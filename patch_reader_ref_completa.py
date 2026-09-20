path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1) Contexto do toque no versículo: incluir o número do versículo
old1 = """          showToolbarForVerse(p.getBoundingClientRect(), text, {
            openFullExplanation: () => showVerseExplanation({"""
new1 = """          showToolbarForVerse(p.getBoundingClientRect(), text, {
            verseIndex: idx,
            openFullExplanation: () => showVerseExplanation({"""
qtd1 = content.count(old1)
if qtd1 != 1:
    raise SystemExit(f"ERRO 1: encontrado {qtd1} vezes")
content = content.replace(old1, new1)

# 2) handlePrintSelection: aceitar contexto e montar referencia completa
old2 = "    function handlePrintSelection(text) {"
new2 = """    function handlePrintSelection(text, context) {
      const referencia = context && context.verseIndex !== undefined
        ? `${book.name} ${chapterIndex + 1}:${context.verseIndex + 1}`
        : `${book.name} ${chapterIndex + 1}`;"""
qtd2 = content.count(old2)
if qtd2 != 1:
    raise SystemExit(f"ERRO 2: encontrado {qtd2} vezes")
content = content.replace(old2, new2)

old3 = '<div class="ministry-theme-label">📖 ${book.name} ${chapterIndex + 1}</div>'
new3 = '<div class="ministry-theme-label">📖 ${referencia}</div>'
qtd3 = content.count(old3)
if qtd3 != 1:
    raise SystemExit(f"ERRO 3: encontrado {qtd3} vezes")
content = content.replace(old3, new3)

# 3) handleImageSelection: aceitar contexto e montar referencia completa
old4 = "    async function handleImageSelection(text) {"
new4 = """    async function handleImageSelection(text, context) {
      const referencia = context && context.verseIndex !== undefined
        ? `${book.name} ${chapterIndex + 1}:${context.verseIndex + 1}`
        : `${book.name} ${chapterIndex + 1}`;"""
qtd4 = content.count(old4)
if qtd4 != 1:
    raise SystemExit(f"ERRO 4: encontrado {qtd4} vezes")
content = content.replace(old4, new4)

old5 = '<div class="ministry-theme-label" style="margin-bottom:10px;">📖 ${book.name} ${chapterIndex + 1}</div>'
new5 = '<div class="ministry-theme-label" style="margin-bottom:10px;">📖 ${referencia}</div>'
qtd5 = content.count(old5)
if qtd5 != 1:
    raise SystemExit(f"ERRO 5: encontrado {qtd5} vezes")
content = content.replace(old5, new5)

old6 = "await navigator.share({ files: [arquivo], title: `${book.name} ${chapterIndex + 1}` });"
new6 = "await navigator.share({ files: [arquivo], title: referencia });"
qtd6 = content.count(old6)
if qtd6 != 1:
    raise SystemExit(f"ERRO 6: encontrado {qtd6} vezes")
content = content.replace(old6, new6)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("reader.js atualizado com sucesso")
