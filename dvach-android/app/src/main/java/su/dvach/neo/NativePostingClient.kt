package su.dvach.neo

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedOutputStream
import java.net.HttpCookie
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.util.UUID

private const val POST_UA = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 DvachNeo/0.5"

data class EmojiCaptchaState(
    val required: Boolean,
    val tokenId: String = "",
    val solvedKey: String? = null,
    val imageBase64: String = "",
    val keyboardBase64: List<String> = emptyList(),
    val challengeHash: String = "",
    val challengeLimit: Int = 0,
    val challengeTemplate: String = ""
) {
    val solved: Boolean get() = !required || !solvedKey.isNullOrBlank()
}

data class NativePostResult(
    val success: Boolean,
    val postNumber: Long = 0L,
    val message: String = ""
)

class NativePostingClient(
    private val context: Context,
    private val repository: DvachRepository
) {
    private val cookieStore = java.net.CookieManager(null, java.net.CookiePolicy.ACCEPT_ALL)

    suspend fun loadCaptcha(): EmojiCaptchaState = withContext(Dispatchers.IO) {
        val root = getJson("/api/captcha/emoji/id")
        val result = root.optInt("result", 0)
        if (result != 1) {
            return@withContext EmojiCaptchaState(required = false)
        }

        val token = root.optString("id")
        if (token.isBlank()) error("Сервер не вернул ID капчи")
        val challenge = root.optJSONObject("challenge")
        val show = getJson("/api/captcha/emoji/show?id=${URLEncoder.encode(token, "UTF-8")}")
        val keyboard = show.optJSONArray("keyboard")
        val keys = buildList {
            if (keyboard != null) for (i in 0 until keyboard.length()) {
                val value = keyboard.optString(i)
                if (value.isNotBlank()) add(value)
            }
        }
        EmojiCaptchaState(
            required = true,
            tokenId = token,
            imageBase64 = show.optString("image"),
            keyboardBase64 = keys,
            challengeHash = challenge?.optString("hash").orEmpty(),
            challengeLimit = challenge?.optInt("limit", 0) ?: 0,
            challengeTemplate = challenge?.optString("template").orEmpty()
        )
    }

    suspend fun clickCaptcha(state: EmojiCaptchaState, emojiIndex: Int): EmojiCaptchaState = withContext(Dispatchers.IO) {
        if (!state.required || state.solved) return@withContext state
        val payload = JSONObject()
            .put("captchaTokenID", state.tokenId)
            .put("emojiNumber", emojiIndex)
        val response = postJson("/api/captcha/emoji/click", payload.toString())
        val success = response.optString("success").takeIf { it.isNotBlank() }
        val keyboard = response.optJSONArray("keyboard")
        val keys = if (keyboard != null) buildList {
            for (i in 0 until keyboard.length()) {
                val value = keyboard.optString(i)
                if (value.isNotBlank()) add(value)
            }
        } else state.keyboardBase64
        state.copy(
            solvedKey = success ?: state.solvedKey,
            imageBase64 = response.optString("image").ifBlank { state.imageBase64 },
            keyboardBase64 = keys
        )
    }

    suspend fun submitReply(
        board: String,
        thread: Long,
        comment: String,
        attachments: List<Uri>,
        captcha: EmojiCaptchaState
    ): NativePostResult = withContext(Dispatchers.IO) {
        if (thread <= 0L) return@withContext NativePostResult(false, message = "Нативный постинг нового треда пока не включён")
        if (comment.isBlank() && attachments.isEmpty()) return@withContext NativePostResult(false, message = "Введите текст или прикрепите файл")
        if (captcha.required && !captcha.solved) return@withContext NativePostResult(false, message = "Сначала решите капчу")

        val challenge = solveChallenge(captcha)
        if (captcha.required && captcha.challengeHash.isNotBlank() && challenge == null) {
            return@withContext NativePostResult(false, message = "Не удалось решить проверочный challenge")
        }

        val fields = linkedMapOf(
            "task" to "post",
            "board" to board,
            "thread" to thread.toString(),
            "usercode" to "",
            "code" to "",
            "captcha_type" to "emoji_captcha",
            "email" to "",
            "comment" to comment
        )
        captcha.solvedKey?.let { fields["emoji_captcha_id"] = it }
        challenge?.let { fields["2ch_challenge"] = it.toString() }

        val root = multipartPost("/user/posting?nc=1", fields, attachments)
        if (root.optInt("result", 0) == 1) {
            return@withContext NativePostResult(true, root.optLong("num", 0L), "Сообщение отправлено")
        }
        val error = root.optJSONObject("error")
        val code = error?.optInt("code")
        val message = error?.optString("message").orEmpty().ifBlank { root.optString("message").ifBlank { "Ошибка отправки" } }
        NativePostResult(false, message = if (code != null) "Ошибка $code: $message" else message)
    }

    private fun solveChallenge(captcha: EmojiCaptchaState): Int? {
        if (captcha.challengeHash.isBlank() || captcha.challengeTemplate.isBlank() || captcha.challengeLimit <= 0) return null
        val digest = MessageDigest.getInstance("SHA-512")
        for (i in 0 until captcha.challengeLimit) {
            val input = captcha.challengeTemplate.replace("%d", i.toString()).toByteArray(Charsets.UTF_8)
            val hash = digest.digest(input).joinToString("") { "%02x".format(it) }
            if (hash.equals(captcha.challengeHash, ignoreCase = true)) return i
        }
        return null
    }

    private fun getJson(path: String): JSONObject {
        val connection = open(path, "GET")
        return readJson(connection)
    }

    private fun postJson(path: String, payload: String): JSONObject {
        val connection = open(path, "POST")
        connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
        connection.doOutput = true
        connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
        return readJson(connection)
    }

    private fun multipartPost(path: String, fields: Map<String, String>, attachments: List<Uri>): JSONObject {
        val boundary = "----DvachNeo${UUID.randomUUID()}"
        val connection = open(path, "POST")
        connection.doOutput = true
        connection.setChunkedStreamingMode(64 * 1024)
        connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")

        BufferedOutputStream(connection.outputStream).use { out ->
            fun write(text: String) = out.write(text.toByteArray(Charsets.UTF_8))
            for ((name, value) in fields) {
                write("--$boundary\r\n")
                write("Content-Disposition: form-data; name=\"$name\"\r\n\r\n")
                write(value)
                write("\r\n")
            }
            for (uri in attachments) {
                val fileName = displayName(uri).replace("\"", "_")
                val mime = context.contentResolver.getType(uri) ?: "application/octet-stream"
                write("--$boundary\r\n")
                write("Content-Disposition: form-data; name=\"file[]\"; filename=\"$fileName\"\r\n")
                write("Content-Type: $mime\r\n\r\n")
                context.contentResolver.openInputStream(uri)?.use { input -> input.copyTo(out, 64 * 1024) }
                    ?: error("Не удалось открыть $fileName")
                write("\r\n")
            }
            write("--$boundary--\r\n")
            out.flush()
        }
        return readJson(connection)
    }

    private fun displayName(uri: Uri): String {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index >= 0) cursor.getString(index)?.takeIf { it.isNotBlank() }?.let { return it }
            }
        }
        return uri.lastPathSegment?.substringAfterLast('/') ?: "file"
    }

    private fun open(path: String, method: String): HttpURLConnection {
        val url = URL(repository.activeBase + path)
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 15_000
        connection.readTimeout = 45_000
        connection.instanceFollowRedirects = true
        connection.setRequestProperty("User-Agent", POST_UA)
        connection.setRequestProperty("Accept", "application/json,text/plain,*/*")
        connection.setRequestProperty("Referer", repository.activeBase + "/")

        val cookieParts = mutableListOf<String>()
        cookieStore.cookieStore.get(URI(url.toString())).forEach { cookieParts += "${it.name}=${it.value}" }
        android.webkit.CookieManager.getInstance().getCookie(repository.activeBase)?.takeIf { it.isNotBlank() }?.let { cookieParts += it }
        if (cookieParts.isNotEmpty()) connection.setRequestProperty("Cookie", cookieParts.joinToString("; "))
        return connection
    }

    private fun readJson(connection: HttpURLConnection): JSONObject {
        try {
            val code = connection.responseCode
            saveCookies(connection)
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (text.isBlank()) error("HTTP $code: пустой ответ")
            if (code !in 200..299) error("HTTP $code: ${text.take(300)}")
            return JSONObject(text)
        } finally {
            connection.disconnect()
        }
    }

    private fun saveCookies(connection: HttpURLConnection) {
        val uri = runCatching { URI(connection.url.toString()) }.getOrNull() ?: return
        connection.headerFields.forEach { (key, values) ->
            if (key != null && key.equals("Set-Cookie", ignoreCase = true)) {
                values.orEmpty().forEach { header ->
                    runCatching { HttpCookie.parse(header) }.getOrNull().orEmpty().forEach { cookie ->
                        cookieStore.cookieStore.add(uri, cookie)
                        android.webkit.CookieManager.getInstance().setCookie(repository.activeBase, "${cookie.name}=${cookie.value}")
                    }
                }
            }
        }
        android.webkit.CookieManager.getInstance().flush()
    }
}
