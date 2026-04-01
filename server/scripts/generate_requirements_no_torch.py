from pathlib import Path
p=Path('requirements.txt')
text=None
for enc in ('utf-8','utf-8-sig','utf-16','latin-1'):
    try:
        text=p.read_text(encoding=enc)
        print('read with',enc)
        break
    except Exception as e:
        pass
if text is None:
    print('failed to read requirements.txt')
    raise SystemExit(1)
lines=text.splitlines()
filtered=[l for l in lines if not any(k in l.lower() for k in ('torch','torchvision','torchaudio','torchmetrics','pytorch'))]
out='\n'.join(filtered)+('\n' if filtered and not filtered[-1].endswith('\n') else '')
Path('requirements-no-torch.txt').write_text(out,encoding='utf-8')
print('wrote requirements-no-torch.txt, lines',len(filtered))
