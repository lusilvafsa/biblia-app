path = 'www/js/features/bible/reader.js'
with open(path, 'r', encoding='utf-8') as f:
    linhas = f.readlines()

def bloco(texto):
    return [l + '\n' for l in texto.strip('\n').split('\n')]

# --- Edição D (mais abaixo no arquivo): chamada do attachSelectionToolbar (linhas 752-758) ---
esperado_d = [
    "    const detachSelectionToolbar = attachSelectionToolbar(readContent, {\n",
    "      onShare: handleShareSelection,\n",
    "      onExplain: handleExplainSelection,\n",
    "      onNarrate: handleNarrateSelection,\n",
    "      onPrint: handlePrintSelection,\n",
    "      onImage: handleImageSelection,\n",
    "    });\n",
]
if linhas[751:758] != esperado_d:
    raise SystemExit("ERRO: bloco D (attachSelectionToolbar) não bateu com o esperado nas linhas 752-758.")
novo_d = bloco("""    const detachSelectionToolbar = attachSelectionToolbar(readContent, {
      onShare: handleShareSelection,
      onExplain: handleExplainSelection,
      onNarrate: handleNarrateSelection,
      onPrint: handlePrintSelection,
      onImage: handleImageSelection,
      onFullExplain: handleFullExplainSelection,
      onReady: (fn) => { showToolbarForVerse = fn; },
    });""")
linhas[751:758] = novo_d

# --- Edição C: nova função handleFullExplainSelection, antes de handlePrintSelection (linha 683) ---
if linhas[682] != "    function handlePrintSelection(text) {\n":
    raise SystemExit("ERRO: linha 683 não é o início esperado de handlePrintSelection.")
nova_funcao = bloco("""    function handleFullExplainSelection(text, context) {
      if (context && typeof context.openFullExplanation === 'function') {
        context.openFullExplanation();
      } else {
        toast.info('Toque em um único versículo para ver a explicação completa.');
      }
    }

""")
linhas[682:682] = nova_funcao

# --- Edição B: corpo do click handler do versículo (linhas 127-166) ---
esperado_click_inicio = "      p.addEventListener('click', () => {\n"
esperado_click_fim = "      });\n"
if linhas[126] != esperado_click_inicio:
    raise SystemExit(f"ERRO: linha 127 inesperada: {linhas[126]!r}")
if linhas[165] != esperado_click_fim:
    raise SystemExit(f"ERRO: linha 166 inesperada: {linhas[165]!r}")

novo_click = bloco("""      p.addEventListener('click', () => {
        // Evita conflitar com uma seleção de texto (arrastar para
        // selecionar um trecho).
        if (window.getSelection().toString().length > 0) return;

        // Marca o versículo selecionado.
        verseEls.forEach((v, i) => {
          v.classList.toggle('selected', i === idx);
        });

        // Registra este versículo como lido.
        // O repositório evita contar o mesmo versículo duas vezes.
        statsRepository.markVerseRead(
          bookIndex,
          chapterIndex,
          idx
        );

        // Ao tocar no texto, apenas seleciona o versículo.
        readingIndex = idx;

        // Em vez de abrir a explicação direto, mostra a barra de ações
        // (a mesma usada ao selecionar um trecho), com um botão pra abrir
        // a explicação completa quando o usuário realmente quiser.
        if (showToolbarForVerse) {
          showToolbarForVerse(p.getBoundingClientRect(), text, {
            openFullExplanation: () => showVerseExplanation({
              bookIndex,
              bookName: book.name,
              chapterIndex,
              verseIndex: idx,
              verseText: text,
              onHighlightChange: (colorId) => {
                if (colorId) {
                  const corInfo = HIGHLIGHT_COLORS.find((c) => c.id === colorId);
                  p.style.background = corInfo ? corInfo.hex + '33' : '';
                } else {
                  p.style.background = '';
                }
              }
            }),
          });
        }
      });""")
linhas[126:166] = novo_click

# --- Edição A: declarar showToolbarForVerse antes do forEach (após linha 114) ---
if linhas[113] != "    const verseEls = [];\n":
    raise SystemExit(f"ERRO: linha 114 inesperada: {linhas[113]!r}")
linhas[114:114] = bloco("    let showToolbarForVerse = null;")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(linhas)

print("reader.js atualizado com sucesso")
