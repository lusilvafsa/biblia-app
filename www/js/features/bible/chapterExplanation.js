// Painel de estudo de um capítulo inteiro, usando o Assistente Bíblico.
// Reaproveita os mesmos estilos visuais do painel de explicação de versículo.
import { icons } from '../../components/icons.js';
import { supabase } from '../../supabaseClient.js';
import { usuarioAtual } from '../../supabaseAuth.js';

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

export function showChapterExplanation({ bookName, chapterNumber }) {
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

  (async () => {
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
  })();
}
