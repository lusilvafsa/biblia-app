import { el } from '../../utils/dom.js';
import { navigateTo } from '../../router.js';
import { favoritesRepository } from '../../data-access/favoritesRepository.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const favoritesPage = {
  async render(container) {
    function render() {
      const items = favoritesRepository.getAll();

      const favorites = items.filter(item => item.favorite === true);
      const notes = items.filter(
        item => typeof item.note === 'string' && item.note.trim()
      );

      container.innerHTML = `
        <section class="favorites-page">

          <div class="favorites-header">
            <div>
              <h2>❤️ Favoritos</h2>
              <p>Seus versículos salvos</p>
            </div>
          </div>

          ${
            favorites.length === 0
              ? `
                <div class="favorites-empty">
                  <div class="favorites-empty-icon">♡</div>
                  <h3>Nenhum favorito ainda</h3>
                  <p>
                    Abra um capítulo da Bíblia, toque em um versículo
                    e marque-o como favorito.
                  </p>
                </div>
              `
              : `
                <div class="favorites-section">
                  <h3>❤️ Versículos favoritos</h3>

                  <div class="favorites-list">
                    ${favorites.map(item => `
                      <article class="favorite-card">

                        <button
                          type="button"
                          class="favorite-verse"
                          data-open-book="${item.bookIndex}"
                          data-open-chapter="${item.chapterIndex}"
                          data-open-verse="${item.verseIndex}"
                        >
                          <strong>${escapeHtml(item.reference)}</strong>
                          <span>${escapeHtml(item.text)}</span>
                        </button>

                        <div class="favorite-card-actions">

                          <button
                            type="button"
                            class="favorite-note-btn"
                            data-note-id="${escapeHtml(item.id)}"
                          >
                            📝 ${item.note ? 'Editar anotação' : 'Adicionar anotação'}
                          </button>

                          <button
                            type="button"
                            class="favorite-remove-btn"
                            data-remove-id="${escapeHtml(item.id)}"
                          >
                            ♥ Remover
                          </button>

                        </div>

                        ${
                          item.note
                            ? `
                              <div class="favorite-note">
                                <strong>📝 Anotação</strong>
                                <p>${escapeHtml(item.note)}</p>
                              </div>
                            `
                            : ''
                        }

                      </article>
                    `).join('')}
                  </div>
                </div>
              `
          }

        </section>
      `;

      bindEvents();
    }

    function getItemById(id) {
      return favoritesRepository
        .getAll()
        .find(item => item.id === id);
    }

    function openNoteEditor(item) {
      if (!item) return;

      const note = window.prompt(
        `Anotação para ${item.reference}:`,
        item.note || ''
      );

      if (note === null) return;

      favoritesRepository.saveNote(
        {
          bookIndex: item.bookIndex,
          bookName: item.bookName,
          chapterIndex: item.chapterIndex,
          verseIndex: item.verseIndex,
          verseText: item.text
        },
        note
      );

      render();
    }

    function bindEvents() {
      container
        .querySelectorAll('.favorite-verse')
        .forEach(button => {
          button.addEventListener('click', () => {
            const book = Number(button.dataset.openBook);
            const chapter = Number(button.dataset.openChapter);
            const verse = Number(button.dataset.openVerse);

            navigateTo(`/biblia/${book}/${chapter}`);

            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('open-verse', {
                  detail: { verseIndex: verse }
                })
              );
            }, 150);
          });
        });

      container
        .querySelectorAll('.favorite-remove-btn')
        .forEach(button => {
          button.addEventListener('click', () => {
            const item = getItemById(button.dataset.removeId);
            if (!item) return;

            favoritesRepository.removeFavorite(
              item.bookIndex,
              item.chapterIndex,
              item.verseIndex
            );

            render();
          });
        });

      container
        .querySelectorAll('.favorite-note-btn')
        .forEach(button => {
          button.addEventListener('click', () => {
            const item = getItemById(button.dataset.noteId);
            openNoteEditor(item);
          });
        });

      container
        .querySelectorAll('.favorite-remove-note-btn')
        .forEach(button => {
          button.addEventListener('click', () => {
            const item = getItemById(button.dataset.removeNoteId);
            if (!item) return;

            favoritesRepository.removeNote(
              item.bookIndex,
              item.chapterIndex,
              item.verseIndex
            );

            render();
          });
        });
    }

    render();

    return () => {
      container.innerHTML = '';
    };
  }
};
