from pathlib import Path

# Materialize complete v0.7 first.
exec(Path('apply_v07.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 8", "versionCode 9")
s = s.replace("versionName '0.7.0'", "versionName '0.7.1'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

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
    val history = readingStore.recentThreads(40)

    val categories = remember(boards) {
        val preferred = listOf(
            "Тематика", "Творчество", "Политика и новости", "Техника и софт", "Игры",
            "Японская культура", "Взрослым", "Взрослым (18+)", "Разное", "Разное (18+)",
            "Новые доски", "Прочие"
        )
        val available = boards.map { it.category.ifBlank { "Прочие" } }.distinct()
        preferred.filter { it in available } + available.filter { it !in preferred }.sorted()
    }

    val special = setOf("Избранное", "История", "Все")
    LaunchedEffect(categories, selectedCategory) {
        if (selectedCategory !in special && selectedCategory !in categories) selectedCategory = "Все"
    }

    val boardResults = remember(boards, query, selectedCategory) {
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

    val favoriteResults = remember(favorites, query) {
        val q = query.trim().lowercase(Locale.ROOT)
        if (q.isBlank()) favorites else favorites.filter {
            it.board.lowercase(Locale.ROOT).contains(q) ||
                it.title.lowercase(Locale.ROOT).contains(q) ||
                it.thread.toString().contains(q)
        }
    }

    val historyResults = remember(history, query) {
        val q = query.trim().lowercase(Locale.ROOT)
        if (q.isBlank()) history else history.filter {
            it.board.lowercase(Locale.ROOT).contains(q) ||
                it.title.lowercase(Locale.ROOT).contains(q) ||
                it.thread.toString().contains(q)
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
            items(listOf("Избранное", "История", "Все") + categories, key = { it }) { category ->
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
            placeholder = {
                Text(
                    when (selectedCategory) {
                        "Избранное" -> "Найти в избранном"
                        "История" -> "Найти в истории"
                        else -> "Найти доску"
                    }
                )
            },
            shape = RoundedCornerShape(16.dp)
        )

        if (error != null && boards.isEmpty() && selectedCategory !in setOf("Избранное", "История")) {
            ErrorPane(error!!, onRetry = { retry++ })
            return@Column
        }

        when (selectedCategory) {
            "Избранное" -> {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Избранные треды", color = Accent, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    Text("${favoriteResults.size}", color = Muted, fontSize = 12.sp)
                }
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 5.dp, bottom = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(favoriteResults, key = { "fav:${it.board}:${it.thread}" }) { item ->
                        Surface(
                            color = Surface1,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth().clickable { onFavoriteThread(item.board, item.thread) }
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Text("/${item.board}/  №${item.thread}", color = Accent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(5.dp))
                                Text(item.title, color = Color.White, fontSize = 14.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                if (item.lastRead > 0L) {
                                    Spacer(Modifier.height(5.dp))
                                    Text("читали до №${item.lastRead}", color = Muted, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                    if (favoriteResults.isEmpty()) {
                        item { Text("Избранных тредов пока нет", color = Muted, modifier = Modifier.padding(20.dp)) }
                    }
                }
            }

            "История" -> {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("История", color = Accent, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    Text("${historyResults.size}", color = Muted, fontSize = 12.sp)
                }
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 5.dp, bottom = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(historyResults, key = { "history:${it.board}:${it.thread}" }) { item ->
                        Surface(
                            color = Surface1,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth().clickable { onFavoriteThread(item.board, item.thread) }
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Text("/${item.board}/  №${item.thread}", color = Accent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(5.dp))
                                Text(item.title, color = Color.White, fontSize = 14.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                if (item.lastPost > 0L) {
                                    Spacer(Modifier.height(5.dp))
                                    Text("последний пост №${item.lastPost}", color = Muted, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                    if (historyResults.isEmpty()) {
                        item { Text("История пока пуста", color = Muted, modifier = Modifier.padding(20.dp)) }
                    }
                }
            }

            else -> {
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
                    Text("${boardResults.size} / ${boards.size}", color = Muted, fontSize = 12.sp)
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 5.dp, bottom = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(1.dp)
                ) {
                    items(boardResults, key = { it.id }) { board ->
                        BoardRow(board = board, onClick = { onBoard(board.id) })
                    }
                    if (!loading && boardResults.isEmpty()) {
                        item { Text("В этой категории ничего не найдено", color = Muted, modifier = Modifier.padding(20.dp)) }
                    }
                }
            }
        }
    }
}
'''

s = s[:start] + boards.rstrip() + s[end:]
ui.write_text(s, encoding='utf-8')
print('v0.7.1 favorites/history category tabs applied')
