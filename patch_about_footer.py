path = 'www/js/features/settings/settings.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """    <div class="app-info">
      Bíblia de Estudo<br>
      Texto: versão ACF (Almeida Corrigida Fiel)
    </div>"""

new = """    <div class="app-info">
      Bíblia de Estudo — v3.0<br>
      Versões: ACF, BLIVRE e ARC 1911<br>
      Referências cruzadas: OpenBible.info (CC BY 4.0)
    </div>"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("settings.js atualizado com sucesso")
