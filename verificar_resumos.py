import json, os, re, subprocess, sys, tempfile, unicodedata

VERSAO = sys.argv[1] if len(sys.argv) > 1 else 'acf'

def norm(t):
    t = unicodedata.normalize('NFD', str(t))
    return ' '.join(re.sub(r'[^a-z0-9 ]+', ' ', ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()).split())

tmp = os.path.join(tempfile.gettempdir(), 'resumos_verif.mjs')
with open('www/data/chapterSummaries.js', encoding='utf-8') as f, open(tmp, 'w', encoding='utf-8') as g:
    g.write(f.read())
r = subprocess.run(['node', '-e', f"import('file://{tmp}').then(m=>console.log(JSON.stringify(m.CHAPTER_SUMMARIES)))"], capture_output=True, text=True)
if r.returncode != 0:
    raise SystemExit('ERRO ao ler chapterSummaries.js:\n' + r.stderr[:400])
dados = json.loads(r.stdout)
indice = json.load(open(f'www/data/bible/{VERSAO}/index.json', encoding='utf-8'))

erros, avisos, por_livro = [], [], {}
for chave, e in dados.items():
    m = re.fullmatch(r'(\d+)-(\d+)', chave)
    if not m:
        erros.append(f'{chave}: chave fora do formato livro-capítulo'); continue
    b, c = int(m.group(1)), int(m.group(2))
    if b >= len(indice):
        erros.append(f'{chave}: livro {b} não existe'); continue
    livro = indice[b]
    if c >= livro['chapterCount']:
        erros.append(f'{chave}: {livro["name"]} só tem {livro["chapterCount"]} capítulos'); continue
    mref = re.fullmatch(r'(.+?) (\d+)', e.get('ref', ''))
    if not mref:
        avisos.append(f'{chave}: sem etiqueta "ref" válida')
    else:
        if int(mref.group(2)) != c + 1:
            erros.append(f'{chave}: a etiqueta diz "{e["ref"]}", mas a chave aponta para {livro["name"]} {c + 1}')
        a, bn = norm(mref.group(1)), norm(livro['name'])
        if a not in bn and bn not in a:
            erros.append(f'{chave}: a etiqueta diz "{e["ref"]}", mas o livro da chave é "{livro["name"]}"')
    pts = e.get('pontos')
    if not e.get('resumo') or not e.get('aplicacao') or not isinstance(pts, list) or not 3 <= len(pts) <= 5:
        erros.append(f'{chave}: resumo, aplicação ou pontos (3 a 5) incompletos')
    if len(e.get('resumo', '')) > 450:
        avisos.append(f'{chave}: resumo muito longo ({len(e["resumo"])} caracteres)')
    por_livro.setdefault(b, []).append(c)

for b in sorted(por_livro):
    total = indice[b]['chapterCount']
    print(f'{indice[b]["name"]:22} {len(por_livro[b]):3}/{total:<3} capítulos' + ('' if len(por_livro[b]) == total else '  (parcial)'))
print()
for a in avisos:
    print('AVISO:', a)
if erros:
    print('\nERROS:')
    for x in erros:
        print('  -', x)
    sys.exit(1)
print(f'VERIFICADO: {len(dados)} resumos em {len(por_livro)} livros; todos os capítulos existem na sua Bíblia e as etiquetas batem')
