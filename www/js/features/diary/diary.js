// Diário de Estudo: tela de temas, tela de um tema, diálogos, compartilhar,
// exportar e importar. Os dados ficam em data-access/diaryRepository.js.
import { toast } from '../../utils/toast.js';
import { navigateTo } from '../../router.js';
import { shareText } from '../../utils/share.js';
import { setHeaderTitle } from '../../state/header.js';
import { getAllBooks, getBook, getChapter } from '../../data-access/bibleRepository.js';
import * as repo from '../../data-access/diaryRepository.js';

const NOME_APP = 'Bíblia de Estudo LS';

const ESTILO_CAMPO =
  'width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid var(--border);' +
  'background:var(--navy-deep);color:var(--text-primary);font:inherit;font-size:16px;';
const ESTILO_CARTAO =
  'margin:0 0 12px;padding:16px;border-radius:14px;border:1px solid var(--border);background:var(--navy);';
const ESTILO_BOTAO = 'flex:1;padding:12px 10px;';

// ---------- utilitários ----------
function criar(tag, atributos = {}, filhos = []) {
  const e = document.createElement(tag);
  Object.entries(atributos).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null) return;
    if (chave === 'style') e.style.cssText = valor;
    else if (chave === 'texto') e.textContent = valor;
    else e.setAttribute(chave, valor);
  });
  [].concat(filhos).forEach((f) => {
    if (f) e.append(f);
  });
  return e;
}

function botao(texto, { principal = false, estilo = ESTILO_BOTAO, aoClicar } = {}) {
  const b = criar('button', { type: 'button', class: principal ? 'read-btn read-btn--primary' : 'tool-btn', texto, style: estilo });
  if (aoClicar) b.addEventListener('click', aoClicar);
  return b;
}

function rotuloCampo(texto, campo) {
  return criar('label', { style: 'display:block;margin-top:12px;font-size:14px;opacity:.85;' }, [
    criar('span', { texto, style: 'display:block;margin-bottom:4px;' }),
    campo,
  ]);
}

function abrirModal(titulo, conteudo) {
  const fundo = criar('div', {
    style: 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;',
  });
  const caixa = criar('div', {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': titulo,
    style:
      'width:min(440px,100%);max-height:90vh;overflow:auto;background:var(--navy);color:var(--text-primary);' +
      'border:1px solid var(--border);border-radius:18px;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.45);',
  });
  caixa.append(
    criar('h2', { texto: titulo, style: 'margin:0 0 12px;font-size:20px;color:var(--gold);font-family:var(--font-display);' }),
    conteudo,
  );
  fundo.append(caixa);
  document.body.append(fundo);
  return { fechar: () => fundo.remove() };
}

function plural(n, um, varios) {
  return `${n} ${n === 1 ? um : varios}`;
}

// ---------- livros e textos (vêm da Bíblia do próprio app) ----------
let cacheLivros = null;
async function livros() {
  if (cacheLivros) return cacheLivros;
  const bruto = await getAllBooks();
  const lista = Array.isArray(bruto) ? bruto : bruto && Array.isArray(bruto.books) ? bruto.books : [];
  const saida = [];
  for (let i = 0; i < lista.length; i++) {
    const b = lista[i] || {};
    let nome = b.name || b.nome;
    let capitulos = b.chapterCount ?? b.capitulos ?? (Array.isArray(b.chapters) ? b.chapters.length : undefined);
    if (!nome || !capitulos) {
      const completo = await getBook(i);
      nome = nome || (completo && completo.name);
      capitulos = capitulos || (completo && completo.chapterCount);
    }
    saida.push({ nome: nome || `Livro ${i + 1}`, capitulos: Number(capitulos) || 1 });
  }
  if (!saida.length) throw new Error('Lista de livros vazia.');
  cacheLivros = saida;
  return saida;
}

function rotuloPassagem(p, lista) {
  const nome = (lista[p.livro] && lista[p.livro].nome) || `Livro ${p.livro + 1}`;
  const fim = p.versiculoFim !== p.versiculoIni ? `-${p.versiculoFim + 1}` : '';
  return `${nome} ${p.capitulo + 1}:${p.versiculoIni + 1}${fim}`;
}

