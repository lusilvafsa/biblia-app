path = 'www/js/features/home/home.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bloco_louvor = """
    <div class="section-title">Louvor do Dia</div>
    <div class="prayer-card">
      <h4>🎵 ${song.title}</h4>
      <p>${song.artist}</p>
      <button type="button" class="prayer-amen" id="btnPlaySong">▶ Ouvir no YouTube</button>
    </div>"""

qtd_bloco = content.count(bloco_louvor)
if qtd_bloco != 1:
    raise SystemExit(f"ERRO: bloco do louvor encontrado {qtd_bloco} vezes (esperado 1). Nada foi alterado.")

# Remove do lugar atual (depois do plan2)
content = content.replace(bloco_louvor, "")

# Insere logo depois do fechamento do verse-card
ancora_verse_card = """      </div>
    </div>

    <div class="section-title">
      Acesso Rápido"""

nova_ordem = """      </div>
    </div>
""" + bloco_louvor + """

    <div class="section-title">
      Acesso Rápido"""

qtd_ancora = content.count(ancora_verse_card)
if qtd_ancora != 1:
    raise SystemExit(f"ERRO: ancora do verse-card encontrada {qtd_ancora} vezes (esperado 1). Nada foi alterado.")

content = content.replace(ancora_verse_card, nova_ordem)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("home.js reordenado com sucesso")
