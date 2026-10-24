// Janela rápida para ligar versículos (um ou vários) a temas do Diário de Estudo.
import { diaryRepository } from '../../data-access/diaryRepository.js';
import { navigateTo } from '../../router.js';
import { toast } from '../../utils/toast.js';

function agrupar(indices) {
  const lista = indices.slice().sort((a, b) => a - b);
  const intervalos = [];
  let ini = lista[0];
  let fim = lista[0];
  for (let k = 1; k <= lista.length; k++) {
    if (k < lista.length && lista[k] === fim + 1) {
      fim = lista[k];
      continue;
    }
    intervalos.push([ini, fim]);
    ini = lista[k];
    fim = lista[k];
  }
  return intervalos;
}

export function openDiaryPicker({ bookIndex, bookName, chapterIndex, verseIndex, verseIndexes }) {
  const indices = verseIndexes && verseIndexes.length ? verseIndexes : [verseIndex];
  const intervalos = agrupar(indices);
  const info = { bookIndex, bookName, chapterIndex };
  const refTexto = bookName + ' ' + (chapterIndex + 1) + ':' +
    intervalos.map(([a, b]) => (a === b ? String(a + 1) : (a + 1) + '-' + (b + 1))).join(', ');

  const overlay = document.createElement('div');
  overlay.className = 'verse-explain-overlay';
  overlay.innerHTML = `
    <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Diário de Estudo">
      <div class="verse-explain-handle"></div>
      <button class="verse-explain-close" id="btnDiarioFechar" aria-label="Fechar">✕</button>
      <div id="diarioTitulo" style="color:var(--gold);font-weight:700;margin-bottom:10px;"></div>
      <div id="diarioLista" style="display:flex;flex-direction:column;gap:8px;max-height:40vh;overflow:auto;"></div>
      <form id="diarioNovo" style="display:flex;gap:8px;margin-top:12px;">
        <input class="diary-input" id="diarioNome" maxlength="80" placeholder="Novo tema..." autocomplete="off">
        <button type="submit" class="diary-btn diary-btn--primary">Criar</button>
      </form>
      <div style="margin-top:12px;"><button type="button" class="diary-btn" id="diarioAbrir">Abrir Diário de Estudo</button></div>
    </div>
  `;
  overlay.querySelector('#diarioTitulo').textContent = '📓 Diário de Estudo · ' + refTexto;
  const lista = overlay.querySelector('#diarioLista');

  function fechar() {
    overlay.remove();
  }

  function desenharLista() {
    const temas = diaryRepository.listar();
    lista.innerHTML = '';
    if (!temas.length) {
      lista.innerHTML = '<div class="diary-empty" style="padding:12px;">Nenhum tema ainda. Crie o primeiro abaixo.</div>';
      return;
    }
    temas.forEach((t) => {
      const ligado = indices.every((i) => diaryRepository.temasDoVersiculo(bookIndex, chapterIndex, i).includes(t.id));
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'diary-card';
      b.style.padding = '12px 14px';
      if (ligado) b.style.borderColor = 'var(--gold)';
      b.textContent = (ligado ? '✓ ' : '○ ') + t.nome;
      b.addEventListener('click', () => {
        const ligou = diaryRepository.alternarIntervalos(t.id, info, intervalos);
        toast.success(ligou ? 'Adicionado a "' + t.nome + '"' : 'Removido de "' + t.nome + '"');
        desenharLista();
      });
      lista.appendChild(b);
    });
  }

  overlay.querySelector('#diarioNovo').addEventListener('submit', (e) => {
    e.preventDefault();
    const campo = overlay.querySelector('#diarioNome');
    const tema = diaryRepository.criar({ nome: campo.value, descricao: '' });
    if (!tema) {
      toast.info('Digite o nome do tema.');
      return;
    }
    diaryRepository.alternarIntervalos(tema.id, info, intervalos);
    campo.value = '';
    toast.success('Tema criado e versículos adicionados!');
    desenharLista();
  });
  overlay.querySelector('#diarioAbrir').addEventListener('click', () => {
    fechar();
    navigateTo('/diario');
  });
  overlay.querySelector('#btnDiarioFechar').addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fechar();
  });

  desenharLista();
  document.body.appendChild(overlay);
}
