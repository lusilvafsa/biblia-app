// Diário de Estudo: temas e passagens guardados só neste aparelho.
// Uma passagem guarda apenas a REFERÊNCIA (livro, capítulo, versículos); o texto é
// buscado na versão da Bíblia escolhida. Índices são base 0, como no resto do app.
import { getItem, setItem } from '../utils/storage.js';

const CHAVE = 'biblia:diario';
export const FORMATO_DIARIO = 'biblia-de-estudo-diario';
export const VERSAO_DIARIO = 1;

const MAX_TEMAS = 500;
const MAX_PASSAGENS = 2000;
const MAX_NOME = 80;
const MAX_DESCRICAO = 500;
const MAX_NOTA = 2000;

function agora() {
  return new Date().toISOString();
}

function novoId(prefixo) {
  return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// Texto digitado pelo próprio usuário: só tira caracteres de controle.
function limpar(valor, max) {
  return String(valor ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

// Texto vindo de arquivo de fora: também tira marcação HTML.
function limparImportado(valor, max) {
  return limpar(String(valor ?? '').replace(/<[^>]*>/g, ''), max);
}

function normalizar(nome) {
  return String(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function ler() {
  const salvo = getItem(CHAVE, null);
  if (!salvo || typeof salvo !== 'object' || !Array.isArray(salvo.temas)) {
    return { versao: VERSAO_DIARIO, temas: [] };
  }
  return salvo;
}

function gravar(dados) {
  try {
    setItem(CHAVE, dados);
    return true;
  } catch (_e) {
    return false;
  }
}

function passagemValida(p) {
  const numeros = [p.livro, p.capitulo, p.versiculoIni, p.versiculoFim];
  if (!numeros.every((n) => Number.isInteger(n) && n >= 0)) return false;
  return p.livro < 66 && p.capitulo < 200 && p.versiculoIni < 200 && p.versiculoFim < 200 && p.versiculoFim >= p.versiculoIni;
}

function mesmaPassagem(a, b) {
  return a.livro === b.livro && a.capitulo === b.capitulo && a.versiculoIni === b.versiculoIni && a.versiculoFim === b.versiculoFim;
}

function normalizarPassagem(p) {
  const ini = Number(p.versiculoIni);
  return {
    livro: Number(p.livro),
    capitulo: Number(p.capitulo),
    versiculoIni: ini,
    versiculoFim: Number(p.versiculoFim ?? ini),
  };
}

export function listarTemas() {
  return clonar(ler().temas).sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)));
}

export function obterTema(id) {
  const t = ler().temas.find((x) => x.id === id);
  return t ? clonar(t) : null;
}

export function contarResumo() {
  const temas = ler().temas;
  return { temas: temas.length, passagens: temas.reduce((n, t) => n + t.passagens.length, 0) };
}

export function criarTema({ nome, descricao = '' }) {
  const n = limpar(nome, MAX_NOME);
  if (!n) return { ok: false, erro: 'Dê um nome ao tema.' };
  const dados = ler();
  if (dados.temas.length >= MAX_TEMAS) return { ok: false, erro: 'Você atingiu o limite de temas.' };
  if (dados.temas.some((t) => normalizar(t.nome) === normalizar(n))) {
    return { ok: false, erro: 'Já existe um tema com esse nome.' };
  }
  const tema = {
    id: novoId('tema'),
    nome: n,
    descricao: limpar(descricao, MAX_DESCRICAO),
    criadoEm: agora(),
    atualizadoEm: agora(),
    passagens: [],
  };
  dados.temas.push(tema);
  if (!gravar(dados)) return { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
  return { ok: true, tema: clonar(tema) };
}

export function editarTema(id, { nome, descricao = '' }) {
  const n = limpar(nome, MAX_NOME);
  if (!n) return { ok: false, erro: 'Dê um nome ao tema.' };
  const dados = ler();
  const tema = dados.temas.find((t) => t.id === id);
  if (!tema) return { ok: false, erro: 'Tema não encontrado.' };
  if (dados.temas.some((t) => t.id !== id && normalizar(t.nome) === normalizar(n))) {
    return { ok: false, erro: 'Já existe um tema com esse nome.' };
  }
  tema.nome = n;
  tema.descricao = limpar(descricao, MAX_DESCRICAO);
  tema.atualizadoEm = agora();
  if (!gravar(dados)) return { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
  return { ok: true, tema: clonar(tema) };
}

export function apagarTema(id) {
  const dados = ler();
  const antes = dados.temas.length;
  dados.temas = dados.temas.filter((t) => t.id !== id);
  if (dados.temas.length === antes) return { ok: false, erro: 'Tema não encontrado.' };
  return gravar(dados) ? { ok: true } : { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
}

export function adicionarPassagem(temaId, entrada) {
  const p = normalizarPassagem(entrada);
  if (!passagemValida(p)) return { ok: false, erro: 'Passagem inválida.' };
  const dados = ler();
  const tema = dados.temas.find((t) => t.id === temaId);
  if (!tema) return { ok: false, erro: 'Tema não encontrado.' };
  if (tema.passagens.length >= MAX_PASSAGENS) return { ok: false, erro: 'Este tema atingiu o limite de passagens.' };
  if (tema.passagens.some((q) => mesmaPassagem(q, p))) return { ok: false, erro: 'Essa passagem já está neste tema.' };
  const nova = { id: novoId('p'), ...p, nota: limpar(entrada.nota, MAX_NOTA), criadoEm: agora() };
  tema.passagens.push(nova);
  tema.atualizadoEm = agora();
  if (!gravar(dados)) return { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
  return { ok: true, passagem: clonar(nova) };
}

export function editarPassagem(temaId, passagemId, { nota }) {
  const dados = ler();
  const tema = dados.temas.find((t) => t.id === temaId);
  const passagem = tema && tema.passagens.find((q) => q.id === passagemId);
  if (!passagem) return { ok: false, erro: 'Passagem não encontrada.' };
  passagem.nota = limpar(nota, MAX_NOTA);
  tema.atualizadoEm = agora();
  return gravar(dados) ? { ok: true } : { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
}

export function removerPassagem(temaId, passagemId) {
  const dados = ler();
  const tema = dados.temas.find((t) => t.id === temaId);
  if (!tema) return { ok: false, erro: 'Tema não encontrado.' };
  const antes = tema.passagens.length;
  tema.passagens = tema.passagens.filter((q) => q.id !== passagemId);
  if (tema.passagens.length === antes) return { ok: false, erro: 'Passagem não encontrada.' };
  tema.atualizadoEm = agora();
  return gravar(dados) ? { ok: true } : { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
}

// Ids dos temas que já guardam exatamente esta passagem.
export function temasComPassagem(entrada) {
  const p = normalizarPassagem(entrada);
  return ler().temas.filter((t) => t.passagens.some((q) => mesmaPassagem(q, p))).map((t) => t.id);
}

// Marca ou desmarca a passagem em um tema (usado nas caixas de seleção do leitor).
export function alternarPassagemNoTema(temaId, entrada) {
  const p = normalizarPassagem(entrada);
  if (!passagemValida(p)) return { ok: false, erro: 'Passagem inválida.' };
  const dados = ler();
  const tema = dados.temas.find((t) => t.id === temaId);
  if (!tema) return { ok: false, erro: 'Tema não encontrado.' };
  const existente = tema.passagens.find((q) => mesmaPassagem(q, p));
  if (existente) {
    tema.passagens = tema.passagens.filter((q) => q.id !== existente.id);
    tema.atualizadoEm = agora();
    return gravar(dados) ? { ok: true, estado: 'removida' } : { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
  }
  if (tema.passagens.length >= MAX_PASSAGENS) return { ok: false, erro: 'Este tema atingiu o limite de passagens.' };
  tema.passagens.push({ id: novoId('p'), ...p, nota: '', criadoEm: agora() });
  tema.atualizadoEm = agora();
  return gravar(dados) ? { ok: true, estado: 'adicionada' } : { ok: false, erro: 'Não foi possível salvar neste aparelho.' };
}

// Objeto pronto para virar arquivo .json. ids = lista de temas, ou null para todos.
export function montarExportacao(ids = null) {
  const temas = ler().temas.filter((t) => !ids || ids.includes(t.id));
  return {
    formato: FORMATO_DIARIO,
    versao: VERSAO_DIARIO,
    geradoEm: agora(),
    temas: temas.map((t) => ({
      nome: t.nome,
      descricao: t.descricao,
      passagens: t.passagens.map((q) => ({
        livro: q.livro,
        capitulo: q.capitulo,
        versiculoIni: q.versiculoIni,
        versiculoFim: q.versiculoFim,
        nota: q.nota,
      })),
    })),
  };
}

export function exportarTudo() {
  return montarExportacao(null);
}

// Junta temas de um arquivo ao diário. Nunca apaga nada e não duplica:
// tema com o mesmo nome recebe só as passagens que faltam.
export function importarTemas(arquivo) {
  if (!arquivo || arquivo.formato !== FORMATO_DIARIO) {
    throw new Error('Este arquivo não é um Diário de Estudo da Bíblia de Estudo LS.');
  }
  if (typeof arquivo.versao !== 'number' || arquivo.versao > VERSAO_DIARIO) {
    throw new Error('Arquivo de uma versão mais nova do app. Atualize o app e tente de novo.');
  }
  const entrada = Array.isArray(arquivo.temas) ? arquivo.temas.slice(0, MAX_TEMAS) : [];
  const dados = ler();
  let temasNovos = 0;
  let temasAtualizados = 0;
  let passagensNovas = 0;
  let descartados = 0;

  for (const bruto of entrada) {
    const nome = limparImportado(bruto && bruto.nome, MAX_NOME);
    if (!nome) {
      descartados++;
      continue;
    }
    let tema = dados.temas.find((t) => normalizar(t.nome) === normalizar(nome));
    let criado = false;
    if (!tema) {
      if (dados.temas.length >= MAX_TEMAS) {
        descartados++;
        continue;
      }
      tema = {
        id: novoId('tema'),
        nome,
        descricao: limparImportado(bruto.descricao, MAX_DESCRICAO),
        criadoEm: agora(),
        atualizadoEm: agora(),
        passagens: [],
      };
      dados.temas.push(tema);
      criado = true;
    }
    let mudou = false;
    const lista = Array.isArray(bruto.passagens) ? bruto.passagens.slice(0, MAX_PASSAGENS) : [];
    for (const q of lista) {
      const p = normalizarPassagem({
        livro: q && q.livro,
        capitulo: q && q.capitulo,
        versiculoIni: q && q.versiculoIni,
        versiculoFim: q && (q.versiculoFim ?? q.versiculoIni),
      });
      if (!passagemValida(p)) {
        descartados++;
        continue;
      }
      if (tema.passagens.some((x) => mesmaPassagem(x, p))) continue;
      if (tema.passagens.length >= MAX_PASSAGENS) {
        descartados++;
        continue;
      }
      tema.passagens.push({ id: novoId('p'), ...p, nota: limparImportado(q.nota, MAX_NOTA), criadoEm: agora() });
      passagensNovas++;
      mudou = true;
    }
    if (criado) temasNovos++;
    else if (mudou) {
      temasAtualizados++;
      tema.atualizadoEm = agora();
    }
  }
  if (!gravar(dados)) throw new Error('Não foi possível salvar neste aparelho.');
  return { temasNovos, temasAtualizados, passagensNovas, descartados };
}
