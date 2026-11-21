'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const c = require('../scripts/title-studies/core.cjs');

const hash = () => crypto.createHash('sha256').update(fs.readFileSync(c.OFFICIAL)).digest('hex');
const originalHash = hash();
const originals = c.readModule(c.OFFICIAL);
const workspace = c.createWorkspace();
const protectedKeys = ['0-0-0', '0-0-25', '0-1-0', '0-1-3'];
const content = path.join(workspace, 'conteudo-sintetico.json');
// Dados técnicos para testar geração; não constituem estudo editorial ou aprovado.
const study = {
  identificacao: 'Gênesis 2:18–25 — A Criação da Mulher',
  explicacao: 'Conteúdo sintético para verificar o campo explicacao.',
  contexto: 'Conteúdo técnico para verificar o campo contexto.',
  aplicacao: 'Texto de teste para verificar o campo aplicacao.',
  conceitos: 'Teste: verificação técnica de estrutura.',
  referencias: [{ ref: 'Gênesis 2:18–25', explicacao: 'Referência usada somente para testar limites válidos.' }]
};
c.writeTemporary(content, JSON.stringify(study, null, 2) + '\n');
const candidate = { ...originals, '0-1-17': study };
function rejectChange(change, pattern) {
  const copy = structuredClone(candidate);
  change(copy);
  const result = c.validate(copy);
  assert.ok(result.errors.some((error) => pattern.test(error)), result.errors.join('\n'));
}
function cli(script, args) {
  return spawnSync(process.execPath, [path.join(c.ROOT, 'scripts', script), ...args], { encoding: 'utf8', cwd: c.ROOT });
}

test('fixture preserva os quatro estudos históricos sem limitar o catálogo atual', () => {
  const fixture = c.readFixture();
  assert.deepStrictEqual(Object.keys(fixture).sort(), protectedKeys);
  for (const key of protectedKeys) assert.deepStrictEqual(originals[key], fixture[key]);
  assert.deepStrictEqual(c.validate(originals).errors, []);
});

test('catálogo e mapa de status classificam todos os estudos sem sobreposição ou órfãos', () => {
  const statusSource = fs.readFileSync(path.join(c.ROOT, 'www/data/titleStudyStatus.js'), 'utf8');
  const readKeys = (name) => {
    const match = statusSource.match(new RegExp(`export const ${name} = Object\\.freeze\\((\\[[^;]+\\])\\);`));
    assert.ok(match, `Lista ${name} não encontrada no mapa de status`);
    return JSON.parse(match[1]);
  };
  const approved = readKeys('APPROVED_TITLE_STUDY_KEYS');
  const provisional = readKeys('PROVISIONAL_TITLE_STUDY_KEYS');
  const studies = Object.keys(originals);
  const approvedSet = new Set(approved);
  const provisionalSet = new Set(provisional);

  assert.equal(studies.length, 2023);
  assert.equal(approved.length, 7);
  assert.equal(provisional.length, 2016);
  assert.equal(approvedSet.size, approved.length);
  assert.equal(provisionalSet.size, provisional.length);
  assert.deepStrictEqual(approved.filter((key) => provisionalSet.has(key)), []);
  assert.deepStrictEqual(studies.filter((key) => !approvedSet.has(key) && !provisionalSet.has(key)), []);
  assert.deepStrictEqual([...approved, ...provisional].filter((key) => !Object.hasOwn(originals, key)), []);
});

test('SHA-256 rejeita cópias adulteradas da fixture antes de interpretar o conteúdo', () => {
  const before = fs.readFileSync(c.FIXTURE);
  const changed = c.parseData(before.toString('utf8'));
  changed['0-1-3'].explicacao += ' Alteração de teste.';
  const contents = [JSON.stringify(changed), before.toString('utf8') + ' ', 'JSON inválido'];
  for (const [index, body] of contents.entries()) {
    const file = path.join(workspace, `fixture-adulterada-${index}.json`);
    c.writeTemporary(file, body);
    assert.throws(() => c.readFixture(file), /Fixture de proteção adulterada: SHA-256 divergente/);
  }
  assert.deepStrictEqual(fs.readFileSync(c.FIXTURE), before);
  assert.deepStrictEqual(c.readFixture(), originals);
});

