path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """    async function handleShareSelection(text) {
      const shareData = { title: `${book.name} ${chapterIndex + 1}`, text };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (_e) {
          /* usuário cancelou — sem erro */
        }
      } else if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          () => toast.success('Trecho copiado!'),
          () => toast.error('Não foi possível copiar')
        );
      } else {
        toast.info('Compartilhamento não suportado neste navegador');
      }
    }"""

new = """    async function handleShareSelection(text) {
      const resultado = await shareText({ title: `${book.name} ${chapterIndex + 1}`, text });
      if (resultado === 'copied') toast.success('Trecho copiado!');
      if (resultado === 'error') toast.error('Não foi possível copiar');
      if (resultado === 'unsupported') toast.info('Compartilhamento não suportado neste navegador');
    }"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

old_import = "import { openExternalExplanation } from '../../utils/externalExplain.js';"
new_import = old_import + "\nimport { shareText } from '../../utils/share.js';"
qtd2 = content.count(old_import)
if qtd2 != 1:
    raise SystemExit(f"ERRO 2: encontrado {qtd2} vezes.")
content = content.replace(old_import, new_import)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("reader.js atualizado com sucesso")
