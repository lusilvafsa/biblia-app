import glob, os, shutil, struct
alvo = 'www/assets/icons/bible-icon.png'
novos = sorted(glob.glob('/sdcard/Download/bible-icon-novo*.png'), key=os.path.getmtime)
if not novos:
    raise SystemExit('ERRO: bible-icon-novo.png ainda não está em /sdcard/Download. Baixe o arquivo do chat e rode de novo.')
def dims(p):
    with open(p, 'rb') as f:
        h = f.read(24)
    return struct.unpack('>II', h[16:24]) if h[:8] == b'\x89PNG\r\n\x1a\n' else None
dn, da = dims(novos[-1]), dims(alvo)
print('novo:', dn, '| atual:', da)
if dn != da:
    raise SystemExit('ERRO: tamanhos diferentes. Nada foi gravado.')
pasta = os.path.expanduser('~/bak-icones/www/assets/icons')
os.makedirs(pasta, exist_ok=True)
shutil.copy2(alvo, os.path.join(pasta, 'bible-icon.png'))
shutil.copy2(novos[-1], alvo)
print('OK: bible-icon.png substituído. Cópia do antigo em ~/bak-icones/')
