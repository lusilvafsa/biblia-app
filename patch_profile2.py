path = 'www/js/features/profile/profile.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

anchor_calc = """  const badgesHtml = badgesComputados.map(
    (b) => `
      <div class="badge-item ${b.unlocked ? 'unlocked' : ''}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>
    `
  ).join('');"""

replacement_calc = anchor_calc + """

  const weekActivity = statsRepository.getWeekActivity();
  const weekActivityHtml = weekActivity.map(
    (d) => `
      <div class="week-day ${d.active ? 'active' : ''}">
        <span class="week-day-label">${d.label}</span>
        <span class="week-day-dot"></span>
      </div>
    `
  ).join('');"""

qtd1 = content.count(anchor_calc)
if qtd1 != 1:
    raise SystemExit(f"ERRO: ancora 1 encontrada {qtd1} vezes (esperado 1).")
content = content.replace(anchor_calc, replacement_calc)

anchor_html = """<div class="streak-banner">
      <div class="streak-flame">${icons.bible}</div>
      <div class="streak-info">
        <h4>Sequência de leitura de ${statsRepository.getStreak()} dias</h4>
        <p>Melhor: ${bestStreakCount} dias</p>
      </div>
    </div>"""

replacement_html = anchor_html + """

    <div class="section-title">Sua Semana</div>
    <div class="week-strip">
      ${weekActivityHtml}
    </div>"""

qtd2 = content.count(anchor_html)
if qtd2 != 1:
    raise SystemExit(f"ERRO: ancora 2 encontrada {qtd2} vezes (esperado 1).")
content = content.replace(anchor_html, replacement_html)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("profile.js atualizado com sucesso")
