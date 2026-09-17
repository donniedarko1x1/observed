package su.dvach.neo

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.LinkedHashSet

private const val UA = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 DvachNeo/0.7"

class DvachRepository(context: Context) {
    private val prefs = context.getSharedPreferences("dvach_neo", Context.MODE_PRIVATE)
    private val bases = listOf("https://2ch.su", "https://2ch.org", "https://2ch.life")
    private val cacheDir = File(context.filesDir, "dvach_json_cache").apply { mkdirs() }

    @Volatile
    var activeBase: String = prefs.getString("active_base", bases.first()) ?: bases.first()
        private set

    suspend fun loadBoards(force: Boolean = false): List<BoardItem> = withContext(Dispatchers.IO) {
        if (!force) {
            val cached = prefs.getString("index_json_cache", null)
            if (!cached.isNullOrBlank()) {
                val parsed = parseBoards(cached)
                if (parsed.size >= 80) return@withContext parsed
            }
        }

        try {
            val live = fetchText("/index.json")
            val parsed = parseBoards(live)
            if (parsed.size < 80) throw IllegalStateException("Получен неполный список досок: ${parsed.size}")
            prefs.edit().putString("index_json_cache", live).apply()
            parsed
        } catch (liveError: Exception) {
            val cached = prefs.getString("index_json_cache", null)
            if (!cached.isNullOrBlank()) {
                val parsed = parseBoards(cached)
                if (parsed.isNotEmpty()) return@withContext parsed
            }
            throw liveError
        }
    }

    fun cachedCatalog(board: String): List<ThreadItem> =
        readCache("catalog_${safe(board)}.json")?.let(::parseCatalog).orEmpty()

    suspend fun loadCatalog(board: String): List<ThreadItem> = withContext(Dispatchers.IO) {
        val file = "catalog_${safe(board)}.json"
        try {
            val live = fetchText("/$board/catalog.json")
            writeCache(file, live)
            parseCatalog(live)
        } catch (e: Exception) {
            val cached = readCache(file)
            if (!cached.isNullOrBlank()) parseCatalog(cached) else throw e
        }
    }

    fun cachedThread(board: String, thread: Long): List<PostItem> =
        readCache("thread_${safe(board)}_$thread.json")?.let(::parseThread).orEmpty()

    suspend fun loadThread(board: String, thread: Long): List<PostItem> = withContext(Dispatchers.IO) {
        val file = "thread_${safe(board)}_$thread.json"
        try {
            val live = fetchText("/$board/res/$thread.json")
            writeCache(file, live)
            parseThread(live)
        } catch (e: Exception) {
            val cached = readCache(file)
            if (!cached.isNullOrBlank()) parseThread(cached) else throw e
        }
    }

    fun absolute(path: String): String {
        if (path.startsWith("http://") || path.startsWith("https://")) return path
        return activeBase + if (path.startsWith('/')) path else "/$path"
    }

