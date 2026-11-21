'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const ROOT = path.resolve(__dirname, '../..');
const OFFICIAL = path.join(ROOT, 'www/data/titleStudies.js');
const FIXTURE = path.join(ROOT, 'tests/fixtures/title-studies/existing.json');
const FIXTURE_SHA256 = '1d8d68d568c12f87c7395cedb36b1379be75481fdb450d7d6acf625d41a5f29e';
const FIELDS = ['identificacao', 'explicacao', 'contexto', 'aplicacao', 'conceitos', 'referencias'];
const VERSIONS = ['acf', 'blivre', 'alm1911'];

// Gramática de dados: strings JSON, objetos, arrays e comentários. Nunca executa JS.
function parseData(source, module = false) {
  let pos = 0;
  const fail = (message) => { throw new Error(`${message} (posição ${pos})`); };
  function skip() {
    for (;;) {
      const match = /^(?:\s+|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)/.exec(source.slice(pos));
      if (!match) return;
      pos += match[0].length;
    }
  }
  function take(token) {
    skip();
    if (!source.startsWith(token, pos)) fail(`Esperado ${token}`);
    pos += token.length;
  }
  function string() {
    skip();
    const match = /^"(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/.exec(source.slice(pos));
    if (!match) fail('Esperada string com aspas duplas');
    pos += match[0].length;
    return JSON.parse(match[0]);
  }
  function value() {
    skip();
    if (source[pos] === '"') return string();
    if (source[pos] === '{') {
      pos++;
      const result = {};
      skip();
      while (source[pos] !== '}') {
        skip();
        let key;
        if (source[pos] === '"') key = string();
        else {
          const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(source.slice(pos));
          if (!match) fail('Esperada propriedade de dados');
          key = match[0]; pos += key.length;
        }
        if (Object.hasOwn(result, key)) fail(`Chave duplicada: ${key}`);
        if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(`Propriedade proibida: ${key}`);
        take(':'); result[key] = value(); skip();
        if (source[pos] !== ',') break;
        pos++; skip();
      }
      take('}'); return result;
    }
    if (source[pos] === '[') {
      pos++;
      const result = [];
      skip();
      while (source[pos] !== ']') {
        result.push(value()); skip();
        if (source[pos] !== ',') break;
        pos++; skip();
      }
      take(']'); return result;
    }
    fail('Somente objetos, arrays e strings são permitidos');
  }
  if (module) {
    skip();
    const prefix = /^export\s+const\s+TITLE_STUDIES\s*=/.exec(source.slice(pos));
    if (!prefix) fail('Esperado export const TITLE_STUDIES =');
    pos += prefix[0].length;
  }
  const result = value(); skip();
  if (module && source[pos] === ';') { pos++; skip(); }
  if (pos !== source.length) fail('Código ou conteúdo extra proibido');
  if (!result || Array.isArray(result) || typeof result !== 'object') fail('Esperado objeto raiz');
  return result;
}

