path = 'www/js/features/bible/selectionToolbar.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """    const actions = [
      { icon: icons.explain, label: 'Estudo Completo', handler: onFullExplain },
      { icon: icons.share, label: 'Compartilhar', handler: onShare },
      { icon: icons.explain, label: 'Explicar', handler: onExplain },
      { icon: icons.mic, label: 'Narrar', handler: onNarrate },
      { icon: '🖨️', label: 'Imprimir', handler: onPrint },
      { icon: '📷', label: 'Imagem', handler: onImage },
    ];"""

new = """    const actions = [
      { icon: icons.explain, label: 'Estudo Completo', handler: onFullExplain },
      { icon: icons.share, label: 'Compartilhar', handler: onShare },
      { icon: '✨', label: 'Explicar', handler: onExplain },
      { icon: '📷', label: 'Imagem', handler: onImage },
      { icon: '🖨️', label: 'Imprimir', handler: onPrint },
    ];"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: bloco encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("selectionToolbar.js atualizado com sucesso")
