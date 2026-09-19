path = 'www/js/features/home/home.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """      <div class="prayer-card" id="btnOpenPsalm" style="cursor:pointer;">
        <h4>📖 Salmos ${chapterIndex + 1}</h4>
        <p>${verses[0]}</p>
      </div>"""

new = """      <div class="prayer-card" id="btnOpenPsalm" style="cursor:pointer;">
        <h4>📖 Salmos ${chapterIndex + 1}</h4>
        <p class="verse-text" style="font-size:16px; margin-bottom:0;">${verses[0]}</p>
      </div>"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: bloco encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("home.js atualizado - fonte do Salmo igualada")
