path = 'www/js/features/home/home.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

anchor_import = "import { statsRepository } from '../../data-access/statsRepository.js';"
replacement_import = anchor_import + "\nimport { getTodaysSong } from '../../../data/worshipSongs.js';"

qtd = content.count(anchor_import)
if qtd != 1:
    raise SystemExit(f"ERRO: ancora de import encontrada {qtd} vezes (esperado 1).")
content = content.replace(anchor_import, replacement_import)

anchor_html = """    <button class="plan-card" id="plan2">
      <div class="plan-icon-box">${icons.planBook}</div>
      <div class="plan-info"><h4>${plan2.plan.titulo}</h4><p>Dia ${plan2.feitos} de ${plan2.total}</p></div>
      <div class="plan-progress">${plan2.percent}%</div>
    </button>
  `;
}"""

replacement_html = """    <button class="plan-card" id="plan2">
      <div class="plan-icon-box">${icons.planBook}</div>
      <div class="plan-info"><h4>${plan2.plan.titulo}</h4><p>Dia ${plan2.feitos} de ${plan2.total}</p></div>
      <div class="plan-progress">${plan2.percent}%</div>
    </button>

    <div class="section-title">Louvor do Dia</div>
    <div class="prayer-card">
      <h4>🎵 ${song.title}</h4>
      <p>${song.artist}</p>
      <button type="button" class="prayer-amen" id="btnPlaySong">▶ Ouvir no YouTube</button>
    </div>
  `;
}"""

qtd2 = content.count(anchor_html)
if qtd2 != 1:
    raise SystemExit(f"ERRO: ancora do HTML encontrada {qtd2} vezes (esperado 1).")
content = content.replace(anchor_html, replacement_html)

anchor_song_var = "function template() {\n  const streak = statsRepository.getStreak();"
replacement_song_var = "function template() {\n  const streak = statsRepository.getStreak();\n  const song = getTodaysSong();"

qtd3 = content.count(anchor_song_var)
if qtd3 != 1:
    raise SystemExit(f"ERRO: ancora da variavel song encontrada {qtd3} vezes (esperado 1).")
content = content.replace(anchor_song_var, replacement_song_var)

anchor_handler = "qs('#btnSeeAllPlans', container).addEventListener('click', () => navigateTo('/planos'));"
replacement_handler = anchor_handler + """
    qs('#btnPlaySong', container).addEventListener('click', () => {
      const s = getTodaysSong();
      const busca = encodeURIComponent(`${s.title} ${s.artist} louvor`);
      window.open(`https://www.youtube.com/results?search_query=${busca}`, '_blank');
    });"""

qtd4 = content.count(anchor_handler)
if qtd4 != 1:
    raise SystemExit(f"ERRO: ancora do handler encontrada {qtd4} vezes (esperado 1).")
content = content.replace(anchor_handler, replacement_handler)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("home.js atualizado com sucesso")
