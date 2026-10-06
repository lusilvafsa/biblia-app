import { icons } from '../../components/icons.js';
import { supabase } from '../../supabaseClient.js';
import {
  aguardarAuthInicial,
  usuarioAtual,
} from '../../supabaseAuth.js';

const SUGESTOES = {
  estudo: 'Explique esta passagem da Bíblia de forma simples, mostrando o contexto e a principal mensagem.',
  ministracao: 'Crie um esboço de ministração bíblica sobre fé, com introdução, pontos principais, referências bíblicas e conclusão.',
  tema: 'O que a Bíblia ensina sobre ansiedade? Apresente os principais ensinamentos e referências bíblicas.',
  oracao: 'Crie uma oração baseada na Bíblia para alguém que está passando por um momento difícil.',
};

function template() {
  return `
    <section class="page assistant-page">
      <div class="page-header">
        <div class="page-header-icon">
          ${icons.sparkles || '✨'}
        </div>

        <div>
          <h2>Assistente Bíblico</h2>
          <p>Estude a Bíblia, prepare ministrações e tire suas dúvidas.</p>
        </div>
      </div>

      <div class="menu-grid assistant-suggestions">
        <button type="button" class="menu-item" data-suggestion="estudo">
          <div class="menu-icon">📖</div>
          <div class="menu-title">Estudar a Bíblia</div>
          <div class="menu-desc">
            Explique passagens, capítulos, versículos e temas bíblicos.
          </div>
        </button>

        <button type="button" class="menu-item" data-suggestion="ministracao">
          <div class="menu-icon">🎤</div>
          <div class="menu-title">Criar ministração</div>
          <div class="menu-desc">
            Desenvolva temas, esboços, estudos e ministrações.
          </div>
        </button>

        <button type="button" class="menu-item" data-suggestion="tema">
          <div class="menu-icon">🔎</div>
          <div class="menu-title">Pesquisar tema</div>
          <div class="menu-desc">
            Encontre referências e compreenda o que a Bíblia ensina.
          </div>
        </button>

        <button type="button" class="menu-item" data-suggestion="oracao">
          <div class="menu-icon">🙏</div>
          <div class="menu-title">Criar oração</div>
          <div class="menu-desc">
            Crie orações baseadas na Bíblia e na sua necessidade.
          </div>
        </button>
      </div>

      <div class="card assistant-intro">
        <h3>Converse com o Assistente Bíblico</h3>

        <div id="assistantMessages" class="assistant-messages" aria-live="polite">
          <div class="assistant-message assistant-message--bot">
            <div class="assistant-message-role">Assistente Bíblico</div>
            <div class="assistant-message-text">
              Olá! Posso ajudar você a estudar a Bíblia, compreender passagens,
              pesquisar temas, preparar ministrações e criar orações.
            </div>
          </div>
        </div>

        <form id="assistantForm" class="assistant-form">
          <label class="visually-hidden" for="assistantInput">
            Pergunte ao Assistente Bíblico
          </label>

          <textarea
            id="assistantInput"
            class="assistant-input"
            rows="3"
            maxlength="8000"
            placeholder="Digite sua pergunta..."
            autocomplete="off"
          ></textarea>

          <div class="assistant-form-footer">
            <span id="assistantStatus" class="assistant-status"></span>

            <button
              type="submit"
              id="assistantSendButton"
              class="btn-primary"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownSeguro(texto) {
  const linhas = String(texto || '').split(/\r?\n/);
  const html = [];
  let listaAberta = false;

  const fecharLista = () => {
    if (listaAberta) {
      html.push('</ul>');
      listaAberta = false;
    }
  };

  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.trim();

    if (!linha) {
      fecharLista();
      continue;
    }

    if (linha.startsWith('### ')) {
      fecharLista();
      html.push(`<h4>${escaparHtml(linha.slice(4))}</h4>`);
      continue;
    }

    if (linha.startsWith('## ')) {
      fecharLista();
      html.push(`<h3>${escaparHtml(linha.slice(3))}</h3>`);
      continue;
    }

    if (linha.startsWith('# ')) {
      fecharLista();
      html.push(`<h3>${escaparHtml(linha.slice(2))}</h3>`);
      continue;
    }

    if (linha.startsWith('- ')) {
      if (!listaAberta) {
        html.push('<ul>');
        listaAberta = true;
      }

      let item = escaparHtml(linha.slice(2));
      item = item.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html.push(`<li>${item}</li>`);
      continue;
    }

    fecharLista();

    let paragrafo = escaparHtml(linha);
    paragrafo = paragrafo.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html.push(`<p>${paragrafo}</p>`);
  }

  fecharLista();

  return html.join('');
}

async function enviarDenuncia(pergunta, resposta, motivo) {
  const usuario = usuarioAtual();
  if (!usuario) throw new Error('Entre na sua conta para reportar.');
  const { error } = await supabase.from('assistente_denuncias').insert({
    user_id: usuario.id,
    pergunta: String(pergunta || '').slice(0, 8000),
    resposta: String(resposta || '').slice(0, 20000),
    motivo,
  });
  if (error) throw error;
}

function anexarAvisoIA(message, pergunta, resposta) {
  const rodape = document.createElement('div');
  rodape.style.cssText = 'margin-top:10px;font-size:12px;opacity:.75;';

  const linha = document.createElement('div');
  linha.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;';

  const aviso = document.createElement('span');
  aviso.textContent = 'Resposta gerada por IA. Pode conter erros. Confira na Bíblia.';

  const reportar = document.createElement('button');
  reportar.type = 'button';
  reportar.textContent = 'Reportar';
  reportar.style.cssText = 'background:transparent;border:0;padding:4px 0;color:var(--gold);font:inherit;text-decoration:underline;cursor:pointer;';

  const opcoes = document.createElement('div');
  opcoes.style.cssText = 'display:none;margin-top:8px;gap:6px;flex-wrap:wrap;align-items:center;';
  const pergunta_ = document.createElement('span');
  pergunta_.textContent = 'O que há de errado?';
  opcoes.appendChild(pergunta_);

  const motivos = [['ofensivo', 'Ofensiva'], ['incorreto', 'Incorreta'], ['outro', 'Outro']];
  motivos.forEach(function (par) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = par[1];
    b.style.cssText = 'border:1px solid var(--gold);background:transparent;color:inherit;border-radius:10px;padding:6px 10px;font:inherit;cursor:pointer;';
    b.addEventListener('click', async function () {
      opcoes.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
      try {
        await enviarDenuncia(pergunta, resposta, par[0]);
        rodape.textContent = 'Obrigado. Sua denúncia foi enviada.';
      } catch (err) {
        console.error('[Assistente Bíblico] Erro ao enviar denúncia:', err);
        rodape.textContent = 'Não foi possível enviar agora. Tente de novo mais tarde.';
      }
    });
    opcoes.appendChild(b);
  });

  reportar.addEventListener('click', function () {
    opcoes.style.display = opcoes.style.display === 'none' ? 'flex' : 'none';
  });

  linha.appendChild(aviso);
  linha.appendChild(reportar);
  rodape.appendChild(linha);
  rodape.appendChild(opcoes);
  message.appendChild(rodape);
}

function adicionarMensagem(messagesEl, tipo, texto, extra) {
  const message = document.createElement('div');

  message.className =
    tipo === 'user'
      ? 'assistant-message assistant-message--user'
      : 'assistant-message assistant-message--bot';

  const role = document.createElement('div');
  role.className = 'assistant-message-role';
  role.textContent =
    tipo === 'user' ? 'Você' : 'Assistente Bíblico';

  const content = document.createElement('div');
  content.className = 'assistant-message-text';
  content.innerHTML = tipo === 'bot' ? markdownSeguro(texto) : escaparHtml(texto).replace(/\n/g, '<br>');

  message.appendChild(role);
  message.appendChild(content);
  if (tipo === 'bot' && extra && extra.ia) anexarAvisoIA(message, extra.pergunta, texto);
  messagesEl.appendChild(message);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

let usoEl = null;
let inputEl = null;
let sendEl = null;
let limiteAtingido = false;

function aplicarBloqueio() {
  if (!inputEl || !sendEl) return;
  inputEl.disabled = limiteAtingido;
  sendEl.disabled = limiteAtingido;
  if (limiteAtingido) {
    if (inputEl.dataset.ph === undefined) inputEl.dataset.ph = inputEl.placeholder;
    inputEl.placeholder = 'Limite diário atingido. Volta à meia-noite.';
  } else if (inputEl.dataset.ph !== undefined) {
    inputEl.placeholder = inputEl.dataset.ph;
  }
}

async function carregarUso() {
  if (!usoEl) return;
  try {
    await aguardarAuthInicial();
    if (!usuarioAtual()) {
      usoEl.textContent = '';
      limiteAtingido = false;
      aplicarBloqueio();
      return;
    }
    const { data, error } = await supabase.functions.invoke('assistente-biblico', {
      body: { consultarUso: true },
    });
    if (error || !data?.sucesso) return;
    limiteAtingido = data.restantes <= 0;
    usoEl.textContent = limiteAtingido
      ? `Você usou as ${data.limite} perguntas de hoje. Volta à meia-noite.`
      : `Restam ${data.restantes} de ${data.limite} perguntas hoje`;
    aplicarBloqueio();
  } catch (_e) {
    /* mantém o texto anterior */
  }
}

async function enviarPergunta({
  pergunta,
  messagesEl,
  input,
  sendButton,
  statusEl,
}) {
  if (limiteAtingido) {
    statusEl.textContent = 'Você usou todas as perguntas de hoje. Volta à meia-noite.';
    return;
  }

  const texto = String(pergunta || '').trim();

  if (!texto) {
    input.focus();
    return;
  }

  if (texto.length > 8000) {
    statusEl.textContent =
      'Sua pergunta é muito longa. Tente resumir.';
    input.focus();
    return;
  }

  const usuario = usuarioAtual();

  if (!usuario) {
    adicionarMensagem(
      messagesEl,
      'bot',
      'Você precisa estar conectado à sua conta para usar o Assistente Bíblico.',
    );
    return;
  }

  adicionarMensagem(messagesEl, 'user', texto);

  input.value = '';
  input.disabled = true;
  sendButton.disabled = true;
  statusEl.textContent = 'Pensando...';

  try {
    const { data, error } = await supabase.functions.invoke(
      'assistente-biblico',
      {
        body: {
          mensagem: texto,
        },
      },
    );

    if (error) {
      console.error(
        '[Assistente Bíblico] Erro na função:',
        error,
      );

      throw new Error(
        error.message ||
          'Não foi possível obter uma resposta do Assistente Bíblico.',
      );
    }

    if (!data?.sucesso || !data?.mensagem) {
      throw new Error(
        data?.erro ||
          'O Assistente Bíblico não retornou uma resposta válida.',
      );
    }

    adicionarMensagem(messagesEl, 'bot', data.mensagem, { ia: true, pergunta: texto });
  } catch (error) {
    console.error(
      '[Assistente Bíblico] Erro:',
      error,
    );

    adicionarMensagem(
      messagesEl,
      'bot',
      'Não foi possível responder agora. Verifique sua conexão e tente novamente.',
    );
  } finally {
    input.disabled = false;
    sendButton.disabled = false;
    statusEl.textContent = '';
    carregarUso();
    input.focus();
  }
}

export const assistantPage = {
  async render(container) {
    container.innerHTML = template();

    const headerEl = container.querySelector('.assistant-page .page-header');
    if (headerEl) {
      usoEl = document.createElement('p');
      usoEl.style.cssText = 'margin:8px 4px 0;font-size:13px;opacity:.7;';
      headerEl.insertAdjacentElement('afterend', usoEl);
      carregarUso();
    }

    const messagesEl = container.querySelector(
      '#assistantMessages',
    );

    const form = container.querySelector(
      '#assistantForm',
    );

    const input = container.querySelector(
      '#assistantInput',
    );

    const sendButton = container.querySelector(
      '#assistantSendButton',
    );

    const statusEl = container.querySelector(
      '#assistantStatus',
    );

    inputEl = input;
    sendEl = sendButton;

    await aguardarAuthInicial();

    const usuario = usuarioAtual();

    if (!usuario) {
      statusEl.textContent =
        'Entre na sua conta para usar o assistente.';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      await enviarPergunta({
        pergunta: input.value,
        messagesEl,
        input,
        sendButton,
        statusEl,
      });
    });

    input.addEventListener('keydown', (event) => {
      if (
        event.key === 'Enter' &&
        !event.shiftKey
      ) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    container
      .querySelectorAll('[data-suggestion]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const tipo = button.dataset.suggestion;
          const sugestao = SUGESTOES[tipo];

          if (!sugestao) return;

          input.value = sugestao;
          input.focus();
        });
      });
  },
};
