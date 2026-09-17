from pathlib import Path

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

if 'private fun cleanPostName(raw: String): String {' not in s:
    anchor = '\nprivate fun extractReplyTargets(html: String): List<Long> {'
    helper = r'''
private fun cleanPostName(raw: String): String {
    val clean = htmlToPlain(raw)
        .replace('\u00A0', ' ')
        .replace(Regex("\\s+"), " ")
        .trim()
    return clean.ifBlank { "Аноним" }
}

private fun extractReplyTargets(html: String): List<Long> {'''
    if anchor not in s:
        raise SystemExit('extractReplyTargets anchor not found')
    s = s.replace(anchor, '\n' + helper.lstrip('\n'), 1)

ui.write_text(s, encoding='utf-8')
print('v0.8.8 helper compatibility fix applied')
