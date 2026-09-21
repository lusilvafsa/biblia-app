path = 'www/sw.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

linhas_remover = [
    "  './data/audioTracks.js',\n",
    "  './js/features/audio/audio.js',\n",
    "  './js/state/audioPlayer.js',\n",
]

for linha in linhas_remover:
    qtd = content.count(linha)
    if qtd != 1:
        raise SystemExit(f"ERRO: linha {linha!r} encontrada {qtd} vezes (esperado 1).")
    content = content.replace(linha, "")

old_versao = "const CACHE_NAME = 'biblia-estudo-v2.5';"
new_versao = "const CACHE_NAME = 'biblia-estudo-v2.6';"
qtd_v = content.count(old_versao)
if qtd_v != 1:
    raise SystemExit(f"ERRO: versao do cache encontrada {qtd_v} vezes (esperado 1). Talvez já esteja em outro numero — me avise.")
content = content.replace(old_versao, new_versao)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("sw.js atualizado com sucesso")