test('validação falha com fixture adulterada mesmo se os estudos tiverem a mesma alteração', (t) => {
  const before = fs.readFileSync(c.FIXTURE);
  const changed = structuredClone(originals);
  changed['0-1-3'].explicacao += ' Alteração de teste.';
  const file = path.join(workspace, 'fixture-adulterada-validacao.json');
  c.writeTemporary(file, JSON.stringify(changed));
  const read = fs.readFileSync;
  // Redireciona somente a leitura da fixture para a cópia; não grava no original.
  const mock = t.mock.method(fs, 'readFileSync', (target, ...args) =>
    read(target === c.FIXTURE ? file : target, ...args));
  try {
    const result = c.validate(changed);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /Fixture de proteção adulterada: SHA-256 divergente/);
    assert.throws(() => c.assertValid(changed), /SHA-256 divergente/);
  } finally {
    mock.mock.restore();
  }
  assert.deepStrictEqual(fs.readFileSync(c.FIXTURE), before);
  assert.deepStrictEqual(c.validate(originals).errors, []);
});

test('Gênesis 2:1 resolve 1–3 nas três versões, sem atravessar o título de 2:4', () => {
  for (const version of ['acf', 'blivre', 'alm1911']) {
    const data = c.bible(version);
    const p = c.passage(data, 0, 2, 1);
    assert.equal(p.key, '0-1-0');
    assert.equal(p.start, 1);
    assert.equal(p.end, 3);
    assert.equal(p.verses.length, 3);
    assert.equal(p.identificacao, originals['0-1-0'].identificacao);
    assert.deepStrictEqual(p.verses, data.book(0).chapters[1].slice(0, 3));
    assert.equal(c.passage(data, 0, 2, 4).end, 17);
    assert.equal(c.passage(data, 0, 2, 18).end, 25);
    assert.deepStrictEqual(c.validate(originals, data).errors, []);
  }
});

test('Gênesis 2:4–17 mantém o texto aprovado e termina antes do título em 2:18', () => {
  const p = c.passage(c.bible('acf'), 0, 2, 4);
  assert.equal(p.key, '0-1-3');
  assert.equal(p.start, 4);
  assert.equal(p.end, 17);
  assert.equal(p.verses.length, 14);
  assert.equal(p.identificacao, originals['0-1-3'].identificacao);
  assert.ok(originals['0-1-3'].explicacao.includes('Um vapor subia da terra e regava toda a superfície do solo.'));
  assert.equal(c.passage(c.bible('acf'), 0, 2, 18).start, 18);
});

test('gerador usa ACF por padrão e preserva os quatro estudos em candidato sintético', () => {
  const prepared = c.generate({ book: 'gn', chapter: 2, verse: 18, out: path.join(workspace, 'passagem.json') });
  const passage = JSON.parse(fs.readFileSync(prepared.file, 'utf8'));
  assert.equal(passage.start, 18);
  assert.equal(passage.end, 25);
  assert.equal(passage.version, 'acf');
  assert.equal(Object.hasOwn(passage, 'explicacao'), false);
  const result = c.generate({ book: 'Gênesis', chapter: 2, verse: 18, content,
    out: path.join(workspace, 'titleStudies.candidate.mjs') });
  const actual = c.readModule(result.file);
  assert.deepStrictEqual(actual, candidate);
  for (const [key, original] of Object.entries(originals)) assert.deepStrictEqual(actual[key], original);
  for (const key of protectedKeys) assert.deepStrictEqual(actual[key], originals[key]);
  assert.deepStrictEqual(actual['0-1-17'], study);
  assert.equal(Object.keys(actual).length, Object.keys(originals).length + 1);
  console.log(`CANDIDATO SINTÉTICO DE TESTE: ${result.file}`);
});

test('CLI gera e valida o candidato e o oficial sem alterar o aplicativo', () => {
  const output = path.join(workspace, 'cli.candidate.mjs');
  const result = cli('gerar-estudo-titulo.cjs', ['--livro', 'Gênesis', '--capitulo', '2', '--versiculo', '18', '--conteudo', content, '--saida', output]);
  assert.equal(result.status, 0, result.stderr);
  for (const args of [[], ['--arquivo', output]]) {
    const checked = cli('validar-estudos-titulo.cjs', args);
    assert.equal(checked.status, 0, checked.stderr);
    assert.match(checked.stdout, /VALIDADO/);
  }
  const invalid = path.join(workspace, 'invalid.candidate.mjs');
  c.writeTemporary(invalid, 'export const TITLE_STUDIES = {};');
  const checked = cli('validar-estudos-titulo.cjs', ['--arquivo', invalid]);
  assert.equal(checked.status, 1);
  assert.match(checked.stderr, /protegido/);
});

