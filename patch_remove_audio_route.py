path = 'www/js/main.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old1 = "import { audioPage } from './features/audio/audio.js';\n"
qtd1 = content.count(old1)
if qtd1 != 1:
    raise SystemExit(f"ERRO 1: encontrado {qtd1} vezes")
content = content.replace(old1, "")

old2 = "  registerRoute('/audio', audioPage, { title: 'Bíblia em Áudio', navKey: 'audio', showSettings: true });\n"
qtd2 = content.count(old2)
if qtd2 != 1:
    raise SystemExit(f"ERRO 2: encontrado {qtd2} vezes")
content = content.replace(old2, "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("main.js atualizado com sucesso")
