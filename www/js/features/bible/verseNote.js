// Editor rápido de anotação de um versículo, aberto pela barra de ações do leitor.
// Grava no mesmo lugar do painel de Estudo (favoritesRepository.saveNote).
import { favoritesRepository } from '../../data-access/favoritesRepository.js';
import { usuarioAtual } from '../../supabaseAuth.js';
import { toast } from '../../utils/toast.js';

export function openVerseNoteEditor({ bookIndex, bookName, chapterIndex, verseIndex, verseText }) {
  if (!usuarioAtual()) {
    toast.info('Faça login para usar as anotações.');
    return;
  }
  const atual = favoritesRepository.get(bookIndex, chapterIndex, verseIndex);
  const notaSalva = (atual && atual.note) || '';

  const overlay = document.createElement('div');
  overlay.className = 'verse-explain-overlay';
  overlay.innerHTML = `
    <div class="verse-explain-panel" role="dialog" aria-modal="true" aria-label="Anotação do versículo">
      <div class="verse-explain-handle"></div>
      <button class="verse-explain-close" id="btnNotaFechar" aria-label="Fechar">✕</button>
      <div id="notaTitulo" style="color:var(--gold);font-weight:700;margin-bottom:6px;"></div>
      <div id="notaVersiculo" style="font-family:var(--font-display);font-size:15px;line-height:1.5;opacity:0.85;margin-bottom:12px;max-height:84px;overflow:auto;"></div>
      <textarea id="notaTexto" rows="5" maxlength="4000" placeholder="Escreva sua anotação..." style="width:100%;box-sizing:border-box;min-height:120px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);background:var(--navy-deep);color:var(--text-primary);font-family:inherit;font-size:15px;line-height:1.5;resize:vertical;outline:none;"></textarea>
      <div id="notaBotoes" style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;"></div>
    </div>
  `;

  const ref = bookName + ' ' + (chapterIndex + 1) + ':' + (verseIndex + 1);
  overlay.querySelector('#notaTitulo').textContent = '📝 Anotação · ' + ref;
  overlay.querySelector('#notaVersiculo').textContent = '"' + verseText + '"';
  const campo = overlay.querySelector('#notaTexto');
  campo.value = notaSalva;

  function fechar() {
    overlay.remove();
  }

  function salvar(texto) {
    const resultado = favoritesRepository.saveNote(
      { bookIndex, bookName, chapterIndex, verseIndex, verseText },
      texto
    );
    if (resultado === null) return; // sem login: o repositório já avisou
    toast.success(texto.trim() ? 'Anotação salva!' : 'Anotação excluída');
    fechar();
  }

  function botao(rotulo, estilo, aoClicar) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = rotulo;
    b.style.cssText = 'padding:11px 20px;border-radius:14px;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;' + estilo;
    b.addEventListener('click', aoClicar);
    return b;
  }

  const caixa = overlay.querySelector('#notaBotoes');
  caixa.appendChild(botao('Salvar', 'background:linear-gradient(135deg,var(--gold),#b8944a);color:#14100a;border:none;', () => salvar(campo.value)));
  caixa.appendChild(botao('Cancelar', 'background:transparent;color:var(--text-primary);border:1px solid var(--border);', fechar));
  if (notaSalva) {
    caixa.appendChild(botao('Excluir', 'background:transparent;color:#eb5757;border:1px solid #eb5757;', () => salvar('')));
  }

  overlay.querySelector('#btnNotaFechar').addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fechar();
  });

  document.body.appendChild(overlay);
  campo.focus();
}
