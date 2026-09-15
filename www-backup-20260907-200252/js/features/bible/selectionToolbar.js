// Toolbar flutuante que aparece ao selecionar um trecho de texto dentro de
// `containerEl` (ex.: o texto do capítulo), com ações de Compartilhar,
// Explicar e Narrar o trecho selecionado.
import { icons } from '../../components/icons.js';
import { getVoiceSettings, setVoiceSettings } from '../../state/voiceSettings.js';

const MIN_SELECTION_LENGTH = 2;

export function attachSelectionToolbar(containerEl, { onShare, onExplain, onNarrate }) {
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

  function showToolbar(rect, text) {
    removeToolbar();
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'selection-toolbar';

    const actions = [
      { icon: icons.share, label: 'Compartilhar', handler: onShare },
      { icon: icons.explain, label: 'Explicar', handler: onExplain },
      { icon: icons.mic, label: 'Narrar', handler: onNarrate },
    ];

    actions.forEach(({ icon, label, handler }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `${icon}<span>${label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handler(text);
        removeToolbar();
        window.getSelection()?.removeAllRanges();
      });
      toolbarEl.appendChild(btn);
    });


    // Botão de velocidade da narração
    const currentSpeed = Number(getVoiceSettings().rate) || 0.85;

    const speedBtn = document.createElement('button');
    speedBtn.type = 'button';
    speedBtn.className = 'selection-speed-btn';
    speedBtn.innerHTML = `⚡<span>Velocidade ${currentSpeed}x</span>`;

    // Estilo próprio para funcionar nos temas claro e escuro
    speedBtn.style.background = 'var(--surface-2, #ffffff)';
    speedBtn.style.color = 'var(--text, #111111)';
    speedBtn.style.border = '1px solid var(--border, #888888)';
    speedBtn.style.borderRadius = '10px';
    speedBtn.style.padding = '8px 10px';
    speedBtn.style.marginLeft = '4px';
    speedBtn.style.fontWeight = '600';
    speedBtn.style.fontSize = '14px';
    speedBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)';
    speedBtn.style.cursor = 'pointer';
    speedBtn.style.whiteSpace = 'nowrap';
    speedBtn.style.zIndex = '99999';

    speedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cycleSpeechSpeed(speedBtn);
    });

    toolbarEl.appendChild(speedBtn);

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

  return function cleanup() {
    removeToolbar();
    containerEl.removeEventListener('mouseup', handleSelectionEnd);
    containerEl.removeEventListener('touchend', handleSelectionEnd);
    document.removeEventListener('mousedown', handlePointerDown);
    document.removeEventListener('touchstart', handlePointerDown);
  };
}
