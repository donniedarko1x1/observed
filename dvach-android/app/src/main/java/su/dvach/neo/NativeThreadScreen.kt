package su.dvach.neo

import android.net.Uri
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.launch

private val ThreadBg = Color(0xFF0B0D10)
private val ThreadSurface = Color(0xFF15181D)
private val ThreadAccent = Color(0xFFF2A24A)
private val ThreadMuted = Color(0xFF9BA3AD)

@Composable
fun NativeThreadScreen(
    repository: DvachRepository,
    board: String,
    onClose: () -> Unit,
    onCreated: (Long) -> Unit,
    onFallback: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val client = remember(repository, board) { NativePostingClient(context.applicationContext, repository) }
    var subject by rememberSaveable(board) { mutableStateOf("") }
    var comment by rememberSaveable(board) { mutableStateOf("") }
    var attachments by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var captcha by remember { mutableStateOf<EmojiCaptchaState?>(null) }
    var captchaLoading by remember { mutableStateOf(true) }
    var captchaBusy by remember { mutableStateOf(false) }
    var submitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        attachments = (attachments + uris).distinct().take(8)
    }

    fun reloadCaptcha() {
        if (captchaLoading) return
        captchaLoading = true
        error = null
        scope.launch {
            runCatching { client.loadCaptcha() }
                .onSuccess { captcha = it }
                .onFailure { error = it.message ?: "Не удалось загрузить капчу" }
            captchaLoading = false
        }
    }

    LaunchedEffect(board) {
        captchaLoading = true
        runCatching { client.loadCaptcha() }
            .onSuccess { captcha = it }
            .onFailure { error = it.message ?: "Не удалось загрузить капчу" }
        captchaLoading = false
    }

    BackHandler(onBack = onClose)

    Surface(color = ThreadBg, modifier = Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
            Row(
                modifier = Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onClose) { Icon(Icons.Default.Close, contentDescription = "Закрыть") }
                Column(Modifier.weight(1f)) {
                    Text("Новый тред /$board/", color = Color.White, fontWeight = FontWeight.SemiBold)
                    Text("нативная форма", color = ThreadMuted, fontSize = 11.sp)
                }
                IconButton(onClick = onFallback) {
                    Icon(Icons.Default.OpenInBrowser, contentDescription = "Веб-форма")
                }
            }
            HorizontalDivider(color = Color(0xFF20242A))

            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = subject,
                    onValueChange = { if (it.length <= 120) subject = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Заголовок темы") },
                    supportingText = { Text("${subject.length} / 120") },
                    shape = RoundedCornerShape(16.dp)
                )

                OutlinedTextField(
                    value = comment,
                    onValueChange = { if (it.length <= 15000) comment = it },
                    modifier = Modifier.fillMaxWidth().weight(1f, fill = false),
                    minLines = 5,
                    maxLines = 9,
                    placeholder = { Text("Сообщение") },
                    supportingText = { Text("${comment.length} / 15000") },
                    shape = RoundedCornerShape(16.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalButton(onClick = { picker.launch(arrayOf("image/*", "video/*")) }) {
                        Icon(Icons.Default.AttachFile, contentDescription = null)
                        Spacer(Modifier.size(6.dp))
                        Text("Файлы${if (attachments.isNotEmpty()) " (${attachments.size})" else ""}")
                    }
                    OutlinedButton(onClick = onFallback) { Text("Веб-форма") }
                }

                if (attachments.isNotEmpty()) {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        itemsIndexed(attachments, key = { _, uri -> uri.toString() }) { index, uri ->
                            Surface(color = ThreadSurface, shape = RoundedCornerShape(12.dp)) {
                                Row(modifier = Modifier.padding(start = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        uri.lastPathSegment?.substringAfterLast('/') ?: "Файл ${index + 1}",
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.padding(vertical = 10.dp)
                                    )
                                    IconButton(onClick = { attachments = attachments.filterIndexed { i, _ -> i != index } }) {
                                        Icon(Icons.Default.Close, contentDescription = "Убрать файл", modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                Surface(color = ThreadSurface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("EmojiCaptcha", color = Color.White, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            IconButton(onClick = { reloadCaptcha() }, enabled = !captchaLoading && !captchaBusy) {
                                Icon(Icons.Default.Refresh, contentDescription = "Новая капча")
                            }
                        }

                        when {
                            captchaLoading -> Box(Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = ThreadAccent)
                            }
                            captcha == null -> Text("Капча недоступна", color = ThreadMuted)
                            captcha?.solved == true -> Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF70C980))
                                Spacer(Modifier.size(7.dp))
                                Text(if (captcha?.required == false) "Капча не требуется" else "Капча решена", color = Color(0xFF70C980))
                            }
                            else -> {
                                val state = captcha!!
                                if (state.imageBase64.isNotBlank()) {
                                    AsyncImage(
                                        model = remember(state.imageBase64) { runCatching { Base64.decode(state.imageBase64, Base64.DEFAULT) }.getOrNull() },
                                        contentDescription = "Капча",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier.fillMaxWidth().height(140.dp).clip(RoundedCornerShape(12.dp)).background(Color.White)
                                    )
                                }
                                Text("Выбери символ с картинки", color = ThreadMuted, fontSize = 12.sp)
                                LazyRow(
                                    contentPadding = PaddingValues(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                                ) {
                                    itemsIndexed(state.keyboardBase64) { index, base64 ->
                                        Surface(
                                            color = Color.White,
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.size(58.dp).clickable(enabled = !captchaBusy) {
                                                captchaBusy = true
                                                error = null
                                                scope.launch {
                                                    runCatching { client.clickCaptcha(state, index) }
                                                        .onSuccess { captcha = it }
                                                        .onFailure { error = it.message ?: "Ошибка капчи" }
                                                    captchaBusy = false
                                                }
                                            }
                                        ) {
                                            AsyncImage(
                                                model = remember(base64) { runCatching { Base64.decode(base64, Base64.DEFAULT) }.getOrNull() },
                                                contentDescription = "Вариант ${index + 1}",
                                                contentScale = ContentScale.Fit,
                                                modifier = Modifier.fillMaxSize().padding(5.dp)
                                            )
                                        }
                                    }
                                }
                                if (captchaBusy) CircularProgressIndicator(color = ThreadAccent, modifier = Modifier.size(22.dp))
                            }
                        }
                    }
                }

                error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp) }

                Button(
                    onClick = {
                        val state = captcha ?: return@Button
                        submitting = true
                        error = null
                        scope.launch {
                            val result = runCatching {
                                client.submitThread(board, subject, comment, attachments, state)
                            }.getOrElse { NativePostResult(false, message = it.message ?: "Ошибка отправки") }
                            submitting = false
                            if (result.success) {
                                Toast.makeText(context, "Тред создан", Toast.LENGTH_SHORT).show()
                                onCreated(result.postNumber)
                            } else {
                                error = result.message
                                runCatching { client.loadCaptcha() }.onSuccess { captcha = it }
                            }
                        }
                    },
                    enabled = !submitting && captcha?.solved == true && (comment.isNotBlank() || attachments.isNotEmpty()),
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    if (submitting) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.size(8.dp))
                    } else {
                        Icon(Icons.Default.Send, contentDescription = null)
                        Spacer(Modifier.size(8.dp))
                    }
                    Text(if (submitting) "Создание…" else "Создать тред")
                }
            }
        }
    }
}
