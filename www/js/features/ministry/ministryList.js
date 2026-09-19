// Tela: Guia de Ministração — lista de temas com esboço pronto para
// estudo, devocional ou pregação curta, com busca/filtro por tema. Para
// temas fora da lista curada, o Assistente Bíblico gera um esboço na hora
// — e o resultado passa a aparecer na lista, marcado como gerado por IA.
import { qs, el } from '../../utils/dom.js';
import { icons } from '../../components/icons.js';
import { navigateTo } from '../../router.js';
import { openExternalExplanation } from '../../utils/externalExplain.js';
import { MINISTRY_OUTLINES } from '../../../data/ministryOutlines.js';
import { generatedOutlinesRepository } from '../../data-access/generatedOutlinesRepository.js';
import { supabase } from '../../supabaseClient.js';
import { usuarioAtual } from '../../supabaseAuth.js';

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos p/ busca mais tolerante
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatarResposta(texto) {
  return String(texto || '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim().length > 0)
    .map((linha) => {
      const escapada = escaparHtml(linha.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p>${escapada}</p>`;
    })
    .join('');
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

export const ministryListPage = {
  render(container) {
    container.innerHTML = template();
    const input = qs('#ministrySearchInput', container);
    const results = qs('#ministryResults', container);

    function renderGeneratedCard(chave, item) {
      return el(
        'button',
        { className: 'plan-card', onClick: () => showGeneratedOutline(chave, item) },
        [
          el('div', { className: 'plan-icon-box', html: icons.sparkles || '✨' }),
          el('div', { className: 'plan-info' }, [
            el('h4', {}, item.tema),
            el('p', {}, 'Gerado pelo Assistente'),
          ]),
        ]
      );
    }

    function showGeneratedOutline(chave, item) {
      results.innerHTML = '';

      const voltarBtn = el('button', { className: 'read-btn', style: 'margin-bottom:16px;' }, '◀ Voltar aos temas');
      voltarBtn.addEventListener('click', () => renderList(input.value));

      const painel = el('div', { className: 'verse-explain-fallback', style: 'text-align:left; padding:8px 4px;' });
      painel.innerHTML = `<h3 style="color:var(--gold); margin-bottom:12px;">✨ ${item.tema}</h3>` + formatarResposta(item.mensagem);

      results.appendChild(voltarBtn);
      results.appendChild(painel);
    }

    function renderAiGenerateButton(query) {
      const chave = normalize(query);
      const wrapper = el('div', { className: 'verse-explain-fallback', style: 'padding:24px 8px;' }, [
        el('p', {}, `Ainda não temos um esboço curado para "${query}".`),
      ]);

      const aiBtn = el('button', {
        className: 'btn-primary',
        html: `${icons.sparkles || '✨'} Gerar esboço com o Assistente`,
      });

      const resultEl = el('div', { style: 'text-align:left;' });
      resultEl.hidden = true;

      const searchBtn = el('button', {
        onClick: () => openExternalExplanation(`esboço de estudo bíblico sobre ${query}`),
        html: `${icons.explain} Buscar sobre "${query}"`,
      });

      wrapper.appendChild(aiBtn);
      wrapper.appendChild(resultEl);
      wrapper.appendChild(searchBtn);

      aiBtn.addEventListener('click', async () => {
        const usuario = usuarioAtual();

        if (!usuario) {
          resultEl.hidden = false;
          resultEl.innerHTML = '<p>Entre na sua conta para usar o Assistente Bíblico.</p>';
          return;
        }

        aiBtn.disabled = true;
        aiBtn.textContent = 'Gerando...';
        resultEl.hidden = false;
        resultEl.innerHTML = '<p>Consultando o Assistente Bíblico...</p>';

        try {
          const { data, error } = await supabase.functions.invoke('assistente-biblico', {
            body: { mensagem: `Crie uma ministração sobre o tema: ${query}` },
          });

          if (error || !data?.sucesso || !data?.mensagem) {
            throw new Error(data?.erro || error?.message || 'Sem resposta.');
          }

          generatedOutlinesRepository.save(chave, query, data.mensagem);
          input.value = '';
          renderList('');
        } catch (_e) {
          resultEl.innerHTML = '<p>Não foi possível gerar o esboço agora. Tente novamente.</p>';
          aiBtn.disabled = false;
          aiBtn.innerHTML = `${icons.sparkles || '✨'} Gerar esboço com o Assistente`;
        }
      });

      return wrapper;
    }

    function renderList(query) {
      const q = normalize(query.trim());
      results.innerHTML = '';

      const curados = q
        ? MINISTRY_OUTLINES.filter((item) => normalize(item.tema).includes(q))
        : MINISTRY_OUTLINES;

      const geradosMap = generatedOutlinesRepository.getAll();
      const gerados = Object.entries(geradosMap).filter(([chave, item]) =>
        q ? normalize(item.tema).includes(q) : true
      );

      if (curados.length === 0 && gerados.length === 0) {
        results.appendChild(renderAiGenerateButton(query.trim()));
        return;
      }

      curados.forEach((item) => results.appendChild(renderThemeCard(item)));
      gerados.forEach(([chave, item]) => results.appendChild(renderGeneratedCard(chave, item)));
    }

    input.addEventListener('input', () => renderList(input.value));
    renderList('');
  },
};