const readModule = (file) => parseData(fs.readFileSync(file, 'utf8'), true);
const norm = (text) => String(text).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
function bible(version = 'acf') {
  if (!VERSIONS.includes(version)) throw new Error('Versão inválida');
  const dir = path.join(ROOT, 'www/data/bible', version);
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  const cache = new Map();
  return { version, index, book(b) {
    if (!Number.isSafeInteger(b) || b < 0 || b >= index.length) throw new Error('Livro inexistente');
    if (!cache.has(b)) cache.set(b, JSON.parse(fs.readFileSync(path.join(dir, `${b}.json`), 'utf8')));
    return cache.get(b);
  } };
}
function bookIndex(data, name) {
  const needle = norm(name) === 'salmo' ? 'salmos' : norm(name);
  const b = data.index.findIndex((item) => [norm(item.name), norm(item.abbrev)].includes(needle));
  if (b < 0) throw new Error(`Livro desconhecido: ${name}`);
  return b;
}
function positive(value, label) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw new Error(`${label} inválido`);
  return Number(value);
}
function passage(data, b, chapter, start) {
  chapter = positive(chapter, 'Capítulo'); start = positive(start, 'Versículo');
  const verses = data.book(b).chapters[chapter - 1];
  if (!verses || start > verses.length) throw new Error('Capítulo ou versículo inexistente');
  const titles = JSON.parse(fs.readFileSync(path.join(ROOT, `www/data/titles/${b}.json`), 'utf8'));
  const chapterTitles = titles[String(chapter)] || {};
  const starts = Object.keys(chapterTitles).map((v) => positive(v, 'Início do título')).sort((a, z) => a - z);
  if (starts.some((n) => n > verses.length)) throw new Error('Título fora do capítulo');
  if (!Object.hasOwn(chapterTitles, String(start))) throw new Error('Versículo não é início de título');
  const end = (starts.find((n) => n > start) || verses.length + 1) - 1;
  const title = chapterTitles[String(start)];
  if (typeof title !== 'string' || !title.trim()) throw new Error('Título vazio');
  const interval = start === end ? String(start) : `${start}–${end}`;
  return { key: `${b}-${chapter - 1}-${start - 1}`, book: data.index[b].name, chapter, start, end, title,
    identificacao: `${data.index[b].name} ${chapter}:${interval} — ${title}`,
    version: data.version, verses: verses.slice(start - 1, end) };
}
function reference(data, ref) {
  const match = /^(.+?) ([1-9]\d*)(?::([1-9]\d*)(?:[–—-]([1-9]\d*))?)?$/.exec(ref);
  if (!match) throw new Error(`Referência não suportada: ${ref}`);
  const b = bookIndex(data, match[1]);
  const verses = data.book(b).chapters[positive(match[2], 'Capítulo') - 1];
  if (!verses) throw new Error(`Capítulo inexistente: ${ref}`);
  if (match[3]) {
    const start = positive(match[3], 'Versículo');
    const end = positive(match[4] || match[3], 'Versículo');
    if (start > end || end > verses.length) throw new Error(`Intervalo inexistente: ${ref}`);
  }
}
function readFixture(file = FIXTURE) {
  const bytes = fs.readFileSync(file);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== FIXTURE_SHA256) {
    throw new Error(`Fixture de proteção adulterada: SHA-256 divergente em ${file}; esperado ${FIXTURE_SHA256}; encontrado ${actual}`);
  }
  return parseData(bytes.toString('utf8'));
}
function protectedStudies(studies) {
  const existing = readFixture();
  if (Object.keys(existing).sort().join(',') !== '0-0-0,0-0-25,0-1-0,0-1-3') throw new Error('Fixture de proteção inválida');
  for (const [key, value] of Object.entries(existing)) {
    try { assert.deepStrictEqual(studies[key], value); }
    catch { throw new Error(`Estudo protegido alterado ou removido: ${key}`); }
  }
}
function validate(studies, data = bible()) {
  const errors = [], warnings = [];
  try { protectedStudies(studies); } catch (error) { errors.push(error.message); }
  for (const [key, study] of Object.entries(studies)) {
    try {
      if (!/^(0|[1-9]\d*)-(0|[1-9]\d*)-(0|[1-9]\d*)$/.test(key)) throw new Error('Chave inválida');
      const [b, c, v] = key.split('-').map(Number);
      const p = passage(data, b, c + 1, v + 1);
      if (!study || Array.isArray(study) || typeof study !== 'object') throw new Error('Estudo deve ser objeto');
      if (Object.keys(study).sort().join(',') !== [...FIELDS].sort().join(',')) throw new Error('Campos obrigatórios ausentes ou campos extras');
      for (const field of FIELDS.filter((f) => f !== 'referencias')) {
        if (typeof study[field] !== 'string' || !study[field].trim()) throw new Error(`Campo vazio ou inválido: ${field}`);
        if (study[field].length > 3000) warnings.push(`${key}: ${field} excede 3000 caracteres`);
      }
      if (study.identificacao !== p.identificacao) throw new Error(`Identificação incorreta; esperado ${p.identificacao}`);
      const concepts = study.conceitos.split(/\.\s+(?=[A-ZÀ-Ú][^:]{1,70}:)/u);
      if (concepts.some((item) => !/^[^:]+:\s*\S/.test(item))) throw new Error('Conceitos devem usar Termo: definição');
      if (!Array.isArray(study.referencias) || !study.referencias.length) throw new Error('Referências devem ser uma lista não vazia');
      const seen = new Set();
      for (const item of study.referencias) {
        if (!item || Array.isArray(item) || Object.keys(item).sort().join(',') !== 'explicacao,ref' ||
          typeof item.ref !== 'string' || !item.ref.trim() || typeof item.explicacao !== 'string' || !item.explicacao.trim()) throw new Error('Referência incompleta ou inválida');
        reference(data, item.ref);
        if (seen.has(norm(item.ref))) warnings.push(`${key}: referência repetida ${item.ref}`);
        seen.add(norm(item.ref));
      }
      const sections = ['explicacao', 'contexto', 'aplicacao', 'conceitos'].map((f) => norm(study[f]));
      if (new Set(sections).size < sections.length) warnings.push(`${key}: seções repetidas`);
    } catch (error) { errors.push(`${key}: ${error.message}`); }
  }
  return { errors, warnings, count: Object.keys(studies).length };
}
function assertValid(studies, data) {
  const result = validate(studies, data);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  return result;
}
// Só aceita a própria raiz temporária ou um subdiretório real dela.
function tempBase() { return fs.realpathSync(os.tmpdir()); }
function createWorkspace() { return fs.mkdtempSync(path.join(tempBase(), 'title-studies-')); }
function writeTemporary(file, contents) {
  const parent = fs.realpathSync(path.dirname(path.resolve(file)));
  const relative = path.relative(tempBase(), parent);
  const first = relative.split(path.sep)[0];
  if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !/^title-studies-[A-Za-z0-9]+$/.test(first)) {
    throw new Error('Destino deve estar em diretório temporário title-studies-* criado pela ferramenta');
  }
  const projectRelative = path.relative(ROOT, parent);
  if (projectRelative === '' || (!projectRelative.startsWith('..') && !path.isAbsolute(projectRelative))) throw new Error('Destino dentro do projeto proibido');
  const destination = path.join(parent, path.basename(file));
  fs.writeFileSync(destination, contents, { flag: 'wx', mode: 0o600 });
  return destination;
}
function generate({ book, chapter, verse, version = 'acf', content, out }) {
  const data = bible(version);
  const p = passage(data, bookIndex(data, book), chapter, verse);
  const current = readModule(OFFICIAL);
  assertValid(current, data);
  if (Object.hasOwn(current, p.key)) throw new Error(`Chave já cadastrada: ${p.key}`);
  let body, name;
  if (content === undefined) {
    body = JSON.stringify(p, null, 2) + '\n'; name = 'passagem.json';
  } else {
    const study = parseData(fs.readFileSync(content, 'utf8'));
    const candidate = { ...current, [p.key]: study };
    assertValid(candidate, data);
    body = `export const TITLE_STUDIES = ${JSON.stringify(candidate, null, 2)};\n`;
    name = 'titleStudies.candidate.mjs';
  }
  const destination = out || path.join(createWorkspace(), name);
  return { file: writeTemporary(destination, body), passage: p, candidate: content !== undefined };
}
function options(args, allowed) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const option = args[i];
    if (!option.startsWith('--') || !allowed.includes(option.slice(2)) || args[i + 1] === undefined || args[i + 1].startsWith('--') || Object.hasOwn(result, option.slice(2))) throw new Error(`Argumento inválido: ${option}`);
    result[option.slice(2)] = args[i + 1];
  }
  return result;
}

module.exports = { ROOT, OFFICIAL, FIXTURE, readFixture, parseData, readModule, bible, bookIndex, passage, reference,
  validate, assertValid, protectedStudies, createWorkspace, writeTemporary, generate, options };
