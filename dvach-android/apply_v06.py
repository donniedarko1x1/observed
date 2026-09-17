from pathlib import Path

# Materialize the complete working v0.5.1 first.
exec(Path('apply_v051.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 6", "versionCode 7")
s = s.replace("versionName '0.5.1'", "versionName '0.6.0'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

# Reading/favorites store is scoped to the app UI and persists through SharedPreferences.
anchor = '        val stateHolder = rememberSaveableStateHolder()\n'
if anchor not in s:
    raise SystemExit('stateHolder anchor not found')
s = s.replace(anchor, anchor + '        val readingStore = remember(activity) { ThreadReadingStore(activity.applicationContext) }\n', 1)

# Wire favorites navigation from the boards screen.
old = '''                            AppScreen.Boards -> BoardsScreen(
                                repository = repository,
                                refreshToken = refreshToken,
                                onBoard = { screen = AppScreen.Catalog(it) }
                            )'''
new = '''                            AppScreen.Boards -> BoardsScreen(
                                repository = repository,
                                readingStore = readingStore,
                                refreshToken = refreshToken,
                                onBoard = { screen = AppScreen.Catalog(it) },
                                onFavoriteThread = { board, thread -> screen = AppScreen.Thread(board, thread) }
                            )'''
if old not in s:
    raise SystemExit('BoardsScreen app call not found')
s = s.replace(old, new, 1)

# Thread screen gets reading/favorites persistence while preserving native reply and media hooks.
old = '''                            is AppScreen.Thread -> ThreadScreen(
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
new = '''                            is AppScreen.Thread -> ThreadScreen(
                                board = s.board,
                                thread = s.thread,
                                repository = repository,
                                imageLoader = imageLoader,
                                readingStore = readingStore,
                                refreshToken = refreshToken,
                                onMedia = { items, index -> gallery = GalleryState(items, index) },
                                onComposeReply = { postNum ->
                                    webPostingFallback = false
                                    posting = PostingTarget(s.board, s.thread, postNum)
                                }
                            )'''
if old not in s:
    raise SystemExit('ThreadScreen app call not found')
s = s.replace(old, new, 1)

# Replace boards screen with the same category UI plus a compact favorite-thread shelf.
start = s.find('@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun BoardsScreen')
end = s.find('\n@Composable\nprivate fun BoardRow', start)
if start < 0 or end < 0:
    raise SystemExit('BoardsScreen markers not found')
boards = r'''@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun BoardsScreen(
    repository: DvachRepository,
    readingStore: ThreadReadingStore,
    refreshToken: Int,
    onBoard: (String) -> Unit,
    onFavoriteThread: (String, Long) -> Unit
) {
    var boards by remember { mutableStateOf<List<BoardItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var query by rememberSaveable { mutableStateOf("") }
    var selectedCategory by rememberSaveable { mutableStateOf("Все") }
    var retry by remember { mutableIntStateOf(0) }

    LaunchedEffect(refreshToken, retry) {
        loading = true
        error = null
        runCatching { repository.loadBoards(force = refreshToken > 0 || retry > 0) }
            .onSuccess { boards = it }
            .onFailure { error = it.message ?: "Не удалось загрузить список досок" }
        loading = false
    }

    val favorites = readingStore.favoriteThreads()
    val categories = remember(boards) {
        val preferred = listOf(
            "Тематика", "Творчество", "Политика и новости", "Техника и софт", "Игры",
            "Японская культура", "Взрослым", "Взрослым (18+)", "Разное", "Разное (18+)",
            "Новые доски", "Прочие"
        )
        val available = boards.map { it.category.ifBlank { "Прочие" } }.distinct()
        preferred.filter { it in available } + available.filter { it !in preferred }.sorted()
    }

    LaunchedEffect(categories, selectedCategory) {
        if (selectedCategory != "Все" && selectedCategory !in categories) selectedCategory = "Все"
    }

    val filtered = remember(boards, query, selectedCategory) {
        val q = query.trim().lowercase(Locale.ROOT)
        boards.filter { board ->
            val categoryMatch = selectedCategory == "Все" || board.category == selectedCategory
            val queryMatch = q.isBlank() ||
                board.id.lowercase(Locale.ROOT).contains(q) ||
                board.name.lowercase(Locale.ROOT).contains(q) ||
                board.info.lowercase(Locale.ROOT).contains(q) ||
                board.category.lowercase(Locale.ROOT).contains(q)
            categoryMatch && queryMatch
        }
    }

    Column(Modifier.fillMaxSize()) {
        if (loading) androidx.compose.material3.LinearProgressIndicator(Modifier.fillMaxWidth(), color = Accent)

        if (favorites.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(start = 14.dp, end = 14.dp, top = 10.dp, bottom = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("★ Избранные треды", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                Text("${favorites.size}", color = Accent, fontSize = 12.sp)
            }
            LazyRow(
                contentPadding = PaddingValues(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(favorites, key = { "${it.board}:${it.thread}" }) { favorite ->
                    Surface(
                        color = Surface1,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.width(240.dp).clickable { onFavoriteThread(favorite.board, favorite.thread) }
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text("/${favorite.board}/  №${favorite.thread}", color = Accent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(favorite.title, color = Color.White, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            if (favorite.lastRead > 0L) {
                                Spacer(Modifier.height(4.dp))
                                Text("читали до №${favorite.lastRead}", color = Muted, fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
        }

        Text(
            "Категории",
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
            fontSize = 14.sp,
            modifier = Modifier.padding(start = 14.dp, top = if (favorites.isEmpty()) 10.dp else 14.dp, bottom = 7.dp)
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(listOf("Все") + categories, key = { it }) { category ->
                val selected = selectedCategory == category
                Surface(
                    color = if (selected) Accent else Surface1,
                    shape = RoundedCornerShape(50),
                    modifier = Modifier.clickable { selectedCategory = category }
                ) {
                    Text(
                        category,
                        color = if (selected) Color.Black else Color(0xFFE7E9EC),
                        fontSize = 12.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp)
                    )
                }
            }
        }

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
            singleLine = true,
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            placeholder = { Text("Найти доску") },
            shape = RoundedCornerShape(16.dp)
        )

        if (error != null && boards.isEmpty()) {
            ErrorPane(error!!, onRetry = { retry++ })
            return@Column
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                if (selectedCategory == "Все") "Все доски" else selectedCategory,
                color = Accent,
                fontWeight = FontWeight.SemiBold,
                fontSize = 12.sp,
                modifier = Modifier.weight(1f)
            )
            Text("${filtered.size} / ${boards.size}", color = Muted, fontSize = 12.sp)
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 5.dp, bottom = 18.dp),
            verticalArrangement = Arrangement.spacedBy(1.dp)
        ) {
            items(filtered, key = { it.id }) { board ->
                BoardRow(board = board, onClick = { onBoard(board.id) })
            }
            if (!loading && filtered.isEmpty()) {
                item { Text("В этой категории ничего не найдено", color = Muted, modifier = Modifier.padding(20.dp)) }
            }
        }
    }
}
'''
s = s[:start] + boards.rstrip() + s[end:]

# Replace thread reader: popup quote previews, backlinks, incremental refresh, favorites, saved position.
start = s.find('@Composable\nprivate fun ThreadScreen(')
end = s.find('\n@Composable\nprivate fun PostCard(', start)
if start < 0 or end < 0:
    raise SystemExit('ThreadScreen markers not found')
thread_screen = r'''@Composable
private fun ThreadScreen(
    board: String,
    thread: Long,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    readingStore: ThreadReadingStore,
    refreshToken: Int,
    onMedia: (List<MediaItem>, Int) -> Unit,
    onComposeReply: (Long) -> Unit
) {
    var posts by remember { mutableStateOf<List<PostItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var retry by remember { mutableIntStateOf(0) }
    var highlighted by remember { mutableStateOf<Long?>(null) }
    var previewTarget by remember { mutableStateOf<Long?>(null) }
    var newCount by remember { mutableIntStateOf(0) }
    var firstNewNum by remember { mutableStateOf<Long?>(null) }
    var restored by rememberSaveable(board, thread) { mutableStateOf(false) }
    var favorite by remember(board, thread) { mutableStateOf(readingStore.isFavorite(board, thread)) }
    val state = rememberLazyListState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(board, thread, refreshToken, retry) {
        val previous = posts
        loading = previous.isEmpty()
        error = null
        val result = runCatching { repository.loadThread(board, thread) }
        result.onSuccess { fresh ->
            if (previous.isNotEmpty()) {
                val oldNums = previous.asSequence().map { it.num }.toHashSet()
                val added = fresh.filter { it.num !in oldNums }
                if (added.isNotEmpty()) {
                    newCount = added.size
                    firstNewNum = added.first().num
                }
            }
            posts = fresh
            if (favorite) {
                val title = fresh.firstOrNull()?.subject?.let { htmlToPlain(it) }.orEmpty().ifBlank { "Тред №$thread" }
                readingStore.updateFavoriteTitle(board, thread, title)
            }
        }.onFailure { error = it.message ?: "Не удалось загрузить тред" }
        loading = false

        if (!restored && posts.isNotEmpty()) {
            val saved = readingStore.loadPosition(board, thread)
            val index = saved.index.coerceIn(0, posts.lastIndex)
            state.scrollToItem(index, saved.offset)
            restored = true
        }
    }

    val visibleIndex = state.firstVisibleItemIndex
    val visibleOffset = state.firstVisibleItemScrollOffset
    LaunchedEffect(board, thread, visibleIndex, visibleOffset, posts.size, restored) {
        if (restored && posts.isNotEmpty()) {
            delay(500)
            val lastRead = posts.getOrNull(visibleIndex)?.num ?: 0L
            readingStore.savePosition(board, thread, visibleIndex, visibleOffset, lastRead)
        }
    }

    LaunchedEffect(highlighted) {
        if (highlighted != null) {
            delay(1400)
            highlighted = null
        }
    }

    val allMedia = remember(posts) { posts.flatMap { it.files } }
    val backlinks = remember(posts) {
        val map = linkedMapOf<Long, MutableList<Long>>()
        posts.forEach { source ->
            extractReplyTargets(source.commentHtml).forEach { target ->
                map.getOrPut(target) { mutableListOf() }.add(source.num)
            }
        }
        map.mapValues { (_, values) -> values.distinct() }
    }

    fun jumpTo(target: Long) {
        val index = posts.indexOfFirst { it.num == target }
        if (index >= 0) {
            highlighted = target
            scope.launch { state.animateScrollToItem(index) }
        }
    }

    Box(Modifier.fillMaxSize()) {
        if (error != null && posts.isEmpty()) {
            ErrorPane(error!!, onRetry = { retry++ })
        } else {
            LazyColumn(
                state = state,
                contentPadding = PaddingValues(start = 8.dp, end = 8.dp, top = 8.dp, bottom = 76.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                item(key = "thread-actions") {
                    val title = posts.firstOrNull()?.subject?.let { htmlToPlain(it) }.orEmpty().ifBlank { "Тред №$thread" }
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("${posts.size} постов", color = Muted, fontSize = 11.sp, modifier = Modifier.weight(1f))
                        FilledTonalButton(
                            onClick = {
                                favorite = readingStore.toggleFavorite(board, thread, title)
                                if (favorite) readingStore.updateFavoriteTitle(board, thread, title)
                            }
                        ) {
                            Text(if (favorite) "★ В избранном" else "☆ В избранное")
                        }
                    }
                }
                itemsIndexed(posts, key = { _, post -> post.num }) { _, post ->
                    PostCard(
                        post = post,
                        highlighted = highlighted == post.num,
                        repository = repository,
                        imageLoader = imageLoader,
                        allMedia = allMedia,
                        backlinks = backlinks[post.num].orEmpty(),
                        onMedia = onMedia,
                        onComposeReply = { onComposeReply(post.num) },
                        onPreview = { target ->
                            if (posts.any { it.num == target }) previewTarget = target
                        }
                    )
                }
            }
        }

        if (newCount > 0 && firstNewNum != null) {
            FilledTonalButton(
                onClick = {
                    firstNewNum?.let { jumpTo(it) }
                    newCount = 0
                },
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 14.dp)
            ) {
                Text("+$newCount новых • к новым", fontWeight = FontWeight.SemiBold)
            }
        }

        if (loading) CircularProgressIndicator(Modifier.align(Alignment.Center), color = Accent)

        previewTarget?.let { target ->
            posts.firstOrNull { it.num == target }?.let { post ->
                ReplyPreviewOverlay(
                    post = post,
                    backlinks = backlinks[post.num].orEmpty(),
                    onReply = { nested -> if (posts.any { it.num == nested }) previewTarget = nested },
                    onJump = {
                        previewTarget = null
                        jumpTo(post.num)
                    },
                    onClose = { previewTarget = null }
                )
            }
        }
    }
}
'''
s = s[:start] + thread_screen.rstrip() + s[end:]

# Replace post card so >> opens previews and every post shows backlinks.
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
    backlinks: List<Long>,
    onMedia: (List<MediaItem>, Int) -> Unit,
    onComposeReply: () -> Unit,
    onPreview: (Long) -> Unit
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
                    onReply = onPreview
                )
                AnimatedVisibility(visible = hasSpoilers && !revealSpoilers) {
                    Text(
                        "Показать спойлеры",
                        color = Accent,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 7.dp).clickable { revealSpoilers = true }
                    )
                }

                if (backlinks.isNotEmpty()) {
                    Spacer(Modifier.height(9.dp))
                    Text("Ответы на этот пост", color = Muted, fontSize = 10.sp)
                    Spacer(Modifier.height(5.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(backlinks.take(20), key = { it }) { replyNum ->
                            Surface(
                                color = Surface2,
                                shape = RoundedCornerShape(9.dp),
                                modifier = Modifier.clickable { onPreview(replyNum) }
                            ) {
                                Text(">>$replyNum", color = Quote, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReplyPreviewOverlay(
    post: PostItem,
    backlinks: List<Long>,
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
                        (post.name.ifBlank { "Аноним" }) + if (post.op) "  OP" else "",
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
                HtmlPostText(post.commentHtml, onReply)
                if (post.files.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    Text("📎 ${post.files.size} вложений", color = Muted, fontSize = 11.sp)
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

private fun extractReplyTargets(html: String): List<Long> {
    val normalized = html.replace("&gt;", ">").replace("&#62;", ">")
    return Regex(">>(\\d{1,18})")
        .findAll(normalized)
        .mapNotNull { it.groupValues.getOrNull(1)?.toLongOrNull() }
        .distinct()
        .toList()
}
'''
s = s[:start] + post_card.rstrip() + s[end:]

ui.write_text(s, encoding='utf-8')
print('v0.6 reading UX patch applied')
