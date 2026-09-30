arq = 'www/js/features/bible/reader.js'
c = open(arq, encoding='utf-8').read()

old = "margin:20px 0 6px;font-weight:700;opacity:.85;font-size:"
new = "margin:20px 0 6px;font-weight:700;color:var(--gold);font-size:"

if c.count(old) != 1:
    raise SystemExit('trecho não encontrado: ' + str(c.count(old)))

open(arq, 'w', encoding='utf-8').write(c.replace(old, new))
print('Cor dourada aplicada aos títulos')