async function textoDaPassagem(p) {
  try {
    const versos = await getChapter(p.livro, p.capitulo);
    const partes = [];
    for (let v = p.versiculoIni; v <= p.versiculoFim; v++) {
      if (versos[v] !== undefined && versos[v] !== null) partes.push(String(versos[v]).trim());
    }
    return partes.join(' ');
  } catch (_e) {
    return '';
  }
}

// ---------- arquivos: exportar e importar ----------
function nomeParaArquivo(nome) {
  const base = String(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return base || 'diario';
}

async function exportarArquivo(objeto, base) {
  const json = JSON.stringify(objeto, null, 2);
  const nome = `${base}-${new Date().toISOString().slice(0, 10)}.json`;
  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  const nativo = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const plugins = nativo && cap.Plugins ? cap.Plugins : {};

  if (plugins.FileSaver) {
    const r = await plugins.FileSaver.saveFile({ name: nome, data: json });
    return r && r.saved ? 'salvo' : 'cancelado';
  }
  if (plugins.Filesystem && plugins.Share) {
    const g = await plugins.Filesystem.writeFile({ path: nome, data: json, directory: 'CACHE', encoding: 'utf8' });
    try {
      await plugins.Share.share({ title: 'Diário de Estudo', url: g.uri, dialogTitle: 'Salvar ou enviar o diário' });
    } catch (err) {
      if (!/cancel/i.test(String(err && err.message))) throw err;
    }
    return 'compartilhado';
  }
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = criar('a', { href: url, download: nome });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'baixado';
}

async function exportarComAviso(objeto, base) {
  try {
    const r = await exportarArquivo(objeto, base);
    if (r === 'cancelado') toast.info('Salvamento cancelado.');
    else if (r === 'salvo') toast.success('Arquivo salvo no aparelho.');
    else if (r === 'baixado') toast.success('Arquivo baixado.');
  } catch (err) {
    console.error('[Diário] erro ao exportar:', err);
    toast.error('Não foi possível exportar agora.');
  }
}

async function importarDoArquivo(arquivo, aoConcluir) {
  if (!arquivo) return;
  if (arquivo.size > 5 * 1024 * 1024) {
    toast.error('Arquivo grande demais para ser um diário.');
    return;
  }
  let dados;
  try {
    dados = JSON.parse(await arquivo.text());
  } catch (_e) {
    toast.error('O arquivo não é um diário válido.');
    return;
  }
  if (!window.confirm('Importar este diário? Nada será apagado: temas novos são acrescentados e, se o tema já existir, só as passagens que faltam são adicionadas.')) return;
  try {
    const r = repo.importarTemas(dados);
    toast.success(`Importado: ${plural(r.temasNovos, 'tema novo', 'temas novos')}, ${r.temasAtualizados} atualizados, ${plural(r.passagensNovas, 'passagem nova', 'passagens novas')}.`);
    if (aoConcluir) aoConcluir();
  } catch (err) {
    toast.error(err && err.message ? err.message : 'Não foi possível importar.');
  }
}

// ---------- compartilhar ----------
async function textoDoTema(tema) {
  const lista = await livros().catch(() => []);
  const partes = [`📖 ${tema.nome}`];
  if (tema.descricao) partes.push(tema.descricao);
  for (const p of tema.passagens) {
    const texto = await textoDaPassagem(p);
    let bloco = `\n${rotuloPassagem(p, lista)}`;
    if (texto) bloco += `\n"${texto}"`;
    if (p.nota) bloco += `\n(${p.nota})`;
    partes.push(bloco);
  }
  partes.push(`\n— ${NOME_APP}`);
  return partes.join('\n');
}

async function compartilharTema(tema) {
  const texto = await textoDoTema(tema);
  const r = await shareText({ title: `Diário de Estudo — ${tema.nome}`, text: texto });
  if (r === 'copied') toast.success('Texto copiado.');
  else if (r === 'error' || r === 'unsupported') toast.error('Não foi possível compartilhar neste aparelho.');
}

// ---------- diálogos ----------
function dialogoTema({ tema = null, aoSalvar }) {
  const nome = criar('input', {
    type: 'text', maxlength: '80', placeholder: 'Ex.: Fé, Ansiedade, Perdão', value: tema ? tema.nome : '',
    'aria-label': 'Nome do tema', style: ESTILO_CAMPO,
  });
  const descricao = criar('textarea', {
    rows: '3', maxlength: '500', placeholder: 'Descrição (opcional)', 'aria-label': 'Descrição', style: ESTILO_CAMPO + 'resize:vertical;',
  });
  descricao.value = tema ? tema.descricao : '';
  const erro = criar('p', { style: 'margin:10px 0 0;color:var(--danger);font-size:14px;' });
  const cancelar = botao('Cancelar');
  const salvar = botao(tema ? 'Salvar' : 'Criar tema', { principal: true });
  const corpo = criar('div', {}, [
    rotuloCampo('Nome', nome), rotuloCampo('Descrição', descricao), erro,
    criar('div', { style: 'display:flex;gap:10px;margin-top:16px;' }, [cancelar, salvar]),
  ]);
  const modal = abrirModal(tema ? 'Editar tema' : 'Novo tema', corpo);
  cancelar.addEventListener('click', modal.fechar);
  salvar.addEventListener('click', () => {
    const dados = { nome: nome.value, descricao: descricao.value };
    const r = tema ? repo.editarTema(tema.id, dados) : repo.criarTema(dados);
    if (!r.ok) {
      erro.textContent = r.erro;
      return;
    }
    modal.fechar();
    if (aoSalvar) aoSalvar(r.tema);
  });
  setTimeout(() => nome.focus(), 50);
}

function dialogoNota({ temaId, passagem, aoSalvar }) {
  const campo = criar('textarea', { rows: '4', maxlength: '2000', placeholder: 'Sua anotação sobre esta passagem', 'aria-label': 'Anotação', style: ESTILO_CAMPO + 'resize:vertical;' });
  campo.value = passagem.nota || '';
  const cancelar = botao('Cancelar');
  const salvar = botao('Salvar', { principal: true });
  const modal = abrirModal('Anotação', criar('div', {}, [campo, criar('div', { style: 'display:flex;gap:10px;margin-top:16px;' }, [cancelar, salvar])]));
  cancelar.addEventListener('click', modal.fechar);
  salvar.addEventListener('click', () => {
    const r = repo.editarPassagem(temaId, passagem.id, { nota: campo.value });
    if (!r.ok) {
      toast.error(r.erro);
      return;
    }
    modal.fechar();
    if (aoSalvar) aoSalvar();
  });
  setTimeout(() => campo.focus(), 50);
}

async function dialogoPassagem({ temaId, aoSalvar }) {
  let lista;
  try {
    lista = await livros();
  } catch (_e) {
    toast.error('Não foi possível carregar a lista de livros.');
    return;
  }
  const seletor = (rotulo) => criar('select', { class: 'select-input', 'aria-label': rotulo, style: ESTILO_CAMPO });
  const selLivro = seletor('Livro');
  lista.forEach((l, i) => selLivro.append(criar('option', { value: String(i), texto: l.nome })));
  const selCap = seletor('Capítulo');
  const selIni = seletor('Versículo inicial');
  const selFim = seletor('Versículo final');
  const nota = criar('textarea', { rows: '2', maxlength: '2000', placeholder: 'Anotação (opcional)', 'aria-label': 'Anotação', style: ESTILO_CAMPO + 'resize:vertical;' });
  const erro = criar('p', { style: 'margin:10px 0 0;color:var(--danger);font-size:14px;' });
  const cancelar = botao('Cancelar');
  const salvar = botao('Adicionar', { principal: true });

  let carga = 0;
  const opcoes = (n) => Array.from({ length: n }, (_, i) => criar('option', { value: String(i), texto: String(i + 1) }));

  async function carregarVersiculos() {
    const minhaCarga = ++carga;
    selIni.disabled = true;
    selFim.disabled = true;
    salvar.disabled = true;
    let total = 0;
    try {
      total = (await getChapter(Number(selLivro.value), Number(selCap.value))).length;
    } catch (_e) {
      total = 0;
    }
    if (minhaCarga !== carga) return;
    if (!total) {
      erro.textContent = 'Não foi possível carregar este capítulo.';
      return;
    }
    erro.textContent = '';
    selIni.replaceChildren(...opcoes(total));
    selFim.replaceChildren(criar('option', { value: '-1', texto: 'só este versículo' }), ...opcoes(total));
    selIni.disabled = false;
    selFim.disabled = false;
    salvar.disabled = false;
  }

  async function carregarCapitulos() {
    selCap.replaceChildren(...opcoes(lista[Number(selLivro.value)].capitulos));
    await carregarVersiculos();
  }

  selLivro.addEventListener('change', carregarCapitulos);
  selCap.addEventListener('change', carregarVersiculos);
  cancelar.addEventListener('click', () => modal.fechar());
  salvar.addEventListener('click', () => {
    const ini = Number(selIni.value);
    let fim = Number(selFim.value);
    if (fim < 0) fim = ini;
    if (fim < ini) {
      erro.textContent = 'O versículo final precisa ser igual ou maior que o inicial.';
      return;
    }
    const r = repo.adicionarPassagem(temaId, {
      livro: Number(selLivro.value), capitulo: Number(selCap.value), versiculoIni: ini, versiculoFim: fim, nota: nota.value,
    });
    if (!r.ok) {
      erro.textContent = r.erro;
      return;
    }
    modal.fechar();
    if (aoSalvar) aoSalvar();
  });

  const modal = abrirModal(
    'Adicionar passagem',
    criar('div', {}, [
      rotuloCampo('Livro', selLivro),
      rotuloCampo('Capítulo', selCap),
      rotuloCampo('Versículo inicial', selIni),
      rotuloCampo('Versículo final (opcional)', selFim),
      rotuloCampo('Anotação', nota),
      erro,
      criar('div', { style: 'display:flex;gap:10px;margin-top:16px;' }, [cancelar, salvar]),
    ]),
  );
  carregarCapitulos();
}

// Usado pelo leitor: marca em quais temas guardar o versículo tocado.
export async function abrirSelecaoDeTemas({ livro, capitulo, versiculo }) {
  const passagem = { livro, capitulo, versiculoIni: versiculo, versiculoFim: versiculo };
  const lista = await livros().catch(() => []);
  const texto = await textoDaPassagem(passagem);
  const cabecalho = criar('div', {}, [
    criar('p', { texto: rotuloPassagem(passagem, lista), style: 'margin:0;color:var(--gold);font-weight:600;' }),
    criar('p', { texto: texto ? `"${texto}"` : '', style: 'margin:6px 0 14px;font-size:14px;opacity:.85;line-height:1.5;' }),
  ]);
  const caixaLista = criar('div');
  const novoNome = criar('input', { type: 'text', maxlength: '80', placeholder: 'Criar tema novo…', 'aria-label': 'Nome do novo tema', style: ESTILO_CAMPO });
  const erro = criar('p', { style: 'margin:8px 0 0;color:var(--danger);font-size:14px;' });
  const adicionarNovo = botao('Criar e guardar', { estilo: 'margin-top:10px;width:100%;padding:12px 10px;' });
  const concluir = botao('Concluir', { principal: true, estilo: 'margin-top:16px;width:100%;padding:12px 10px;' });

  function desenhar() {
    const marcados = new Set(repo.temasComPassagem(passagem));
    const temas = repo.listarTemas();
    caixaLista.replaceChildren();
    if (!temas.length) {
      caixaLista.append(criar('p', { texto: 'Você ainda não tem temas. Crie o primeiro abaixo.', style: 'opacity:.8;font-size:14px;' }));
    }
    temas.forEach((t) => {
      const caixa = criar('input', { type: 'checkbox', 'aria-label': t.nome, style: 'width:22px;height:22px;flex:none;' });
      caixa.checked = marcados.has(t.id);
      caixa.addEventListener('change', () => {
        const r = repo.alternarPassagemNoTema(t.id, passagem);
        if (!r.ok) {
          caixa.checked = !caixa.checked;
          toast.error(r.erro);
          return;
        }
        toast.info(r.estado === 'adicionada' ? `Guardado em "${t.nome}"` : `Removido de "${t.nome}"`);
      });
      caixaLista.append(
        criar('label', { style: 'display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid var(--border);cursor:pointer;' }, [
          caixa, criar('span', { texto: t.nome, style: 'flex:1;' }),
        ]),
      );
    });
  }

  adicionarNovo.addEventListener('click', () => {
    const r = repo.criarTema({ nome: novoNome.value });
    if (!r.ok) {
      erro.textContent = r.erro;
      return;
    }
    const a = repo.alternarPassagemNoTema(r.tema.id, passagem);
    if (!a.ok) {
      erro.textContent = a.erro;
      return;
    }
    novoNome.value = '';
    erro.textContent = '';
    desenhar();
    toast.success(`Guardado em "${r.tema.nome}"`);
  });

  const modal = abrirModal('Guardar no Diário', criar('div', {}, [cabecalho, caixaLista, criar('div', { style: 'margin-top:14px;' }, [novoNome, adicionarNovo]), erro, concluir]));
  concluir.addEventListener('click', modal.fechar);
  desenhar();
}

// ---------- tela inicial: cartão de entrada ----------
export function montarCartaoDiario() {
  const resumo = repo.contarResumo();
  const subtitulo = resumo.temas
    ? `${plural(resumo.temas, 'tema', 'temas')} · ${plural(resumo.passagens, 'passagem', 'passagens')}`
    : 'Organize versículos por tema, com suas anotações';
  const cartao = criar('div', { class: 'streak-banner', role: 'button', tabindex: '0', style: 'cursor:pointer;' }, [
    criar('div', { class: 'streak-flame', texto: '📓', style: 'font-size:30px;line-height:1;' }),
    criar('div', { class: 'streak-info' }, [criar('h4', { texto: 'Diário de Estudo' }), criar('p', { texto: subtitulo })]),
  ]);
  const abrir = () => navigateTo('/diario');
  cartao.addEventListener('click', abrir);
  cartao.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrir();
    }
  });
  return cartao;
}

