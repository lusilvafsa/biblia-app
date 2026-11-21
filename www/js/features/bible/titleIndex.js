// Índice global simplificado dos títulos bíblicos.
import { el } from '../../utils/dom.js';
import { navigateTo } from '../../router.js';
import { getTitleIndex, normalizeTitleSearch } from '../../data-access/titleRepository.js';

function titleButton(entry) {
  return el('button', {
    type: 'button',
    className: 'title-index-entry',
    dataset: { titleKey: entry.key },
    'aria-label': `${entry.title} — ${entry.reference}`,
  }, [
    el('span', { className: 'title-index-entry-main' }, [
      el('span', { className: 'title-index-entry-name' }, entry.title),
      el('span', { className: 'title-index-entry-reference' }, entry.reference),
    ]),
    el('span', { className: 'title-index-entry-arrow', 'aria-hidden': 'true' }, '›'),
  ]);
}

export const titleIndexPage = {
  async render(container, _params, isCurrent = () => true) {
    container.innerHTML = `
      <section class="title-index-page" aria-label="Índice de Títulos Bíblicos">
        <p class="title-index-intro">Encontre uma passagem e abra seu estudo ou a leitura bíblica.</p>
        <label class="title-index-search-label" for="titleIndexSearch">Pesquisar títulos, livros ou referências</label>
        <input id="titleIndexSearch" class="title-index-search" type="search" autocomplete="off" placeholder="Ex.: O Bom Samaritano, Lucas ou Lucas 10:25">
        <p class="title-index-result-count" aria-live="polite">Carregando os títulos…</p>
        <div id="titleIndexList" class="title-index-list"></div>
      </section>`;

    const search = container.querySelector('#titleIndexSearch');
    const list = container.querySelector('#titleIndexList');
    const count = container.querySelector('.title-index-result-count');

    let data;
    try {
      data = await getTitleIndex();
    } catch (error) {
      if (!isCurrent()) return;
      count.textContent = error.message || 'Não foi possível carregar o índice.';
      count.classList.add('error');
      return;
    }

    if (!isCurrent()) return;

    function renderList(query = '') {
      const normalized = normalizeTitleSearch(query);
      const matches = normalized
        ? data.entries.filter((entry) =>
            normalized.split(/\s+/).every((token) => entry.searchText.includes(token)))
        : data.entries;

      list.replaceChildren();
      count.textContent = normalized
        ? `${matches.length} título(s) encontrado(s)`
        : `${matches.length} títulos disponíveis`;

      matches.forEach((entry) => list.appendChild(titleButton(entry)));

      if (!matches.length) {
        list.appendChild(el('p', { className: 'title-index-empty' },
          'Nenhum título corresponde à pesquisa.'));
      }
    }

    renderList();
    search.addEventListener('input', () => renderList(search.value));

    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-title-key]');
      if (!button) return;

      const entry = data.entries.find((item) => item.key === button.dataset.titleKey);
      if (!entry) return;

      navigateTo(`/indice-titulos/estudo/${entry.bookIndex}/${entry.chapterIndex}/${entry.startVerseIndex}`);
    });
  },
};