test('recusa regravação, destino oficial, destinos dentro do projeto e links simbólicos', () => {
  assert.throws(() => c.writeTemporary(content, '{}'), /EEXIST/);
  assert.throws(() => c.writeTemporary(c.OFFICIAL, '{}'), /Destino/);
  assert.throws(() => c.writeTemporary(path.join(c.ROOT, 'tests', 'proibido.json'), '{}'), /Destino/);
  const link = path.join(workspace, 'link.candidate.mjs');
  fs.symlinkSync(c.OFFICIAL, link);
  assert.throws(() => c.writeTemporary(link, '{}'), /EEXIST/);
  const linkedParent = path.join(workspace, 'project');
  fs.symlinkSync(c.ROOT, linkedParent);
  assert.throws(() => c.writeTemporary(path.join(linkedParent, 'proibido.json'), '{}'), /Destino/);
  assert.throws(() => c.generate({ book: 'Gênesis', chapter: 1, verse: 1, content }), /já cadastrada/);
  assert.throws(() => c.generate({ book: 'Gênesis', chapter: 1, verse: 26, content }), /já cadastrada/);
});

test('gerador e CLI recusam as quatro chaves oficiais, com e sem conteúdo', () => {
  for (const [chapter, verse] of [[1, 1], [1, 26], [2, 1], [2, 4]]) {
    for (const supplied of [undefined, content]) {
      const out = path.join(workspace, `colisao-${chapter}-${verse}-${supplied ? 'conteudo' : 'entrada'}.mjs`);
      assert.throws(() => c.generate({ book: 'Gênesis', chapter, verse, content: supplied, out }), /já cadastrada/);
      const args = ['--livro', 'Gênesis', '--capitulo', String(chapter), '--versiculo', String(verse), '--saida', out];
      if (supplied) args.push('--conteudo', supplied);
      const result = cli('gerar-estudo-titulo.cjs', args);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Chave já cadastrada/);
      assert.equal(fs.existsSync(out), false);
    }
  }
});

test('rejeita alteração, remoção e reordenação das referências dos estudos originais', () => {
  for (const key of protectedKeys) {
    for (const field of ['identificacao', 'explicacao', 'contexto', 'aplicacao', 'conceitos']) {
      rejectChange((copy) => { copy[key][field] += ' Alteração.'; }, /protegido/);
    }
    rejectChange((copy) => { delete copy[key]; }, /protegido/);
    rejectChange((copy) => { copy[key].referencias.reverse(); }, /protegido/);
    rejectChange((copy) => { copy[key].referencias[0].explicacao += ' Alteração.'; }, /protegido/);
    rejectChange((copy) => { copy[key].referencias.pop(); }, /protegido/);
    rejectChange((copy) => { copy[key].referencias[0].ref = 'Gênesis 1:1'; }, /protegido/);
  }
});

test('rejeita campos vazios, tipos incorretos, campos ausentes e referências incompletas', () => {
  for (const field of ['identificacao', 'explicacao', 'contexto', 'aplicacao', 'conceitos']) {
    rejectChange((copy) => { copy['0-1-17'][field] = ' '; }, /vazio/);
    rejectChange((copy) => { copy['0-1-17'][field] = []; }, /inválido/);
    rejectChange((copy) => { delete copy['0-1-17'][field]; }, /Campos/);
  }
  rejectChange((copy) => { copy['0-1-17'].referencias = []; }, /não vazia/);
  rejectChange((copy) => { copy['0-1-17'].referencias = 'Gênesis 1'; }, /lista/);
  rejectChange((copy) => { copy['0-1-17'].referencias[0].explicacao = ''; }, /incompleta/);
  rejectChange((copy) => { copy['0-1-17'].referencias[0].ref = ''; }, /incompleta/);
  rejectChange((copy) => { copy['0-1-17'].conceitos = 'Sem definição'; }, /Conceitos/);
});

