path = 'www/js/features/home/home.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '<p class="verse-text" style="margin-bottom:0; color:var(--text-primary);">${verses[0]}</p>'
new = '<p class="verse-text" style="margin-bottom:0; color:var(--text-primary); font-size:19px; line-height:1.65;">${verses[0]}</p>'

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("home.js atualizado - tamanho forcado via inline style")
