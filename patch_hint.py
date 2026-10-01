p = 'www/js/features/settings/settings.js'
c = open(p, encoding='utf-8').read()
old = '<p class="voice-hint" style="margin-top:8px;">Respostas já geradas antes não gastam sua cota.</p>'
new = '<p style="margin-top:8px;font-size:13px;opacity:.65;">Respostas já geradas antes não gastam sua cota.</p>'
if c.count(old) != 1:
    raise SystemExit(f'ERRO: trecho achado {c.count(old)}x')
open(p, 'w', encoding='utf-8').write(c.replace(old, new))
print('OK')
