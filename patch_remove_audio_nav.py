path = 'www/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """      <button class="nav-item" data-nav-key="audio" data-route="/audio">
        <span class="nav-icon"></span><span>Áudio</span>
      </button>
"""
qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html atualizado com sucesso")
