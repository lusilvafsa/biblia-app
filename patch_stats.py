path = 'www/js/data-access/statsRepository.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

anchor = """  getPerfectQuizCount() {
    return readStats().perfectQuizCount;
  },
};"""

replacement = """  getPerfectQuizCount() {
    return readStats().perfectQuizCount;
  },

  /** Retorna os últimos 7 dias (do mais antigo ao de hoje), indicando se
   * houve leitura em cada um — usado no resumo "Sua Semana" do Perfil. */
  getWeekActivity() {
    const dias = new Set(readStats().readDays);
    const nomes = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const resultado = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      resultado.push({ iso, label: nomes[d.getDay()], active: dias.has(iso) });
    }

    return resultado;
  },
};"""

qtd = content.count(anchor)
if qtd != 1:
    raise SystemExit(f"ERRO: âncora encontrada {qtd} vezes (esperado 1). Nada foi alterado.")
content = content.replace(anchor, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("statsRepository.js atualizado com sucesso")
