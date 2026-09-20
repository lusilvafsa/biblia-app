path = 'www/js/features/bible/selectionToolbar.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """export function attachSelectionToolbar(containerEl, { onShare, onExplain, onNarrate }) {"""
new = """export function attachSelectionToolbar(containerEl, { onShare, onExplain, onNarrate, onPrint, onImage }) {"""
qtd1 = content.count(old)
if qtd1 != 1:
    raise SystemExit(f"ERRO 1: encontrado {qtd1} vezes")
content = content.replace(old, new)

old2 = """    const actions = [
      { icon: icons.share, label: 'Compartilhar', handler: onShare },
      { icon: icons.explain, label: 'Explicar', handler: onExplain },
      { icon: icons.mic, label: 'Narrar', handler: onNarrate },
    ];"""
new2 = """    const actions = [
      { icon: icons.share, label: 'Compartilhar', handler: onShare },
      { icon: icons.explain, label: 'Explicar', handler: onExplain },
      { icon: icons.mic, label: 'Narrar', handler: onNarrate },
      { icon: '🖨️', label: 'Imprimir', handler: onPrint },
      { icon: '📷', label: 'Imagem', handler: onImage },
    ];"""
qtd2 = content.count(old2)
if qtd2 != 1:
    raise SystemExit(f"ERRO 2: encontrado {qtd2} vezes")
content = content.replace(old2, new2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("selectionToolbar.js atualizado")
