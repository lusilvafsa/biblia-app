path = 'www/js/features/bible/studyCorner.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: {
            mensagem: `Explique o versículo ${ref}, que diz: "${verseText}". Traga o contexto histórico, o significado principal e uma aplicação prática para a vida hoje.`,
          },
        });"""

new = """        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: {
            mensagem: `Explique o versículo ${ref}, que diz: "${verseText}". Traga o contexto histórico, o significado principal e uma aplicação prática para a vida hoje.`,
            tipo: 'versiculo',
            chave: `${bookIndex}-${chapterIndex}-${verseIndex}`,
          },
        });"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("studyCorner.js atualizado com sucesso")
