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

const assistantIcons = {
  book: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 5.2C3 3.98 4 3 5.25 3H11v17H6a3 3 0 0 0-3 1V5.2Zm18 0C21 3.98 20 3 18.75 3H13v17h5a3 3 0 0 1 3 1V5.2Z"/>
    <path d="M11.5 4h1v16h-1z"/>
  </svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a3.2 3.2 0 0 0-3.2 3.2v5.9a3.2 3.2 0 0 0 6.4 0V5.2A3.2 3.2 0 0 0 12 2Z"/>
    <path d="M5 10.5a1 1 0 0 1 1 1v.2a6 6 0 0 0 12 0v-.2a1 1 0 1 1 2 0v.2a8 8 0 0 1-7 7.94V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-1.56a8 8 0 0 1-7-7.94v-.2a1 1 0 0 1 1-1Z"/>
  </svg>`,
  search: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fill-rule="evenodd" d="M10.8 2a8.8 8.8 0 1 0 5.48 15.68l4.31 4.31a1.2 1.2 0 0 0 1.7-1.7l-4.31-4.31A8.8 8.8 0 0 0 10.8 2Zm0 2.4a6.4 6.4 0 1 1 0 12.8 6.4 6.4 0 0 1 0-12.8Z" clip-rule="evenodd"/>
  </svg>`,
  prayer: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6V2Z"/>
  </svg>`
};

function template() {
  return `
    <section class="page assistant-page">
      <div class="menu-grid assistant-suggestions">
        <button type="button" class="menu-item" data-suggestion="estudo">
          <div class="menu-icon">${assistantIcons.book}</div>
          <div class="menu-title">Estudar a Bíblia</div>
          <div class="menu-desc">
            Explique passagens, capítulos, versículos e temas bíblicos.
          </div>
        </button>

        <button type="button" class="menu-item" data-suggestion="ministracao">
          <div class="menu-icon">${assistantIcons.mic}</div>
          <div class="menu-title">Criar ministração</div>
          <div class="menu-desc">
            Desenvolva temas, esboços, estudos e ministrações.
          </div>
        </button>

        <button type="button" class="menu-item" data-suggestion="tema">
          <div class="menu-icon">${assistantIcons.search}</div>
          <div class="menu-title">Pesquisar tema</div>
          <div class="menu-desc">
            Encontre referências e compreenda o que a Bíblia ensina.
          </div>
        </button>

        <button type="button" class="menu-item" data-suggestion="oracao">
          <div class="menu-icon">${assistantIcons.prayer}</div>
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
            <span class="assistant-message-avatar" aria-hidden="true">${icons.angel}</span>
            <div class="assistant-message-body">
              <div class="assistant-message-role">Assistente Bíblico</div>
              <div class="assistant-message-text">
                Olá! Posso ajudar você a estudar a Bíblia, compreender passagens,
                pesquisar temas, preparar ministrações e criar orações.
              </div>
            </div>
          </div>
        </div>

        <section id="assistantHistoryPanel" class="assistant-history-panel" hidden aria-label="Histórico de conversas">
          <label class="visually-hidden" for="assistantHistorySearch">Pesquisar conversas</label>
          <input
            type="search"
            id="assistantHistorySearch"
            class="assistant-history-search"
            placeholder="Pesquisar no histórico..."
            autocomplete="off"
          />
          <div id="assistantHistoryList" class="assistant-history-list" aria-live="polite">
            <p class="assistant-history-empty">Suas conversas aparecerão aqui.</p>
          </div>
        </section>
        <form id="assistantForm" class="assistant-form">
          <label class="visually-hidden" for="assistantInput">
            Pergunte ao Assistente Bíblico
          </label>

        <div class="assistant-history-actions">
          <button type="button" id="assistantNewConversation" class="assistant-history-button assistant-history-button--primary" aria-label="Nova conversa" title="Nova conversa">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v16M4 12h16"/>
            </svg>
          </button>
          <button type="button" id="assistantToggleHistory" class="assistant-history-button" aria-label="Histórico de conversas" title="Histórico de conversas" aria-expanded="false" aria-controls="assistantHistoryPanel">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 11a8.5 8.5 0 1 1 2.2 6.2"/>
              <path d="M3 4v7h7"/>
              <path d="M12 7v5l3 2"/>
            </svg>
          </button>
        </div>

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
              aria-label="Enviar pergunta"
              title="Enviar pergunta"
            >
              <img
                src="assets/icons/assistant-send.jpg"
                class="assistant-send-image"
                alt=""
                aria-hidden="true"
              />
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
  const isBot = tipo === 'bot';

  message.className = isBot
    ? 'assistant-message assistant-message--bot'
    : 'assistant-message assistant-message--user';

  const role = document.createElement('div');
  role.className = 'assistant-message-role';
  role.textContent = isBot ? 'Assistente Bíblico' : 'Você';

  const content = document.createElement('div');
  content.className = 'assistant-message-text';
  content.innerHTML = isBot
    ? markdownSeguro(texto)
    : escaparHtml(texto).replace(/\n/g, '<br>');

  if (isBot) {
    const avatar = document.createElement('span');
    avatar.className = 'assistant-message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = icons.angel;

    const body = document.createElement('div');
    body.className = 'assistant-message-body';
    body.appendChild(role);
    body.appendChild(content);

    message.appendChild(avatar);
    message.appendChild(body);

    if (extra && extra.ia) {
      anexarAvisoIA(body, extra.pergunta, texto);
    }
  } else {
    message.appendChild(role);
    message.appendChild(content);
  }

  messagesEl.appendChild(message);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}


