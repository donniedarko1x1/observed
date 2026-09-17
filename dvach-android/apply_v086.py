from pathlib import Path

# Materialize complete working v0.8.5 first.
exec(Path('apply_v085.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 15", "versionCode 16")
s = s.replace("versionName '0.8.5'", "versionName '0.8.6'")
build.write_text(s, encoding='utf-8')

print('v0.8.6 hard launcher icon patch applied')
