path = 'www/js/features/bible/chapterExplanation.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """      const { data, error } = await supabase.functions.invoke('assistente-biblico', {
        body: {
          mensagem: `Faça um breve estudo bíblico do capítulo ${ref}. Traga o contexto do capítulo, de 3 a 5 ensinamentos principais e uma aplicação prática.`,
        },
      });"""

new = """      const { data, error } = await supabase.functions.invoke('assistente-biblico', {
        body: {
          mensagem: `Faça um breve estudo bíblico do capítulo ${ref}. Traga o contexto do capítulo, de 3 a 5 ensinamentos principais e uma aplicação prática.`,
          tipo: 'capitulo',
          chave: `${bookName}_${chapterNumber}`,
        },
      });"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("chapterExplanation.js atualizado com sucesso")
