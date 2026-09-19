path = 'www/js/features/profile/profile.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_badges = """const badgesHtml = BADGES.map(
    (b) => `
      <div class="badge-item ${b.unlocked ? 'unlocked' : ''}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>
    `
  ).join('');"""

new_badges = """const bestStreakCount = statsRepository.getBestStreak();
  const perfectQuizCount = statsRepository.getPerfectQuizCount();

  const badgesComputados = [
    { icon: icons.badgeFirst, name: 'Primeira Leitura', unlocked: readVersesCount >= 1 },
    { icon: icons.badgeStreak, name: '7 Dias Seguidos', unlocked: bestStreakCount >= 7 },
    { icon: icons.prayer, name: 'Guerreiro de Oração', unlocked: prayerCount >= 5 },
    { icon: icons.badgeDouble, name: 'Estudioso da Bíblia', unlocked: readVersesCount >= 50 },
    { icon: icons.badgeQuiz, name: 'Mestre do Quiz', unlocked: perfectQuizCount >= 1 },
    { icon: icons.badgeFull, name: 'Bíblia Completa', unlocked: readVersesCount >= 31100 },
  ];

  const badgesHtml = badgesComputados.map(
    (b) => `
      <div class="badge-item ${b.unlocked ? 'unlocked' : ''}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>
    `
  ).join('');"""

qtd = content.count(old_badges)
if qtd != 1:
    raise SystemExit(f"ERRO: bloco de insignias encontrado {qtd} vezes (esperado 1). Nada foi alterado.")
content = content.replace(old_badges, new_badges)

old_streak = """<div class="streak-banner">
      <div class="streak-flame">${icons.bible}</div>
      <div class="streak-info">
        <h4>Sequência de leitura de 7 dias</h4>
        <p>Melhor: 14 dias</p>
      </div>
    </div>"""

new_streak = """<div class="streak-banner">
      <div class="streak-flame">${icons.bible}</div>
      <div class="streak-info">
        <h4>Sequência de leitura de ${statsRepository.getStreak()} dias</h4>
        <p>Melhor: ${bestStreakCount} dias</p>
      </div>
    </div>"""

qtd2 = content.count(old_streak)
if qtd2 != 1:
    raise SystemExit(f"ERRO: bloco de sequencia encontrado {qtd2} vezes (esperado 1). Nada foi alterado.")
content = content.replace(old_streak, new_streak)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("profile.js atualizado com sucesso")
