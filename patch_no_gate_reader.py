path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """      const resultEl = overlay.querySelector('#quickAiResult');
      const usuario = usuarioAtual();

      if (!usuario) {
        resultEl.innerHTML = '<p>Entre na sua conta para usar o Assistente Bíblico.</p>';
        return;
      }

      try {"""

new = """      const resultEl = overlay.querySelector('#quickAiResult');

      try {"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("reader.js atualizado com sucesso")