function tituloDaConversa(texto) {
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!limpo) return 'Nova conversa';
  return limpo.length > 80 ? `${limpo.slice(0, 77)}...` : limpo;
}

async function criarConversa(usuario, primeiraPergunta) {
  const { data, error } = await supabase
    .from('assistente_conversas')
    .insert({
      user_id: usuario.id,
      titulo: tituloDaConversa(primeiraPergunta),
    })
    .select('id,titulo,updated_at')
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error('Não foi possível criar a conversa.');
  return data;
}

async function salvarMensagem(conversaId, usuarioId, role, conteudo) {
  const { error } = await supabase.from('assistente_mensagens').insert({
    conversa_id: conversaId,
    user_id: usuarioId,
    role,
    conteudo: String(conteudo || '').slice(0, 20000),
  });

  if (error) throw error;
}

async function atualizarDataConversa(conversaId, usuarioId) {
  const { error } = await supabase
    .from('assistente_conversas')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversaId)
    .eq('user_id', usuarioId);

  if (error) throw error;
}

function restaurarBoasVindas(messagesEl) {
  messagesEl.innerHTML = `
    <div class="assistant-message assistant-message--bot">
      <span class="assistant-message-avatar" aria-hidden="true">${icons.angel}</span>
      <div class="assistant-message-body">
        <div class="assistant-message-role">Assistente Bíblico</div>
        <div class="assistant-message-text">
          Olá! Posso ajudar você a estudar a Bíblia, compreender passagens,
          pesquisar temas, preparar ministrações e criar orações.
        </div>
      </div>
    </div>
  `;
}

