from pathlib import Path

p = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = p.read_text(encoding='utf-8')
old = '''    val postOwners: List<Long>,
    val board: String,
    val onPostChanged: (Long) -> Unit
)'''
new = '''    val postOwners: List<Long> = emptyList(),
    val board: String = "",
    val onPostChanged: (Long) -> Unit = {}
)'''
if old not in s:
    raise SystemExit('GalleryState defaults marker not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('v0.8 compatibility fix applied')