// ---------- tela: lista de temas ----------
export const diaryListPage = {
  render(container) {
    container.innerHTML = '';
    const raiz = criar('section', { class: 'page', style: 'padding-bottom:110px;' });
    const lista = criar('div');
    const arquivo = criar('input', { type: 'file', hidden: '' });

    function desenhar() {
      const temas = repo.listarTemas();
      lista.replaceChildren();
      if (!temas.length) {
        lista.append(criar('div', { class: 'state-message', texto: 'Você ainda não criou nenhum tema. Toque em "Novo tema" para começar. Exemplos: Fé, Ansiedade, Perdão.' }));
        return;
      }
      temas.forEach((t) => {
        const cartao = criar('button', {
          type: 'button', 'aria-label': `Abrir o tema ${t.nome}`,
          style: ESTILO_CARTAO + 'display:block;width:100%;text-align:left;cursor:pointer;color:inherit;font:inherit;',
        }, [
          criar('div', { texto: t.nome, style: 'font-weight:600;font-size:17px;' }),
          t.descricao ? criar('div', { texto: t.descricao, style: 'margin-top:4px;font-size:14px;opacity:.8;' }) : null,
          criar('div', { texto: plural(t.passagens.length, 'passagem', 'passagens'), style: 'margin-top:8px;font-size:13px;color:var(--gold);' }),
        ]);
        cartao.addEventListener('click', () => navigateTo('/diario/' + encodeURIComponent(t.id)));
        lista.append(cartao);
      });
    }

    const novo = botao('+ Novo tema', { principal: true, estilo: 'flex:1 1 100%;padding:12px 10px;', aoClicar: () => dialogoTema({ aoSalvar: desenhar }) });
    const importar = botao('Importar', { aoClicar: () => arquivo.click() });
    const exportarTodos = botao('Exportar todos', {
      aoClicar: () => {
        if (!repo.contarResumo().temas) {
          toast.info('Não há temas para exportar.');
          return;
        }
        exportarComAviso(repo.montarExportacao(null), 'diario-de-estudo');
      },
    });
    arquivo.addEventListener('change', async () => {
      const escolhido = arquivo.files && arquivo.files[0];
      arquivo.value = '';
      await importarDoArquivo(escolhido, desenhar);
    });

    raiz.append(
      criar('p', { texto: 'Organize versículos por tema e guarde suas anotações.', style: 'margin:0 0 14px;opacity:.85;' }),
      criar('div', { style: 'display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;' }, [novo, importar, exportarTodos]),
      lista,
      arquivo,
    );
    container.append(raiz);
    desenhar();
  },
};

