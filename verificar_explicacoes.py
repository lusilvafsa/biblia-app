import json, os, re, subprocess, sys, tempfile, unicodedata

VERSAO = sys.argv[1] if len(sys.argv) > 1 else 'acf'
ARQUIVO = 'www/data/verseCommentaryExtra.js'
PASTA = f'www/data/bible/{VERSAO}'
CAMPOS = ('explicacao', 'contexto', 'aplicacao', 'conceitos')
LIMITES = {'explicacao': 320, 'contexto': 300, 'aplicacao': 300, 'conceitos': 300}

def norm(t):
    t = unicodedata.normalize('NFD', str(t))
    return re.sub(r'[^a-z0-9 ]+', ' ', ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()).split()

tmp = os.path.join(tempfile.gettempdir(), 'extra_verif.mjs')
with open(ARQUIVO, encoding='utf-8') as f, open(tmp, 'w', encoding='utf-8') as g:
    g.write(f.read())
r = subprocess.run(['node', '-e', f"import('file://{tmp}').then(m=>console.log(JSON.stringify(m.VERSE_COMMENTARY_EXTRA)))"], capture_output=True, text=True)
if r.returncode != 0:
    raise SystemExit('ERRO ao ler o arquivo de explicações:\n' + r.stderr[:400])
extra = json.loads(r.stdout)
indice = json.load(open(f'{PASTA}/index.json', encoding='utf-8'))
curado = set()
try:
    txt = open('www/data/verseCommentary.js', encoding='utf-8').read()
    curado = set(re.findall(r"^\s*'(\d+-\d+-\d+)'\s*:", txt, flags=re.M))
except OSError:
    pass

livros, erros, avisos = {}, [], []
for chave, e in extra.items():
    m = re.fullmatch(r'(\d+)-(\d+)-(\d+)', chave)
    if not m:
        erros.append(f'{chave}: chave fora do formato livro-capítulo-versículo'); continue
    b, c, v = map(int, m.groups())
    if b >= len(indice):
        erros.append(f'{chave}: livro {b} não existe'); continue
    if b not in livros:
        livros[b] = json.load(open(f'{PASTA}/{b}.json', encoding='utf-8'))
    caps = livros[b]['chapters']
    if c >= len(caps) or v >= len(caps[c]):
        erros.append(f'{chave}: {indice[b]["name"]} {c + 1}:{v + 1} não existe nesta versão'); continue
    texto = caps[c][v]
    nome = indice[b]['name']
    ref = e.get('ref', '')
    mref = re.fullmatch(r'(.+?) (\d+):(\d+)', ref)
    if mref:
        if (int(mref.group(2)), int(mref.group(3))) != (c + 1, v + 1):
            erros.append(f'{chave}: a etiqueta diz "{ref}", mas a chave aponta para {nome} {c + 1}:{v + 1}')
        a, bn = ' '.join(norm(mref.group(1))), ' '.join(norm(nome))
        if a not in bn and bn not in a:
            erros.append(f'{chave}: a etiqueta diz "{ref}", mas o livro da chave é "{nome}"')
    else:
        avisos.append(f'{chave}: sem etiqueta "ref"')
    for campo in CAMPOS:
        valor = e.get(campo)
        if not valor or not str(valor).strip():
            erros.append(f'{chave}: campo "{campo}" vazio')
        elif len(valor) > LIMITES[campo]:
            avisos.append(f'{chave}: "{campo}" tem {len(valor)} caracteres (acima de {LIMITES[campo]})')
    palavras_v = norm(texto)
    trechos = {' '.join(palavras_v[i:i + 6]) for i in range(max(0, len(palavras_v) - 5))}
    for campo in CAMPOS:
        pc = norm(e.get(campo, ''))
        if any(' '.join(pc[i:i + 6]) in trechos for i in range(max(0, len(pc) - 5))):
            avisos.append(f'{chave}: "{campo}" repete 6 ou mais palavras seguidas do versículo')
    dup = ' (JÁ EXISTE no arquivo curado; o curado vale)' if chave in curado else ''
    print(f'{nome} {c + 1}:{v + 1} [{chave}]{dup}\n   Bíblia: {texto[:110]}{"…" if len(texto) > 110 else ""}\n   Explicação: {e.get("explicacao", "")[:110]}…')
print()
for a in avisos:
    print('AVISO:', a)
if erros:
    print('\nERROS:')
    for x in erros:
        print('  -', x)
    sys.exit(1)
print(f'VERIFICADO: {len(extra)} explicações, numeração e campos conferidos' + (f' ({len(avisos)} avisos)' if avisos else ''))
