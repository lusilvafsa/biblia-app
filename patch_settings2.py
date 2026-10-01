p = 'www/js/features/settings/settings.js'
c = open(p, encoding='utf-8').read()

def rep(old, new):
    global c
    n = c.count(old)
    if n != 1:
        raise SystemExit(f'ERRO: trecho achado {n}x (esperado 1): {old[:70]}')
    c = c.replace(old, new)

# 1) imports
rep("const SAMPLE_TEXT =", """import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';
import { BIBLE_VERSIONS } from '../../../data/bibleVersions.js';
import { getBibleVersion, setBibleVersion } from '../../state/bibleVersion.js';
import { getDailyNotificationConfig, applyDailyNotification } from '../../utils/dailyNotification.js';

const SAMPLE_TEXT =""")

# 2) helpers antes do template
rep("function template(settings) {", """function isNativeApp() {
  const cap = window.Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

function readerFontSize() {
  return Number(getItem(STORAGE_KEYS.settings, {}).fontSize) || 18;
}

function versionOptionsHtml() {
  const atual = getBibleVersion();
  return BIBLE_VERSIONS.filter((v) => v.available !== false)
    .map((v) => `<option value="${v.id}" ${v.id === atual ? 'selected' : ''}>${v.label} — ${v.name}</option>`)
    .join('');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function template(settings) {""")

# 3) novas seções antes da seção "Aplicativo"
rep("""<div class="settings-section" id="installSection\"""", """<div class="settings-section">
      <div class="settings-section-title">Leitura</div>
      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-row-header">
            <span class="setting-label">Tamanho da letra</span>
            <span class="setting-value" id="fontValue">${readerFontSize()} px</span>
          </div>
          <input type="range" class="range-slider" id="fontSlider" min="12" max="32" step="1" value="${readerFontSize()}">
          <p id="fontPreview" style="margin-top:12px;font-size:${readerFontSize()}px;line-height:1.6;">O Senhor é o meu pastor; nada me faltará.</p>
        </div>
        <div class="setting-row">
          <div class="setting-row-header"><span class="setting-label">Versão padrão da Bíblia</span></div>
          <select class="select-input" id="versionSelect">${versionOptionsHtml()}</select>
        </div>
      </div>
    </div>

    <div class="settings-section" id="notifSection" ${isNativeApp() ? '' : 'hidden'}>
      <div class="settings-section-title">Lembrete diário</div>
      <div class="settings-card">
        <div class="setting-row">
          <label class="setting-label" style="display:flex;align-items:center;gap:10px;">
            <input type="checkbox" id="notifToggle" ${getDailyNotificationConfig().enabled ? 'checked' : ''}>
            Lembrar de ler todos os dias
          </label>
        </div>
        <div class="setting-row">
          <div class="setting-row-header"><span class="setting-label">Horário</span></div>
          <input type="time" class="select-input" id="notifTime" value="${pad2(getDailyNotificationConfig().hour)}:${pad2(getDailyNotificationConfig().minute)}" ${getDailyNotificationConfig().enabled ? '' : 'disabled'}>
        </div>
      </div>
    </div>

    <div class="settings-section" id="installSection\"""")

# 4) eventos
rep("const installSection = qs('#installSection', container);", """const fontSlider = qs('#fontSlider', container);
    const fontValue = qs('#fontValue', container);
    const fontPreview = qs('#fontPreview', container);
    fontSlider.addEventListener('input', () => {
      const fontSize = Number(fontSlider.value);
      fontValue.textContent = fontSize + ' px';
      fontPreview.style.fontSize = fontSize + 'px';
      setItem(STORAGE_KEYS.settings, { ...getItem(STORAGE_KEYS.settings, {}), fontSize });
    });

    qs('#versionSelect', container).addEventListener('change', (e) => {
      setBibleVersion(e.target.value);
      toast.success('Versão padrão alterada');
    });

    const notifToggle = qs('#notifToggle', container);
    const notifTime = qs('#notifTime', container);
    async function saveNotification() {
      const [hour, minute] = (notifTime.value || '08:00').split(':').map(Number);
      notifTime.disabled = !notifToggle.checked;
      const ok = await applyDailyNotification({ enabled: notifToggle.checked, hour, minute });
      if (ok) toast.success(notifToggle.checked ? 'Lembrete salvo' : 'Lembrete desativado');
      else toast.error('Não foi possível agendar. Verifique a permissão de notificações.');
    }
    notifToggle.addEventListener('change', saveNotification);
    notifTime.addEventListener('change', saveNotification);

    const installSection = qs('#installSection', container);""")

open(p, 'w', encoding='utf-8').write(c)
print('OK: parte B aplicada')
