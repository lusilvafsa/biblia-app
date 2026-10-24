import os, re, sys

def sem_comentarios(src):
    src = re.sub(r'(?m)^\s*/\*.*?\*/', '', src, flags=re.DOTALL)
    return '\n'.join(l for l in src.splitlines() if not l.lstrip().startswith('//'))

def exports_de(caminho):
    src = sem_comentarios(open(caminho, encoding='utf-8').read())
    nomes, aberto = set(), False
    for m in re.finditer(r'export\s+(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)', src):
        nomes.add(m.group(1))
    for m in re.finditer(r'export\s+(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)', src):
        nomes.add(m.group(1))
    for m in re.finditer(r'export\s+(?:const|let|var)\s*\{([^}]*)\}', src, re.DOTALL):
        for p in m.group(1).split(','):
            if p.strip():
                nomes.add(re.split(r'\s*:\s*', p.strip())[-1].split('=')[0].strip())
    for m in re.finditer(r'export\s*\{([^}]*)\}', src, re.DOTALL):
        for p in m.group(1).split(','):
            if p.strip():
                nomes.add(re.split(r'\s+as\s+', p.strip())[-1].strip())
    if re.search(r'export\s+default\b', src):
        nomes.add('default')
    if re.search(r'export\s*\*\s*from', src):
        aberto = True
    return nomes, aberto

def clausula(c):
    nomes, padrao = [], False
    m = re.search(r'\{([^}]*)\}', c, re.DOTALL)
    if m:
        for p in m.group(1).split(','):
            if p.strip():
                nomes.append(re.split(r'\s+as\s+', p.strip())[0].strip())
        c = c.replace(m.group(0), '')
    resto = re.sub(r'\*\s*as\s+[\w$]+', '', c).strip(' ,\n\t')
    if resto:
        padrao = True
    return nomes, padrao

def resolver(origem, spec):
    alvo = os.path.normpath(os.path.join(os.path.dirname(origem), spec))
    if os.path.isfile(alvo):
        return alvo
    if os.path.isfile(alvo + '.js'):
        return alvo + '.js'
    return None

raiz = sys.argv[1] if len(sys.argv) > 1 else 'www'
arquivos = []
for pasta, _, nomes in os.walk(raiz):
    if any(parte in pasta.split(os.sep) for parte in ('assets', 'node_modules')):
        continue
    arquivos += [os.path.join(pasta, n) for n in nomes if n.endswith('.js')]
cache, problemas, total = {}, [], 0
for f in sorted(arquivos):
    src = sem_comentarios(open(f, encoding='utf-8').read())
    achados = [(m.group(1), m.group(2)) for m in re.finditer(r"""import\s+([^'";]*?)\s*from\s*['"]([^'"]+)['"]""", src, re.DOTALL)]
    achados += [(None, m.group(1)) for m in re.finditer(r"""import\s*['"]([^'"]+)['"]""", src)]
    achados += [(None, m.group(1)) for m in re.finditer(r"""import\(\s*['"]([^'"]+)['"]\s*\)""", src)]
    for cl, spec in achados:
        if not spec.startswith('.'):
            continue
        total += 1
        alvo = resolver(f, spec)
        if not alvo:
            problemas.append(f'{f}: importa "{spec}", mas esse arquivo não existe')
            continue
        if cl is None:
            continue
        if alvo not in cache:
            cache[alvo] = exports_de(alvo)
        exportados, aberto = cache[alvo]
        nomes, padrao = clausula(cl)
        if aberto:
            continue
        for n in nomes:
            if n not in exportados:
                problemas.append(f'{f}: importa "{n}" de {spec}, que não exporta esse nome (exporta: {", ".join(sorted(exportados)) or "nada"})')
        if padrao and 'default' not in exportados:
            problemas.append(f'{f}: importa o padrão (default) de {spec}, que não tem export default')
if problemas:
    print('PROBLEMAS DE IMPORTAÇÃO (o app quebraria ao abrir):')
    for p in problemas:
        print('  -', p)
    sys.exit(1)
print(f'IMPORTS OK ({len(arquivos)} arquivos, {total} importações conferidas)')
