const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("o estado de erro do roteador trata mensagens como texto", () => {
  const source = read("www/js/router.js");
  const start = source.lastIndexOf("function renderErrorState(");
  assert.notEqual(start, -1, "renderErrorState deve existir");
  const handler = source.slice(start);
  assert.match(handler, /detail\.textContent/);
  assert.match(handler, /replaceChildren/);
  assert.doesNotMatch(handler, /innerHTML/);
});

test("o Service Worker só remove caches pertencentes ao Bíblia App", () => {
  const source = read("www/sw.js");
  assert.match(source, /const CACHE_PREFIX = ['"]biblia-estudo-['"]/);
  assert.match(source, /key\.startsWith\(CACHE_PREFIX\)\s*&&\s*key !== CACHE_NAME/);
});

test("os logs de autenticação não expõem IDs nem URLs OAuth", () => {
  const source = read("www/js/supabaseAuth.js");
  assert.doesNotMatch(
    source,
    /console\.log\([\s\S]{0,180}(?:user\.id|usuarioAtualEmMemoria\?\.id|data\?\.url)/
  );
});

test("o assistente não consulta nem preenche cache público com prompts arbitrários", () => {
  const source = read("supabase/functions/assistente-biblico/index.ts");
  assert.doesNotMatch(source, /assistente_cache_publico|TIPOS_CACHEAVEIS|usaCache/);
});

test("o assistente falha de forma segura quando o controle de quota não responde", () => {
  const source = read("supabase/functions/assistente-biblico/index.ts");
  assert.match(source, /if \(erroConsultaUso\)/);
  assert.match(source, /if \(erroConsultaLimite\)/);
  assert.match(source, /if \(erroReserva\)/);
});
