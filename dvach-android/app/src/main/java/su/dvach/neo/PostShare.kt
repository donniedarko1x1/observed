package su.dvach.neo

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.SystemClock
import android.webkit.CookieManager
import android.webkit.URLUtil
import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.core.text.HtmlCompat
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

private const val SHARE_UA = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 DvachNeo/0.8.1"
private const val SHARE_CACHE_MAX_AGE_MS = 6L * 60L * 60L * 1000L

data class PostShareProgress(
    val fileIndex: Int,
    val fileCount: Int,
    val fileName: String,
    val downloadedBytes: Long,
    val currentTotalBytes: Long,
    val overallFraction: Float?
)

@Composable
fun PostShareButton(
    repository: DvachRepository,
    board: String,
    thread: Long,
    post: PostItem
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    var progress by remember(post.num) { mutableStateOf<PostShareProgress?>(null) }
    var shareJob by remember(post.num) { mutableStateOf<Job?>(null) }

    DisposableEffect(post.num) {
        onDispose { shareJob?.cancel() }
    }

    IconButton(
        onClick = {
            if (shareJob?.isActive == true) return@IconButton
            if (post.files.isEmpty()) {
                launchPostShare(context, repository, board, thread, post, emptyList())
                return@IconButton
            }

            shareJob = scope.launch {
                try {
                    val uris = preparePostMediaForShare(
                        context = context,
                        repository = repository,
                        board = board,
                        post = post,
                        onProgress = { progress = it }
                    )
                    progress = null
                    launchPostShare(context, repository, board, thread, post, uris)
                } catch (_: CancellationException) {
                    progress = null
                } catch (t: Throwable) {
                    progress = null
                    Toast.makeText(
                        context,
                        "Не удалось подготовить пост: ${t.message ?: "ошибка загрузки"}",
                        Toast.LENGTH_LONG
                    ).show()
                } finally {
                    shareJob = null
                }
            }
        }
    ) {
        Icon(Icons.Default.Share, contentDescription = "Поделиться постом")
    }

    progress?.let { p ->
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Подготовка поста к отправке") },
            text = {
                Column(Modifier.fillMaxWidth()) {
                    Text("Файл ${p.fileIndex} из ${p.fileCount}")
                    Spacer(Modifier.height(4.dp))
                    Text(p.fileName, maxLines = 1)
                    Spacer(Modifier.height(12.dp))
                    if (p.overallFraction != null) {
                        LinearProgressIndicator(
                            progress = { p.overallFraction.coerceIn(0f, 1f) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    } else {
                        LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        if (p.currentTotalBytes > 0L) {
                            "${formatBytes(p.downloadedBytes)} / ${formatBytes(p.currentTotalBytes)}"
                        } else {
                            "Скачано ${formatBytes(p.downloadedBytes)}"
                        }
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { shareJob?.cancel() }) {
                    Text("Отмена")
                }
            }
        )
    }
}

private suspend fun preparePostMediaForShare(
    context: Context,
    repository: DvachRepository,
    board: String,
    post: PostItem,
    onProgress: (PostShareProgress) -> Unit
): List<Uri> = withContext(Dispatchers.IO) {
    val root = File(context.cacheDir, "shared_posts").apply { mkdirs() }
    cleanupOldShareCache(root)

    val sessionDir = File(root, "${board}_${post.num}_${System.currentTimeMillis()}").apply { mkdirs() }
    val files = post.files
    val estimatedSizes = files.map { if (it.sizeKb > 0) it.sizeKb.toLong() * 1024L else 0L }
    val knownOverall = estimatedSizes.all { it > 0L }
    val overallTotal = if (knownOverall) estimatedSizes.sum() else 0L
    var completedEstimated = 0L

    try {
        val result = ArrayList<Uri>(files.size)
        files.forEachIndexed { index, media ->
            currentCoroutineContext().ensureActive()
            val url = repository.absolute(media.path)
            val guessed = URLUtil.guessFileName(url, null, null)
            val fileName = sanitizeFileName(guessed.ifBlank { "media_${index + 1}" })
            val target = uniqueFile(sessionDir, fileName)

            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                instanceFollowRedirects = true
                connectTimeout = 15_000
                readTimeout = 45_000
                setRequestProperty("User-Agent", SHARE_UA)
                setRequestProperty("Referer", "${repository.activeBase}/$board/")
                CookieManager.getInstance().getCookie(url)?.let { setRequestProperty("Cookie", it) }
            }

            try {
                val code = connection.responseCode
                if (code !in 200..299) throw IOException("HTTP $code")
                val responseLength = connection.contentLengthLong.takeIf { it > 0L } ?: 0L
                val estimatedLength = estimatedSizes[index]
                val currentTotal = if (responseLength > 0L) responseLength else estimatedLength
                var downloaded = 0L
                var lastUpdate = 0L

                withContext(Dispatchers.Main.immediate) {
                    onProgress(
                        PostShareProgress(
                            fileIndex = index + 1,
                            fileCount = files.size,
                            fileName = fileName,
                            downloadedBytes = 0L,
                            currentTotalBytes = currentTotal,
                            overallFraction = calculateOverallFraction(
                                index,
                                files.size,
                                0L,
                                currentTotal,
                                completedEstimated,
                                overallTotal,
                                knownOverall
                            )
                        )
                    )
                }

                connection.inputStream.use { input ->
                    FileOutputStream(target).use { output ->
                        val buffer = ByteArray(64 * 1024)
                        while (true) {
                            currentCoroutineContext().ensureActive()
                            val read = input.read(buffer)
                            if (read < 0) break
                            output.write(buffer, 0, read)
                            downloaded += read

                            val now = SystemClock.elapsedRealtime()
                            if (now - lastUpdate >= 120L) {
                                lastUpdate = now
                                withContext(Dispatchers.Main.immediate) {
                                    onProgress(
                                        PostShareProgress(
                                            fileIndex = index + 1,
                                            fileCount = files.size,
                                            fileName = fileName,
                                            downloadedBytes = downloaded,
                                            currentTotalBytes = currentTotal,
                                            overallFraction = calculateOverallFraction(
                                                index,
                                                files.size,
                                                downloaded,
                                                currentTotal,
                                                completedEstimated,
                                                overallTotal,
                                                knownOverall
                                            )
                                        )
                                    )
                                }
                            }
                        }
                    }
                }

                completedEstimated += if (estimatedLength > 0L) estimatedLength else downloaded
                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    target
                )
                result.add(uri)
            } finally {
                connection.disconnect()
            }
        }
        result
    } catch (t: Throwable) {
        sessionDir.deleteRecursively()
        throw t
    }
}