test('rejeita identificação, intervalos, títulos e coordenadas incorretos', () => {
  for (const label of [
    'Gênesis 2:18–26 — A Criação da Mulher',
    'Gênesis 2:18–25 — Outro Título',
    'Gênesis 2:18–3:1 — A Criação da Mulher'
  ]) rejectChange((copy) => { copy['0-1-17'].identificacao = label; }, /Identificação/);
  for (const key of ['00-1-0', '-1-1-0', '66-0-0', '0-50-0', '0-1-25', '0-1-1']) {
    rejectChange((copy) => { copy[key] = copy['0-1-17']; delete copy['0-1-17']; }, /inválid|inexistente|início/);
  }
  for (const input of [
    { book: 'Gênesis', chapter: '2:1–3', verse: 1 },
    { book: 'Gênesis', chapter: 2, verse: '1–3' },
    { book: 'Gênesis–Êxodo', chapter: 2, verse: 1 },
    { book: 'Gênesis', chapter: 2, verse: 2 },
    { book: 'Gênesis', chapter: 51, verse: 1 }
  ]) assert.throws(() => c.generate(input), /inválido|desconhecido|início|inexistente/);
});

test('limites de capítulos e livros: termina no próprio capítulo e não inventa título no v1', () => {
  const data = c.bible();
  assert.equal(c.passage(data, 0, 1, 26).end, 31);
  assert.equal(c.passage(data, 0, 50, 22).end, 26);
  assert.equal(c.passage(data, 65, 22, 6).end, 21);
  assert.throws(() => c.passage(data, 0, 30, 1), /início/);
});

test('referências: aceita capítulos completos e rejeita livros, capítulos e intervalos inexistentes', () => {
  for (const ref of ['Salmo 104', 'Salmos 8:4–8', 'João 1:1-3', '1 Coríntios 13']) {
    assert.doesNotThrow(() => c.reference(c.bible(), ref));
  }
  for (const ref of ['Inexistente 1:1', 'Gênesis 51', 'Gênesis 2:26', 'Gênesis 2:3–1', 'Gênesis 2:1–26', 'Gênesis 0:1', 'Gênesis 2:0', 'Gênesis 2:1–3:1', 'Gênesis 2:1–Êxodo 1:1']) {
    rejectChange((copy) => { copy['0-1-17'].referencias[0].ref = ref; }, /Referência|desconhecido|inexistente/);
  }
});

test('parser rejeita duplicatas antes de materializar objetos e nunca executa código', () => {
  for (const source of [
    'export const TITLE_STUDIES = {"0-1-0":{},"0-1-0":{}};',
    'export const TITLE_STUDIES = {"x": {"ref":"a",ref:"b"}};'
  ]) assert.throws(() => c.parseData(source, true), /duplicada/);
  for (const source of [
    'export const TITLE_STUDIES = {}; process.exit(99);',
    'export const TITLE_STUDIES = {"x": process.exit(99)};',
    'export const TITLE_STUDIES = { get x() { return {}; } };',
    'export const TITLE_STUDIES = {...{}};',
    'export const TITLE_STUDIES = {"__proto__": {}};',
    'export const OTHER = {};',
    'export const TITLE_STUDIES = {"x": `template`};',
    'export const TITLE_STUDIES = {"x": "truncado"'
  ]) assert.throws(() => c.parseData(source, true));
  assert.throws(() => c.parseData('{"explicacao":"a","explicacao":"b"}'), /duplicada/);
});

test('CLI rejeita argumentos desconhecidos, repetidos e tentativas de declarar intervalo', () => {
  for (const args of [[], ['--livro', 'Gênesis', '--livro', 'Êxodo'], ['--fim', '3'], ['--livro']]) {
    const result = cli('gerar-estudo-titulo.cjs', args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ERRO/);
  }
});

test('avisos editoriais não são aprovação de conteúdo nem erro estrutural', () => {
  const copy = structuredClone(candidate);
  copy['0-1-17'].contexto = copy['0-1-17'].explicacao;
  copy['0-1-17'].referencias.push(structuredClone(copy['0-1-17'].referencias[0]));
  const result = c.validate(copy);
  assert.deepStrictEqual(result.errors, []);
  assert.equal(result.warnings.length, 2);
});

after(() => {
  assert.equal(hash(), originalHash, 'Hash do oficial deve permanecer idêntico');
  assert.deepStrictEqual(c.readModule(c.OFFICIAL), originals);
  console.log(`SHA-256 OFICIAL ANTES/DEPOIS: ${originalHash}`);
  console.log(`ARTEFATOS DE TESTE: ${workspace}`);
  // Mantidos para inspeção; nenhum arquivo preexistente é removido.
});
