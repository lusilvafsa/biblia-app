path = 'www/js/features/ministry/ministryList.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """        const usuario = usuarioAtual();

        if (!usuario) {
          resultEl.hidden = false;
          resultEl.innerHTML = '<p>Entre na sua conta para usar o Assistente Bíblico.</p>';
          return;
        }

        aiBtn.disabled = true;"""

new = """        aiBtn.disabled = true;"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ministryList.js atualizado com sucesso")
