// Tela: Guia de Ministração — lista de temas com esboço pronto para
// estudo, devocional ou pregação curta, com busca/filtro por tema.
import { qs, el } from '../../utils/dom.js';
import { icons } from '../../components/icons.js';
import { navigateTo } from '../../router.js';
import { openExternalExplanation } from '../../utils/externalExplain.js';
import { MINISTRY_OUTLINES } from '../../../data/ministryOutlines.js';

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos p/ busca mais tolerante
}

function template() {
  return `
    <p class="ministry-intro">Escolha um tema para ver uma passagem principal e um esboço pronto para conduzir um estudo, devocional ou pregação curta.</p>
    <div class="search-box">
      <label class="visually-hidden" for="ministrySearchInput">Buscar tema</label>
      <input type="text" class="search-input" id="ministrySearchInput" placeholder="Buscar ou digitar um tema (ex.: gratidão, ansiedade...)" autocomplete="off">
    </div>
    <div id="ministryResults"></div>
  `;
}

function renderThemeCard(item) {
  return el(
    'button',
    { className: 'plan-card', onClick: () => navigateTo(`/ministracao/${item.id}`) },
    [
      el('div', { className: 'plan-icon-box', html: icons.explain }),
      el('div', { className: 'plan-info' }, [
        el('h4', {}, item.tema),
        el('p', {}, item.versiculoPrincipal.ref),
      ]),
    ]
  );
}

function renderEmptyState(resultsEl, query) {
  resultsEl.innerHTML = '';
  const fallback = el('div', { className: 'verse-explain-fallback', style: 'padding:24px 8px;' }, [
    el('p', {}, `Ainda não temos um esboço pronto para "${query}".`),
    el('p', {}, 'Este app não tem um serviço de IA por trás (é 100% local, sem servidor), então não dá para criar um esboço novo na hora — mas você pode buscar conteúdo sobre esse tema para se preparar.'),
  ]);
  const searchBtn = el('button', {
    onClick: () => openExternalExplanation(`esboço de estudo bíblico sobre ${query}`),
    html: `${icons.explain} Buscar sobre "${query}"`,
  });
  fallback.appendChild(searchBtn);
  resultsEl.appendChild(fallback);
}

export const ministryListPage = {
  render(container) {
    container.innerHTML = template();
    const input = qs('#ministrySearchInput', container);
    const results = qs('#ministryResults', container);

    function renderList(query) {
      const q = normalize(query.trim());
      results.innerHTML = '';

      const matches = q
        ? MINISTRY_OUTLINES.filter((item) => normalize(item.tema).includes(q))
        : MINISTRY_OUTLINES;

      if (matches.length === 0) {
        renderEmptyState(results, query.trim());
        return;
      }
      matches.forEach((item) => results.appendChild(renderThemeCard(item)));
    }

    input.addEventListener('input', () => renderList(input.value));
    renderList('');
  },
};
