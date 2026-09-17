from pathlib import Path

# Materialize complete working v0.8.7 first.
exec(Path('apply_v087.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 17", "versionCode 18")
s = s.replace("versionName '0.8.7'", "versionName '0.8.8'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

# ---------------- Internal 2ch URL parsing/navigation ----------------
nav_anchor = 'private val screenSaver = Saver<AppScreen, String>(\n'
nav_helpers = r'''private data class DvachUrlTarget(
    val board: String?,
    val thread: Long?,
    val post: Long?
)

private fun isDvachHost(host: String): Boolean {
    val h = host.lowercase(Locale.ROOT).trimEnd('.')
    val roots = listOf("2ch.su", "2ch.org", "2ch.life")
    return roots.any { root -> h == root || h.endsWith(".$root") }
}

private fun parseDvachUrl(raw: String): DvachUrlTarget? {
    val value = raw.trim()
    if (value.isBlank()) return null
    val normalized = when {
        value.startsWith("//") -> "https:$value"
        value.startsWith("/") -> "https://2ch.su$value"
        !value.contains("://") && (value.startsWith("2ch.su/") || value.startsWith("2ch.org/") || value.startsWith("2ch.life/")) -> "https://$value"
        else -> value
    }
    val uri = runCatching { Uri.parse(normalized) }.getOrNull() ?: return null
    val host = uri.host ?: return null
    if (!isDvachHost(host)) return null

    val parts = uri.pathSegments.filter { it.isNotBlank() }
    if (parts.isEmpty()) return DvachUrlTarget(null, null, null)
    val board = parts.firstOrNull()?.takeIf { it.matches(Regex("[A-Za-z0-9_]+")) }
        ?: return DvachUrlTarget(null, null, null)

    val resIndex = parts.indexOf("res")
    val thread = if (resIndex >= 0) {
        parts.getOrNull(resIndex + 1)
            ?.substringBefore('?')
            ?.removeSuffix(".html")
            ?.removeSuffix(".json")
            ?.toLongOrNull()
    } else null
    val post = uri.fragment?.let { fragment -> Regex("\\d{1,18}").find(fragment)?.value?.toLongOrNull() }
    return DvachUrlTarget(board, thread, post)
}

'''
if nav_anchor not in s:
    raise SystemExit('screenSaver anchor not found')
s = s.replace(nav_anchor, nav_helpers + nav_anchor, 1)

state_anchor = '        var gallery by remember { mutableStateOf<GalleryState?>(null) }\n'
if state_anchor not in s:
    raise SystemExit('gallery state anchor not found')
s = s.replace(state_anchor, state_anchor + '        var pendingInternalPost by remember { mutableStateOf<Long?>(null) }\n', 1)

back_anchor = '''        fun navigateBack() {
            screen = when (val s = screen) {
                AppScreen.Boards -> AppScreen.Boards
                is AppScreen.Catalog -> AppScreen.Boards
                is AppScreen.Thread -> AppScreen.Catalog(s.board)
            }
        }
'''
open_fn = '''        fun navigateBack() {
            screen = when (val s = screen) {
                AppScreen.Boards -> AppScreen.Boards
                is AppScreen.Catalog -> AppScreen.Boards
                is AppScreen.Thread -> AppScreen.Catalog(s.board)
            }
        }

        fun openDvachLink(url: String) {
            val target = parseDvachUrl(url) ?: return
            gallery = null
            posting = null
            pendingInternalPost = target.post
            screen = when {
                target.board != null && target.thread != null -> AppScreen.Thread(target.board, target.thread)
                target.board != null -> AppScreen.Catalog(target.board)
                else -> AppScreen.Boards
            }
        }
'''
if back_anchor not in s:
    raise SystemExit('navigateBack block not found')
s = s.replace(back_anchor, open_fn, 1)

# ThreadScreen app invocation: pass deep-link post and internal-url callback.
app_thread_start = s.find('                            is AppScreen.Thread -> ThreadScreen(')
app_thread_end = s.find('                            )', app_thread_start)
if app_thread_start < 0 or app_thread_end < 0:
    raise SystemExit('app ThreadScreen invocation not found')
app_thread = s[app_thread_start:app_thread_end + len('                            )')]
refresh_arg = '                                refreshToken = refreshToken,\n'
if refresh_arg not in app_thread:
    raise SystemExit('ThreadScreen refreshToken argument not found')
app_thread = app_thread.replace(
    refresh_arg,
    refresh_arg + '''                                initialJumpPost = pendingInternalPost,
                                onJumpConsumed = { pendingInternalPost = null },
                                onInternalLink = ::openDvachLink,
''',
    1
)
s = s[:app_thread_start] + app_thread + s[app_thread_end + len('                            )'):]

# ---------------- Thread screen deep-link support ----------------
ts = s.find('@Composable\nprivate fun ThreadScreen(')
te = s.find('\n@Composable\nprivate fun PostCard(', ts)
if ts < 0 or te < 0:
    raise SystemExit('ThreadScreen markers not found')
thread = s[ts:te]
old_sig = '''    readingStore: ThreadReadingStore,
    refreshToken: Int,
    onMedia: (List<MediaItem>, Int, List<Long>, (Long) -> Unit) -> Unit,
    onComposeReply: (Long) -> Unit
) {'''
new_sig = '''    readingStore: ThreadReadingStore,
    refreshToken: Int,
    initialJumpPost: Long?,
    onJumpConsumed: () -> Unit,
    onInternalLink: (String) -> Unit,
    onMedia: (List<MediaItem>, Int, List<Long>, (Long) -> Unit) -> Unit,
    onComposeReply: (Long) -> Unit
) {'''
if old_sig not in thread:
    raise SystemExit('ThreadScreen final signature not found')
thread = thread.replace(old_sig, new_sig, 1)

thread = thread.replace(
    '        if (!restored && posts.isNotEmpty()) {',
    '        if (!restored && posts.isNotEmpty() && initialJumpPost == null) {',
    1
)

highlight_effect = '''    LaunchedEffect(highlighted) {
        if (highlighted != null) {
            delay(1400)
            highlighted = null
        }
    }
'''
jump_effect = '''    LaunchedEffect(highlighted) {
        if (highlighted != null) {
            delay(1400)
            highlighted = null
        }
    }

    LaunchedEffect(initialJumpPost, posts.size) {
        val target = initialJumpPost ?: return@LaunchedEffect
        if (posts.isEmpty()) return@LaunchedEffect
        val index = posts.indexOfFirst { it.num == target }
        if (index >= 0) {
            restored = true
            highlighted = target
            state.scrollToItem(index)
        }
        onJumpConsumed()
    }
'''
if highlight_effect not in thread:
    raise SystemExit('highlight effect anchor not found')
thread = thread.replace(highlight_effect, jump_effect, 1)

preview_arg = '''                        onPreview = { target ->
                            if (posts.any { it.num == target }) previewTarget = target
                        }
'''
preview_new = '''                        onPreview = { target ->
                            if (posts.any { it.num == target }) previewTarget = target
                        },
                        onInternalLink = onInternalLink
'''
if preview_arg not in thread:
    raise SystemExit('PostCard preview argument block not found')
thread = thread.replace(preview_arg, preview_new, 1)

preview_call = '''                ReplyPreviewOverlay(
                    post = post,
                    backlinks = backlinks[post.num].orEmpty(),
                    onReply = { nested -> if (posts.any { it.num == nested }) previewTarget = nested },'''
preview_call_new = '''                ReplyPreviewOverlay(
                    post = post,
                    backlinks = backlinks[post.num].orEmpty(),
                    repository = repository,
                    imageLoader = imageLoader,
                    onInternalLink = onInternalLink,
                    onReply = { nested -> if (posts.any { it.num == nested }) previewTarget = nested },'''
if preview_call not in thread:
    raise SystemExit('ReplyPreviewOverlay invocation not found')
thread = thread.replace(preview_call, preview_call_new, 1)
s = s[:ts] + thread + s[te:]

# ---------------- Post card internal-link callback ----------------
ps = s.find('@Composable\nprivate fun PostCard(')
pe = s.find('\n@Composable\nprivate fun ReplyPreviewOverlay(', ps)
if ps < 0 or pe < 0:
    raise SystemExit('PostCard markers not found')
post = s[ps:pe]
old_tail = '''    onMedia: (List<MediaItem>, Int) -> Unit,
    onComposeReply: () -> Unit,
    onPreview: (Long) -> Unit
) {'''
new_tail = '''    onMedia: (List<MediaItem>, Int) -> Unit,
    onComposeReply: () -> Unit,
    onPreview: (Long) -> Unit,
    onInternalLink: (String) -> Unit
) {'''
if old_tail not in post:
    raise SystemExit('PostCard signature tail not found')
post = post.replace(old_tail, new_tail, 1)
old_html = '''                HtmlPostText(
                    html = if (revealSpoilers) post.commentHtml else maskSpoilers(post.commentHtml),
                    onReply = onPreview
                )'''
new_html = '''                HtmlPostText(
                    html = if (revealSpoilers) post.commentHtml else maskSpoilers(post.commentHtml),
                    onReply = onPreview,
                    onInternalLink = onInternalLink
                )'''
if old_html not in post:
    raise SystemExit('PostCard HtmlPostText call not found')
post = post.replace(old_html, new_html, 1)
s = s[:ps] + post + s[pe:]

# ---------------- Rich quote preview with compact media ----------------
rps = s.find('@Composable\nprivate fun ReplyPreviewOverlay(')
rpe = s.find('\nprivate fun extractReplyTargets', rps)
if rps < 0 or rpe < 0:
    raise SystemExit('ReplyPreviewOverlay function markers not found')
reply_preview = r'''@Composable
private fun ReplyPreviewOverlay(
    post: PostItem,
    backlinks: List<Long>,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    onInternalLink: (String) -> Unit,
    onReply: (Long) -> Unit,
    onJump: () -> Unit,
    onClose: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.72f)).clickable(onClick = onClose),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            color = Surface1,
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth().padding(22.dp).clickable { }
        ) {
            Column(Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        cleanPostName(post.name) + if (post.op) "  OP" else "",
                        color = if (post.op) Accent else Muted,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f)
                    )
                    Text("№${post.num}", color = Accent, fontSize = 12.sp)
                    IconButton(onClick = onClose) { Icon(Icons.Default.Close, contentDescription = "Закрыть") }
                }
                if (post.subject.isNotBlank()) {
                    Text(htmlToPlain(post.subject), color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(Modifier.height(6.dp))
                }
                HtmlPostText(post.commentHtml, onReply, onInternalLink)

                if (post.files.isNotEmpty()) {
                    Spacer(Modifier.height(10.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        items(post.files.take(8), key = { "preview:${it.path}" }) { media ->
                            Box(
                                modifier = Modifier
                                    .size(82.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Surface2),
                                contentAlignment = Alignment.Center
                            ) {
                                AsyncImage(
                                    model = repository.absolute(media.thumbnail.ifBlank { media.path }),
                                    imageLoader = imageLoader,
                                    contentDescription = media.displayName,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                if (media.isVideo) {
                                    Surface(
                                        color = Color.Black.copy(alpha = 0.55f),
                                        shape = RoundedCornerShape(50)
                                    ) {
                                        Text("▶", color = Color.White, fontSize = 18.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp))
                                    }
                                }
                            }
                        }
                    }
                    Text(
                        "📎 ${post.files.size} вложений",
                        color = Muted,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(top = 5.dp)
                    )
                }

                if (backlinks.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(backlinks.take(12), key = { it }) { replyNum ->
                            Surface(color = Surface2, shape = RoundedCornerShape(9.dp), modifier = Modifier.clickable { onReply(replyNum) }) {
                                Text(">>$replyNum", color = Quote, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp))
                            }
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalButton(onClick = onJump) { Text("К посту") }
                    FilledTonalButton(onClick = onClose) { Text("Закрыть") }
                }
            }
        }
    }
}
'''
s = s[:rps] + reply_preview.rstrip() + s[rpe:]

# ---------------- Link confirmation: internal 2ch vs external browser ----------------
hs = s.find('@Composable\nprivate fun HtmlPostText(')
he = s.find('\n@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun MediaViewer(', hs)
if hs < 0 or he < 0:
    raise SystemExit('HtmlPostText block markers not found')
html_block = r'''@Composable
private fun HtmlPostText(
    html: String,
    onReply: (Long) -> Unit,
    onInternalLink: (String) -> Unit = {}
) {
    val context = LocalContext.current
    var pendingUrl by remember { mutableStateOf<String?>(null) }

    AndroidView(
        modifier = Modifier.fillMaxWidth(),
        factory = { androidContext ->
            TextView(androidContext).apply {
                setTextColor(AndroidColor.rgb(235, 237, 240))
                setLinkTextColor(AndroidColor.rgb(242, 162, 74))
                textSize = 14f
                highlightColor = AndroidColor.TRANSPARENT
                setLineSpacing(0f, 1.08f)
                setTextIsSelectable(true)
                linksClickable = true
                movementMethod = LinkMovementMethod.getInstance()
            }
        },
        update = { view ->
            view.text = makeRichText(
                html = html,
                onReply = onReply,
                onExternalLink = { url -> pendingUrl = url }
            )
            view.linksClickable = true
            view.movementMethod = LinkMovementMethod.getInstance()
        }
    )

    pendingUrl?.let { url ->
        val internalTarget = remember(url) { parseDvachUrl(url) }
        val isInternal = internalTarget != null
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { pendingUrl = null },
            title = { Text(if (isInternal) "Открыть ссылку Двача?" else "Перейти по внешней ссылке?") },
            text = { Text(url, color = Color(0xFFE1E4E8), fontSize = 13.sp) },
            confirmButton = {
                androidx.compose.material3.TextButton(
                    onClick = {
                        pendingUrl = null
                        if (isInternal) onInternalLink(url) else openExternal(context, url)
                    }
                ) { Text(if (isInternal) "Открыть в Двач Neo" else "Да") }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { pendingUrl = null }) { Text("Отмена") }
            }
        )
    }
}

private fun makeRichText(
    html: String,
    onReply: (Long) -> Unit,
    onExternalLink: (String) -> Unit
): SpannableStringBuilder {
    val raw = HtmlCompat.fromHtml(html, HtmlCompat.FROM_HTML_MODE_LEGACY)
    val text = SpannableStringBuilder(raw)
    androidx.core.text.util.LinkifyCompat.addLinks(text, android.text.util.Linkify.WEB_URLS)

    val urlSpans = text.getSpans(0, text.length, android.text.style.URLSpan::class.java)
    urlSpans.forEach { span ->
        val spanStart = text.getSpanStart(span)
        val spanEnd = text.getSpanEnd(span)
        val flags = text.getSpanFlags(span)
        val url = span.url.orEmpty()
        val visible = if (spanStart >= 0 && spanEnd > spanStart) text.subSequence(spanStart, spanEnd).toString().trim() else ""
        text.removeSpan(span)
        val isInternalReply = Regex("^>>\\d+$").matches(visible)
        if (!isInternalReply && spanStart >= 0 && spanEnd > spanStart && url.isNotBlank()) {
            text.setSpan(object : ClickableSpan() {
                override fun onClick(widget: View) = onExternalLink(url)
                override fun updateDrawState(ds: android.text.TextPaint) {
                    super.updateDrawState(ds)
                    ds.color = AndroidColor.rgb(242, 162, 74)
                    ds.isUnderlineText = true
                }
            }, spanStart, spanEnd, flags)
        }
    }

    val matcher = Pattern.compile(">>(\\d+)").matcher(text.toString())
    while (matcher.find()) {
        val number = matcher.group(1)?.toLongOrNull() ?: continue
        text.setSpan(object : ClickableSpan() {
            override fun onClick(widget: View) = onReply(number)
            override fun updateDrawState(ds: android.text.TextPaint) {
                super.updateDrawState(ds)
                ds.color = AndroidColor.rgb(242, 162, 74)
                ds.isUnderlineText = false
            }
        }, matcher.start(), matcher.end(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
    return text
}
'''
s = s[:hs] + html_block.rstrip() + s[he:]

ui.write_text(s, encoding='utf-8')
print('v0.8.8 compact quote media + internal 2ch links applied')
