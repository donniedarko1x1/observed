from pathlib import Path

# Materialize complete working v0.8.3 first.
exec(Path('apply_v083.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 13", "versionCode 14")
s = s.replace("versionName '0.8.3'", "versionName '0.8.4'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

# Gesture helpers for cooperative image gestures: at 1x, single-finger horizontal drags
# are left unconsumed so HorizontalPager can swipe; pinch and zoomed panning are consumed here.
import_anchor = 'import androidx.compose.foundation.gestures.detectTransformGestures\n'
extra_imports = '''import androidx.compose.foundation.gestures.calculatePan\nimport androidx.compose.foundation.gestures.calculateZoom\nimport androidx.compose.foundation.gestures.awaitEachGesture\nimport androidx.compose.foundation.gestures.awaitFirstDown\n'''
if extra_imports not in s:
    if import_anchor not in s:
        raise SystemExit('gesture import anchor not found')
    s = s.replace(import_anchor, import_anchor + extra_imports, 1)

start = s.find('@Composable\nprivate fun ZoomableImage(')
end = s.find('\n@Composable\nprivate fun VideoPage(', start)
if start < 0 or end < 0:
    raise SystemExit('ZoomableImage block markers not found')

replacement = r'''@Composable
private fun ZoomableImage(url: String, imageLoader: ImageLoader) {
    var scale by remember(url) { mutableStateOf(1f) }
    var offset by remember(url) { mutableStateOf(Offset.Zero) }
    var lastTapAt by remember(url) { mutableStateOf(0L) }
    var lastTapPosition by remember(url) { mutableStateOf(Offset.Unspecified) }

    Box(
        Modifier
            .fillMaxSize()
            .pointerInput(url) {
                val touchSlop = viewConfiguration.touchSlop
                val doubleTapTimeout = viewConfiguration.doubleTapTimeoutMillis

                awaitEachGesture {
                    val firstDown = awaitFirstDown(requireUnconsumed = false)
                    val downPosition = firstDown.position
                    var moved = false
                    var multiTouch = false
                    var finished = false

                    while (!finished) {
                        val event = awaitPointerEvent()
                        val pressed = event.changes.filter { it.pressed }

                        if (event.changes.size >= 2 || pressed.size >= 2) {
                            multiTouch = true
                            val zoom = event.calculateZoom()
                            val pan = event.calculatePan()
                            if (zoom != 1f || pan != Offset.Zero) {
                                val next = (scale * zoom).coerceIn(1f, 6f)
                                val factor = if (scale == 0f) 1f else next / scale
                                scale = next
                                offset = if (next <= 1.01f) {
                                    Offset.Zero
                                } else {
                                    Offset(
                                        (offset.x + pan.x * factor).coerceIn(-size.width * 2f, size.width * 2f),
                                        (offset.y + pan.y * factor).coerceIn(-size.height * 2f, size.height * 2f)
                                    )
                                }
                                event.changes.forEach { if (it.positionChanged()) it.consume() }
                            }
                        } else {
                            val change = event.changes.firstOrNull()
                            if (change != null) {
                                val delta = change.position - change.previousPosition
                                if (delta.getDistance() > 0f) {
                                    val total = change.position - downPosition
                                    if (total.getDistance() > touchSlop) moved = true

                                    if (scale > 1.01f) {
                                        offset = Offset(
                                            (offset.x + delta.x).coerceIn(-size.width * 2f, size.width * 2f),
                                            (offset.y + delta.y).coerceIn(-size.height * 2f, size.height * 2f)
                                        )
                                        change.consume()
                                    }
                                    // At 1x we intentionally do NOT consume this drag:
                                    // HorizontalPager receives it and performs gallery navigation.
                                }
                            }
                        }

                        if (event.changes.none { it.pressed }) {
                            finished = true
                            if (!moved && !multiTouch) {
                                val now = System.currentTimeMillis()
                                val tapPosition = event.changes.firstOrNull()?.position ?: downPosition
                                val closeEnough = lastTapPosition != Offset.Unspecified &&
                                    (tapPosition - lastTapPosition).getDistance() < 96f
                                if (now - lastTapAt <= doubleTapTimeout && closeEnough) {
                                    if (scale > 1.01f) {
                                        scale = 1f
                                        offset = Offset.Zero
                                    } else {
                                        scale = 2.5f
                                        // Keep the first implementation predictable: zoom to center.
                                        // Pinch/pan can then reposition freely.
                                        offset = Offset.Zero
                                    }
                                    lastTapAt = 0L
                                    lastTapPosition = Offset.Unspecified
                                } else {
                                    lastTapAt = now
                                    lastTapPosition = tapPosition
                                }
                            }
                        }
                    }
                }
            },
        contentAlignment = Alignment.Center
    ) {
        AsyncImage(
            model = url,
            imageLoader = imageLoader,
            contentDescription = null,
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    translationX = offset.x
                    translationY = offset.y
                }
        )
    }
}
'''

s = s[:start] + replacement.rstrip() + s[end:]
ui.write_text(s, encoding='utf-8')
print('v0.8.4 gallery swipe and double-tap zoom patch applied')
