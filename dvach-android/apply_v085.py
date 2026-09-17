from pathlib import Path

# Materialize complete working v0.8.4 first.
exec(Path('apply_v084.py').read_text(encoding='utf-8'), {'__name__': '__main__'})

# Bump version for the adaptive-icon fix.
build = Path('app/build.gradle')
s = build.read_text(encoding='utf-8')
s = s.replace("versionCode 14", "versionCode 15")
s = s.replace("versionName '0.8.4'", "versionName '0.8.5'")
build.write_text(s, encoding='utf-8')

print('v0.8.5 adaptive launcher icon patch applied')
