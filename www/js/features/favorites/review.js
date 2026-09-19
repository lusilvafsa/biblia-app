// Tela unificada: favoritos, anotações e grifos, com filtro por tipo.
// Substitui as antigas telas separadas de Favoritos e Anotações.
import { navigateTo } from '../../router.js';
import { favoritesRepository } from '../../data-access/favoritesRepository.js';
import { highlightRepository, HIGHLIGHT_COLORS } from '../../data-access/highlightRepository.js';
import { getBook, getChapter } from '../../data-access/bibleRepository.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function corDoGrifo(colorId) {
  return HIGHLIGHT_COLORS.find((c) => c.id === colorId) || null;
}

async function montarLista() {
  const favoritosItens = favoritesRepository.getAll();
  const grifos = highlightRepository.getAll();

  const mapa = new Map();

  favoritosItens.forEach((item) => {
    const chave = `${item.bookIndex}-${item.chapterIndex}-${item.verseIndex}`;
    mapa.set(chave, {
      bookIndex: item.bookIndex,
      chapterIndex: item.chapterIndex,
      verseIndex: item.verseIndex,
      reference: item.reference,
      text: item.text,
      isFavorite: item.favorite === true,
      note: item.note || null,
      highlightColor: null,
    });
  });

  const pendentes = [];
  Object.entries(grifos).forEach(([chave, colorId]) => {
    if (mapa.has(chave)) {
      mapa.get(chave).highlightColor = colorId;
    } else {
      const [b, c, v] = chave.split('-').map(Number);
      mapa.set(chave, {
        bookIndex: b,
        chapterIndex: c,
        verseIndex: v,
        reference: null,
        text: null,
        isFavorite: false,
        note: null,
        highlightColor: colorId,
      });
      pendentes.push({ chave, b, c, v });
    }
  });

  const livrosCapitulos = new Map();
  pendentes.forEach(({ b, c }) => livrosCapitulos.set(`${b}-${c}`, { b, c }));

  for (const { b, c } of livrosCapitulos.values()) {
    try {
      const [book, verses] = await Promise.all([getBook(b), getChapter(b, c)]);
      pendentes
        .filter((p) => p.b === b && p.c === c)
        .forEach(({ chave, v }) => {
          const item = mapa.get(chave);
          item.reference = `${book.name} ${c + 1}:${v + 1}`;
          item.text = verses[v] || '';
        });
    } catch (_e) {
      // livro/capítulo indisponível — ignora esse item silenciosamente
    }
  }

  return Array.from(mapa.values()).filter((item) => item.text);
}

function aplicarFiltro(lista, filtro) {
  if (filtro === 'favoritos') return lista.filter((i) => i.isFavorite);
  if (filtro === 'anotacoes') return lista.filter((i) => i.note);
  if (filtro === 'grifos') return lista.filter((i) => i.highlightColor);
  return lista;
}

export const reviewPage = {
  async render(container) {
    container.innerHTML = '<div class="state-message">Carregando...</div>';

    let filtro = 'todos';
    const todos = await montarLista();

    function renderLista() {
      const lista = aplicarFiltro(todos, filtro);

      const cardsHtml = lista.length
        ? lista.map((item) => {
            const cor = corDoGrifo(item.highlightColor);
            return `
              <article class="favorite-card" ${cor ? `style="border-left:4px solid ${cor.hex}"` : ''}>
                <button type="button" class="favorite-verse" data-book="${item.bookIndex}" data-chapter="${item.chapterIndex}" data-verse="${item.verseIndex}">
                  <strong>${escapeHtml(item.reference)}</strong>
                  <span>${escapeHtml(item.text)}</span>
                </button>
                <div class="favorite-card-tags">
                  ${item.isFavorite ? '<span class="tag-chip">❤️ Favorito</span>' : ''}
                  ${item.note ? '<span class="tag-chip">📝 Anotação</span>' : ''}
                  ${cor ? `<span class="tag-chip" style="color:${cor.hex}">● ${cor.label}</span>` : ''}
                </div>
                ${item.note ? `<div class="favorite-note"><p>${escapeHtml(item.note)}</p></div>` : ''}
              </article>
            `;
          }).join('')
        : `
          <div class="favorites-empty">
            <div class="favorites-empty-icon">📚</div>
            <h3>Nada por aqui ainda</h3>
            <p>Marque um versículo como favorito, adicione uma anotação ou grife com uma cor para vê-lo listado aqui.</p>
          </div>
        `;

      container.innerHTML = `
        <section class="favorites-page">
          <div class="favorites-header">
            <div>
              <h2>📚 Meus Marcadores</h2>
              <p>Favoritos, anotações e grifos num só lugar</p>
            </div>
          </div>

          <div class="bible-nav-tabs">
            <button class="bible-nav-tab ${filtro === 'todos' ? 'active' : ''}" data-filtro="todos">Todos</button>
            <button class="bible-nav-tab ${filtro === 'favoritos' ? 'active' : ''}" data-filtro="favoritos">Favoritos</button>
            <button class="bible-nav-tab ${filtro === 'anotacoes' ? 'active' : ''}" data-filtro="anotacoes">Anotações</button>
            <button class="bible-nav-tab ${filtro === 'grifos' ? 'active' : ''}" data-filtro="grifos">Grifos</button>
          </div>

          <div class="favorites-list">
            ${cardsHtml}
          </div>
        </section>
      `;

      container.querySelectorAll('[data-filtro]').forEach((btn) => {
        btn.addEventListener('click', () => {
          filtro = btn.dataset.filtro;
          renderLista();
        });
      });

      container.querySelectorAll('.favorite-verse').forEach((btn) => {
        btn.addEventListener('click', () => {
          const book = Number(btn.dataset.book);
          const chapter = Number(btn.dataset.chapter);
          const verse = Number(btn.dataset.verse);

          navigateTo(`/biblia/${book}/${chapter}`);

          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-verse', { detail: { verseIndex: verse } }));
          }, 150);
        });
      });
    }

    renderLista();
  },
};
