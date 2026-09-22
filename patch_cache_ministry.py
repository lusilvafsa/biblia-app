path = 'www/js/features/ministry/ministryList.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """          const { data, error } = await supabase.functions.invoke('assistente-biblico', {
            body: { mensagem: `Crie uma ministração sobre o tema: ${query}` },
          });"""

new = """          const { data, error } = await supabase.functions.invoke('assistente-biblico', {
            body: {
              mensagem: `Crie uma ministração sobre o tema: ${query}`,
              tipo: 'ministracao',
              chave,
            },
          });"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ministryList.js atualizado com sucesso")
