import json, os, re, shutil, subprocess
import xml.dom.minidom
home = os.path.expanduser('~')
ARQUIVOS = [
    'www/index.html',
    'www/manifest.json',
    'www/js/features/onboarding/onboarding.js',
    'www/js/features/settings/settings.js',
    'www/js/features/home/home.js',
    'www/js/features/bible/reader.js',
    'www/js/main.js',
    'www/js/utils/mediaSession.js',
    'www/js/utils/verseImage.js',
    'www/js/utils/dailyNotification.js',
    'android/app/src/main/res/values/strings.xml',
    'android/app/src/main/java/com/biblia/deestudo/MediaNotificationService.java',
    'android/app/src/main/java/com/biblia/deestudo/MediaNotificationPlugin.java',
    'capacitor.config.json',
]
padrao = re.compile(r'Bíblia de Estudo(?! LS)')
novos = {}

for f in ARQUIVOS:
    if not os.path.exists(f):
        raise SystemExit(f'ERRO: {f} não existe. Nada foi gravado.')
    c = open(f, encoding='utf-8').read()
    n = len(padrao.findall(c))
    if n == 0:
        raise SystemExit(f'ERRO: nenhum "Bíblia de Estudo" em {f}. Nada foi gravado.')
    novo = padrao.sub('Bíblia de Estudo LS', c)
    if f.endswith('.js'):
        t = os.path.join(home, 'chk_nome.mjs')
        open(t, 'w', encoding='utf-8').write(novo)
        r = subprocess.run(['node', '--check', t], capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit(f'ERRO de sintaxe em {f}, nada foi gravado:\n' + r.stderr)
    elif f.endswith('.json'):
        json.loads(novo)
    elif f.endswith('.xml'):
        xml.dom.minidom.parseString(novo.encode('utf-8'))
    novos[f] = novo
    print(f'{n}x  {f}')

for f, novo in novos.items():
    destino = os.path.join(home, 'bak-nome', f)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    shutil.copy2(f, destino)
    open(f, 'w', encoding='utf-8').write(novo)
print('OK: nome trocado em', len(novos), 'arquivos. Cópias em ~/bak-nome/')