// ---------- tela: um tema ----------
export const diaryThemePage = {
  render(container, params) {
    container.innerHTML = '';
    const id = params && params.id;
    const raiz = criar('section', { class: 'page', style: 'padding-bottom:110px;' });
    container.append(raiz);

    async function desenhar() {
      const tema = repo.obterTema(id);
      raiz.replaceChildren();
      if (!tema) {
        raiz.append(
          criar('div', { class: 'state-message', texto: 'Tema não encontrado.' }),
          botao('Voltar aos temas', { principal: true, estilo: 'width:100%;padding:12px 10px;', aoClicar: () => navigateTo('/diario') }),
        );
        return;
      }
      setHeaderTitle(tema.nome);
      const lista = await livros().catch(() => []);

      const acoes = criar('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0;' }, [
        botao('Editar', { estilo: 'padding:12px 10px;', aoClicar: () => dialogoTema({ tema, aoSalvar: desenhar }) }),
        botao('Compartilhar', {
          estilo: 'padding:12px 10px;',
          aoClicar: () => {
            if (!tema.passagens.length && !tema.descricao) {
              toast.info('Adicione passagens antes de compartilhar.');
              return;
            }
            compartilharTema(tema).catch(() => toast.error('Não foi possível compartilhar agora.'));
          },
        }),
        botao('Exportar', { estilo: 'padding:12px 10px;', aoClicar: () => exportarComAviso(repo.montarExportacao([tema.id]), 'diario-' + nomeParaArquivo(tema.nome)) }),
        botao('Apagar tema', {
          estilo: 'padding:12px 10px;color:var(--danger);',
          aoClicar: () => {
            if (!window.confirm(`Apagar o tema "${tema.nome}" e suas ${plural(tema.passagens.length, 'passagem', 'passagens')}? Não dá para desfazer.`)) return;
            repo.apagarTema(tema.id);
            toast.info('Tema apagado.');
            navigateTo('/diario');
          },
        }),
      ]);

      raiz.append(
        criar('div', { style: ESTILO_CARTAO }, [
          criar('div', { texto: tema.nome, style: 'font-weight:600;font-size:20px;font-family:var(--font-display);color:var(--gold);' }),
          tema.descricao ? criar('div', { texto: tema.descricao, style: 'margin-top:6px;opacity:.85;line-height:1.5;' }) : null,
        ]),
        acoes,
        botao('+ Adicionar passagem', { principal: true, estilo: 'width:100%;padding:12px 10px;margin-bottom:16px;', aoClicar: () => dialogoPassagem({ temaId: tema.id, aoSalvar: desenhar }) }),
      );

      if (!tema.passagens.length) {
        raiz.append(criar('div', { class: 'state-message', texto: 'Este tema ainda não tem passagens. Toque em "Adicionar passagem" ou, no leitor, toque num versículo e escolha "Diário".' }));
        return;
      }

      tema.passagens.forEach((p) => {
        const corpo = criar('div', { texto: 'Carregando…', style: 'margin-top:6px;line-height:1.6;opacity:.7;' });
        textoDaPassagem(p).then((texto) => {
          corpo.textContent = texto || 'Texto indisponível nesta versão.';
          corpo.style.opacity = '1';
        });
        raiz.append(
          criar('div', { style: ESTILO_CARTAO }, [
            criar('div', { texto: rotuloPassagem(p, lista), style: 'color:var(--gold);font-weight:600;' }),
            corpo,
            p.nota ? criar('div', { texto: p.nota, style: 'margin-top:8px;font-style:italic;font-size:14px;border-left:3px solid var(--gold);padding-left:10px;white-space:pre-wrap;' }) : null,
            criar('div', { style: 'display:flex;gap:8px;margin-top:12px;' }, [
              botao('Abrir', { estilo: 'padding:10px 8px;', aoClicar: () => navigateTo(`/biblia/${p.livro}/${p.capitulo}/versiculo/${p.versiculoIni}`) }),
              botao(p.nota ? 'Editar nota' : 'Anotar', { estilo: 'padding:10px 8px;', aoClicar: () => dialogoNota({ temaId: tema.id, passagem: p, aoSalvar: desenhar }) }),
              botao('Remover', {
                estilo: 'padding:10px 8px;color:var(--danger);',
                aoClicar: () => {
                  if (!window.confirm('Remover esta passagem do tema?')) return;
                  repo.removerPassagem(tema.id, p.id);
                  desenhar();
                },
              }),
            ]),
          ]),
        );
      });
    }

    desenhar();
  },
};
