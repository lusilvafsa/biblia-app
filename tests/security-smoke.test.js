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

test("o OAuth web usa PKCE e detecta o retorno da sessão", () => {
  const client = read("www/js/supabaseClient.js");
  const profile = read("www/js/features/profile/profile.js");
  assert.match(client, /flowType:\s*["']pkce["']/);
  assert.match(client, /detectSessionInUrl:\s*true/);
  assert.match(profile, /if \(!usuario\) return;/);
});

test("o assistente não consulta nem preenche cache público com prompts arbitrários", () => {
  const source = read("supabase/functions/assistente-biblico/index.ts");
  assert.doesNotMatch(source, /assistente_cache_publico|TIPOS_CACHEAVEIS|usaCache/);
});

test("o assistente reserva quota por RPC atômica e falha de forma segura", () => {
  const source = read("supabase/functions/assistente-biblico/index.ts");
  assert.match(source, /adminClient\.rpc\(/);
  assert.match(source, /reservar_quota_assistente/);
  assert.match(source, /if \(erroReserva\)/);
  assert.match(source, /contagemReservada === null/);
  assert.match(source, /liberar_quota_assistente/);
  assert.match(source, /await liberarReserva\(\)/);
  assert.doesNotMatch(source, /\.from\(["']assistente_uso["']\)[\s\S]{0,300}\.upsert\(/);
});

test("o Android não inclui dados privados no backup automático do sistema", () => {
  const manifest = read("android/app/src/main/AndroidManifest.xml");
  assert.match(manifest, /android:allowBackup="false"/);
});

test("o CORS do assistente só permite origens conhecidas", () => {
  const source = read("supabase/functions/assistente-biblico/index.ts");
  assert.match(source, /ORIGENS_PERMITIDAS/);
  assert.match(source, /https:\/\/lusilvafsa\.github\.io/);
  assert.match(source, /https:\/\/localhost/);
  assert.match(source, /const corsHeaders = obterCorsHeaders\(req\);/);
  assert.doesNotMatch(source, /"Access-Control-Allow-Origin": "\*"/);
});

test("o FileProvider não expõe o armazenamento externo inteiro", () => {
  const paths = read("android/app/src/main/res/xml/file_paths.xml");
  assert.match(paths, /<cache-path/);
  assert.doesNotMatch(paths, /<external-path/);
});
