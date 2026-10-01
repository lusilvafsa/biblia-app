p = 'www/js/features/settings/settings.js'
c = open(p, encoding='utf-8').read()

def rep(old, new):
    global c
    n = c.count(old)
    if n != 1:
        raise SystemExit(f'ERRO: trecho achado {n}x (esperado 1): {old[:70]}')
    c = c.replace(old, new)

rep("import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';",
    "import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';\nimport { supabase } from '../../supabaseClient.js';")

rep('<div class="settings-section" id="notifSection"',
'''<div class="settings-section">
      <div class="settings-section-title">Assistente Bíblico</div>
      <div class="settings-card">
        <p class="ministry-plain-text" id="assistantUsage">Consultando...</p>
        <p class="voice-hint" style="margin-top:8px;">Respostas já geradas antes não gastam sua cota.</p>
      </div>
    </div>

    <div class="settings-section" id="notifSection"''')

rep("const notifToggle = qs('#notifToggle', container);",
'''const usoEl = qs('#assistantUsage', container);
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess?.session) {
          usoEl.textContent = 'Entre na sua conta para usar o Assistente.';
          return;
        }
        const { data, error } = await supabase.functions.invoke('assistente-biblico', {
          body: { consultarUso: true },
        });
        if (error || !data?.sucesso) throw new Error('falha');
        usoEl.textContent = `Hoje: ${data.usadas} de ${data.limite} perguntas · zera à meia-noite`;
      } catch {
        usoEl.textContent = 'Não foi possível consultar agora.';
      }
    })();

    const notifToggle = qs('#notifToggle', container);''')

open(p, 'w', encoding='utf-8').write(c)
print('OK: cartão do Assistente adicionado')
