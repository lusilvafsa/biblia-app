// Tela: lista de livros da Bíblia, com exibição em botões (grade) ou lista,
// seletor de versão, busca rápida e abas Antigo / Novo Testamento.
import { qs, qsa, el } from '../../utils/dom.js';
import { toast } from '../../utils/toast.js';
import { navigateTo } from '../../router.js';
import { getAllBooks } from '../../data-access/bibleRepository.js';
import { BIBLE_VERSIONS } from '../../../data/bibleVersions.js';
import { getBibleVersion, setBibleVersion } from '../../state/bibleVersion.js';
import { icons } from '../../components/icons.js';

const STORAGE_LAYOUT_KEY = 'biblia_layout_livros'; // 'grid' (botões) ou 'list'

function getSavedLayout() {
  try {
    return localStorage.getItem(STORAGE_LAYOUT_KEY) || 'grid';
  } catch {
    return 'grid';
  }
}

function setSavedLayout(layout) {
  try {
    localStorage.setItem(STORAGE_LAYOUT_KEY, layout);
  } catch {}
}

function normalizeText(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function versionSelectorHtml() {
  const current = getBibleVersion();
  const buttons = BIBLE_VERSIONS.map((v) => {
    const active = v.id === current ? 'active' : '';
    const dimmed = v.available ? '' : 'version-pill--unavailable';
    return `<button type="button" class="version-pill ${active} ${dimmed}" data-version="${v.id}">${v.label}</button>`;
  }).join('');
  return `<div class="version-selector" id="versionSelector">${buttons}</div>`;
}

function template(currentLayout = 'grid') {
  return `
    ${versionSelectorHtml()}
    <div class="bible-nav-header">
      <div class="bible-nav-tabs" role="tablist">
        <button class="bible-nav-tab active" data-testament="old" role="tab" aria-selected="true">
          <span>Antigo Test.</span>
          <span class="bible-nav-tab-badge">39</span>
        </button>
        <button class="bible-nav-tab" data-testament="new" role="tab" aria-selected="false">
          <span>Novo Test.</span>
          <span class="bible-nav-tab-badge">27</span>
        </button>
      </div>
      <div class="bible-layout-toggle" role="group" aria-label="Modo de visualização dos livros">
        <button type="button" class="bible-layout-btn ${currentLayout === 'grid' ? 'active' : ''}" data-layout="grid" title="Exibir em botões" aria-label="Exibir em botões">
          ${icons.grid}
        </button>
        <button type="button" class="bible-layout-btn ${currentLayout === 'list' ? 'active' : ''}" data-layout="list" title="Exibir em lista" aria-label="Exibir em lista">
          ${icons.list}
        </button>
      </div>
    </div>

    <div class="book-search-bar" role="search">
      <span class="book-search-icon" aria-hidden="true">${icons.search}</span>
      <input type="text" class="book-search-input" id="bookSearchInput" placeholder="Buscar livro (ex: Salmos, Mateus, Gn)..." aria-label="Buscar livro na lista">
      <button type="button" class="book-search-clear" id="bookSearchClear" style="display:none" aria-label="Limpar busca">
        ${icons.close}
      </button>
    </div>

    <div id="bookListOld" class="book-grid ${currentLayout === 'list' ? 'is-list-view' : ''}" role="region" aria-label="Livros do Antigo Testamento"></div>
    <div id="bookListNew" class="book-grid ${currentLayout === 'list' ? 'is-list-view' : ''}" role="region" aria-label="Livros do Novo Testamento" style="display:none"></div>
    <div id="bookSearchEmpty" class="book-search-empty" style="display:none">Nenhum livro encontrado com esse termo.</div>
  `;
}

function renderBookButtons(listEl, books) {
  listEl.innerHTML = '';
  books.forEach((book) => {
    const item = el(
      'button',
      {
        className: 'book-btn book-item',
        type: 'button',
        title: `${book.name} (${book.chapterCount} cap.)`,
        'aria-label': `${book.name}, ${book.chapterCount} capítulos`,
        onClick: () => navigateTo(`/biblia/${book.index}`),
      },
      [
        el('span', { className: 'book-btn-abbrev' }, (book.abbrev || '').toUpperCase()),
        el('span', { className: 'book-btn-name' }, book.name),
        el('span', { className: 'book-btn-count' }, `${book.chapterCount} cap.`),
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

    const currentLayout = getSavedLayout();
    container.innerHTML = template(currentLayout);

    const oldBooks = books.filter((b) => b.testament === 'old');
    const newBooks = books.filter((b) => b.testament === 'new');

    const oldList = qs('#bookListOld', container);
    const newList = qs('#bookListNew', container);
    const emptyState = qs('#bookSearchEmpty', container);
    const searchInput = qs('#bookSearchInput', container);
    const clearBtn = qs('#bookSearchClear', container);

    let activeTestament = 'old';

    function updateLists(filteredOld = oldBooks, filteredNew = newBooks) {
      renderBookButtons(oldList, filteredOld);
      renderBookButtons(newList, filteredNew);

      const hasOld = filteredOld.length > 0;
      const hasNew = filteredNew.length > 0;

      if (!hasOld && !hasNew) {
        oldList.style.display = 'none';
        newList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';

      // Se a busca encontrar livros apenas no outro testamento, seleciona a aba correspondente
      if (activeTestament === 'old' && !hasOld && hasNew) {
        setTestament('new');
        return;
      } else if (activeTestament === 'new' && !hasNew && hasOld) {
        setTestament('old');
        return;
      }

      oldList.style.display = activeTestament === 'old' ? '' : 'none';
      newList.style.display = activeTestament === 'new' ? '' : 'none';
    }

    function setTestament(testament) {
      activeTestament = testament;
      qsa('.bible-nav-tab', container).forEach((tab) => {
        const isThis = tab.dataset.testament === testament;
        tab.classList.toggle('active', isThis);
        tab.setAttribute('aria-selected', String(isThis));
      });
      oldList.style.display = testament === 'old' ? '' : 'none';
      newList.style.display = testament === 'new' ? '' : 'none';
    }

    function setLayout(layout) {
      setSavedLayout(layout);
      const isList = layout === 'list';
      oldList.classList.toggle('is-list-view', isList);
      newList.classList.toggle('is-list-view', isList);
      qsa('.bible-layout-btn', container).forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.layout === layout);
      });
    }

    // Inicializa renderização dos botões de livros
    updateLists();

    // Alternar abas Antigo / Novo Testamento
    qsa('.bible-nav-tab', container).forEach((tab) => {
      tab.addEventListener('click', () => {
        setTestament(tab.dataset.testament);
      });
    });

    // Alternar modo de visualização (Botões em grade vs Lista)
    qsa('.bible-layout-btn', container).forEach((btn) => {
      btn.addEventListener('click', () => {
        setLayout(btn.dataset.layout);
      });
    });

    // Busca rápida de livros
    function handleSearch() {
      const query = normalizeText(searchInput.value);
      clearBtn.style.display = query ? 'flex' : 'none';

      if (!query) {
        updateLists(oldBooks, newBooks);
        return;
      }

      const match = (b) =>
        normalizeText(b.name).includes(query) ||
        normalizeText(b.abbrev).includes(query);

      const filteredOld = oldBooks.filter(match);
      const filteredNew = newBooks.filter(match);
      updateLists(filteredOld, filteredNew);
    }

    searchInput.addEventListener('input', handleSearch);

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      handleSearch();
    });

    attachVersionSelector(container, () => bookListPage.render(container));
  },
};
