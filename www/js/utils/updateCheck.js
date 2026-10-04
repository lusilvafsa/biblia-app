// Aviso de "nova versão" para quem usa o site. No APK os arquivos vêm dentro
// do pacote, então ali o aviso não faz sentido e fica desligado.
import { APP_BUILD } from '../version.js';

const CHAVE_IGNORADO = 'biblia:update-ignorado';
const PRIMEIRA_CHECAGEM_MS = 15000;
const INTERVALO_MS = 20 * 60 * 1000;
const VOLTA_AO_APP_MS = 2 * 60 * 1000;
let ultimaChecagem = 0;

function ehApp() {
  const cap = window.Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

function lerIgnorado() {
  try {
    return Number(sessionStorage.getItem(CHAVE_IGNORADO)) || 0;
  } catch (_e) {
    return 0;
  }
}

function gravarIgnorado(n) {
  try {
    sessionStorage.setItem(CHAVE_IGNORADO, String(n));
  } catch (_e) {
    /* ignora */
  }
}

function mostrarAviso(buildNovo) {
  if (document.getElementById('avisoNovaVersao')) return;
  const caixa = document.createElement('div');
  caixa.id = 'avisoNovaVersao';
  caixa.setAttribute('role', 'status');
  caixa.style.cssText =
    'position:fixed;left:12px;right:96px;bottom:calc(16px + env(safe-area-inset-bottom, 0px));' +
    'z-index:9999;display:flex;align-items:center;gap:10px;padding:10px 12px;' +
    'background:#1a2644;color:#f4efe3;border:1px solid #c9a96e;border-radius:14px;' +
    'font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.4);';

  const texto = document.createElement('span');
  texto.textContent = 'Há uma versão nova do app.';
  texto.style.cssText = 'flex:1;';

  const atualizar = document.createElement('button');
  atualizar.type = 'button';
  atualizar.textContent = 'Atualizar';
  atualizar.style.cssText =
    'background:#c9a96e;color:#1a1a1a;border:0;border-radius:10px;padding:8px 12px;font-weight:600;';
  atualizar.addEventListener('click', () => {
    gravarIgnorado(buildNovo);
    window.location.reload();
  });

  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.textContent = '×';
  fechar.setAttribute('aria-label', 'Fechar aviso');
  fechar.style.cssText =
    'background:transparent;border:0;color:inherit;font-size:20px;line-height:1;padding:4px 6px;';
  fechar.addEventListener('click', () => {
    gravarIgnorado(buildNovo);
    caixa.remove();
  });

  caixa.append(texto, atualizar, fechar);
  document.body.appendChild(caixa);
}

async function verificar() {
  ultimaChecagem = Date.now();
  try {
    const resp = await fetch('js/version.js?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) return;
    const achado = (await resp.text()).match(/APP_BUILD\s*=\s*'(\d+)'/);
    if (!achado) return;
    const remoto = Number(achado[1]);
    const local = Number(APP_BUILD) || 0;
    if (remoto > local && remoto > lerIgnorado()) mostrarAviso(remoto);
  } catch (_e) {
    /* sem internet: segue sem aviso */
  }
}

export function iniciarVerificacaoDeVersao() {
  if (typeof window === 'undefined' || ehApp()) return;
  if (window.__verificacaoVersaoAtiva) return;
  window.__verificacaoVersaoAtiva = true;
  setTimeout(verificar, PRIMEIRA_CHECAGEM_MS);
  setInterval(() => {
    if (document.visibilityState === 'visible') verificar();
  }, INTERVALO_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - ultimaChecagem > VOLTA_AO_APP_MS) {
      verificar();
    }
  });
}
