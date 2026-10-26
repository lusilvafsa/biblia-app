import glob, os, shutil, sys, zipfile
pasta = os.environ.get('DOWNLOADS', '/sdcard/Download')
forcar = '--forcar' in sys.argv
pacotes = sorted(glob.glob(os.path.join(pasta, 'pacote-icones*.zip')), key=os.path.getmtime)
if not pacotes:
    raise SystemExit('ERRO: nenhum pacote em ' + pasta)
z = zipfile.ZipFile(pacotes[-1])
alvos = [n for n in z.namelist() if n.startswith(('www/', 'android/')) and not n.endswith('/')]
print('usando', pacotes[-1])
existentes = [n for n in alvos if os.path.exists(n)]
if existentes and not forcar:
    print('PARE: estes arquivos já existem e seriam sobrescritos:')
    for n in existentes:
        print('  -', n)
    raise SystemExit('Nada foi gravado. Se for mesmo para substituir, rode: python3 aplicar_codigo.py --forcar')
for n in alvos:
    if os.path.exists(n):
        copia = os.path.expanduser('~/bak-codigo/' + n)
        os.makedirs(os.path.dirname(copia), exist_ok=True)
        shutil.copy2(n, copia)
    os.makedirs(os.path.dirname(n) or '.', exist_ok=True)
    with open(n, 'wb') as f:
        f.write(z.read(n))
print('OK:', len(alvos), 'arquivos aplicados' + (' (com cópia em ~/bak-codigo/ dos que já existiam)' if existentes else ''))
