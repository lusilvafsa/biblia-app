path = 'www/js/data-access/highlightRepository.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

anchor = """export const highlightRepository = {
  get(bookIndex, chapterIndex, verseIndex) {"""

replacement = """export const highlightRepository = {
  getAll() {
    return readAll();
  },
  get(bookIndex, chapterIndex, verseIndex) {"""

qtd = content.count(anchor)
if qtd != 1:
    raise SystemExit(f"ERRO: ancora encontrada {qtd} vezes (esperado 1).")
content = content.replace(anchor, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("highlightRepository.js atualizado")
