// Painel de estudo de um capítulo inteiro, usando o Assistente Bíblico.
// Reaproveita os mesmos estilos visuais do painel de explicação de versículo.
import { icons } from '../../components/icons.js';
import { supabase } from '../../supabaseClient.js';
import { usuarioAtual } from '../../supabaseAuth.js';
import { getChapterSummary } from '../../../data/chapterSummaries.js';

let overlayEl = null;

function removePanel() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
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

export function showChapterExplanation({ bookName, chapterNumber, bookIndex, chapterIndex }) {
  removePanel();

  const ref = `${bookName} ${chapterNumber}`;

  overlayEl = document.createElement('div');
  overlayEl.className = 'verse-explain-overlay';
  overlayEl.innerHTML = `
    <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Estudo de ${ref}">
      <div class="verse-explain-handle"></div>
      <button class="verse-explain-close" id="btnCloseChapterExplain" aria-label="Fechar">${icons.close}</button>
      <div class="verse-explain-ref">✨ Estudo de ${ref}</div>
      <div id="chapterExplainResult"><p>Consultando o Assistente Bíblico...</p></div>
    </div>
  `;

  document.body.appendChild(overlayEl);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) removePanel();
  });
  overlayEl.querySelector('#btnCloseChapterExplain').addEventListener('click', removePanel);

  const resultEl = overlayEl.querySelector('#chapterExplainResult');

  const mostrarResumo = (s) => {
    const itens = (Array.isArray(s.pontos) ? s.pontos : []).map((p) => `<li>${escaparHtml(p)}</li>`).join('');
    resultEl.innerHTML =
      `<p><strong>Resumo</strong></p><p>${escaparHtml(s.resumo || '')}</p>` +
      (itens ? `<p><strong>Pontos principais</strong></p><ul style="margin:0 0 12px;padding-left:20px;">${itens}</ul>` : '') +
      (s.aplicacao ? `<p><strong>Aplicação</strong></p><p>${escaparHtml(s.aplicacao)}</p>` : '') +
      '<button type="button" class="tool-btn" id="btnMaisDetalhes" style="width:100%;padding:12px 10px;margin-top:8px;">Pedir um estudo mais detalhado ao Assistente</button>' +
      '<p style="font-size:12px;opacity:.7;margin-top:8px;">O estudo detalhado é gerado por inteligência artificial e usa uma das suas perguntas do dia.</p>';
    const botao = resultEl.querySelector('#btnMaisDetalhes');
    if (botao) {
      botao.addEventListener('click', async () => {
        resultEl.innerHTML = '<p>Consultando o Assistente Bíblico...</p>';
        await pedirAoAssistente();
        if (/Não foi possível obter o estudo|Entre na sua conta/.test(resultEl.textContent || '')) {
          const aviso = resultEl.innerHTML;
          mostrarResumo(s);
          resultEl.insertAdjacentHTML('beforeend', '<div style="margin-top:10px;opacity:.85;">' + aviso + '</div>');
        }
      });
    }
  };

  const pedirAoAssistente = async () => {
    const usuario = usuarioAtual();

    if (!usuario) {
      resultEl.innerHTML = '<p>Entre na sua conta para usar o Assistente Bíblico.</p>';
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('assistente-biblico', {
        body: {
          mensagem: `Faça um breve estudo bíblico do capítulo ${ref}. Traga o contexto do capítulo, de 3 a 5 ensinamentos principais e uma aplicação prática.`,
          tipo: 'capitulo',
          chave: `${bookName}_${chapterNumber}`,
        },
      });

      if (error || !data?.sucesso || !data?.mensagem) {
        throw new Error(data?.erro || error?.message || 'Sem resposta.');
      }

      resultEl.innerHTML = formatarResposta(data.mensagem);
    } catch (err) {
      resultEl.innerHTML = '<p>Não foi possível obter o estudo agora. Tente novamente.</p>';
    }
  };

  const resumoPronto = typeof bookIndex === 'number' && typeof chapterIndex === 'number'
    ? getChapterSummary(bookIndex, chapterIndex)
    : null;
  if (resumoPronto) mostrarResumo(resumoPronto);
  else pedirAoAssistente();
}
