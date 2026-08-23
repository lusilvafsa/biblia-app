// Tela: lista de livros da Bíblia, com seletor de versão e abas
// Antigo Testamento / Novo Testamento.
import { qs, qsa, el } from '../../utils/dom.js';
import { toast } from '../../utils/toast.js';
import { navigateTo } from '../../router.js';
import { getAllBooks } from '../../data-access/bibleRepository.js';
import { BIBLE_VERSIONS } from '../../../data/bibleVersions.js';
import { getBibleVersion, setBibleVersion } from '../../state/bibleVersion.js';

function versionSelectorHtml() {
  const current = getBibleVersion();
  const buttons = BIBLE_VERSIONS.map((v) => {
    const active = v.id === current ? 'active' : '';
    const dimmed = v.available ? '' : 'version-pill--unavailable';
    return `<button type="button" class="version-pill ${active} ${dimmed}" data-version="${v.id}">${v.label}</button>`;
  }).join('');
  return `<div class="version-selector" id="versionSelector">${buttons}</div>`;
}

function template() {
  return `
    ${versionSelectorHtml()}
    <div class="bible-nav-tabs">
      <button class="bible-nav-tab active" data-testament="old">Antigo Test.</button>
      <button class="bible-nav-tab" data-testament="new">Novo Test.</button>
    </div>
    <div id="bookListOld" class="book-list"></div>
    <div id="bookListNew" class="book-list" style="display:none"></div>
  `;
}

function renderBookButtons(listEl, books) {
  listEl.innerHTML = '';
  books.forEach((book) => {
    const item = el(
      'button',
      { className: 'book-item', onClick: () => navigateTo(`/biblia/${book.index}`) },
      [
        document.createTextNode(book.name),
        el('span', {}, `${book.chapterCount} cap.`),
      ]
    );
    listEl.appendChild(item);
  });
}

function attachVersionSelector(container, onSwitched) {
  qsa('.version-pill', container).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.version;
      if (id === getBibleVersion()) return;
      const meta = BIBLE_VERSIONS.find((v) => v.id === id);
      if (!meta.available) {
        toast.info(`${meta.name}: ${meta.note}`);
        return;
      }
      setBibleVersion(id);
      onSwitched();
    });
  });
}

export const bookListPage = {
  async render(container) {
    container.innerHTML = '<div class="state-message">Carregando livros...</div>';

    let books;
    try {
      books = await getAllBooks();
    } catch (err) {
      container.innerHTML = `
        <div class="state-message error">Não foi possível carregar a Bíblia. Verifique sua conexão e tente novamente.</div>
        ${versionSelectorHtml()}
      `;
      attachVersionSelector(container, () => bookListPage.render(container));
      return;
    }

    container.innerHTML = template();
    const oldList = qs('#bookListOld', container);
    const newList = qs('#bookListNew', container);
    renderBookButtons(oldList, books.filter((b) => b.testament === 'old'));
    renderBookButtons(newList, books.filter((b) => b.testament === 'new'));

    qsa('.bible-nav-tab', container).forEach((tab) => {
      tab.addEventListener('click', () => {
        qsa('.bible-nav-tab', container).forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const isOld = tab.dataset.testament === 'old';
        oldList.style.display = isOld ? 'flex' : 'none';
        newList.style.display = isOld ? 'none' : 'flex';
      });
    });

    attachVersionSelector(container, () => bookListPage.render(container));
  },
};
