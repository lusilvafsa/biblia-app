// Backup e restauração dos dados da conta: favoritos, anotações e grifos.
// O arquivo é um .json com versão, para o formato poder crescer sem quebrar
// backups antigos. Importar NUNCA apaga nada.
import { favoritesRepository } from '../data-access/favoritesRepository.js';
import { highlightRepository } from '../data-access/highlightRepository.js';
import { usuarioAtual } from '../supabaseAuth.js';
import { planProgressRepository } from '../data-access/planProgressRepository.js';
import { statsRepository } from '../data-access/statsRepository.js';
import { getReadingPlan } from '../../data/readingPlans.js';

const FORMATO = 'biblia-de-estudo-backup';
const VERSAO = 1;
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_ITENS = 20000;
const CHAVES_PERIGOSAS = ['__proto__', 'constructor', 'prototype'];

function limpaTexto(valor, max) {
  return String(valor)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, max);
}

function limparItem(bruto) {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;
  if (typeof bruto.id !== 'string' || !bruto.id || bruto.id.length > 100) return null;
  const item = {};
  for (const [chave, valor] of Object.entries(bruto)) {
    if (chave.length > 40 || CHAVES_PERIGOSAS.includes(chave)) continue;
    if (typeof valor === 'string') {
      item[chave] = limpaTexto(valor, chave === 'text' || chave === 'note' ? 5000 : 300);
    } else if (typeof valor === 'number' && Number.isFinite(valor)) {
      item[chave] = valor;
    } else if (typeof valor === 'boolean' || valor === null) {
      item[chave] = valor;
    }
  }
  for (const chave of ['bookIndex', 'chapterIndex', 'verseIndex']) {
    if (chave in item && !(Number.isInteger(item[chave]) && item[chave] >= 0 && item[chave] < 1000)) return null;
  }
  for (const chave of ['createdAt', 'updatedAt']) {
    if (typeof item[chave] === 'string' && Number.isNaN(Date.parse(item[chave]))) {
      item[chave] = new Date().toISOString();
    }
  }
  return item;
}

function limparGrifos(bruto) {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;
  const grifos = {};
  for (const [chave, cor] of Object.entries(bruto)) {
    if (!/^\d{1,3}-\d{1,3}-\d{1,3}$/.test(chave)) continue;
    const corOk = (typeof cor === 'string' && /^[A-Za-z0-9_-]{1,30}$/.test(cor)) || Number.isInteger(cor);
    if (corOk) grifos[chave] = cor;
  }
  return grifos;
}

function limparPlanos(bruto) {
  const planos = {};
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return planos;
  for (const [planId, valor] of Object.entries(bruto)) {
    if (CHAVES_PERIGOSAS.includes(planId) || !/^[A-Za-z0-9_-]{1,60}$/.test(planId)) continue;
    const plano = getReadingPlan(planId);
    if (!plano || !Array.isArray(plano.dias)) continue;
    const validos = new Set(plano.dias.map((d) => d.dia));
    const dias = Array.isArray(valor && valor.diasConcluidos) ? valor.diasConcluidos : [];
    const limpos = [...new Set(dias.filter((d) => Number.isInteger(d) && validos.has(d)))];
    if (limpos.length > 0) planos[planId] = { diasConcluidos: limpos };
  }
  return planos;
}

function limparLeitura(bruto) {
  const vazio = { readDays: [], bestStreak: 0 };
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return vazio;
  const limite = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const dias = Array.isArray(bruto.readDays) ? bruto.readDays.slice(0, 5000) : [];
  const validos = [...new Set(dias.filter((d) =>
    typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) &&
    d >= '2020-01-01' && d <= limite))];
  const melhor = Number.isInteger(bruto.bestStreak) && bruto.bestStreak >= 0 && bruto.bestStreak <= 5000
    ? bruto.bestStreak : 0;
  return { readDays: validos, bestStreak: melhor };
}

async function lerArquivo(arquivo) {
  if (!arquivo) throw new Error('Nenhum arquivo escolhido.');
  if (arquivo.size > MAX_BYTES) throw new Error('Arquivo grande demais para ser um backup.');
  let dados;
  try {
    dados = JSON.parse(await arquivo.text());
  } catch (_e) {
    throw new Error('O arquivo não é um backup válido.');
  }
  if (!dados || dados.formato !== FORMATO) {
    throw new Error('Este arquivo não é um backup da Bíblia de Estudo.');
  }
  if (typeof dados.versao !== 'number' || dados.versao > VERSAO) {
    throw new Error('Backup de uma versão mais nova do app. Atualize o app e tente de novo.');
  }
  return dados;
}

export async function exportarBackup() {
  if (!usuarioAtual()) throw new Error('Entre na sua conta para gerar o backup.');
  const favoritos = favoritesRepository.getAll();
  const grifos = highlightRepository.getAll() || {};
  const planos = planProgressRepository.exportAll();
  const leitura = statsRepository.exportReading();
  const backup = {
    formato: FORMATO,
    versao: VERSAO,
    geradoEm: new Date().toISOString(),
    favoritos,
    grifos,
    planos,
    leitura,
  };
  const json = JSON.stringify(backup, null, 2);
  const nome = `biblia-de-estudo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const resumo = {
    favoritos: favoritos.length,
    grifos: Object.keys(grifos).length,
    planos: Object.keys(planos).length,
    diasLidos: leitura.readDays.length,
  };

  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  const nativo = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const fs = nativo && cap.Plugins ? cap.Plugins.Filesystem : null;
  const share = nativo && cap.Plugins ? cap.Plugins.Share : null;

  if (fs && share) {
    const gravado = await fs.writeFile({ path: nome, data: json, directory: 'CACHE', encoding: 'utf8' });
    try {
      await share.share({
        title: 'Backup da Bíblia de Estudo',
        url: gravado.uri,
        dialogTitle: 'Salvar ou enviar o backup',
      });
    } catch (err) {
      if (!/cancel/i.test(String(err && err.message))) throw err;
    }
    return resumo;
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return resumo;
}

export async function importarBackup(arquivo) {
  if (!usuarioAtual()) throw new Error('Entre na sua conta para importar um backup.');
  const dados = await lerArquivo(arquivo);
  const bruto = Array.isArray(dados.favoritos) ? dados.favoritos.slice(0, MAX_ITENS) : [];
  const itens = bruto.map(limparItem).filter(Boolean);
  const grifos = limparGrifos(dados.grifos) || {};
  const planos = limparPlanos(dados.planos);
  const leitura = limparLeitura(dados.leitura);
  if (itens.length === 0 && Object.keys(grifos).length === 0 && Object.keys(planos).length === 0 && leitura.readDays.length === 0) {
    throw new Error('O backup não tem nenhum item válido para importar.');
  }
  const rFav = await favoritesRepository.importItems(itens);
  const rGri = await highlightRepository.importMap(grifos);
  const rPla = await planProgressRepository.importPlans(planos);
  const rLei = statsRepository.importReading(leitura);
  if (!rFav.ok || !rGri.ok || !rPla.ok) throw new Error('Entre na sua conta para importar um backup.');
  return { favoritos: rFav, grifos: rGri, planos: rPla, leitura: rLei, descartados: bruto.length - itens.length };
}
