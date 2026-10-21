// Toolbar flutuante que aparece ao selecionar um trecho de texto dentro de
// `containerEl` (ex.: o texto do capítulo), ou ao tocar num versículo
// (nesse caso, com um botão extra para abrir a explicação completa).
import { icons } from '../../components/icons.js';
import { HIGHLIGHT_COLORS } from '../../data-access/highlightRepository.js';
import { getVoiceSettings, setVoiceSettings } from '../../state/voiceSettings.js';

const MIN_SELECTION_LENGTH = 2;

function imp(el, props) {
  Object.entries(props).forEach(([k, v]) => el.style.setProperty(k, v, 'important'));
}

export function attachSelectionToolbar(containerEl, { onShare, onExplain, onNarrate, onPrint, onImage, onFullExplain, onHighlight, onFavorite, onNote, onReady }) {
  let toolbarEl = null;

  function removeToolbar() {
    if (toolbarEl) {
      toolbarEl.remove();
      toolbarEl = null;
    }
  }

  function getSelectionInfo() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    // Remove um número de versículo colado no início (artefato do <sup>
    // quando a seleção começa bem no início do parágrafo).
    const text = selection.toString().trim().replace(/^\d+\s*/, '');
    if (text.length < MIN_SELECTION_LENGTH) return null;
    if (!containerEl.contains(selection.anchorNode)) return null;
    return { text, rect: selection.getRangeAt(0).getBoundingClientRect() };
  }


  function cycleSpeechSpeed(button) {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const current = Number(getVoiceSettings().rate) || 0.85;

    let closest = 0;
    let distance = Infinity;

    speeds.forEach((speed, index) => {
      const d = Math.abs(speed - current);
      if (d < distance) {
        distance = d;
        closest = index;
      }
    });

    const next = speeds[(closest + 1) % speeds.length];

    setVoiceSettings({ rate: next });

    button.querySelector('span').textContent = `Velocidade ${next}x`;
    button.setAttribute('aria-label', `Velocidade da narração: ${next} vezes`);
  }

  function showToolbar(rect, text, context) {
    removeToolbar();
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'selection-toolbar';

    const actions = [
      { icon: icons.explain, label: 'Estudo', handler: onFullExplain },
      (onFavorite && context && context.verseIndex !== undefined)
        ? { icon: iconeFavorito(), label: 'Favorito', handler: () => onFavorite(context) }
        : null,
      (onNote && context && context.verseIndex !== undefined)
        ? { icon: '📝', label: 'Anotação', handler: () => onNote(context) }
        : null,
      { icon: icons.share, label: 'Compartilhar', handler: abrirSubmenu },
      { icon: '✨', label: 'Explicar', handler: onExplain },
    ].filter(Boolean);

    actions.forEach(({ icon, label, handler }) => {
      if (!handler) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<div class="sel-ico">${icon}</div><span>${label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const manter = handler(text, context);
        if (manter === 'manter') return;
        removeToolbar();
        window.getSelection()?.removeAllRanges();
      });
      toolbarEl.appendChild(btn);
    });


    function iconeFavorito() {
      const fav = !!(context && context.isFavorite);
      return '<i style="font-style:normal;' + (fav ? 'color:var(--gold);' : '') + '">' + (fav ? '★' : '☆') + '</i>';
    }

    const submenuEl = document.createElement('div');
    submenuEl.className = 'selection-share-menu';
    imp(toolbarEl, { width: 'max-content', 'flex-wrap': 'wrap', overflow: 'visible', 'justify-content': 'center' });
    imp(submenuEl, { flex: '0 0 100%', width: '100%', display: 'none', 'justify-content': 'center', gap: '8px', padding: '8px 4px 0', 'margin-top': '6px', 'border-top': '1px solid rgba(255,255,255,0.12)' });
    [
      { rotulo: '💬 Texto', fn: onShare },
      { rotulo: '📷 Imagem', fn: onImage },
      { rotulo: '🖨️ Imprimir', fn: onPrint },
    ].filter((o) => o.fn).forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.rotulo;
      imp(b, { width: 'auto', height: 'auto', 'min-width': '0', 'max-width': 'none', flex: '0 0 auto', padding: '8px 14px', margin: '0', 'border-radius': '12px', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.08)', color: 'inherit', 'font-size': '14px', 'flex-direction': 'row', cursor: 'pointer' });
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        o.fn(text, context);
        removeToolbar();
        window.getSelection()?.removeAllRanges();
      });
      submenuEl.appendChild(b);
    });
    toolbarEl.appendChild(submenuEl);

    function abrirSubmenu() {
      const aberto = submenuEl.style.display !== 'none';
      imp(submenuEl, { display: aberto ? 'none' : 'flex' });
      return 'manter';
    }

    if (onHighlight && context && context.verseIndex !== undefined) {
      const aplicar = (el, props) => Object.entries(props).forEach(([k, v]) => el.style.setProperty(k, v, 'important'));
      aplicar(toolbarEl, { width: 'max-content', 'flex-wrap': 'wrap', overflow: 'visible', 'justify-content': 'center' });
      const linha = document.createElement('div');
      linha.className = 'selection-colors';
      aplicar(linha, { flex: '0 0 100%', width: '100%', display: 'flex', 'flex-wrap': 'wrap', 'justify-content': 'center', gap: '5px', padding: '8px 4px 4px', 'margin-top': '6px', 'border-top': '1px solid rgba(255,255,255,0.12)' });
      const criarPonto = (cor, titulo) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.title = titulo;
        b.setAttribute('aria-label', titulo);
        const ativo = cor && context.currentColor === cor.id;
        aplicar(b, { flex: '0 0 26px', width: '26px', height: '26px', 'min-width': '26px', 'max-width': '26px', padding: '0', margin: '0', 'border-radius': '50%', cursor: 'pointer', display: 'flex', 'align-items': 'center', 'justify-content': 'center', background: cor ? cor.hex : 'transparent', border: '2px solid ' + (ativo ? '#ffffff' : 'rgba(255,255,255,0.28)') });
        if (!cor) {
          b.textContent = '✕';
          b.style.color = 'rgba(255,255,255,0.8)';
          b.style.fontSize = '12px';
        }
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          onHighlight(cor ? cor.id : null, context);
          removeToolbar();
          window.getSelection()?.removeAllRanges();
        });
        return b;
      };
      HIGHLIGHT_COLORS.forEach((cor) => linha.appendChild(criarPonto(cor, cor.label)));
      linha.appendChild(criarPonto(null, 'Remover grifo'));
      toolbarEl.appendChild(linha);
    }

    document.body.appendChild(toolbarEl);

    const toolbarRect = toolbarEl.getBoundingClientRect();
    let left = rect.left + rect.width / 2;
    let top = rect.top - 10;
    left = Math.max(toolbarRect.width / 2 + 8, Math.min(left, window.innerWidth - toolbarRect.width / 2 - 8));
    if (top - toolbarRect.height < 8) {
      top = rect.bottom + toolbarRect.height + 10; // não cabe acima: mostra abaixo
    }
    toolbarEl.style.left = `${left}px`;
    toolbarEl.style.top = `${top}px`;
  }

  function handleSelectionEnd() {
    const info = getSelectionInfo();
    if (info) {
      showToolbar(info.rect, info.text);
    } else {
      removeToolbar();
    }
  }

  function handlePointerDown(e) {
    if (toolbarEl && !toolbarEl.contains(e.target)) {
      removeToolbar();
    }
  }

  containerEl.addEventListener('mouseup', handleSelectionEnd);
  containerEl.addEventListener('touchend', handleSelectionEnd);
  document.addEventListener('mousedown', handlePointerDown);
  document.addEventListener('touchstart', handlePointerDown);

  if (onReady) {
    onReady((rect, text, context) => showToolbar(rect, text, context));
  }

  return function cleanup() {
    removeToolbar();
    containerEl.removeEventListener('mouseup', handleSelectionEnd);
    containerEl.removeEventListener('touchend', handleSelectionEnd);
    document.removeEventListener('mousedown', handlePointerDown);
    document.removeEventListener('touchstart', handlePointerDown);
  };
}
