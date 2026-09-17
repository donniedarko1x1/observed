package su.dvach.neo

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.webkit.CookieManager
import android.webkit.URLUtil
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.ImageLoader
import coil.compose.AsyncImage

private const val MEDIA_UA = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 DvachNeo/0.5"

@Composable
fun WideMediaStrip(
    files: List<MediaItem>,
    allMedia: List<MediaItem>,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    onOpen: (List<MediaItem>, Int) -> Unit
) {
    if (files.isEmpty()) return
    BoxWithConstraints {
        val itemWidth = maxWidth
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            itemsIndexed(files, key = { _, media -> media.path }) { _, media ->
                val openIndex = allMedia.indexOfFirst { it.path == media.path }.coerceAtLeast(0)
                WideMediaCard(
                    media = media,
                    repository = repository,
                    imageLoader = imageLoader,
                    width = itemWidth,
                    onOpen = { onOpen(allMedia, openIndex) }
                )
            }
        }
    }
}

@Composable
private fun WideMediaCard(
    media: MediaItem,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    width: Dp,
    onOpen: () -> Unit
) {
    val context = LocalContext.current
    val ratio = if (media.width > 0 && media.height > 0) media.width.toFloat() / media.height.toFloat() else 16f / 9f
    val calculated = width / ratio.coerceIn(0.55f, 2.2f)
    val mediaHeight = calculated.coerceIn(210.dp, 460.dp)

    Box(
        modifier = Modifier
            .width(width)
            .height(mediaHeight)
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF090A0C))
            .clickable(onClick = onOpen),
        contentAlignment = Alignment.Center
    ) {
        AsyncImage(
            model = repository.absolute(media.thumbnail.ifBlank { media.path }),
            imageLoader = imageLoader,
            contentDescription = media.displayName,
            contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxSize()
        )

        if (media.isVideo) {
            Surface(color = Color.Black.copy(alpha = 0.64f), shape = RoundedCornerShape(40.dp)) {
                Text("▶", color = Color.White, fontSize = 28.sp, modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp))
            }
        }

        IconButton(
            onClick = { downloadMediaFromAnywhere(context, repository.absolute(media.path), repository.activeBase) },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(8.dp)
                .size(42.dp)
                .background(Color.Black.copy(alpha = 0.72f), RoundedCornerShape(12.dp))
        ) {
            Icon(Icons.Default.Download, contentDescription = "Скачать", tint = Color.White, modifier = Modifier.size(21.dp))
        }
    }
}

fun downloadMediaFromAnywhere(context: Context, url: String, refererBase: String) {
    runCatching {
        val name = URLUtil.guessFileName(url, null, null)
        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle(name)
            .setDescription("Скачивание с 2ch")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)
        CookieManager.getInstance().getCookie(url)?.let { request.addRequestHeader("Cookie", it) }
        request.addRequestHeader("User-Agent", MEDIA_UA)
        request.addRequestHeader("Referer", "$refererBase/")
        (context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
        Toast.makeText(context, "Файл сохраняется в Downloads", Toast.LENGTH_SHORT).show()
    }.onFailure {
        Toast.makeText(context, "Не удалось скачать файл", Toast.LENGTH_SHORT).show()
    }
}
