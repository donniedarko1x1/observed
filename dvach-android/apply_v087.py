from pathlib import Path

# Materialize complete working v0.8.6 first.
exec(Path('apply_v086.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 16", "versionCode 17")
s = s.replace("versionName '0.8.6'", "versionName '0.8.7'")
build.write_text(s, encoding='utf-8')

# Make manual refresh a real network refresh instead of allowing HTTP/CDN cache reuse.
repo = Path('app/src/main/java/su/dvach/neo/DvachRepository.kt')
r = repo.read_text(encoding='utf-8')
r = r.replace('val live = fetchText("/index.json")', 'val live = fetchText("/index.json", noCache = force)', 1)
r = r.replace(
    'suspend fun loadCatalog(board: String): List<ThreadItem> = withContext(Dispatchers.IO) {',
    'suspend fun loadCatalog(board: String, force: Boolean = false): List<ThreadItem> = withContext(Dispatchers.IO) {',
    1
)
r = r.replace(
    'val live = fetchText("/$board/catalog.json")',
    'val live = fetchText("/$board/catalog.json", noCache = force)',
    1
)
r = r.replace(
    'suspend fun loadThread(board: String, thread: Long): List<PostItem> = withContext(Dispatchers.IO) {',
    'suspend fun loadThread(board: String, thread: Long, force: Boolean = false): List<PostItem> = withContext(Dispatchers.IO) {',
    1
)
r = r.replace(
    'val live = fetchText("/$board/res/$thread.json")',
    'val live = fetchText("/$board/res/$thread.json", noCache = force)',
    1
)
r = r.replace(
    'private fun fetchText(path: String): String {',
    'private fun fetchText(path: String, noCache: Boolean = false): String {',
    1
)
old_conn = '                connection = URL(base + path).openConnection() as HttpURLConnection\n'
new_conn = '''                val requestPath = if (noCache) {
                    path + (if ('?' in path) "&" else "?") + "_dn=" + System.currentTimeMillis()
                } else path
                connection = URL(base + requestPath).openConnection() as HttpURLConnection
                connection.useCaches = !noCache
'''
if old_conn not in r:
    raise SystemExit('repository connection anchor not found')
r = r.replace(old_conn, new_conn, 1)
header_anchor = '                connection.setRequestProperty("Referer", "$base/")\n'
header_extra = '''                connection.setRequestProperty("Referer", "$base/")
                if (noCache) {
                    connection.setRequestProperty("Cache-Control", "no-cache, no-store, max-age=0")
                    connection.setRequestProperty("Pragma", "no-cache")
                }
'''
if header_anchor not in r:
    raise SystemExit('repository header anchor not found')
r = r.replace(header_anchor, header_extra, 1)
repo.write_text(r, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

# Scroll-to-top icon.
import_anchor = 'import androidx.compose.material.icons.filled.Refresh\n'
if 'import androidx.compose.material.icons.filled.KeyboardArrowUp\n' not in s:
    if import_anchor not in s:
        raise SystemExit('refresh icon import anchor not found')
    s = s.replace(import_anchor, import_anchor + 'import androidx.compose.material.icons.filled.KeyboardArrowUp\n', 1)

# Force current catalog/thread to bypass network cache when the toolbar refresh token changes.
s = s.replace(
    'repository.loadCatalog(board)',
    'repository.loadCatalog(board, force = refreshToken > 0 || retry > 0)',
    1
)
s = s.replace(
    'repository.loadThread(board, thread)',
    'repository.loadThread(board, thread, force = refreshToken > 0 || retry > 0)',
    1
)

# Show visible feedback while a manual refresh is happening even when old data remains on screen.
s = s.replace('        loading = data.isEmpty()\n        error = null',
              '        loading = data.isEmpty() || refreshToken > 0 || retry > 0\n        error = null', 1)
s = s.replace('        loading = previous.isEmpty()\n        error = null',
              '        loading = previous.isEmpty() || refreshToken > 0 || retry > 0\n        error = null', 1)

# Reusable bottom-left scroll-to-top control.
boards_marker = '@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun BoardsScreen'
helper = r'''@Composable
private fun ScrollToTopButton(
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        color = Surface2.copy(alpha = 0.92f),
        shape = RoundedCornerShape(50),
        shadowElevation = 6.dp,
        modifier = modifier.size(48.dp).clickable(onClick = onClick)
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Icon(
                Icons.Default.KeyboardArrowUp,
                contentDescription = "Наверх",
                tint = Accent,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

'''
if boards_marker not in s:
    raise SystemExit('BoardsScreen marker not found')
s = s.replace(boards_marker, helper + boards_marker, 1)

# Boards / Favorites / History: one shared list state and bottom-left arrow.
bs = s.find('@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun BoardsScreen')
be = s.find('\n@Composable\nprivate fun BoardRow', bs)
if bs < 0 or be < 0:
    raise SystemExit('BoardsScreen section markers not found')
boards = s[bs:be]
retry_anchor = '    var retry by remember { mutableIntStateOf(0) }\n'
if retry_anchor not in boards:
    raise SystemExit('Boards retry anchor not found')
boards = boards.replace(
    retry_anchor,
    retry_anchor + '    val listState = rememberLazyListState()\n    val scope = rememberCoroutineScope()\n',
    1
)
# Keep a category switch predictable instead of leaving the new list halfway down.
category_effect = '''    LaunchedEffect(categories, selectedCategory) {
        if (selectedCategory !in special && selectedCategory !in categories) selectedCategory = "Все"
    }
'''
if category_effect in boards:
    boards = boards.replace(
        category_effect,
        category_effect + '''    LaunchedEffect(selectedCategory) {
        if (listState.firstVisibleItemIndex != 0 || listState.firstVisibleItemScrollOffset != 0) {
            listState.scrollToItem(0)
        }
    }
''',
        1
    )
open_root = '    Column(Modifier.fillMaxSize()) {\n'
if open_root not in boards:
    raise SystemExit('Boards root Column not found')
boards = boards.replace(open_root, '    Box(Modifier.fillMaxSize()) {\n        Column(Modifier.fillMaxSize()) {\n', 1)
boards = boards.replace(
    '                LazyColumn(\n                    modifier = Modifier.fillMaxSize(),',
    '                LazyColumn(\n                    state = listState,\n                    modifier = Modifier.fillMaxSize(),'
)
boards = boards.replace('bottom = 18.dp', 'bottom = 74.dp')
end_token = '\n    }\n}'
idx = boards.rfind(end_token)
if idx < 0:
    raise SystemExit('Boards closing token not found')
boards = boards[:idx] + '''
        }
        ScrollToTopButton(
            modifier = Modifier.align(Alignment.BottomStart).padding(start = 14.dp, bottom = 14.dp),
            onClick = { scope.launch { listState.animateScrollToItem(0) } }
        )
    }
}''' + boards[idx + len(end_token):]
s = s[:bs] + boards + s[be:]

# Catalog already has a LazyListState. Add visible bottom-left arrow and extra bottom padding.
cs = s.find('@Composable\nprivate fun CatalogScreen(')
ce = s.find('\n@Composable\nprivate fun ThreadCard(', cs)
if cs < 0 or ce < 0:
    raise SystemExit('CatalogScreen markers not found')
cat = s[cs:ce]
cat_state = '    val listState = rememberLazyListState()\n'
if cat_state not in cat:
    raise SystemExit('Catalog listState anchor not found')
cat = cat.replace(cat_state, cat_state + '    val scope = rememberCoroutineScope()\n', 1)
cat = cat.replace(
    'contentPadding = PaddingValues(10.dp),',
    'contentPadding = PaddingValues(start = 10.dp, end = 10.dp, top = 10.dp, bottom = 74.dp),',
    1
)
cat_loading = '        if (loading) CircularProgressIndicator(Modifier.align(Alignment.Center), color = Accent)\n'
if cat_loading not in cat:
    raise SystemExit('Catalog loading anchor not found')
cat = cat.replace(
    cat_loading,
    cat_loading + '''        ScrollToTopButton(
            modifier = Modifier.align(Alignment.BottomStart).padding(start = 14.dp, bottom = 14.dp),
            onClick = { scope.launch { listState.animateScrollToItem(0) } }
        )
''',
    1
)
s = s[:cs] + cat + s[ce:]

# Thread already has list state + coroutine scope; add the same bottom-left arrow.
ts = s.find('@Composable\nprivate fun ThreadScreen(')
te = s.find('\n@Composable\nprivate fun PostCard(', ts)
if ts < 0 or te < 0:
    raise SystemExit('ThreadScreen markers not found')
thread = s[ts:te]
thread_loading = '        if (loading) CircularProgressIndicator(Modifier.align(Alignment.Center), color = Accent)\n'
if thread_loading not in thread:
    raise SystemExit('Thread loading anchor not found')
thread = thread.replace(
    thread_loading,
    thread_loading + '''        ScrollToTopButton(
            modifier = Modifier.align(Alignment.BottomStart).padding(start = 14.dp, bottom = 14.dp),
            onClick = { scope.launch { state.animateScrollToItem(0) } }
        )
''',
    1
)
s = s[:ts] + thread + s[te:]

ui.write_text(s, encoding='utf-8')
print('v0.8.7 refresh + bottom-left scroll-to-top patch applied')
