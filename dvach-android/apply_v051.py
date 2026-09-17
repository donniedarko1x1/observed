from pathlib import Path

# Materialize all v0.5 changes first.
exec(Path('apply_v05.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 5", "versionCode 6")
s = s.replace("versionName '0.5.0'", "versionName '0.5.1'")
build.write_text(s, encoding='utf-8')

# Reorder catalog cards: title -> media -> text.
ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')
start = s.find('@Composable\nprivate fun ThreadCard(')
end = s.find('\n@Composable\nprivate fun ThreadScreen(', start)
if start < 0 or end < 0:
    raise SystemExit('ThreadCard markers not found')
thread_card = r'''@Composable
private fun ThreadCard(
    thread: ThreadItem,
    repository: DvachRepository,
    imageLoader: ImageLoader,
    onMedia: (List<MediaItem>, Int) -> Unit,
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

            if (thread.files.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                WideMediaStrip(
                    files = thread.files,
                    allMedia = thread.files,
                    repository = repository,
                    imageLoader = imageLoader,
                    onOpen = onMedia
                )
            }

            if (thread.commentHtml.isNotBlank()) {
                Spacer(Modifier.height(10.dp))
                Text(
                    htmlToPlain(thread.commentHtml),
                    color = Color(0xFFE1E4E8),
                    fontSize = 14.sp,
                    lineHeight = 19.sp,
                    maxLines = 8,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
'''
s = s[:start] + thread_card.rstrip() + s[end:]
ui.write_text(s, encoding='utf-8')

# Full-resolution previews for images. Video keeps a lightweight poster/thumbnail.
media = Path('app/src/main/java/su/dvach/neo/MediaWidgets.kt')
s = media.read_text(encoding='utf-8')
old = '''        AsyncImage(
            model = repository.absolute(media.thumbnail.ifBlank { media.path }),
            imageLoader = imageLoader,
            contentDescription = media.displayName,
            contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxSize()
        )'''
new = '''        val previewUrl = repository.absolute(
            if (media.isVideo) media.thumbnail.ifBlank { media.path } else media.path
        )
        AsyncImage(
            model = previewUrl,
            imageLoader = imageLoader,
            contentDescription = media.displayName,
            contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxSize()
        )'''
if old not in s:
    raise SystemExit('WideMediaCard preview marker not found')
s = s.replace(old, new, 1)
media.write_text(s, encoding='utf-8')

print('v0.5.1 source patch applied')
