from pathlib import Path

# Materialize complete v0.6 UI first.
exec(Path('apply_v06.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 7", "versionCode 8")
s = s.replace("versionName '0.6.0'", "versionName '0.7.0'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

# Native new-thread composer; WebView remains only as explicit fallback.
old_posting = '''            posting?.let { target ->
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
new_posting = '''            posting?.let { target ->
                if (!webPostingFallback) {
                    if (target.thread > 0L) {
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
                        NativeThreadScreen(
                            repository = repository,
                            board = target.board,
                            onClose = {
                                webPostingFallback = false
                                posting = null
                            },
                            onCreated = { newThread ->
                                webPostingFallback = false
                                posting = null
                                refreshToken++
                                if (newThread > 0L) screen = AppScreen.Thread(target.board, newThread)
                            },
                            onFallback = { webPostingFallback = true }
                        )
                    }
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
if old_posting not in s:
    raise SystemExit('posting block not found')
s = s.replace(old_posting, new_posting, 1)

# Catalog: show cached data instantly, then refresh from the network.
cat_start = s.find('@Composable\nprivate fun CatalogScreen(')
cat_end = s.find('\n@Composable\nprivate fun ThreadCard(', cat_start)
if cat_start < 0 or cat_end < 0:
    raise SystemExit('CatalogScreen markers not found')
cat = s[cat_start:cat_end]
old = '''    LaunchedEffect(board, refreshToken, retry) {
        loading = true
        error = null
        runCatching { repository.loadCatalog(board) }
            .onSuccess { data = it }
            .onFailure { error = it.message ?: "Не удалось загрузить каталог" }
        loading = false
    }'''
new = '''    LaunchedEffect(board, refreshToken, retry) {
        if (data.isEmpty()) {
            val cached = repository.cachedCatalog(board)
            if (cached.isNotEmpty()) {
                data = cached
                loading = false
            }
        }
        loading = data.isEmpty()
        error = null
        runCatching { repository.loadCatalog(board) }
            .onSuccess { data = it }
            .onFailure { error = it.message ?: "Не удалось загрузить каталог" }
        loading = false
    }'''
if old not in cat:
    raise SystemExit('Catalog load block not found')
cat = cat.replace(old, new, 1)
s = s[:cat_start] + cat + s[cat_end:]

# Catalog card media belongs to the thread card: tapping it opens the thread, not the gallery.
card_start = s.find('@Composable\nprivate fun ThreadCard(')
card_end = s.find('\n@Composable\nprivate fun ThreadScreen(', card_start)
if card_start < 0 or card_end < 0:
    raise SystemExit('ThreadCard markers not found')
card = s[card_start:card_end]
if 'onOpen = onMedia' not in card:
    raise SystemExit('Catalog media click marker not found')
card = card.replace('onOpen = onMedia', 'onOpen = { _, _ -> onClick() }', 1)
s = s[:card_start] + card + s[card_end:]

# Boards: add recent thread history under favorites.
boards_start = s.find('@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun BoardsScreen')
boards_end = s.find('\n@Composable\nprivate fun BoardRow', boards_start)
if boards_start < 0 or boards_end < 0:
    raise SystemExit('BoardsScreen markers not found')
boards = s[boards_start:boards_end]
old = '    val favorites = readingStore.favoriteThreads()\n    val categories = remember(boards) {'
new = '''    val favorites = readingStore.favoriteThreads()
    val favoriteKeys = favorites.map { "${it.board}:${it.thread}" }.toSet()
    val history = readingStore.recentThreads(12).filterNot { "${it.board}:${it.thread}" in favoriteKeys }
    val categories = remember(boards) {'''
if old not in boards:
    raise SystemExit('favorites anchor not found')
boards = boards.replace(old, new, 1)
cat_anchor = '''        Text(
            "Категории",'''
history_ui = '''        if (history.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(start = 14.dp, end = 14.dp, top = 12.dp, bottom = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("История", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                Text("${history.size}", color = Muted, fontSize = 12.sp)
            }
            LazyRow(
                contentPadding = PaddingValues(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(history, key = { "history:${it.board}:${it.thread}" }) { recent ->
                    Surface(
                        color = Surface1,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.width(220.dp).clickable { onFavoriteThread(recent.board, recent.thread) }
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text("/${recent.board}/  №${recent.thread}", color = Accent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(recent.title, color = Color.White, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }

        Text(
            "Категории",'''
if cat_anchor not in boards:
    raise SystemExit('Categories anchor not found')
boards = boards.replace(cat_anchor, history_ui, 1)
s = s[:boards_start] + boards + s[boards_end:]

# Thread: show cached posts immediately and remember it in history after refresh.
thread_start = s.find('@Composable\nprivate fun ThreadScreen(')
thread_end = s.find('\n@Composable\nprivate fun PostCard(', thread_start)
if thread_start < 0 or thread_end < 0:
    raise SystemExit('ThreadScreen markers not found')
thread = s[thread_start:thread_end]
old = '''    LaunchedEffect(board, thread, refreshToken, retry) {
        val previous = posts
        loading = previous.isEmpty()
        error = null
        val result = runCatching { repository.loadThread(board, thread) }'''
new = '''    LaunchedEffect(board, thread, refreshToken, retry) {
        if (posts.isEmpty()) {
            val cached = repository.cachedThread(board, thread)
            if (cached.isNotEmpty()) {
                posts = cached
                loading = false
                val cachedTitle = cached.firstOrNull()?.subject?.let { htmlToPlain(it) }.orEmpty().ifBlank { "Тред №$thread" }
                readingStore.markVisited(board, thread, cachedTitle, cached.lastOrNull()?.num ?: thread)
            }
        }
        val previous = posts
        loading = previous.isEmpty()
        error = null
        val result = runCatching { repository.loadThread(board, thread) }'''
if old not in thread:
    raise SystemExit('Thread load start not found')
thread = thread.replace(old, new, 1)
old = '''            posts = fresh
            if (favorite) {'''
new = '''            posts = fresh
            val historyTitle = fresh.firstOrNull()?.subject?.let { htmlToPlain(it) }.orEmpty().ifBlank { "Тред №$thread" }
            readingStore.markVisited(board, thread, historyTitle, fresh.lastOrNull()?.num ?: thread)
            if (favorite) {'''
if old not in thread:
    raise SystemExit('Thread history anchor not found')
thread = thread.replace(old, new, 1)
s = s[:thread_start] + thread + s[thread_end:]

# Fix raw HTML/entities in post author/ID headers, both normal cards and quote previews.
post_start = s.find('@Composable\nprivate fun PostCard(')
html_start = s.find('\n@Composable\nprivate fun HtmlPostText', post_start)
if post_start < 0 or html_start < 0:
    raise SystemExit('PostCard/preview markers not found')
post_section = s[post_start:html_start]
count = post_section.count('(post.name.ifBlank { "Аноним" })')
if count < 2:
    raise SystemExit(f'Expected author markers in card+preview, got {count}')
post_section = post_section.replace('(post.name.ifBlank { "Аноним" })', 'cleanPostName(post.name)')
s = s[:post_start] + post_section + s[html_start:]

helper_anchor = 'private fun extractReplyTargets(html: String): List<Long> {'
helper = '''private fun cleanPostName(raw: String): String {
    val clean = htmlToPlain(raw)
        .replace('\\u00A0', ' ')
        .replace(Regex("\\\\s+"), " ")
        .trim()
    return clean.ifBlank { "Аноним" }
}

private fun extractReplyTargets(html: String): List<Long> {'''
if helper_anchor not in s:
    raise SystemExit('reply helper anchor not found')
s = s.replace(helper_anchor, helper, 1)

ui.write_text(s, encoding='utf-8')
print('v0.7 cache/history/native-thread/HTML fixes applied')
