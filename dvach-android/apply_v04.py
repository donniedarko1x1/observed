from pathlib import Path
import re

p = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = p.read_text(encoding='utf-8')

# Base Compose fixes carried over from v0.3.
s = s.replace('import androidx.compose.material3.DarkColorScheme\n', '')
s = s.replace('import androidx.compose.runtime.rememberSaveable\n', 'import androidx.compose.runtime.saveable.rememberSaveable\n')
s = s.replace('import androidx.compose.runtime.rememberSaveableStateHolder\n', 'import androidx.compose.runtime.saveable.rememberSaveableStateHolder\n')
s = s.replace('private val AppColors: DarkColorScheme = darkColorScheme(', 'private val AppColors = darkColorScheme(')

cookie_pattern = r'CookieManager\.getInstance\(\)\.apply\s*\{\s*setAcceptCookie\(true\)\s*setAcceptThirdPartyCookies\([^\n]+\)\s*\}'
cookie_replacement = 'val cookies = CookieManager.getInstance()\n                        cookies.setAcceptCookie(true)\n                        cookies.setAcceptThirdPartyCookies(this, true)'
s, cookie_count = re.subn(cookie_pattern, cookie_replacement, s, count=1, flags=re.MULTILINE)
if cookie_count != 1:
    raise SystemExit(f'CookieManager patch count: {cookie_count}')

# Replace grouped/sticky boards screen with category chips + a flat board list.
start = s.find('@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun BoardsScreen')
end = s.find('\n@Composable\nprivate fun BoardRow', start)
if start < 0 or end < 0:
    raise SystemExit('BoardsScreen markers not found')

boards_screen = r'''@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun BoardsScreen(repository: DvachRepository, refreshToken: Int, onBoard: (String) -> Unit) {
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

        Text(
            "Категории",
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
            fontSize = 14.sp,
            modifier = Modifier.padding(start = 14.dp, top = 10.dp, bottom = 7.dp)
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

s = s[:start] + boards_screen.rstrip() + s[end:]

# Add the board category as a small subtitle now that sticky group headers are gone.
category_anchor = '''                if (board.info.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text(htmlToPlain(board.info), color = Muted, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }'''
category_replacement = '''                Spacer(Modifier.height(4.dp))
                Text(board.category, color = Accent.copy(alpha = 0.85f), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                if (board.info.isNotBlank()) {
                    Spacer(Modifier.height(3.dp))
                    Text(htmlToPlain(board.info), color = Muted, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }'''
if category_anchor not in s:
    raise SystemExit('BoardRow category anchor not found')
s = s.replace(category_anchor, category_replacement, 1)

# Make media downloading directly discoverable on each thumbnail.
post_anchor = ''') {
    var revealSpoilers by rememberSaveable(post.num) { mutableStateOf(false) }
    val hasSpoilers = remember(post.commentHtml)'''
post_replacement = ''') {
    val context = LocalContext.current
    var revealSpoilers by rememberSaveable(post.num) { mutableStateOf(false) }
    val hasSpoilers = remember(post.commentHtml)'''
if post_anchor not in s:
    raise SystemExit('PostCard context anchor not found')
s = s.replace(post_anchor, post_replacement, 1)

video_anchor = '''                            if (media.isVideo) {
                                Surface(color = Color.Black.copy(alpha = 0.55f), shape = RoundedCornerShape(20.dp)) {
                                    Text("▶", color = Color.White, fontSize = 19.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp))
                                }
                            }'''
video_replacement = '''                            if (media.isVideo) {
                                Surface(color = Color.Black.copy(alpha = 0.55f), shape = RoundedCornerShape(20.dp)) {
                                    Text("▶", color = Color.White, fontSize = 19.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp))
                                }
                            }
                            IconButton(
                                onClick = { downloadMedia(context, repository.absolute(media.path), repository.activeBase) },
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(4.dp)
                                    .size(34.dp)
                                    .background(Color.Black.copy(alpha = 0.68f), RoundedCornerShape(10.dp))
                            ) {
                                Icon(
                                    Icons.Default.Download,
                                    contentDescription = "Скачать файл",
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }'''
if video_anchor not in s:
    raise SystemExit('Media thumbnail anchor not found')
s = s.replace(video_anchor, video_replacement, 1)

# Clearer feedback about the system Downloads folder.
s = s.replace('Toast.makeText(context, "Скачивание началось", Toast.LENGTH_SHORT).show()',
              'Toast.makeText(context, "Скачивание началось • папка Downloads", Toast.LENGTH_SHORT).show()', 1)

p.write_text(s, encoding='utf-8')
print('v0.4 source patch applied')
