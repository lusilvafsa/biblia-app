path = 'www/js/features/bible/selectionToolbar.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_label = "{ icon: icons.explain, label: 'Estudo Completo', handler: onFullExplain },"
new_label = "{ icon: icons.explain, label: 'Estudo', handler: onFullExplain },"
qtd1 = content.count(old_label)
if qtd1 != 1:
    raise SystemExit(f"ERRO 1: encontrado {qtd1} vezes")
content = content.replace(old_label, new_label)

old_speed = """

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

    toolbarEl.appendChild(speedBtn);"""

qtd2 = content.count(old_speed)
if qtd2 != 1:
    raise SystemExit(f"ERRO 2: encontrado {qtd2} vezes")
content = content.replace(old_speed, "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("selectionToolbar.js atualizado com sucesso")