private fun calculateOverallFraction(
    index: Int,
    count: Int,
    downloaded: Long,
    currentTotal: Long,
    completedEstimated: Long,
    overallTotal: Long,
    knownOverall: Boolean
): Float? {
    if (count <= 0) return null
    if (knownOverall && overallTotal > 0L) {
        return ((completedEstimated + downloaded).toDouble() / overallTotal.toDouble()).toFloat().coerceIn(0f, 1f)
    }
    if (currentTotal > 0L) {
        val currentFraction = (downloaded.toDouble() / currentTotal.toDouble()).coerceIn(0.0, 1.0)
        return ((index.toDouble() + currentFraction) / count.toDouble()).toFloat().coerceIn(0f, 1f)
    }
    return null
}

private fun launchPostShare(
    context: Context,
    repository: DvachRepository,
    board: String,
    thread: Long,
    post: PostItem,
    uris: List<Uri>
) {
    val text = buildShareText(repository, board, thread, post)
    val intent = if (uris.size <= 1) {
        Intent(Intent.ACTION_SEND).apply {
            type = if (uris.isEmpty()) "text/plain" else mimeTypeFor(post.files.firstOrNull())
            putExtra(Intent.EXTRA_TEXT, text)
            uris.firstOrNull()?.let { putExtra(Intent.EXTRA_STREAM, it) }
        }
    } else {
        Intent(Intent.ACTION_SEND_MULTIPLE).apply {
            type = aggregateMimeType(post.files)
            putParcelableArrayListExtra(Intent.EXTRA_STREAM, ArrayList(uris))
            putExtra(Intent.EXTRA_TEXT, text)
        }
    }

    if (uris.isNotEmpty()) {
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        intent.clipData = ClipData.newUri(context.contentResolver, "Двач Neo", uris.first()).apply {
            uris.drop(1).forEach { addItem(ClipData.Item(it)) }
        }
    }

    context.startActivity(Intent.createChooser(intent, "Поделиться постом"))
}

