path = 'www/js/features/home/home.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """      <button class="menu-item" data-route="/audio">
        <div class="menu-icon">${icons.audio}</div>
        <div class="menu-title">Bíblia em Áudio</div>
        <div class="menu-desc">Ouça as Escrituras</div>
      </button>
"""
qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("home.js atualizado com sucesso")
