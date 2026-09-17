from pathlib import Path

# Materialize complete v0.8.1 first.
exec(Path('apply_v081.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 11", "versionCode 12")
s = s.replace("versionName '0.8.1'", "versionName '0.8.2'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

start = s.find('@Composable\nprivate fun HtmlPostText(')
end = s.find('\nprivate fun extractReplyTargets', start)
if start < 0 or end < 0:
    raise SystemExit('HtmlPostText/makeRichText block markers not found')

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
                movementMethod = LinkMovementMethod.getInstance()
                highlightColor = AndroidColor.TRANSPARENT
                setTextIsSelectable(true)
                setLineSpacing(0f, 1.08f)
            }
        },
        update = { view ->
            view.text = makeRichText(
                html = html,
                onReply = onReply,
                onExternalLink = { url -> pendingExternalUrl = url }
            )
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

    // Replace Android URLSpan with a guarded click so links cannot open without confirmation.
    val urlSpans = text.getSpans(0, text.length, android.text.style.URLSpan::class.java)
    urlSpans.forEach { span ->
        val start = text.getSpanStart(span)
        val end = text.getSpanEnd(span)
        val flags = text.getSpanFlags(span)
        val url = span.url.orEmpty()
        text.removeSpan(span)
        if (start >= 0 && end > start && url.isNotBlank()) {
            text.setSpan(object : ClickableSpan() {
                override fun onClick(widget: View) = onExternalLink(url)
                override fun updateDrawState(ds: android.text.TextPaint) {
                    super.updateDrawState(ds)
                    ds.color = AndroidColor.rgb(242, 162, 74)
                    ds.isUnderlineText = true
                }
            }, start, end, flags)
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
print('v0.8.2 guarded external links patch applied')
