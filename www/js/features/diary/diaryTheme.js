// Tela: um tema do Diário de Estudo — passagens, edição, compartilhar e exportar.
import { diaryRepository } from '../../data-access/diaryRepository.js';
import { getAllBooks, getChapter } from '../../data-access/bibleRepository.js';
import { exportarJson } from './diaryFiles.js';
import { shareText } from '../../utils/share.js';
import { navigateTo } from '../../router.js';
import { setHeaderTitle } from '../../state/header.js';
import { toast } from '../../utils/toast.js';

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function referencia(p) {
  const base = p.bookName + ' ' + (p.chapterIndex + 1) + ':' + (p.verseStart + 1);
  return p.verseEnd > p.verseStart ? base + '-' + (p.verseEnd + 1) : base;
}

function nomeArquivo(nome) {
  const base = String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return 'tema-' + (base || 'diario') + '.json';
}

export const diaryThemePage = {
  async render(container, params) {
    let tema = diaryRepository.obter(params.id);
    if (!tema) {
      container.innerHTML = '<div class="state-message error">Tema não encontrado.</div>';
      return;
    }
    let livros = [];
    try {
      livros = await getAllBooks();
    } catch (e) {
      livros = [];
    }
    const cache = new Map();

    async function versosDe(bookIndex, chapterIndex) {
      const chave = bookIndex + '-' + chapterIndex;
      if (!cache.has(chave)) {
        try {
          cache.set(chave, await getChapter(bookIndex, chapterIndex));
        } catch (e) {
          cache.set(chave, []);
        }
      }
      return cache.get(chave);
    }

    async function textoDe(p) {
      const versos = await versosDe(p.bookIndex, p.chapterIndex);
      return versos.slice(p.verseStart, p.verseEnd + 1).join(' ');
    }

    async function montarTexto() {
      const linhas = ['📓 ' + tema.nome];
      if (tema.descricao) linhas.push(tema.descricao);
      linhas.push('');
      for (const p of tema.passagens) {
        linhas.push('• ' + referencia(p) + ' — ' + (await textoDe(p)));
        if (p.nota) linhas.push('   📝 ' + p.nota);
      }
      linhas.push('', 'Bíblia de Estudo LS');
      return linhas.join('\n');
    }

    async function desenhar() {
      tema = diaryRepository.obter(tema.id) || tema;
      setHeaderTitle(tema.nome);
      const opcoes = livros.map((b, i) => '<option value="' + (Number.isInteger(b.index) ? b.index : i) + '">' + esc(b.name) + '</option>').join('');
      const itens = tema.passagens.map((p) => `
        <div class="diary-item" data-id="${esc(p.id)}">
          <div class="diary-item-ref">${esc(referencia(p))}</div>
          <div class="diary-item-text" data-texto="${esc(p.id)}">…</div>
          ${p.nota ? '<div class="diary-note">📝 ' + esc(p.nota) + '</div>' : ''}
          <form class="diary-note-form" hidden>
            <textarea class="diary-input" rows="3" maxlength="4000" placeholder="Sua anotação sobre esta passagem">${esc(p.nota || '')}</textarea>
            <div class="diary-actions"><button type="submit" class="diary-btn diary-btn--primary">Salvar nota</button></div>
          </form>
          <div class="diary-actions">
            <button type="button" class="diary-btn" data-acao="abrir">Abrir</button>
            <button type="button" class="diary-btn" data-acao="nota">${p.nota ? 'Editar nota' : 'Nota'}</button>
            <button type="button" class="diary-btn" data-acao="remover">Remover</button>
          </div>
        </div>`).join('');

      container.innerHTML = `
        ${tema.descricao ? '<p class="diary-desc">' + esc(tema.descricao) + '</p>' : ''}
        <div class="diary-actions">
          <button type="button" class="diary-btn" id="diaryEditToggle">Editar</button>
          <button type="button" class="diary-btn" id="diaryShare">Compartilhar</button>
          <button type="button" class="diary-btn" id="diaryExport">Exportar</button>
          <button type="button" class="diary-btn diary-btn--danger" id="diaryDelete">Excluir</button>
        </div>
        <form class="diary-form" id="diaryEditForm" hidden>
          <input class="diary-input" id="diaryEditNome" maxlength="80" value="${esc(tema.nome)}">
          <textarea class="diary-input" id="diaryEditDesc" rows="3" maxlength="500" placeholder="Descrição (opcional)">${esc(tema.descricao)}</textarea>
          <div class="diary-actions">
            <button type="submit" class="diary-btn diary-btn--primary">Salvar</button>
            <button type="button" class="diary-btn" id="diaryEditCancel">Cancelar</button>
          </div>
        </form>
        <div class="diary-actions">
          <button type="button" class="diary-btn diary-btn--primary" id="diaryAddToggle">+ Adicionar passagem</button>
        </div>
        <form class="diary-form" id="diaryAddForm" hidden>
          <select class="diary-input" id="diaryLivro">${opcoes}</select>
          <div class="diary-row">
            <input class="diary-input" id="diaryCap" type="number" min="1" inputmode="numeric" placeholder="Capítulo">
            <input class="diary-input" id="diaryVerIni" type="number" min="1" inputmode="numeric" placeholder="Versículo">
            <input class="diary-input" id="diaryVerFim" type="number" min="1" inputmode="numeric" placeholder="até (opc.)">
          </div>
          <div class="diary-actions">
            <button type="submit" class="diary-btn diary-btn--primary">Adicionar</button>
            <button type="button" class="diary-btn" id="diaryAddCancel">Cancelar</button>
          </div>
        </form>
        <div>${itens || '<div class="diary-empty">Este tema ainda não tem passagens. Toque em "+ Adicionar passagem".</div>'}</div>
      `;

      const q = (s) => container.querySelector(s);
      const editForm = q('#diaryEditForm');
      const addForm = q('#diaryAddForm');
      q('#diaryEditToggle').addEventListener('click', () => { editForm.hidden = !editForm.hidden; });
      q('#diaryEditCancel').addEventListener('click', () => { editForm.hidden = true; });
      q('#diaryAddToggle').addEventListener('click', () => { addForm.hidden = !addForm.hidden; });
      q('#diaryAddCancel').addEventListener('click', () => { addForm.hidden = true; });

      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const r = diaryRepository.atualizar(tema.id, { nome: q('#diaryEditNome').value, descricao: q('#diaryEditDesc').value });
        if (!r) {
          toast.info('Digite o nome do tema.');
          return;
        }
        toast.success('Tema atualizado!');
        await desenhar();
      });

      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookIndex = Number(q('#diaryLivro').value);
        const cap = parseInt(q('#diaryCap').value, 10);
        const ini = parseInt(q('#diaryVerIni').value, 10);
        const fimBruto = parseInt(q('#diaryVerFim').value, 10);
        const livro = livros.find((b, i) => (Number.isInteger(b.index) ? b.index : i) === bookIndex);
        if (!livro || !(cap >= 1) || !(ini >= 1)) {
          toast.info('Informe livro, capítulo e versículo.');
          return;
        }
        if (livro.chapterCount && cap > livro.chapterCount) {
          toast.info(livro.name + ' tem ' + livro.chapterCount + ' capítulos.');
          return;
        }
        const versos = await versosDe(bookIndex, cap - 1);
        if (!versos.length) {
          toast.error('Não foi possível ler esse capítulo.');
          return;
        }
        const fim = fimBruto >= ini ? fimBruto : ini;
        if (ini > versos.length || fim > versos.length) {
          toast.info(livro.name + ' ' + cap + ' tem ' + versos.length + ' versículos.');
          return;
        }
        const r = diaryRepository.adicionarPassagem(tema.id, { bookIndex, bookName: livro.name, chapterIndex: cap - 1, verseStart: ini - 1, verseEnd: fim - 1 });
        if (r === 'duplicada') toast.info('Essa passagem já está no tema.');
        if (r === 'ok') toast.success('Passagem adicionada!');
        await desenhar();
      });

      q('#diaryShare').addEventListener('click', async () => {
        if (!tema.passagens.length) {
          toast.info('Adicione passagens antes de compartilhar.');
          return;
        }
        const r = await shareText({ title: tema.nome, text: await montarTexto() });
        if (r === 'copied') toast.success('Texto copiado!');
        if (r === 'unsupported') toast.info('Compartilhamento não suportado neste aparelho');
        if (r === 'error') toast.error('Não foi possível compartilhar agora.');
      });

      q('#diaryExport').addEventListener('click', async () => {
        const r = await exportarJson(nomeArquivo(tema.nome), diaryRepository.exportar([tema.id]), tema.nome);
        if (r === 'erro') toast.error('Não foi possível exportar agora.');
      });

      q('#diaryDelete').addEventListener('click', () => {
        if (!window.confirm('Excluir o tema "' + tema.nome + '" e suas passagens?')) return;
        diaryRepository.excluir(tema.id);
        toast.info('Tema excluído');
        navigateTo('/diario');
      });

      container.querySelectorAll('.diary-item').forEach((item) => {
        const id = item.dataset.id;
        const p = tema.passagens.find((x) => x.id === id);
        const notaForm = item.querySelector('.diary-note-form');
        item.querySelector('[data-acao="abrir"]').addEventListener('click', () => {
          navigateTo('/biblia/' + p.bookIndex + '/' + p.chapterIndex + '/versiculo/' + p.verseStart);
        });
        item.querySelector('[data-acao="nota"]').addEventListener('click', () => { notaForm.hidden = !notaForm.hidden; });
        item.querySelector('[data-acao="remover"]').addEventListener('click', async () => {
          diaryRepository.removerPassagem(tema.id, id);
          toast.info('Passagem removida');
          await desenhar();
        });
        notaForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          diaryRepository.salvarNota(tema.id, id, notaForm.querySelector('textarea').value);
          toast.success('Nota salva!');
          await desenhar();
        });
      });

      tema.passagens.forEach(async (p) => {
        const alvo = container.querySelector('[data-texto="' + p.id + '"]');
        if (alvo) alvo.textContent = '"' + (await textoDe(p)) + '"';
      });
    }

    await desenhar();
  },
};