function formatarDataHistorico(valor) {
  if (!valor) return '';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function carregarHistorico({ listEl, usuario, termo, onOpen, onDelete }) {
  listEl.replaceChildren();

  const carregando = document.createElement('p');
  carregando.className = 'assistant-history-empty';
  carregando.textContent = 'Carregando conversas...';
  listEl.appendChild(carregando);

  const { data: conversas, error } = await supabase
    .from('assistente_conversas')
    .select('id,titulo,updated_at')
    .eq('user_id', usuario.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  const lista = conversas || [];
  const busca = String(termo || '').trim().toLocaleLowerCase('pt-BR');
  let filtradas = lista;

  if (busca && lista.length) {
    const ids = lista.map((conversa) => conversa.id);
    const { data: mensagens, error: erroMensagens } = await supabase
      .from('assistente_mensagens')
      .select('conversa_id,conteudo')
      .eq('user_id', usuario.id)
      .in('conversa_id', ids)
      .limit(2000);

    if (erroMensagens) throw erroMensagens;

    const idsEncontrados = new Set(
      (mensagens || [])
        .filter((mensagem) =>
          String(mensagem.conteudo || '').toLocaleLowerCase('pt-BR').includes(busca)
        )
        .map((mensagem) => mensagem.conversa_id)
    );

    filtradas = lista.filter((conversa) =>
      String(conversa.titulo || '').toLocaleLowerCase('pt-BR').includes(busca)
      || idsEncontrados.has(conversa.id)
    );
  }

  listEl.replaceChildren();

  if (!filtradas.length) {
    const vazio = document.createElement('p');
    vazio.className = 'assistant-history-empty';
    vazio.textContent = busca
      ? 'Nenhuma conversa encontrada.'
      : 'Você ainda não tem conversas salvas.';
    listEl.appendChild(vazio);
    return;
  }

  filtradas.forEach((conversa) => {
    const item = document.createElement('div');
    item.className = 'assistant-history-item';

    const abrir = document.createElement('button');
    abrir.type = 'button';
    abrir.className = 'assistant-history-open';

    const titulo = document.createElement('span');
    titulo.className = 'assistant-history-title';
    titulo.textContent = conversa.titulo || 'Nova conversa';

    const data = document.createElement('span');
    data.className = 'assistant-history-date';
    data.textContent = formatarDataHistorico(conversa.updated_at);

    abrir.append(titulo, data);
    abrir.addEventListener('click', () => onOpen(conversa));

    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'assistant-history-delete';
    excluir.textContent = 'Excluir';
    excluir.setAttribute('aria-label', `Excluir conversa: ${conversa.titulo || 'Nova conversa'}`);
    excluir.addEventListener('click', () => onDelete(conversa));

    item.append(abrir, excluir);
    listEl.appendChild(item);
  });
}

async function abrirConversa(conversa, usuario, messagesEl) {
  const { data: registro, error: erroConversa } = await supabase
    .from('assistente_conversas')
    .select('id,titulo')
    .eq('id', conversa.id)
    .eq('user_id', usuario.id)
    .single();

  if (erroConversa) throw erroConversa;
  if (!registro) throw new Error('Conversa não encontrada.');

  const { data: mensagens, error } = await supabase
    .from('assistente_mensagens')
    .select('id,role,conteudo,created_at')
    .eq('conversa_id', conversa.id)
    .eq('user_id', usuario.id)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;

  restaurarBoasVindas(messagesEl);

  let ultimaPergunta = '';
  (mensagens || []).forEach((mensagem) => {
    if (mensagem.role === 'user') {
      ultimaPergunta = mensagem.conteudo;
      adicionarMensagem(messagesEl, 'user', mensagem.conteudo);
    } else if (mensagem.role === 'assistant') {
      adicionarMensagem(messagesEl, 'bot', mensagem.conteudo, {
        ia: true,
        pergunta: ultimaPergunta,
      });
    }
  });

  return registro;
}

function aplicarBloqueio(inputEl, sendEl, limiteAtingido) {
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

async function carregarUso({ usoEl, inputEl, sendEl, state, isCurrent }) {
  if (!usoEl || !isCurrent()) return;

  try {
    await aguardarAuthInicial();
    if (!isCurrent()) return;

    if (!usuarioAtual()) {
      usoEl.textContent = '';
      state.limiteAtingido = false;
      aplicarBloqueio(inputEl, sendEl, state.limiteAtingido);
      return;
    }

    const { data, error } = await supabase.functions.invoke('assistente-biblico', {
      body: { consultarUso: true },
    });

    if (!isCurrent() || error || !data?.sucesso) return;

    state.limiteAtingido = data.restantes <= 0;
    usoEl.textContent = state.limiteAtingido
      ? `Você usou as ${data.limite} perguntas de hoje. Volta à meia-noite.`
      : `Restam ${data.restantes} de ${data.limite} perguntas hoje`;

    aplicarBloqueio(inputEl, sendEl, state.limiteAtingido);
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
  usoEl,
  historyListEl,
  usuario,
  state,
  isCurrent,
}) {
  if (!isCurrent()) return;

  if (state.limiteAtingido) {
    statusEl.textContent = 'Você usou todas as perguntas de hoje. Volta à meia-noite.';
    return;
  }

  const texto = String(pergunta || '').trim();

  if (!texto) {
    input.focus();
    return;
  }

  if (texto.length > 8000) {
    statusEl.textContent = 'Sua pergunta é muito longa. Tente resumir.';
    input.focus();
    return;
  }

  if (!usuario) {
    adicionarMensagem(
      messagesEl,
      'bot',
      'Você precisa estar conectado à sua conta para usar o Assistente Bíblico.',
    );
    return;
  }

  input.value = '';
  input.disabled = true;
  sendButton.disabled = true;
  statusEl.textContent = 'Salvando conversa...';
  state.persistenciaAviso = '';

  try {
    if (!state.conversaId) {
      const conversa = await criarConversa(usuario, texto);
      if (!isCurrent()) return;
      state.conversaId = conversa.id;
    }

    await salvarMensagem(state.conversaId, usuario.id, 'user', texto);
    if (!isCurrent()) return;

    await atualizarDataConversa(state.conversaId, usuario.id);
    if (!isCurrent()) return;

    adicionarMensagem(messagesEl, 'user', texto);
    statusEl.textContent = 'Pensando...';

    const { data, error } = await supabase.functions.invoke(
      'assistente-biblico',
      {
        body: {
          mensagem: texto,
          conversaId: state.conversaId,
        },
      },
    );

    if (!isCurrent()) return;

    if (error) {
      console.error('[Assistente Bíblico] Erro na função:', error);

      let msgServidor = null;
      try {
        const corpo = await error.context.json();
        if (!isCurrent()) return;
        msgServidor = corpo && corpo.erro ? String(corpo.erro) : null;
      } catch (_e) {
        /* sem corpo legível */
      }

      const falha = new Error(
        msgServidor || error.message || 'Não foi possível obter uma resposta do Assistente Bíblico.',
      );
      falha.doServidor = !!msgServidor;
      throw falha;
    }

    if (!data?.sucesso || !data?.mensagem) {
      throw new Error(
        data?.erro || 'O Assistente Bíblico não retornou uma resposta válida.',
      );
    }

    if (!isCurrent()) return;

    try {
      await salvarMensagem(state.conversaId, usuario.id, 'assistant', data.mensagem);
      await atualizarDataConversa(state.conversaId, usuario.id);
    } catch (erroPersistencia) {
      console.error('[Assistente Bíblico] Não foi possível salvar a resposta:', erroPersistencia);
      state.persistenciaAviso = 'A resposta foi gerada, mas não foi possível salvar tudo no histórico.';
    }

    if (!isCurrent()) return;
    adicionarMensagem(messagesEl, 'bot', data.mensagem, {
      ia: true,
      pergunta: texto,
    });

    if (historyListEl && !state.historyPanelHidden) {
      try {
        await carregarHistorico({
          listEl: historyListEl,
          usuario,
          termo: '',
          onOpen: state.onOpenConversation,
          onDelete: state.onDeleteConversation,
        });
      } catch (erro) {
        console.error('[Assistente Bíblico] Erro ao atualizar histórico:', erro);
      }
    }
  } catch (error) {
    if (!isCurrent()) return;

    console.error('[Assistente Bíblico] Erro:', error);

    adicionarMensagem(
      messagesEl,
      'bot',
      error && error.doServidor
        ? error.message
        : 'Não foi possível responder agora. Verifique sua conexão e tente novamente.',
    );
  } finally {
    if (isCurrent()) {
      input.disabled = false;
      sendButton.disabled = false;
      statusEl.textContent = state.persistenciaAviso || '';
      carregarUso({ usoEl, inputEl: input, sendEl: sendButton, state, isCurrent });
      input.focus();
    }
  }
}

export const assistantPage = {
  async render(container, params, isCurrent = () => true) {
    if (!isCurrent()) return;

    const state = {
      limiteAtingido: false,
      conversaId: null,
      historyPanelHidden: true,
      onOpenConversation: null,
      onDeleteConversation: null,
      persistenciaAviso: '',
    };

    container.innerHTML = template();

    const suggestionsEl = container.querySelector('.assistant-page .assistant-suggestions');
    const messagesEl = container.querySelector('#assistantMessages');
    const form = container.querySelector('#assistantForm');
    const input = container.querySelector('#assistantInput');
    const sendButton = container.querySelector('#assistantSendButton');
    const statusEl = container.querySelector('#assistantStatus');
    const newConversationButton = container.querySelector('#assistantNewConversation');
    const toggleHistoryButton = container.querySelector('#assistantToggleHistory');
    const historyPanel = container.querySelector('#assistantHistoryPanel');
    const historySearch = container.querySelector('#assistantHistorySearch');
    const historyList = container.querySelector('#assistantHistoryList');

    if (!messagesEl || !form || !input || !sendButton || !statusEl) return;

    let usoEl = null;

    if (suggestionsEl) {
      usoEl = document.createElement('p');
      usoEl.style.cssText = 'margin:8px 4px 0;font-size:13px;opacity:.7;';
      suggestionsEl.insertAdjacentElement('afterend', usoEl);

      const avisoEl = document.createElement('p');
      avisoEl.style.cssText = 'margin:3px 4px 0;font-size:11px;opacity:.62;line-height:1.35;';
      avisoEl.textContent = 'Privacidade: não escreva dados pessoais nem informações sensíveis. As perguntas são processadas pelo Google (Gemini) e, no plano gratuito, podem ser usadas por ele para melhorar seus serviços.';
      const conversaEl = container.querySelector('.assistant-page .assistant-intro');
      if (conversaEl) {
        avisoEl.style.cssText = 'margin:10px 4px 0;font-size:11px;opacity:.62;line-height:1.35;';
        conversaEl.insertAdjacentElement('afterend', avisoEl);
      }
    }

    carregarUso({
      usoEl,
      inputEl: input,
      sendEl: sendButton,
      state,
      isCurrent,
    });

    await aguardarAuthInicial();
    if (!isCurrent()) return;

    const usuario = usuarioAtual();

    if (!usuario) {
      statusEl.textContent = 'Entre na sua conta para usar o assistente.';
      if (newConversationButton) newConversationButton.disabled = true;
      if (toggleHistoryButton) toggleHistoryButton.disabled = true;
    }

    async function atualizarHistorico() {
      if (!usuario || !historyList || !isCurrent()) return;

      try {
        await carregarHistorico({
          listEl: historyList,
          usuario,
          termo: historySearch?.value || '',
          onOpen: state.onOpenConversation,
          onDelete: state.onDeleteConversation,
        });
      } catch (error) {
        console.error('[Assistente Bíblico] Erro ao carregar histórico:', error);
        historyList.replaceChildren();
        const aviso = document.createElement('p');
        aviso.className = 'assistant-history-empty';
        aviso.textContent = 'Não foi possível carregar o histórico. Verifique se a configuração do histórico foi concluída.';
        historyList.appendChild(aviso);
      }
    }

    state.onOpenConversation = async (conversa) => {
      if (!usuario || !isCurrent()) return;

      statusEl.textContent = 'Abrindo conversa...';
      input.disabled = true;
      sendButton.disabled = true;

      try {
        const registro = await abrirConversa(conversa, usuario, messagesEl);
        if (!isCurrent()) return;

        state.conversaId = registro.id;
        if (historyPanel) historyPanel.hidden = true;
        if (toggleHistoryButton) toggleHistoryButton.setAttribute('aria-expanded', 'false');
        state.historyPanelHidden = true;
        statusEl.textContent = '';
      } catch (error) {
        console.error('[Assistente Bíblico] Erro ao abrir conversa:', error);
        statusEl.textContent = 'Não foi possível abrir esta conversa.';
      } finally {
        if (isCurrent()) {
          input.disabled = false;
          sendButton.disabled = false;
          input.focus();
        }
      }
    };

    state.onDeleteConversation = async (conversa) => {
      if (!usuario || !isCurrent()) return;

      const confirmar = window.confirm(
        `Deseja excluir a conversa "${conversa.titulo || 'Nova conversa'}"? Esta ação não poderá ser desfeita.`,
      );
      if (!confirmar) return;

      try {
        const { error } = await supabase
          .from('assistente_conversas')
          .delete()
          .eq('id', conversa.id)
          .eq('user_id', usuario.id);

        if (error) throw error;
        if (!isCurrent()) return;

        if (state.conversaId === conversa.id) {
          state.conversaId = null;
          restaurarBoasVindas(messagesEl);
        }

        await atualizarHistorico();
      } catch (error) {
        console.error('[Assistente Bíblico] Erro ao excluir conversa:', error);
        statusEl.textContent = 'Não foi possível excluir a conversa.';
      }
    };

    if (toggleHistoryButton && historyPanel) {
      toggleHistoryButton.addEventListener('click', async () => {
        if (!isCurrent() || !usuario) return;

        historyPanel.hidden = !historyPanel.hidden;
        state.historyPanelHidden = historyPanel.hidden;
        toggleHistoryButton.setAttribute('aria-expanded', String(!historyPanel.hidden));

        if (!historyPanel.hidden) {
          await atualizarHistorico();
          historySearch?.focus();
        }
      });
    }

    if (historySearch) {
      historySearch.addEventListener('input', () => {
        if (historyPanel && !historyPanel.hidden) atualizarHistorico();
      });
    }

    if (newConversationButton) {
      newConversationButton.addEventListener('click', () => {
        if (!isCurrent() || !usuario) return;

        state.conversaId = null;
        state.persistenciaAviso = '';
        restaurarBoasVindas(messagesEl);
        input.value = '';
        statusEl.textContent = 'Nova conversa pronta.';
        input.focus();
      });
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!isCurrent()) return;

      await enviarPergunta({
        pergunta: input.value,
        messagesEl,
        input,
        sendButton,
        statusEl,
        usoEl,
        historyListEl: historyList,
        usuario,
        state,
        isCurrent,
      });
    });

    input.addEventListener('keydown', (event) => {
      if (!isCurrent()) return;

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    container.querySelectorAll('[data-suggestion]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!isCurrent()) return;

        const tipo = button.dataset.suggestion;
        const sugestao = SUGESTOES[tipo];

        if (!sugestao) return;

        input.value = sugestao;
        input.focus();
      });
    });
  },
};