private fun buildShareText(
    repository: DvachRepository,
    board: String,
    thread: Long,
    post: PostItem
): String {
    val subject = plainHtml(post.subject)
    val body = plainHtml(post.commentHtml)
    val url = "${repository.activeBase}/$board/res/$thread.html#${post.num}"
    return buildString {
        if (subject.isNotBlank()) append(subject).append("\n\n")
        if (body.isNotBlank()) append(body).append("\n\n")
        append("/$board/ • №${post.num}\n")
        append(url)
    }
}

private fun plainHtml(value: String): String = HtmlCompat
    .fromHtml(value, HtmlCompat.FROM_HTML_MODE_LEGACY)
    .toString()
    .replace('\u00A0', ' ')
    .replace(Regex("[ \\t]+"), " ")
    .replace(Regex("\\n{3,}"), "\n\n")
    .trim()

private fun aggregateMimeType(files: List<MediaItem>): String {
    if (files.isEmpty()) return "text/plain"
    return when {
        files.all { !it.isVideo } -> "image/*"
        files.all { it.isVideo } -> "video/*"
        else -> "*/*"
    }
}

private fun mimeTypeFor(media: MediaItem?): String {
    if (media == null) return "application/octet-stream"
    val lower = media.path.lowercase(Locale.ROOT)
    return when {
        lower.endsWith(".jpg") || lower.endsWith(".jpeg") -> "image/jpeg"
        lower.endsWith(".png") -> "image/png"
        lower.endsWith(".gif") -> "image/gif"
        lower.endsWith(".webp") -> "image/webp"
        lower.endsWith(".webm") -> "video/webm"
        lower.endsWith(".mp4") -> "video/mp4"
        lower.endsWith(".m4v") -> "video/x-m4v"
        lower.endsWith(".mov") -> "video/quicktime"
        else -> if (media.isVideo) "video/*" else "image/*"
    }
}

private fun cleanupOldShareCache(root: File) {
    val cutoff = System.currentTimeMillis() - SHARE_CACHE_MAX_AGE_MS
    root.listFiles()?.forEach { file ->
        if (file.lastModified() < cutoff) file.deleteRecursively()
    }
}

private fun sanitizeFileName(value: String): String {
    val sanitized = value.replace(Regex("[^A-Za-z0-9._-]"), "_").take(120)
    return sanitized.ifBlank { "media.bin" }
}

private fun uniqueFile(dir: File, requested: String): File {
    var candidate = File(dir, requested)
    if (!candidate.exists()) return candidate
    val dot = requested.lastIndexOf('.')
    val stem = if (dot > 0) requested.substring(0, dot) else requested
    val ext = if (dot > 0) requested.substring(dot) else ""
    var index = 2
    while (candidate.exists()) {
        candidate = File(dir, "${stem}_$index$ext")
        index++
    }
    return candidate
}

private fun formatBytes(bytes: Long): String {
    if (bytes < 1024L) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024.0) return String.format(Locale.US, "%.1f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format(Locale.US, "%.1f MB", mb)
    return String.format(Locale.US, "%.2f GB", mb / 1024.0)
}
