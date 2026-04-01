import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
exclude_dirs = ['server/venv', 'node_modules', 'client/node_modules', '.git']
packages = ['dash','eventlet','flask','flask_jwt_extended','jinja2','werkzeug','ultralytics','cv2','pytesseract','psycopg2','sqlalchemy','socketio','matplotlib','seaborn','sklearn','pillow','python-dotenv','flask_socketio','httpx','python_engineio','python_socketio']
file_exts = {'.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.pyw'}

for pkg in packages:
    print('\n=== PACKAGE:', pkg, '===')
    pat = re.compile(rf"\bimport\s+{re.escape(pkg)}\b|\bfrom\s+{re.escape(pkg)}\b|\b{re.escape(pkg)}\.")
    found = False
    for p in root.rglob('*'):
        if p.is_dir():
            continue
        rel = str(p.relative_to(root)).replace('\\','/')
        if any(rel.startswith(ed) for ed in exclude_dirs):
            continue
        if p.suffix.lower() not in file_exts:
            continue
        try:
            text = p.read_text(encoding='utf-8')
        except Exception:
            try:
                text = p.read_text(encoding='latin-1')
            except Exception:
                continue
        for i, line in enumerate(text.splitlines(), start=1):
            if pat.search(line):
                print(f"{rel}:{i}: {line.strip()}")
                found = True
    if not found:
        print('No matches')

print('\nSearch complete.')
