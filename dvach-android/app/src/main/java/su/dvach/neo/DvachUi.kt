package su.dvach.neo

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color as AndroidColor
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.text.Html
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.view.View
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Reply
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DarkColorScheme
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberSaveable
import androidx.compose.runtime.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.Saver
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.text.HtmlCompat
import androidx.media3.common.MediaItem as ExoMediaItem
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView
import coil.ImageLoader
import coil.compose.AsyncImage
import coil.decode.GifDecoder
import coil.decode.ImageDecoderDecoder
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.regex.Pattern
import kotlin.math.max
import kotlin.math.min

private val Bg = Color(0xFF0B0D10)
private val Surface1 = Color(0xFF14171B)
private val Surface2 = Color(0xFF1B2026)
private val Accent = Color(0xFFF2A24A)
private val Muted = Color(0xFF9BA3AD)
private val Quote = Color(0xFF70C980)
private const val APP_UA = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 DvachNeo/0.3"

private val AppColors: DarkColorScheme = darkColorScheme(
    primary = Accent,
    onPrimary = Color.Black,
    background = Bg,
    onBackground = Color(0xFFF1F3F5),
    surface = Surface1,
    onSurface = Color(0xFFF1F3F5),
    surfaceVariant = Surface2,
    onSurfaceVariant = Muted
)

private sealed interface AppScreen {
    val key: String
    data object Boards : AppScreen { override val key = "boards" }
    data class Catalog(val board: String) : AppScreen { override val key = "catalog:$board" }
    data class Thread(val board: String, val thread: Long) : AppScreen { override val key = "thread:$board:$thread" }
}

private data class PostingTarget(val board: String, val thread: Long)
private data class GalleryState(val items: List<MediaItem>, val initial: Int)

