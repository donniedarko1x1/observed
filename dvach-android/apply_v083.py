from pathlib import Path

# Materialize complete working v0.8.2 first.
exec(Path('apply_v082.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 12", "versionCode 13")
s = s.replace("versionName '0.8.2'", "versionName '0.8.3'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

start = s.find('@Composable\nprivate fun HtmlPostText(')
end = s.find('\n@OptIn(ExperimentalFoundationApi::class)\n@Composable\nprivate fun MediaViewer(', start)
if start < 0 or end < 0:
    raise SystemExit('HtmlPostText -> MediaViewer block markers not found')

replacement = r'''@Composable
private fun HtmlPostText(html: String, onReply: (Long) -> Unit) {
    val context = LocalContext.current
    var pendingExternalUrl by remember { mutableStateOf<String?>(null) }

    AndroidView(
        modifier = Modifier.fillMaxWidth(),
        factory = { androidContext ->
            TextView(androidContext).apply {
                setTextColor(AndroidColor.rgb(235, 237, 240))
                setLinkTextColor(AndroidColor.rgb(242, 162, 74))
                textSize = 14f
                highlightColor = AndroidColor.TRANSPARENT
                setLineSpacing(0f, 1.08f)

                // Important: enabling selection can replace TextView's movement method.
                // Set selectable first, then explicitly restore LinkMovementMethod.
                setTextIsSelectable(true)
                linksClickable = true
                movementMethod = LinkMovementMethod.getInstance()
            }
        },
        update = { view ->
            view.text = makeRichText(
                html = html,
                onReply = onReply,
                onExternalLink = { url -> pendingExternalUrl = url }
            )
            // Some Android versions reset movement handling when text changes.
            view.linksClickable = true
            view.movementMethod = LinkMovementMethod.getInstance()
        }
    )

    pendingExternalUrl?.let { url ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { pendingExternalUrl = null },
            title = { Text("Перейти по внешней ссылке?") },
            text = {
                Text(
                    text = url,
                    color = Color(0xFFE1E4E8),
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                androidx.compose.material3.TextButton(
                    onClick = {
                        pendingExternalUrl = null
                        openExternal(context, url)
                    }
                ) { Text("Да") }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(
                    onClick = { pendingExternalUrl = null }
                ) { Text("Отмена") }
            }
        )
    }
}

private fun makeRichText(
    html: String,
    onReply: (Long) -> Unit,
    onExternalLink: (String) -> Unit
): SpannableStringBuilder {
    val raw = HtmlCompat.fromHtml(html, HtmlCompat.FROM_HTML_MODE_LEGACY)
    val text = SpannableStringBuilder(raw)

    // 2ch sometimes sends a visible URL as plain text instead of an <a> tag.
    // Linkify those too, then replace every URLSpan with our confirmation span.
    androidx.core.text.util.LinkifyCompat.addLinks(text, android.text.util.Linkify.WEB_URLS)

    val urlSpans = text.getSpans(0, text.length, android.text.style.URLSpan::class.java)
    urlSpans.forEach { span ->
        val spanStart = text.getSpanStart(span)
        val spanEnd = text.getSpanEnd(span)
        val flags = text.getSpanFlags(span)
        val url = span.url.orEmpty()
        val visible = if (spanStart >= 0 && spanEnd > spanStart) {
            text.subSequence(spanStart, spanEnd).toString().trim()
        } else ""
        text.removeSpan(span)

        // Quote links are internal navigation and must never open a browser dialog.
        val isInternalReply = Regex("^>>\\d+$").matches(visible)
        if (!isInternalReply && spanStart >= 0 && spanEnd > spanStart && url.isNotBlank()) {
            text.setSpan(object : ClickableSpan() {
                override fun onClick(widget: View) = onExternalLink(url)
                override fun updateDrawState(ds: android.text.TextPaint) {
                    super.updateDrawState(ds)
                    ds.color = AndroidColor.rgb(242, 162, 74)
                    ds.isUnderlineText = true
                }
            }, spanStart, spanEnd, flags)
        }
    }

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
'''

s = s[:start] + replacement.rstrip() + s[end:]
ui.write_text(s, encoding='utf-8')
print('v0.8.3 robust tappable links patch applied')
