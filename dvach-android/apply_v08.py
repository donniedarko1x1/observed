from pathlib import Path

# Materialize complete v0.7.1 first.
exec(Path('apply_v071.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 9", "versionCode 10")
s = s.replace("versionName '0.7.1'", "versionName '0.8.0'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

# Gallery now knows which post owns every media item and can move the underlying thread.
old = 'private data class GalleryState(val items: List<MediaItem>, val initial: Int)'
new = '''private data class GalleryState(
    val items: List<MediaItem>,
    val initial: Int,
    val postOwners: List<Long>,
    val board: String,
    val onPostChanged: (Long) -> Unit
)'''
if old not in s:
    raise SystemExit('GalleryState marker not found')
s = s.replace(old, new, 1)

# Wire richer media callback from the thread into the app-level overlay.
old = '''                                onMedia = { items, index -> gallery = GalleryState(items, index) },
                                onComposeReply = { postNum ->'''
new = '''                                onMedia = { items, index, owners, onPostChanged ->
                                    gallery = GalleryState(items, index, owners, s.board, onPostChanged)
                                },
                                onComposeReply = { postNum ->'''
if old not in s:
    raise SystemExit('Thread onMedia app marker not found')
s = s.replace(old, new, 1)

# ThreadScreen callback includes owners + a sync callback, while PostCard keeps its simple media API.
old = '''    onMedia: (List<MediaItem>, Int) -> Unit,
    onComposeReply: (Long) -> Unit
) {'''
new = '''    onMedia: (List<MediaItem>, Int, List<Long>, (Long) -> Unit) -> Unit,
    onComposeReply: (Long) -> Unit
) {'''
if old not in s:
    raise SystemExit('ThreadScreen onMedia signature marker not found')
s = s.replace(old, new, 1)

old = '    val allMedia = remember(posts) { posts.flatMap { it.files } }\n'
new = '''    val allMedia = remember(posts) { posts.flatMap { it.files } }
    val allMediaOwners = remember(posts) {
        posts.flatMap { post -> post.files.map { post.num } }
    }
'''
if old not in s:
    raise SystemExit('allMedia marker not found')
s = s.replace(old, new, 1)

old = '''    fun jumpTo(target: Long) {
        val index = posts.indexOfFirst { it.num == target }
        if (index >= 0) {
            highlighted = target
            scope.launch { state.animateScrollToItem(index) }
        }
    }
'''
new = '''    fun jumpTo(target: Long) {
        val index = posts.indexOfFirst { it.num == target }
        if (index >= 0) {
            highlighted = target
            scope.launch { state.animateScrollToItem(index) }
        }
    }

    fun syncMediaPost(target: Long) {
        val index = posts.indexOfFirst { it.num == target }
        if (index >= 0) {
            scope.launch { state.scrollToItem(index) }
        }
    }
'''
if old not in s:
    raise SystemExit('jumpTo marker not found')
s = s.replace(old, new, 1)

# Only the PostCard call inside ThreadScreen is adapted; PostCard itself remains reusable.
old = '                        onMedia = onMedia,\n                        onComposeReply = { onComposeReply(post.num) },'
new = '''                        onMedia = { items, index ->
                            onMedia(items, index, allMediaOwners, ::syncMediaPost)
                        },
                        onComposeReply = { onComposeReply(post.num) },'''
if old not in s:
    raise SystemExit('PostCard onMedia call marker not found')
s = s.replace(old, new, 1)

# Replace the full-screen viewer with synchronized post navigation and edge controls.
start = s.find('@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun MediaViewer(')
end = s.find('\n@Composable\nprivate fun PostingScreen(', start)
if start < 0 or end < 0:
    raise SystemExit('MediaViewer block markers not found')
viewer = r'''@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun MediaViewer(
    state: GalleryState,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val pager = rememberPagerState(
        initialPage = state.initial.coerceIn(0, max(0, state.items.lastIndex)),
        pageCount = { state.items.size }
    )
    val current = state.items.getOrNull(pager.currentPage)
    val currentPost = state.postOwners.getOrNull(pager.currentPage) ?: 0L
    val isVideo = current?.isVideo == true

    BackHandler(onBack = onClose)

    LaunchedEffect(pager.currentPage) {
        val owner = state.postOwners.getOrNull(pager.currentPage) ?: 0L
        if (owner > 0L) state.onPostChanged(owner)
    }

    fun previous() {
        if (pager.currentPage > 0) {
            scope.launch { pager.animateScrollToPage(pager.currentPage - 1) }
        }
    }

    fun next() {
        if (pager.currentPage < state.items.lastIndex) {
            scope.launch { pager.animateScrollToPage(pager.currentPage + 1) }
        }
    }

    Surface(color = Color.Black, modifier = Modifier.fillMaxSize()) {
        Box(
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            HorizontalPager(
                state = pager,
                userScrollEnabled = !isVideo,
                modifier = Modifier.fillMaxSize()
            ) { page ->
                val media = state.items[page]
                if (media.isVideo) {
                    VideoPage(
                        url = repository.absolute(media.path),
                        referer = repository.activeBase + "/",
                        active = page == pager.currentPage
                    )
                } else {
                    ZoomableImage(url = repository.absolute(media.path), imageLoader = imageLoader)
                }
            }

            // Top overlay: always visible close button, post/file counter and media actions.
            Row(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .height(64.dp)
                    .background(Color.Black.copy(alpha = 0.32f))
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = Color.Black.copy(alpha = 0.62f),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.size(44.dp).clickable(onClick = onClose)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Close, contentDescription = "Закрыть", tint = Color.White)
                    }
                }
                Spacer(Modifier.width(10.dp))
                Text(
                    buildString {
                        append("/")
                        append(state.board)
                        append("/  ")
                        if (currentPost > 0L) {
                            append("№")
                            append(currentPost)
                            append("  •  ")
                        }
                        append(pager.currentPage + 1)
                        append(" / ")
                        append(state.items.size)
                    },
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                current?.let { media ->
                    IconButton(onClick = { shareUrl(context, repository.absolute(media.path)) }) {
                        Icon(Icons.Default.Share, contentDescription = "Поделиться", tint = Color.White)
                    }
                    IconButton(onClick = { downloadMedia(context, repository.absolute(media.path), repository.activeBase) }) {
                        Icon(Icons.Default.Download, contentDescription = "Скачать", tint = Color.White)
                    }
                }
            }

            // Edge navigation. For video, the bottom controller/seek area is deliberately excluded.
            if (pager.currentPage > 0) {
                Box(
                    modifier = Modifier
                        .align(Alignment.CenterStart)
                        .padding(top = 72.dp, bottom = if (isVideo) 104.dp else 20.dp)
                        .width(if (isVideo) 58.dp else 76.dp)
                        .fillMaxHeight()
                        .clickable(onClick = ::previous),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Surface(
                        color = Color.Black.copy(alpha = 0.34f),
                        shape = RoundedCornerShape(topEnd = 18.dp, bottomEnd = 18.dp)
                    ) {
                        Text(
                            "‹",
                            color = Color.White.copy(alpha = 0.82f),
                            fontSize = 38.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 18.dp)
                        )
                    }
                }
            }

            if (pager.currentPage < state.items.lastIndex) {
                Box(
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .padding(top = 72.dp, bottom = if (isVideo) 104.dp else 20.dp)
                        .width(if (isVideo) 58.dp else 76.dp)
                        .fillMaxHeight()
                        .clickable(onClick = ::next),
                    contentAlignment = Alignment.CenterEnd
                ) {
                    Surface(
                        color = Color.Black.copy(alpha = 0.34f),
                        shape = RoundedCornerShape(topStart = 18.dp, bottomStart = 18.dp)
                    ) {
                        Text(
                            "›",
                            color = Color.White.copy(alpha = 0.82f),
                            fontSize = 38.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ZoomableImage(url: String, imageLoader: ImageLoader) {
    var scale by remember(url) { mutableStateOf(1f) }
    var offset by remember(url) { mutableStateOf(Offset.Zero) }
    Box(
        Modifier
            .fillMaxSize()
            .pointerInput(url) {
                detectTransformGestures { _, pan, zoom, _ ->
                    val next = (scale * zoom).coerceIn(1f, 6f)
                    val factor = if (scale == 0f) 1f else next / scale
                    scale = next
                    offset = if (scale <= 1.01f) Offset.Zero else Offset(
                        (offset.x + pan.x * factor).coerceIn(-size.width * 2f, size.width * 2f),
                        (offset.y + pan.y * factor).coerceIn(-size.height * 2f, size.height * 2f)
                    )
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

@Composable
private fun VideoPage(url: String, referer: String, active: Boolean) {
    val context = LocalContext.current
    val player = remember(url) {
        val http = DefaultHttpDataSource.Factory()
            .setUserAgent(APP_UA)
            .setDefaultRequestProperties(mapOf("Referer" to referer))
        ExoPlayer.Builder(context)
            .setMediaSourceFactory(DefaultMediaSourceFactory(http))
            .build()
            .apply {
                setMediaItem(ExoMediaItem.fromUri(url))
                prepare()
                playWhenReady = active
            }
    }
    LaunchedEffect(player, active) {
        if (active) {
            player.playWhenReady = true
        } else {
            player.pause()
        }
    }
    DisposableEffect(player) { onDispose { player.release() } }
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx -> PlayerView(ctx).apply { this.player = player; useController = true } },
        update = { it.player = player }
    )
}
'''
s = s[:start] + viewer.rstrip() + s[end:]

ui.write_text(s, encoding='utf-8')
print('v0.8 synchronized media viewer patch applied')
