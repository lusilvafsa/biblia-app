import glob, os, shutil, struct, zipfile
home = os.path.expanduser('~')
achados = sorted(glob.glob('/sdcard/Download/pacote-icones*.zip'), key=os.path.getmtime)
if not achados:
    raise SystemExit('ERRO: pacote-icones.zip não está em /sdcard/Download.')
z = zipfile.ZipFile(achados[-1])
print('usando', achados[-1])

def dims(dados):
    return struct.unpack('>II', dados[16:24]) if dados[:8] == b'\x89PNG\r\n\x1a\n' else None

plano = []
for nome in sorted(z.namelist()):
    if not (nome.startswith('android/') or nome.startswith('www/')):
        continue
    novo = z.read(nome)
    if nome.endswith('.png') and os.path.exists(nome):
        antigo = open(nome, 'rb').read()
        da, dn = dims(antigo), dims(novo)
        eh_launcher = os.path.basename(nome) in ('ic_launcher.png', 'ic_launcher_round.png')
        if da and dn and da != dn and not eh_launcher:
            raise SystemExit(f'ERRO: tamanho diferente em {nome}: atual {da}, novo {dn}. Nada foi gravado.')
    plano.append((nome, novo))

for nome, novo in plano:
    if os.path.exists(nome):
        destino = os.path.join(home, 'bak-icones', nome)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.copy2(nome, destino)
    os.makedirs(os.path.dirname(nome), exist_ok=True)
    open(nome, 'wb').write(novo)
print(f'OK: {len(plano)} arquivos aplicados. Cópias em ~/bak-icones/')
