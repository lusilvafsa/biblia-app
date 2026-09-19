path = 'www/js/features/home/home.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1) Importar getChapter também (getBook já está importado)
ancora_import = "import { getBook } from '../../data-access/bibleRepository.js';"
nova_import = "import { getBook, getChapter } from '../../data-access/bibleRepository.js';"

qtd1 = content.count(ancora_import)
if qtd1 != 1:
    raise SystemExit(f"ERRO: ancora de import encontrada {qtd1} vezes (esperado 1).")
content = content.replace(ancora_import, nova_import)

# 2) Adicionar o slot do Salmo do Dia no template, logo depois do verse-card
ancora_html = """      </div>
    </div>

    <div class="section-title">Louvor do Dia</div>"""

nova_html = """      </div>
    </div>

    <div id="psalmOfDaySlot"></div>

    <div class="section-title">Louvor do Dia</div>"""

qtd2 = content.count(ancora_html)
if qtd2 != 1:
    raise SystemExit(f"ERRO: ancora do html encontrada {qtd2} vezes (esperado 1).")
content = content.replace(ancora_html, nova_html)

# 3) Adicionar a função que busca e mostra o Salmo do dia
ancora_funcao = "async function renderContinueReadingCard(container) {"

nova_funcao = """function getTodaysPsalmChapter() {
  const inicioDoAno = new Date(new Date().getFullYear(), 0, 0);
  const diffMs = new Date() - inicioDoAno;
  const diaDoAno = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diaDoAno % 150; // Salmos tem 150 capítulos, índice 0-149
}

async function renderPsalmOfDay(container) {
  const slot = qs('#psalmOfDaySlot', container);
  if (!slot) return;

  const chapterIndex = getTodaysPsalmChapter();

  try {
    const verses = await getChapter(18, chapterIndex); // 18 = Salmos
    if (!document.body.contains(slot)) return;

    slot.innerHTML = `
      <div class="section-title">Salmo do Dia</div>
      <div class="prayer-card" id="btnOpenPsalm" style="cursor:pointer;">
        <h4>📖 Salmos ${chapterIndex + 1}</h4>
        <p>${verses[0]}</p>
      </div>
    `;

    qs('#btnOpenPsalm', slot).addEventListener('click', () => {
      navigateTo(`/biblia/18/${chapterIndex}/versiculo/0`);
    });
  } catch (_e) {
    // dado indisponível — não quebra a Home por causa disso
  }
}

async function renderContinueReadingCard(container) {"""

qtd3 = content.count(ancora_funcao)
if qtd3 != 1:
    raise SystemExit(f"ERRO: ancora da funcao encontrada {qtd3} vezes (esperado 1).")
content = content.replace(ancora_funcao, nova_funcao)

# 4) Chamar a função junto com o card "Continue de onde parou"
ancora_chamada = "    updateVerseDisplay(container);\n    renderContinueReadingCard(container);"
nova_chamada = "    updateVerseDisplay(container);\n    renderContinueReadingCard(container);\n    renderPsalmOfDay(container);"

qtd4 = content.count(ancora_chamada)
if qtd4 != 1:
    raise SystemExit(f"ERRO: ancora da chamada encontrada {qtd4} vezes (esperado 1).")
content = content.replace(ancora_chamada, nova_chamada)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("home.js atualizado com sucesso (Salmo do Dia)")
