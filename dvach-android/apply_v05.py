from pathlib import Path

# First materialize all v0.4 source changes.
exec(Path('apply_v04.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

p = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = p.read_text(encoding='utf-8')

s = s.replace(
    'private data class PostingTarget(val board: String, val thread: Long)',
    'private data class PostingTarget(val board: String, val thread: Long, val quote: Long? = null)',
    1
)
s = s.replace(
    'var posting by remember { mutableStateOf<PostingTarget?>(null) }\n        var gallery by remember',
    'var posting by remember { mutableStateOf<PostingTarget?>(null) }\n        var webPostingFallback by remember { mutableStateOf(false) }\n        var gallery by remember',
    1
)

catalog_call = '''                            is AppScreen.Catalog -> CatalogScreen(
                                board = s.board,
                                repository = repository,
                                imageLoader = imageLoader,
                                refreshToken = refreshToken,
                                onThread = { screen = AppScreen.Thread(s.board, it) }
                            )'''
catalog_replacement = '''                            is AppScreen.Catalog -> CatalogScreen(
                                board = s.board,
                                repository = repository,
                                imageLoader = imageLoader,
                                refreshToken = refreshToken,
                                onThread = { screen = AppScreen.Thread(s.board, it) },
                                onMedia = { items, index -> gallery = GalleryState(items, index) }
                            )'''
if catalog_call not in s:
    raise SystemExit('CatalogScreen call marker not found')
s = s.replace(catalog_call, catalog_replacement, 1)

thread_call = '''                            is AppScreen.Thread -> ThreadScreen(
                                board = s.board,
                                thread = s.thread,
                                repository = repository,
                                imageLoader = imageLoader,
                                refreshToken = refreshToken,
                                onMedia = { items, index -> gallery = GalleryState(items, index) }
                            )'''
thread_replacement = '''                            is AppScreen.Thread -> ThreadScreen(
                                board = s.board,
                                thread = s.thread,
                                repository = repository,
                                imageLoader = imageLoader,
                                refreshToken = refreshToken,
                                onMedia = { items, index -> gallery = GalleryState(items, index) },
                                onComposeReply = { postNum ->
                                    webPostingFallback = false
                                    posting = PostingTarget(s.board, s.thread, postNum)
                                }
                            )'''
if thread_call not in s:
    raise SystemExit('ThreadScreen call marker not found')
s = s.replace(thread_call, thread_replacement, 1)

posting_block = '''            posting?.let { target ->
                PostingScreen(
                    target = target,
                    repository = repository,
                    activity = activity,
                    onClose = { posting = null }
                )
            }'''
posting_replacement = '''            posting?.let { target ->
                if (target.thread > 0L && !webPostingFallback) {
                    NativeReplyScreen(
                        repository = repository,
                        board = target.board,
                        thread = target.thread,
                        initialQuote = target.quote,
                        onClose = {
                            webPostingFallback = false
                            posting = null
                        },
                        onPosted = {
                            webPostingFallback = false
                            posting = null
                            refreshToken++
                        },
                        onFallback = { webPostingFallback = true }
                    )
                } else {
                    PostingScreen(
                        target = target,
                        repository = repository,
                        activity = activity,
                        onClose = {
                            webPostingFallback = false
                            posting = null
                        }
                    )
                }
            }'''
if posting_block not in s:
    raise SystemExit('Posting overlay marker not found')
s = s.replace(posting_block, posting_replacement, 1)

s = s.replace(
    '''    refreshToken: Int,
    onThread: (Long) -> Unit
) {''',
    '''    refreshToken: Int,
    onThread: (Long) -> Unit,
    onMedia: (List<MediaItem>, Int) -> Unit
) {''',
    1
)
s = s.replace(
    'ThreadCard(thread, repository, imageLoader) { onThread(thread.num) }',
    'ThreadCard(thread, repository, imageLoader, onMedia) { onThread(thread.num) }',
    1
)

# Replace the catalog card: media is full width at the top and downloadable there.
start = s.find('@Composable\nprivate fun ThreadCard(')
end = s.find('\n@Composable\nprivate fun ThreadScreen(', start)
if start < 0 or end < 0:
    raise SystemExit('ThreadCard markers not found')
thread_card = r'''@Composable
private fun ThreadCard(
    thread: ThreadItem,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    onMedia: (List<MediaItem>, Int) -> Unit,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = Surface1,
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            if (thread.files.isNotEmpty()) {
                WideMediaStrip(
                    files = thread.files,
                    allMedia = thread.files,
                    repository = repository,
                    imageLoader = imageLoader,
                    onOpen = onMedia
                )
            }
            Column(Modifier.padding(14.dp)) {
                Text(
                    text = thread.subject.ifBlank { "Тред №${thread.num}" },
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "№${thread.num}   💬 ${thread.postsCount}   📎 ${if (thread.filesCount > 0) thread.filesCount else thread.files.size}" +
                        if (thread.views > 0) "   👁 ${thread.views}" else "",
                    color = Muted,
                    fontSize = 12.sp
                )
                if (thread.commentHtml.isNotBlank()) {
                    Spacer(Modifier.height(9.dp))
                    Text(
                        htmlToPlain(thread.commentHtml),
                        color = Color(0xFFE1E4E8),
                        fontSize = 14.sp,
                        lineHeight = 19.sp,
                        maxLines = 8,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
'''
s = s[:start] + thread_card.rstrip() + s[end:]

# Thread screen now exposes a dedicated reply-composer action per post.
s = s.replace(
    '''    refreshToken: Int,
    onMedia: (List<MediaItem>, Int) -> Unit
) {''',
    '''    refreshToken: Int,
    onMedia: (List<MediaItem>, Int) -> Unit,
    onComposeReply: (Long) -> Unit
) {''',
    1
)
s = s.replace(
    '''                        allMedia = allMedia,
                        onMedia = onMedia,
                        onReply = { target ->''',
    '''                        allMedia = allMedia,
                        onMedia = onMedia,
                        onComposeReply = { onComposeReply(post.num) },
                        onReply = { target ->''',
    1
)

# Replace post cards: media is the first element and spans the full card width.
start = s.find('@Composable\nprivate fun PostCard(')
end = s.find('\n@Composable\nprivate fun HtmlPostText', start)
if start < 0 or end < 0:
    raise SystemExit('PostCard markers not found')
post_card = r'''@Composable
private fun PostCard(
    post: PostItem,
    highlighted: Boolean,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    allMedia: List<MediaItem>,
    onMedia: (List<MediaItem>, Int) -> Unit,
    onComposeReply: () -> Unit,
    onReply: (Long) -> Unit
) {
    var revealSpoilers by rememberSaveable(post.num) { mutableStateOf(false) }
    val hasSpoilers = remember(post.commentHtml) { post.commentHtml.lowercase(Locale.ROOT).contains("spoiler") }
    val bg = if (post.op) Color(0xFF1B1815) else Surface1
    val border = if (highlighted) Accent else Color.Transparent

    Surface(
        color = bg,
        shape = RoundedCornerShape(15.dp),
        border = androidx.compose.foundation.BorderStroke(if (highlighted) 2.dp else 1.dp, border),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            if (post.files.isNotEmpty()) {
                WideMediaStrip(
                    files = post.files,
                    allMedia = allMedia,
                    repository = repository,
                    imageLoader = imageLoader,
                    onOpen = onMedia
                )
            }

            Column(Modifier.padding(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        (post.name.ifBlank { "Аноним" }) + if (post.op) "  OP" else "",
                        color = if (post.op) Accent else Muted,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f)
                    )
                    Text("№${post.num}", color = Accent, fontSize = 12.sp)
                    IconButton(onClick = onComposeReply, modifier = Modifier.size(34.dp)) {
                        Icon(Icons.AutoMirrored.Filled.Reply, contentDescription = "Ответить", tint = Accent, modifier = Modifier.size(18.dp))
                    }
                }
                if (post.date.isNotBlank()) Text(post.date, color = Muted, fontSize = 11.sp)
                if (post.subject.isNotBlank()) {
                    Spacer(Modifier.height(5.dp))
                    Text(htmlToPlain(post.subject), color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                }

                if (post.commentHtml.isNotBlank()) Spacer(Modifier.height(8.dp))
                HtmlPostText(
                    html = if (revealSpoilers) post.commentHtml else maskSpoilers(post.commentHtml),
                    onReply = onReply
                )
                AnimatedVisibility(visible = hasSpoilers && !revealSpoilers) {
                    Text(
                        "Показать спойлеры",
                        color = Accent,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 7.dp).clickable { revealSpoilers = true }
                    )
                }
            }
        }
    }
}
'''
s = s[:start] + post_card.rstrip() + s[end:]

# Gallery download button uses the same helper as inline media.
s = s.replace(
    'downloadMedia(context, repository.absolute(media.path), repository.activeBase)',
    'downloadMediaFromAnywhere(context, repository.absolute(media.path), repository.activeBase)'
)

p.write_text(s, encoding='utf-8')
print('v0.5 source patch applied')
