path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: { mensagem: `Explique este trecho da Bíblia: "${text}"` },
        });"""

new = """        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: {
            mensagem: `Explique este trecho da Bíblia: "${text}"`,
            tipo: 'trecho',
            chave: text.trim().toLowerCase().slice(0, 200),
          },
        });"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("reader.js (cache) atualizado com sucesso")