private val screenSaver = Saver<AppScreen, String>(
    save = {
        when (it) {
            AppScreen.Boards -> "boards"
            is AppScreen.Catalog -> "catalog|${it.board}"
            is AppScreen.Thread -> "thread|${it.board}|${it.thread}"
        }
    },
    restore = { raw ->
        val p = raw.split('|')
        when (p.firstOrNull()) {
            "catalog" -> p.getOrNull(1)?.let { AppScreen.Catalog(it) } ?: AppScreen.Boards
            "thread" -> {
                val board = p.getOrNull(1)
                val number = p.getOrNull(2)?.toLongOrNull()
                if (board != null && number != null) AppScreen.Thread(board, number) else AppScreen.Boards
            }
            else -> AppScreen.Boards
        }
    }
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DvachNeoApp(repository: DvachRepository, activity: MainActivity) {
    MaterialTheme(colorScheme = AppColors) {
        var screen by rememberSaveable(stateSaver = screenSaver) { mutableStateOf<AppScreen>(AppScreen.Boards) }
        var refreshToken by remember { mutableIntStateOf(0) }
        var posting by remember { mutableStateOf<PostingTarget?>(null) }
        var gallery by remember { mutableStateOf<GalleryState?>(null) }
        val stateHolder = rememberSaveableStateHolder()
        val imageLoader = remember(activity) {
            ImageLoader.Builder(activity)
                .components {
                    if (Build.VERSION.SDK_INT >= 28) add(ImageDecoderDecoder.Factory())
                    else add(GifDecoder.Factory())
                }
                .crossfade(true)
                .build()
        }

        fun navigateBack() {
            screen = when (val s = screen) {
                AppScreen.Boards -> AppScreen.Boards
                is AppScreen.Catalog -> AppScreen.Boards
                is AppScreen.Thread -> AppScreen.Catalog(s.board)
            }
        }

        BackHandler(enabled = posting == null && gallery == null && screen != AppScreen.Boards) { navigateBack() }

        Box(Modifier.fillMaxSize().background(Bg)) {
            Scaffold(
                containerColor = Bg,
                contentWindowInsets = WindowInsets.safeDrawing,
                topBar = {
                    AppBar(
                        screen = screen,
                        onBack = ::navigateBack,
                        onRefresh = { refreshToken++ },
                        onAction = {
                            when (val s = screen) {
                                AppScreen.Boards -> Unit
                                is AppScreen.Catalog -> posting = PostingTarget(s.board, 0L)
                                is AppScreen.Thread -> posting = PostingTarget(s.board, s.thread)
                            }
                        }
                    )
                }
            ) { padding ->
                Box(Modifier.fillMaxSize().padding(padding)) {
                    stateHolder.SaveableStateProvider(screen.key) {
                        when (val s = screen) {
                            AppScreen.Boards -> BoardsScreen(
                                repository = repository,
                                refreshToken = refreshToken,
                                onBoard = { screen = AppScreen.Catalog(it) }
                            )
                            is AppScreen.Catalog -> CatalogScreen(
                                board = s.board,
                                repository = repository,
                                imageLoader = imageLoader,
                                refreshToken = refreshToken,
                                onThread = { screen = AppScreen.Thread(s.board, it) }
                            )
                            is AppScreen.Thread -> ThreadScreen(
                                board = s.board,
                                thread = s.thread,
                                repository = repository,
                                imageLoader = imageLoader,
                                refreshToken = refreshToken,
                                onMedia = { items, index -> gallery = GalleryState(items, index) }
                            )
                        }
                    }
                }
            }

            gallery?.let { state ->
                MediaViewer(
                    state = state,
                    repository = repository,
                    imageLoader = imageLoader,
                    onClose = { gallery = null }
                )
            }

            posting?.let { target ->
                PostingScreen(
                    target = target,
                    repository = repository,
                    activity = activity,
                    onClose = { posting = null }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppBar(
    screen: AppScreen,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onAction: () -> Unit
) {
    val title = when (screen) {
        AppScreen.Boards -> "Двач Neo"
        is AppScreen.Catalog -> "/${screen.board}/"
        is AppScreen.Thread -> "/${screen.board}/  №${screen.thread}"
    }
    CenterAlignedTopAppBar(
        title = {
            Text(title, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        },
        navigationIcon = {
            if (screen != AppScreen.Boards) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                }
            }
        },
        actions = {
            when (screen) {
                AppScreen.Boards -> Unit
                is AppScreen.Catalog -> IconButton(onClick = onAction) { Icon(Icons.Default.Add, contentDescription = "Новый тред") }
                is AppScreen.Thread -> IconButton(onClick = onAction) { Icon(Icons.AutoMirrored.Filled.Reply, contentDescription = "Ответить") }
            }
            IconButton(onClick = onRefresh) { Icon(Icons.Default.Refresh, contentDescription = "Обновить") }
        },
        colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Bg, titleContentColor = Color.White)
    )
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun BoardsScreen(repository: DvachRepository, refreshToken: Int, onBoard: (String) -> Unit) {
    var boards by remember { mutableStateOf<List<BoardItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var query by rememberSaveable { mutableStateOf("") }
    var retry by remember { mutableIntStateOf(0) }

    LaunchedEffect(refreshToken, retry) {
        loading = true
        error = null
        runCatching { repository.loadBoards(force = refreshToken > 0 || retry > 0) }
            .onSuccess { boards = it }
            .onFailure { error = it.message ?: "Не удалось загрузить список досок" }
        loading = false
    }

    Column(Modifier.fillMaxSize()) {
        if (loading) androidx.compose.material3.LinearProgressIndicator(Modifier.fillMaxWidth(), color = Accent)
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

        val filtered = remember(boards, query) {
            val q = query.trim().lowercase(Locale.ROOT)
            if (q.isBlank()) boards else boards.filter {
                it.id.lowercase(Locale.ROOT).contains(q) ||
                    it.name.lowercase(Locale.ROOT).contains(q) ||
                    it.info.lowercase(Locale.ROOT).contains(q) ||
                    it.category.lowercase(Locale.ROOT).contains(q)
            }
        }
        val groups = remember(filtered) { filtered.groupBy { it.category } }
        val preferredOrder = listOf(
            "Тематика", "Творчество", "Политика и новости", "Техника и софт", "Игры",
            "Японская культура", "Взрослым", "Взрослым (18+)", "Разное", "Разное (18+)", "Новые доски", "Прочие"
        )
        val categoryOrder = remember(groups) {
            preferredOrder.filter { it in groups } + groups.keys.filter { it !in preferredOrder }.sorted()
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 12.dp, end = 12.dp, bottom = 18.dp)
        ) {
            item {
                Text(
                    text = if (boards.isEmpty()) "" else "${boards.size} доски • живой список 2ch",
                    color = Muted,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
                )
            }
            categoryOrder.forEach { category ->
                stickyHeader(key = "header:$category") {
                    Surface(color = Bg.copy(alpha = 0.97f)) {
                        Text(
                            category,
                            color = Accent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 9.dp)
                        )
                    }
                }
                items(groups[category].orEmpty(), key = { it.id }) { board ->
                    BoardRow(board = board, onClick = { onBoard(board.id) })
                }
            }
            if (!loading && filtered.isEmpty()) {
                item { Text("Ничего не найдено", color = Muted, modifier = Modifier.padding(20.dp)) }
            }
        }
    }
}

@Composable
private fun BoardRow(board: BoardItem, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        shape = RoundedCornerShape(16.dp),
        color = Surface1,
        tonalElevation = 0.dp
    ) {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("/${board.id}/", color = Accent, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.width(10.dp))
                    Text(board.name, color = Color.White, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                if (board.info.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text(htmlToPlain(board.info), color = Muted, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(horizontalAlignment = Alignment.End) {
                Text("${board.speed} п/ч", color = Color(0xFFD5DAE0), fontSize = 12.sp)
                Text("${board.uniquePosters} online", color = Muted, fontSize = 11.sp)
                if (board.threads > 0) Text("${board.threads} тредов", color = Muted, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun CatalogScreen(
    board: String,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    refreshToken: Int,
    onThread: (Long) -> Unit
) {
    var data by remember { mutableStateOf<List<ThreadItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var retry by remember { mutableIntStateOf(0) }
    val listState = rememberLazyListState()

    LaunchedEffect(board, refreshToken, retry) {
        loading = true
        error = null
        runCatching { repository.loadCatalog(board) }
            .onSuccess { data = it }
            .onFailure { error = it.message ?: "Не удалось загрузить каталог" }
        loading = false
    }

    Box(Modifier.fillMaxSize()) {
        if (error != null && data.isEmpty()) {
            ErrorPane(error!!, onRetry = { retry++ })
        } else {
            LazyColumn(
                state = listState,
                contentPadding = PaddingValues(10.dp),
                verticalArrangement = Arrangement.spacedBy(9.dp)
            ) {
                items(data, key = { it.num }) { thread ->
                    ThreadCard(thread, repository, imageLoader) { onThread(thread.num) }
                }
            }
        }
        if (loading) CircularProgressIndicator(Modifier.align(Alignment.Center), color = Accent)
    }
}

@Composable
private fun ThreadCard(
    thread: ThreadItem,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = Surface1,
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
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
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.Top) {
                thread.files.firstOrNull()?.let { media ->
                    AsyncImage(
                        model = repository.absolute(media.thumbnail.ifBlank { media.path }),
                        imageLoader = imageLoader,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.size(112.dp).clip(RoundedCornerShape(12.dp)).background(Surface2)
                    )
                    Spacer(Modifier.width(12.dp))
                }
                Text(
                    htmlToPlain(thread.commentHtml),
                    color = Color(0xFFE1E4E8),
                    fontSize = 14.sp,
                    lineHeight = 19.sp,
                    maxLines = 7,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun ThreadScreen(
    board: String,
    thread: Long,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    refreshToken: Int,
    onMedia: (List<MediaItem>, Int) -> Unit
) {
    var posts by remember { mutableStateOf<List<PostItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var retry by remember { mutableIntStateOf(0) }
    var highlighted by remember { mutableStateOf<Long?>(null) }
    val state = rememberLazyListState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(board, thread, refreshToken, retry) {
        loading = true
        error = null
        runCatching { repository.loadThread(board, thread) }
            .onSuccess { posts = it }
            .onFailure { error = it.message ?: "Не удалось загрузить тред" }
        loading = false
    }
    LaunchedEffect(highlighted) {
        if (highlighted != null) {
            delay(1400)
            highlighted = null
        }
    }

    val allMedia = remember(posts) { posts.flatMap { it.files } }

    Box(Modifier.fillMaxSize()) {
        if (error != null && posts.isEmpty()) {
            ErrorPane(error!!, onRetry = { retry++ })
        } else {
            LazyColumn(
                state = state,
                contentPadding = PaddingValues(start = 8.dp, end = 8.dp, top = 8.dp, bottom = 22.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                itemsIndexed(posts, key = { _, post -> post.num }) { _, post ->
                    PostCard(
                        post = post,
                        highlighted = highlighted == post.num,
                        repository = repository,
                        imageLoader = imageLoader,
                        allMedia = allMedia,
                        onMedia = onMedia,
                        onReply = { target ->
                            val index = posts.indexOfFirst { it.num == target }
                            if (index >= 0) {
                                highlighted = target
                                scope.launch { state.animateScrollToItem(index) }
                            }
                        }
                    )
                }
            }
        }
        if (loading) CircularProgressIndicator(Modifier.align(Alignment.Center), color = Accent)
    }
}

@Composable
private fun PostCard(
    post: PostItem,
    highlighted: Boolean,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    allMedia: List<MediaItem>,
    onMedia: (List<MediaItem>, Int) -> Unit,
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
            }
            if (post.date.isNotBlank()) Text(post.date, color = Muted, fontSize = 11.sp)
            if (post.subject.isNotBlank()) {
                Spacer(Modifier.height(5.dp))
                Text(htmlToPlain(post.subject), color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            }

            if (post.files.isNotEmpty()) {
                Spacer(Modifier.height(9.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    items(post.files, key = { it.path }) { media ->
                        Box(
                            modifier = Modifier
                                .size(112.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Surface2)
                                .clickable {
                                    val index = allMedia.indexOfFirst { it.path == media.path }.coerceAtLeast(0)
                                    onMedia(allMedia, index)
                                },
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
                                Surface(color = Color.Black.copy(alpha = 0.55f), shape = RoundedCornerShape(20.dp)) {
                                    Text("▶", color = Color.White, fontSize = 19.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp))
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(9.dp))
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

@Composable
private fun HtmlPostText(html: String, onReply: (Long) -> Unit) {
    AndroidView(
        modifier = Modifier.fillMaxWidth(),
        factory = { context ->
            TextView(context).apply {
                setTextColor(AndroidColor.rgb(235, 237, 240))
                setLinkTextColor(AndroidColor.rgb(242, 162, 74))
                textSize = 14f
                movementMethod = LinkMovementMethod.getInstance()
                highlightColor = AndroidColor.TRANSPARENT
                setTextIsSelectable(true)
                setLineSpacing(0f, 1.08f)
            }
        },
        update = { view -> view.text = makeRichText(html, onReply) }
    )
}

private fun makeRichText(html: String, onReply: (Long) -> Unit): SpannableStringBuilder {
    val raw = HtmlCompat.fromHtml(html, HtmlCompat.FROM_HTML_MODE_LEGACY)
    val text = SpannableStringBuilder(raw)
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun MediaViewer(
    state: GalleryState,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val pager = rememberPagerState(initialPage = state.initial.coerceIn(0, max(0, state.items.lastIndex)), pageCount = { state.items.size })
    BackHandler(onBack = onClose)

    Surface(color = Color.Black, modifier = Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
            Row(
                modifier = Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onClose) { Icon(Icons.Default.Close, contentDescription = "Закрыть") }
                val current = state.items.getOrNull(pager.currentPage)
                Text(
                    "${pager.currentPage + 1} / ${state.items.size}" + (current?.displayName?.takeIf { it.isNotBlank() }?.let { "  $it" } ?: ""),
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                current?.let { media ->
                    IconButton(onClick = { shareUrl(context, repository.absolute(media.path)) }) { Icon(Icons.Default.Share, contentDescription = "Поделиться") }
                    IconButton(onClick = { downloadMedia(context, repository.absolute(media.path), repository.activeBase) }) { Icon(Icons.Default.Download, contentDescription = "Скачать") }
                }
            }
            HorizontalPager(state = pager, modifier = Modifier.fillMaxSize()) { page ->
                val media = state.items[page]
                if (media.isVideo) {
                    VideoPage(url = repository.absolute(media.path), referer = repository.activeBase + "/")
                } else {
                    ZoomableImage(url = repository.absolute(media.path), imageLoader = imageLoader)
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
private fun VideoPage(url: String, referer: String) {
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
                playWhenReady = true
            }
    }
    DisposableEffect(player) { onDispose { player.release() } }
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx -> PlayerView(ctx).apply { this.player = player; useController = true } },
        update = { it.player = player }
    )
}

@Composable
private fun PostingScreen(
    target: PostingTarget,
    repository: DvachRepository,
    activity: MainActivity,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    var webView by remember { mutableStateOf<WebView?>(null) }
    val url = if (target.thread > 0) {
        "${repository.activeBase}/${target.board}/res/${target.thread}.html"
    } else {
        "${repository.activeBase}/${target.board}/"
    }

    BackHandler {
        val w = webView
        if (w != null && w.canGoBack()) w.goBack() else onClose()
    }

    DisposableEffect(Unit) {
        onDispose {
            webView?.stopLoading()
            webView?.destroy()
            webView = null
        }
    }

    Surface(color = Bg, modifier = Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
            Row(Modifier.fillMaxWidth().height(56.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onClose) { Icon(Icons.Default.Close, contentDescription = "Закрыть") }
                Text(
                    if (target.thread > 0) "Ответ /${target.board}/" else "Новый тред /${target.board}/",
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                IconButton(onClick = { openExternal(context, webView?.url ?: url) }) { Icon(Icons.Default.OpenInBrowser, contentDescription = "Открыть в браузере") }
            }
            HorizontalDivider(color = Surface2)
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        webView = this
                        setBackgroundColor(AndroidColor.rgb(20, 23, 27))
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.databaseEnabled = true
                        settings.loadsImagesAutomatically = true
                        settings.mediaPlaybackRequiresUserGesture = false
                        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        settings.userAgentString = APP_UA
                        CookieManager.getInstance().apply {
                            setAcceptCookie(true)
                            setAcceptThirdPartyCookies(this@apply.let { this@apply as? WebView } ?: this@apply, true)
                        }
                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                                val scheme = request.url.scheme
                                if (scheme == "http" || scheme == "https") return false
                                return try { openExternal(ctx, request.url.toString()); true } catch (_: Exception) { true }
                            }
                            override fun onPageFinished(view: WebView, pageUrl: String) {
                                super.onPageFinished(view, pageUrl)
                                val js = "javascript:(function(){var m=document.querySelector('meta[name=viewport]');if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}m.content='width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes';var f=document.querySelector('form[action*=posting],form[id*=post],.postform form');if(f){setTimeout(function(){f.scrollIntoView({block:\"center\"});},250);}})()"
                                view.evaluateJavascript(js, null)
                            }
                        }
                        webChromeClient = object : WebChromeClient() {
                            override fun onShowFileChooser(
                                webView: WebView,
                                filePathCallback: android.webkit.ValueCallback<Array<Uri>>,
                                fileChooserParams: FileChooserParams
                            ): Boolean = activity.launchFileChooser(filePathCallback, fileChooserParams)

                            override fun onPermissionRequest(request: PermissionRequest) {
                                activity.runOnUiThread { request.grant(request.resources) }
                            }
                        }
                        loadUrl(url)
                    }
                }
            )
        }
    }
}

@Composable
private fun ErrorPane(message: String, onRetry: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Не удалось загрузить", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(8.dp))
        Text(message, color = Muted, fontSize = 13.sp)
        Spacer(Modifier.height(18.dp))
        FilledTonalButton(onClick = onRetry) { Text("Повторить") }
    }
}

private fun maskSpoilers(html: String): String = html.replace(
    Regex("(?is)<span[^>]*class=[\\\"'][^\\\"']*spoiler[^\\\"']*[\\\"'][^>]*>.*?</span>"),
    "<span>████████</span>"
)

private fun htmlToPlain(html: String): String {
    if (html.isBlank()) return ""
    return Html.fromHtml(html, Html.FROM_HTML_MODE_LEGACY).toString().replace(Regex("\\n{3,}"), "\n\n").trim()
}

private fun shareUrl(context: Context, url: String) {
    runCatching {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, url)
        }
        context.startActivity(Intent.createChooser(intent, "Поделиться"))
    }
}

private fun openExternal(context: Context, url: String) {
    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
        .onFailure { Toast.makeText(context, "Не удалось открыть ссылку", Toast.LENGTH_SHORT).show() }
}

private fun downloadMedia(context: Context, url: String, refererBase: String) {
    runCatching {
        val name = android.webkit.URLUtil.guessFileName(url, null, null)
        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle(name)
            .setDescription("Скачивание с 2ch")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)
        CookieManager.getInstance().getCookie(url)?.let { request.addRequestHeader("Cookie", it) }
        request.addRequestHeader("User-Agent", APP_UA)
        request.addRequestHeader("Referer", "$refererBase/")
        (context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
        Toast.makeText(context, "Скачивание началось", Toast.LENGTH_SHORT).show()
    }.onFailure {
        Toast.makeText(context, "Не удалось скачать файл", Toast.LENGTH_SHORT).show()
    }
}
