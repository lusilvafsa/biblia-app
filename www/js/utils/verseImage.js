// Imagem de versículo para compartilhar: desenhada direto num canvas
// (sem depender de bibliotecas), em dois estilos, com prévia.
import { toast } from './toast.js';

const LARGURA = 1080;
const ALTURA = 1350;
const MARGEM = 110;
const CHAVE_ESTILO = 'biblia:verse-image-style';
const SERIFA = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Inter, 'Segoe UI', Arial, sans-serif";

function douradoDoApp() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim();
    if (v) return v;
  } catch (e) { /* usa o padrão */ }
  return '#c9a96e';
}

function temas() {
  return {
    escuro: { fundo1: '#0f1729', fundo2: '#1a2644', texto: '#f4efe3', dourado: douradoDoApp(), suave: 'rgba(244,239,227,0.55)' },
    claro: { fundo1: '#fbf6ea', fundo2: '#efe5cd', texto: '#2a2418', dourado: '#8f7233', suave: 'rgba(42,36,24,0.55)' },
  };
}

async function carregarFontes() {
  try {
    if (!document.fonts || !document.fonts.load) return;
    await Promise.all([
      document.fonts.load("italic 400 48px 'Playfair Display'"),
      document.fonts.load("600 48px 'Playfair Display'"),
      document.fonts.load('400 28px Inter'),
    ]);
  } catch (e) { /* segue com a fonte reserva */ }
}

function quebrarLinhas(ctx, texto, larguraMax) {
  const palavras = texto.split(/\s+/);
  const linhas = [];
  let atual = '';
  palavras.forEach((p) => {
    const teste = atual ? atual + ' ' + p : p;
    if (ctx.measureText(teste).width > larguraMax && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  });
  if (atual) linhas.push(atual);
  return linhas;
}

function desenhar(estilo, texto, referencia) {
  const t = temas()[estilo] || temas().escuro;
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  const cx = LARGURA / 2;

  const grad = ctx.createLinearGradient(0, 0, 0, ALTURA);
  grad.addColorStop(0, t.fundo1);
  grad.addColorStop(1, t.fundo2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.strokeStyle = t.dourado;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, LARGURA - 96, ALTURA - 96);
  ctx.globalAlpha = 1;

  ctx.fillStyle = t.dourado;
  ctx.strokeStyle = t.dourado;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 150, 190); ctx.lineTo(cx - 24, 190);
  ctx.moveTo(cx + 24, 190); ctx.lineTo(cx + 150, 190);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, 176); ctx.lineTo(cx + 14, 190); ctx.lineTo(cx, 204); ctx.lineTo(cx - 14, 190);
  ctx.closePath();
  ctx.fill();

  const areaTopo = 270;
  const areaAltura = 750;
  const larguraTexto = LARGURA - 2 * MARGEM;
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
  let tamanho = 70;
  let linhas = [];
  let alturaLinha = 0;
  for (; tamanho >= 28; tamanho -= 2) {
    ctx.font = 'italic 400 ' + tamanho + 'px ' + SERIFA;
    linhas = quebrarLinhas(ctx, '\u201C' + limpo + '\u201D', larguraTexto);
    alturaLinha = tamanho * 1.45;
    if (linhas.length * alturaLinha <= areaAltura) break;
  }
  tamanho = Math.max(tamanho, 28);
  ctx.font = 'italic 400 ' + tamanho + 'px ' + SERIFA;
  const maxLinhas = Math.floor(areaAltura / alturaLinha);
  if (linhas.length > maxLinhas) {
    linhas = linhas.slice(0, maxLinhas);
    linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/[\s.,;:]*$/, '') + '\u2026';
  }
  ctx.fillStyle = t.texto;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = areaTopo + (areaAltura - linhas.length * alturaLinha) / 2 + tamanho;
  linhas.forEach((l) => {
    ctx.fillText(l, cx, y);
    y += alturaLinha;
  });

  ctx.fillStyle = t.dourado;
  ctx.font = '600 46px ' + SERIFA;
  ctx.fillText(referencia, cx, 1110);
  ctx.fillStyle = t.suave;
  ctx.font = '400 28px ' + SANS;
  ctx.fillText('Bíblia de Estudo', cx, 1230);
  return canvas;
}

function nomeArquivo(referencia) {
  const base = String(referencia).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'versiculo') + '.png';
}

async function compartilhar(canvas, arquivo, titulo) {
  const cap = window.Capacitor;
  const nativo = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const fs = cap && cap.Plugins && cap.Plugins.Filesystem;
  const share = cap && cap.Plugins && cap.Plugins.Share;
  if (nativo && fs && share) {
    try {
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      const escrita = await fs.writeFile({ path: arquivo, data: base64, directory: 'CACHE' });
      await share.share({ title: titulo, url: escrita.uri, dialogTitle: titulo });
      return 'shared';
    } catch (e) {
      return /cancel/i.test(String((e && (e.message || e)) || '')) ? 'cancelled' : 'error';
    }
  }
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return 'error';
  try {
    const file = new File([blob], arquivo, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: titulo });
      return 'shared';
    }
  } catch (e) {
    return /abort|cancel/i.test(String((e && (e.name || e.message)) || '')) ? 'cancelled' : 'error';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}

export async function abrirImagemDoVersiculo({ texto, referencia }) {
  await carregarFontes();
  let estilo = 'escuro';
  try {
    const salvo = window.localStorage.getItem(CHAVE_ESTILO);
    if (salvo === 'claro' || salvo === 'escuro') estilo = salvo;
  } catch (e) { /* sem armazenamento */ }
  let canvas = desenhar(estilo, texto, referencia);

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;';
  const img = document.createElement('img');
  img.alt = 'Prévia da imagem do versículo';
  img.style.cssText = 'max-width:100%;max-height:60vh;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.5);';
  const linhaEstilos = document.createElement('div');
  linhaEstilos.style.cssText = 'display:flex;gap:10px;';
  const linhaAcoes = document.createElement('div');
  linhaAcoes.style.cssText = 'display:flex;gap:10px;';

  function botao(rotulo) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool-btn';
    b.textContent = rotulo;
    b.style.cssText = 'width:auto;min-width:110px;height:48px;padding:0 16px;';
    return b;
  }
  const bEscuro = botao('Escuro');
  const bClaro = botao('Claro');
  const bShare = botao('Compartilhar');
  const bFechar = botao('Fechar');

  function atualizar() {
    canvas = desenhar(estilo, texto, referencia);
    img.src = canvas.toDataURL('image/png');
    bEscuro.classList.toggle('active-audio', estilo === 'escuro');
    bClaro.classList.toggle('active-audio', estilo === 'claro');
  }
  function escolher(novo) {
    estilo = novo;
    try { window.localStorage.setItem(CHAVE_ESTILO, novo); } catch (e) { /* ignora */ }
    atualizar();
  }

  bEscuro.addEventListener('click', () => escolher('escuro'));
  bClaro.addEventListener('click', () => escolher('claro'));
  bShare.addEventListener('click', async () => {
    bShare.disabled = true;
    const r = await compartilhar(canvas, nomeArquivo(referencia), referencia);
    bShare.disabled = false;
    if (r === 'error') toast.error('Não foi possível compartilhar a imagem.');
    if (r === 'downloaded') toast.success('Imagem baixada!');
  });
  bFechar.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  linhaEstilos.append(bEscuro, bClaro);
  linhaAcoes.append(bShare, bFechar);
  overlay.append(img, linhaEstilos, linhaAcoes);
  document.body.appendChild(overlay);
  atualizar();
}
