from pathlib import Path

# Materialize the complete working v0.8 first, including its compatibility fix.
exec(Path('apply_v08.py').read_text(encoding='utf-8'), {'__name__': '__main__'})
exec(Path('apply_v08_fix.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 10", "versionCode 11")
s = s.replace("versionName '0.8.0'", "versionName '0.8.1'")
build.write_text(s, encoding='utf-8')

ui = Path('app/src/main/java/su/dvach/neo/DvachUi.kt')
s = ui.read_text(encoding='utf-8')

# Thread -> PostCard must pass board/thread so the share action can construct a canonical post URL.
old = '''                    PostCard(
                        post = post,
                        highlighted = highlighted == post.num,'''
new = '''                    PostCard(
                        board = board,
                        thread = thread,
                        post = post,
                        highlighted = highlighted == post.num,'''
if old not in s:
    raise SystemExit('PostCard invocation marker not found')
s = s.replace(old, new, 1)

# Add board/thread to the normal post card signature.
old = '''private fun PostCard(
    post: PostItem,'''
new = '''private fun PostCard(
    board: String,
    thread: Long,
    post: PostItem,'''
if old not in s:
    raise SystemExit('PostCard signature marker not found')
s = s.replace(old, new, 1)

# Add one native Share button in the main post header, immediately after the post number.
post_start = s.find('@Composable\nprivate fun PostCard(')
if post_start < 0:
    raise SystemExit('PostCard start not found')
post_end_candidates = [
    s.find('\n@Composable\nprivate fun PostPreviewCard', post_start),
    s.find('\n@Composable\nprivate fun HtmlPostText', post_start),
]
post_end_candidates = [x for x in post_end_candidates if x > post_start]
if not post_end_candidates:
    raise SystemExit('PostCard end not found')
post_end = min(post_end_candidates)
section = s[post_start:post_end]
marker = '                Text("№${post.num}", color = Accent, fontSize = 12.sp)'
if marker not in section:
    raise SystemExit('Post number marker not found in PostCard')
section = section.replace(
    marker,
    marker + '''
                PostShareButton(
                    repository = repository,
                    board = board,
                    thread = thread,
                    post = post
                )''',
    1
)
s = s[:post_start] + section + s[post_end:]

ui.write_text(s, encoding='utf-8')
print('v0.8.1 post sharing UI patch applied')
