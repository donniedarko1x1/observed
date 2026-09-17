package su.dvach.neo

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class FavoriteThread(
    val board: String,
    val thread: Long,
    val title: String,
    val lastRead: Long,
    val updatedAt: Long
)

data class ReadingPosition(
    val index: Int,
    val offset: Int
)

class ThreadReadingStore(context: Context) {
    private val prefs = context.getSharedPreferences("dvach_reading_v06", Context.MODE_PRIVATE)

    @Synchronized
    fun favoriteThreads(): List<FavoriteThread> {
        val raw = prefs.getString("favorites", "[]").orEmpty()
        val arr = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return buildList {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                val board = o.optString("board")
                val thread = o.optLong("thread", 0L)
                if (board.isBlank() || thread <= 0L) continue
                add(
                    FavoriteThread(
                        board = board,
                        thread = thread,
                        title = o.optString("title").ifBlank { "Тред №$thread" },
                        lastRead = o.optLong("lastRead", 0L),
                        updatedAt = o.optLong("updatedAt", 0L)
                    )
                )
            }
        }.sortedByDescending { it.updatedAt }
    }

    fun isFavorite(board: String, thread: Long): Boolean =
        favoriteThreads().any { it.board == board && it.thread == thread }

    @Synchronized
    fun toggleFavorite(board: String, thread: Long, title: String): Boolean {
        val items = favoriteThreads().toMutableList()
        val index = items.indexOfFirst { it.board == board && it.thread == thread }
        val now = System.currentTimeMillis()
        val enabled = if (index >= 0) {
            items.removeAt(index)
            false
        } else {
            items.add(
                FavoriteThread(
                    board = board,
                    thread = thread,
                    title = title.ifBlank { "Тред №$thread" },
                    lastRead = 0L,
                    updatedAt = now
                )
            )
            true
        }
        saveFavorites(items)
        return enabled
    }

    @Synchronized
    fun updateFavoriteTitle(board: String, thread: Long, title: String) {
        if (title.isBlank()) return
        val items = favoriteThreads().toMutableList()
        val index = items.indexOfFirst { it.board == board && it.thread == thread }
        if (index < 0) return
        val old = items[index]
        if (old.title == title) return
        items[index] = old.copy(title = title, updatedAt = System.currentTimeMillis())
        saveFavorites(items)
    }

    fun loadPosition(board: String, thread: Long): ReadingPosition {
        val key = key(board, thread)
        return ReadingPosition(
            index = prefs.getInt("${key}_index", 0).coerceAtLeast(0),
            offset = prefs.getInt("${key}_offset", 0).coerceAtLeast(0)
        )
    }

    @Synchronized
    fun savePosition(board: String, thread: Long, index: Int, offset: Int, lastRead: Long) {
        val key = key(board, thread)
        prefs.edit()
            .putInt("${key}_index", index.coerceAtLeast(0))
            .putInt("${key}_offset", offset.coerceAtLeast(0))
            .apply()

        if (lastRead <= 0L) return
        val items = favoriteThreads().toMutableList()
        val favoriteIndex = items.indexOfFirst { it.board == board && it.thread == thread }
        if (favoriteIndex < 0) return
        val old = items[favoriteIndex]
        if (old.lastRead == lastRead) return
        items[favoriteIndex] = old.copy(lastRead = lastRead, updatedAt = System.currentTimeMillis())
        saveFavorites(items)
    }

    private fun key(board: String, thread: Long): String =
        "thread_${board.replace(Regex("[^A-Za-z0-9_]"), "_")}_$thread"

    private fun saveFavorites(items: List<FavoriteThread>) {
        val arr = JSONArray()
        items.forEach { item ->
            arr.put(
                JSONObject()
                    .put("board", item.board)
                    .put("thread", item.thread)
                    .put("title", item.title)
                    .put("lastRead", item.lastRead)
                    .put("updatedAt", item.updatedAt)
            )
        }
        prefs.edit().putString("favorites", arr.toString()).apply()
    }
}
