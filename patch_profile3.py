path = 'www/js/features/profile/profile.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_buttons = """      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileFavorites"
      >
        <div class="menu-icon">♥</div>
        <div class="menu-title">${favoritesCount}</div>
        <div class="menu-desc">Favoritos</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileNotes"
      >
        <div class="menu-icon">📝</div>
        <div class="menu-title">${notesCount}</div>
        <div class="menu-desc">Anotações</div>
      </button>"""

new_button = """      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileMarcadores"
      >
        <div class="menu-icon">📚</div>
        <div class="menu-title">${favoritesCount}</div>
        <div class="menu-desc">Meus Marcadores</div>
      </button>"""

qtd = content.count(old_buttons)
if qtd != 1:
    raise SystemExit(f"ERRO: bloco dos botoes encontrado {qtd} vezes (esperado 1).")
content = content.replace(old_buttons, new_button)

old_handlers = """  const favoritesBtn =
    container.querySelector(
      '#btnProfileFavorites'
    );

  if (favoritesBtn) {
    favoritesBtn.addEventListener(
      'click',
      () => navigateTo('/favoritos')
    );
  }

  const notesBtn =
    container.querySelector(
      '#btnProfileNotes'
    );

  if (notesBtn) {
    notesBtn.addEventListener(
      'click',
      () => navigateTo('/anotacoes')
    );
  }"""

new_handlers = """  const marcadoresBtn =
    container.querySelector(
      '#btnProfileMarcadores'
    );

  if (marcadoresBtn) {
    marcadoresBtn.addEventListener(
      'click',
      () => navigateTo('/favoritos')
    );
  }"""

qtd2 = content.count(old_handlers)
if qtd2 != 1:
    raise SystemExit(f"ERRO: bloco dos handlers encontrado {qtd2} vezes (esperado 1). Encontrado: {content.count(old_handlers)}")
content = content.replace(old_handlers, new_handlers)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("profile.js atualizado com sucesso")
