p = 'www/js/features/settings/settings.js'
c = open(p, encoding='utf-8').read()

def rep(old, new):
    global c
    n = c.count(old)
    if n != 1:
        raise SystemExit(f'ERRO: trecho achado {n}x (esperado 1): {old[:70]}')
    c = c.replace(old, new)

# 1) valores numéricos nos rótulos dos controles
rep("""function pitchLabel(v) {""", """function pitchLabel(v) {
  return `${pitchLabelBase(v)} · ${String(Number(v.toFixed(1))).replace('.', ',')}`;
}

function pitchLabelBase(v) {""")
rep("""function rateLabel(v) {""", """function rateLabel(v) {
  return `${rateLabelBase(v)} · ${String(Number(v.toFixed(2))).replace('.', ',')}×`;
}

function rateLabelBase(v) {""")

# 2) texto cortado e dica
rep('Automática (masculina, pt-BR quando disponível)', 'Automática (masculina)')
rep('<span>As vozes disponíveis dependem do seu aparelho e navegador.</span>', '')

# 3) "Voz específica" + diagnóstico dentro de "Avançado" recolhido
rep('''<div class="setting-row-header"><span class="setting-label">Voz específica</span></div>''',
    '''<details class="settings-advanced"><summary class="setting-label" style="cursor:pointer;">Avançado: voz específica</summary>''')
rep('''<select class="select-input" id="voiceSelect">${voiceOptionsHtml(getAvailableVoices(), settings.voiceURI)}</select>''',
    '''<select class="select-input" id="voiceSelect" style="margin-top:12px;">${voiceOptionsHtml(getAvailableVoices(), settings.voiceURI)}</select><div class="setting-scale" style="justify-content:flex-start;"><span>As vozes disponíveis dependem do seu aparelho.</span></div><button class="tool-btn" id="btnDebugVoices" type="button" style="margin-top:12px;">Diagnóstico de vozes</button></details>''')
rep('<button class="tool-btn" id="btnDebugVoices">Diagnostico de vozes</button>', '')

# 4) dica de gênero abre o "Avançado" e cita o nome certo
rep('''em "Voz específica" abaixo''', '''em "Avançado" abaixo''')
rep('voiceSelect.focus();', "qs('.settings-advanced', container).open = true;\n        voiceSelect.focus();")

# 5) confirmação ao restaurar padrão
rep("qs('#btnResetVoice', container).addEventListener('click', () => {",
    "qs('#btnResetVoice', container).addEventListener('click', () => {\n      if (!confirm('Restaurar as configurações de voz para o padrão?')) return;")

open(p, 'w', encoding='utf-8').write(c)
print('OK: settings.js atualizado')
