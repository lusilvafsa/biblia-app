/**
 * Tela: grade de versículos de um capítulo específico.
 *
 * Fluxo:
 * Livro -> Capítulos -> Versículos -> Leitura
 */

import { el } from '../../utils/dom.js';
import { navigateTo } from '../../router.js';
import { getBook, getChapter } from '../../data-access/bibleRepository.js';
import { setHeaderTitle } from '../../state/header.js';

export const verseGridPage = {
  async render(container, params) {
    const bookIndex = Number(params.book);
    const chapterIndex = Number(params.chapter);

    container.innerHTML =
      '<div class="state-message">Carregando versículos...</div>';

    let book;
    let verses;

    try {
      [book, verses] = await Promise.all([
        getBook(bookIndex),
        getChapter(bookIndex, chapterIndex),
      ]);
    } catch (err) {
      console.error('[verseGrid] erro ao carregar capítulo', err);

      container.innerHTML =
        '<div class="state-message error">Capítulo não encontrado.</div>';

      return;
    }

    setHeaderTitle(`${book.name} — Capítulo ${chapterIndex + 1}`);

    const grid = el('div', { className: 'verse-grid' });

    verses.forEach((_text, index) => {
      const verseIndex = index;

      grid.appendChild(
        el(
          'button',
          {
            className: 'verse-grid-btn',
            title: `Versículo ${verseIndex + 1}`,
            'aria-label': `Versículo ${verseIndex + 1}`,
            onClick: () =>
              navigateTo(
                `/biblia/${bookIndex}/${chapterIndex}/versiculo/${verseIndex}`
              ),
          },
          String(verseIndex + 1)
        )
      );
    });

    container.innerHTML = '';

    const title = el(
      'div',
      { className: 'verse-grid-title' },
      `Versículos — ${book.name} ${chapterIndex + 1}`
    );

    container.appendChild(title);
    container.appendChild(grid);
  },
};