    private fun parseBoards(json: String): List<BoardItem> {
        val root = JSONObject(json)
        val arr = root.optJSONArray("boards") ?: JSONArray()
        return buildList {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                val id = o.stringFlexible("id").trim()
                if (id.isEmpty()) continue
                add(
                    BoardItem(
                        id = id,
                        name = o.stringFlexible("name").ifBlank { "/$id/" },
                        category = o.stringFlexible("category").ifBlank { "Прочие" },
                        info = o.stringFlexible("info_outer").ifBlank { o.stringFlexible("info") },
                        speed = o.intFlexible("speed"),
                        uniquePosters = o.intFlexible("unique_posters"),
                        threads = o.intFlexible("threads"),
                        lastNum = o.longFlexible("last_num")
                    )
                )
            }
        }
    }

    private fun parseCatalog(json: String): List<ThreadItem> {
        val root = JSONObject(json)
        val arr = root.optJSONArray("threads") ?: JSONArray()
        return buildList {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                val num = o.longFlexible("num")
                if (num <= 0L) continue
                add(
                    ThreadItem(
                        num = num,
                        subject = o.stringFlexible("subject"),
                        commentHtml = o.stringFlexible("comment"),
                        postsCount = o.intFlexible("posts_count"),
                        filesCount = o.intFlexible("files_count"),
                        views = o.intFlexible("views"),
                        files = parseFiles(o.optJSONArray("files"))
                    )
                )
            }
        }
    }

    private fun parseThread(json: String): List<PostItem> {
        val root = JSONObject(json)
        val threads = root.optJSONArray("threads") ?: JSONArray()
        val threadObj = threads.optJSONObject(0) ?: return emptyList()
        val posts = threadObj.optJSONArray("posts") ?: JSONArray()
        return buildList {
            for (i in 0 until posts.length()) {
                val o = posts.optJSONObject(i) ?: continue
                val num = o.longFlexible("num")
                if (num <= 0L) continue
                add(
                    PostItem(
                        num = num,
                        parent = o.longFlexible("parent"),
                        date = o.stringFlexible("date"),
                        name = o.stringFlexible("name"),
                        subject = o.stringFlexible("subject"),
                        commentHtml = o.stringFlexible("comment"),
                        op = i == 0 || o.intFlexible("op") == 1,
                        files = parseFiles(o.optJSONArray("files"))
                    )
                )
            }
        }
    }

    private fun parseFiles(arr: JSONArray?): List<MediaItem> {
        if (arr == null) return emptyList()
        return buildList {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                val path = o.stringFlexible("path")
                if (path.isBlank()) continue
                add(
                    MediaItem(
                        path = path,
                        thumbnail = o.stringFlexible("thumbnail"),
                        displayName = o.stringFlexible("displayname").ifBlank { o.stringFlexible("name") },
                        width = o.intFlexible("width"),
                        height = o.intFlexible("height"),
                        sizeKb = o.intFlexible("size"),
                        duration = o.stringFlexible("duration")
                    )
                )
            }
        }
    }

    private fun safe(value: String): String = value.replace(Regex("[^A-Za-z0-9_.-]"), "_")

    private fun readCache(name: String): String? = runCatching {
        val file = File(cacheDir, name)
        if (!file.exists() || file.length() == 0L) null else file.readText(Charsets.UTF_8)
    }.getOrNull()

    private fun writeCache(name: String, text: String) {
        runCatching {
            val file = File(cacheDir, name)
            val tmp = File(cacheDir, "$name.tmp")
            tmp.writeText(text, Charsets.UTF_8)
            if (file.exists()) file.delete()
            tmp.renameTo(file)
        }
    }

    private fun fetchText(path: String): String {
        var last: Exception? = null
        val ordered = LinkedHashSet<String>().apply {
            add(activeBase)
            addAll(bases)
        }
        for (base in ordered) {
            var connection: HttpURLConnection? = null
            try {
                connection = URL(base + path).openConnection() as HttpURLConnection
                connection.connectTimeout = 12_000
                connection.readTimeout = 25_000
                connection.instanceFollowRedirects = true
                connection.setRequestProperty("User-Agent", UA)
                connection.setRequestProperty("Accept", "application/json,text/plain,*/*")
                connection.setRequestProperty("Referer", "$base/")
                val code = connection.responseCode
                if (code !in 200..299) throw IllegalStateException("HTTP $code")
                val text = connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                val trimmed = text.trimStart()
                if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
                    throw IllegalStateException("Сервер вернул не JSON")
                }
                activeBase = base
                prefs.edit().putString("active_base", base).apply()
                return text
            } catch (e: Exception) {
                last = e
            } finally {
                connection?.disconnect()
            }
        }
        throw last ?: IllegalStateException("Нет доступного зеркала")
    }
}

data class BoardItem(
    val id: String,
    val name: String,
    val category: String,
    val info: String,
    val speed: Int,
    val uniquePosters: Int,
    val threads: Int,
    val lastNum: Long
)

data class ThreadItem(
    val num: Long,
    val subject: String,
    val commentHtml: String,
    val postsCount: Int,
    val filesCount: Int,
    val views: Int,
    val files: List<MediaItem>
)

data class PostItem(
    val num: Long,
    val parent: Long,
    val date: String,
    val name: String,
    val subject: String,
    val commentHtml: String,
    val op: Boolean,
    val files: List<MediaItem>
)

data class MediaItem(
    val path: String,
    val thumbnail: String,
    val displayName: String,
    val width: Int,
    val height: Int,
    val sizeKb: Int,
    val duration: String
) {
    val isVideo: Boolean
        get() {
            val p = path.lowercase()
            return p.endsWith(".webm") || p.endsWith(".mp4") || p.endsWith(".m4v") || p.endsWith(".mov")
        }
}

private fun JSONObject.stringFlexible(key: String): String {
    val value = opt(key)
    return if (value == null || value == JSONObject.NULL) "" else value.toString()
}

private fun JSONObject.intFlexible(key: String): Int {
    val value = opt(key)
    return when (value) {
        is Number -> value.toInt()
        else -> value?.toString()?.toIntOrNull() ?: 0
    }
}

private fun JSONObject.longFlexible(key: String): Long {
    val value = opt(key)
    return when (value) {
        is Number -> value.toLong()
        else -> value?.toString()?.toLongOrNull() ?: 0L
    }
}
