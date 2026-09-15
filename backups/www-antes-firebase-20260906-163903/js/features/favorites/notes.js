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

export const notesPage = {
  render(container) {
    const notes = favoritesRepository.getNotes();

    container.innerHTML = `
      <section class="favorites-page">

        <div class="favorites-header">
          <div>
            <h2>📝 Anotações</h2>
            <p>Suas anotações bíblicas</p>
          </div>
        </div>

        ${
          notes.length === 0
            ? `
              <div class="favorites-empty">
                <div class="favorites-empty-icon">📝</div>
                <h3>Nenhuma anotação ainda</h3>
                <p>
                  Abra um versículo, toque nele e use
                  <strong>Editar anotação</strong> para criar uma anotação.
                </p>
              </div>
            `
            : `
              <div class="favorites-section">
                <h3>📝 Minhas anotações</h3>

                <div class="favorites-list">
                  ${notes.map(item => `
                    <article class="favorite-card note-card">

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

                      <div class="favorite-note">
                        <strong>📝 Anotação</strong>
                        <p>${escapeHtml(item.note)}</p>
                      </div>

                      <div class="favorite-card-actions">

                        <button
                          type="button"
                          class="favorite-note-btn"
                          data-note-id="${escapeHtml(item.id)}"
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type="button"
                          class="favorite-remove-note-btn"
                          data-remove-note-id="${escapeHtml(item.id)}"
                        >
                          🗑️ Apagar anotação
                        </button>

                      </div>

                    </article>
                  `).join('')}
                </div>
              </div>
            `
        }

      </section>
    `;

    function getItemById(id) {
      return favoritesRepository.getAll()
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

      render(container);
    }

    container.querySelectorAll('.favorite-verse').forEach(button => {
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

    container.querySelectorAll('.favorite-note-btn').forEach(button => {
      button.addEventListener('click', () => {
        openNoteEditor(getItemById(button.dataset.noteId));
      });
    });

    container.querySelectorAll('.favorite-remove-note-btn').forEach(button => {
      button.addEventListener('click', () => {
        const item = getItemById(button.dataset.removeNoteId);
        if (!item) return;

        favoritesRepository.removeNote(
          item.bookIndex,
          item.chapterIndex,
          item.verseIndex
        );

        render(container);
      });
    });
  }
};
