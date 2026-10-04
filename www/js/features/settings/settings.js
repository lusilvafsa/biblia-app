import { VOZ_MASCULINA_PADRAO } from '../../state/voiceSettings.js';
// Tela: Configurações — tom de voz, velocidade de leitura e escolha da voz
// usados em toda leitura por voz do app (versículo do dia, capítulos,
// narrativa de capítulos, trechos selecionados e o player de "Bíblia em
// Áudio").
import { qs, qsa } from '../../utils/dom.js';
import { toast } from '../../utils/toast.js';
import {
  speak,
  stopSpeech,
  getAvailableVoices,
  onVoicesChanged,
  isSpeechSupported,
  guessVoiceGender,
  findVoiceByGender,
} from '../../utils/speech.js';
import { getVoiceSettings, setVoiceSettings, resetVoiceSettings, DEFAULT_VOICE_SETTINGS } from '../../state/voiceSettings.js';
import { isInstallAvailable, onInstallAvailabilityChange, promptInstall } from '../../state/installPrompt.js';

import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage.js';
import { supabase } from '../../supabaseClient.js';
import { APP_VERSION, APP_BUILD, APP_DATE } from '../../version.js';
import { exportarBackup, importarBackup } from '../../utils/backup.js';
import { BIBLE_VERSIONS } from '../../../data/bibleVersions.js';
import { getBibleVersion, setBibleVersion } from '../../state/bibleVersion.js';
import { getDailyNotificationConfig, applyDailyNotification } from '../../utils/dailyNotification.js';

const SAMPLE_TEXT = 'O Senhor é o meu pastor; nada me faltará.';

function pitchLabel(v) {
  return `${pitchLabelBase(v)} · ${String(Number(v.toFixed(1))).replace('.', ',')}`;
}

function pitchLabelBase(v) {
  if (v <= 0.8) return 'Grave';
  if (v >= 1.5) return 'Agudo';
  return 'Normal';
}

function rateLabel(v) {
  return `${rateLabelBase(v)} · ${String(Number(v.toFixed(2))).replace('.', ',')}×`;
}

function rateLabelBase(v) {
  if (v <= 0.7) return 'Lenta';
  if (v >= 1.15) return 'Rápida';
  return 'Normal';
}

function genderSuffix(voice) {
  const gender = guessVoiceGender(voice);
  if (gender === 'male') return ' — masculina';
  if (gender === 'female') return ' — feminina';
  return '';
}

function voiceOptionsHtml(voices, selectedURI) {
  const autoSelected = !selectedURI ? 'selected' : '';
  let html = `<option value="" ${autoSelected}>Automática (masculina)</option>`;
  voices.forEach((v) => {
    const sel = v.voiceURI === selectedURI ? 'selected' : '';
    html += `<option value="${v.voiceURI}" ${sel}>${v.voiceURI}${v.voiceURI === VOZ_MASCULINA_PADRAO ? ' — masculina (padrão)' : ''}</option>`;
  });
  return html;
}

/** Determina qual botão do seletor rápido (Masculina/Feminina/Automática)
 * deve aparecer marcado como ativo, a partir da voz selecionada agora. */
function currentGenderPreference(settings) {
  if (!settings.voiceURI) return 'auto';
  if (settings.voiceURI === VOZ_MASCULINA_PADRAO) return 'male';
  const voice = getAvailableVoices().find((v) => v.voiceURI === settings.voiceURI);
  return guessVoiceGender(voice) === 'female' ? 'female' : guessVoiceGender(voice) === 'male' ? 'male' : 'auto';
}

function isNativeApp() {
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

function template(settings) {
  const pref = currentGenderPreference(settings);
  return `
    <div class="settings-section">
      <div class="settings-section-title">Voz e Leitura</div>
      <div class="settings-card">

        <div class="setting-row">
          <div class="setting-row-header"><span class="setting-label">Voz da narrativa</span></div>
          <div class="gender-toggle" id="genderToggle">
            <button type="button" data-gender="male" class="${pref === 'male' ? 'active' : ''}">Masculina</button>
            <button type="button" data-gender="female" class="${pref === 'female' ? 'active' : ''}">Feminina</button>
            <button type="button" data-gender="auto" class="${pref === 'auto' ? 'active' : ''}">Automática</button>
          </div>
          <div class="voice-hint" id="voiceHint" hidden></div>
        <div class="setting-row">
          <label class="setting-label" style="display:flex;align-items:center;gap:10px;">
            <input type="checkbox" id="readTitlesToggle" ${getVoiceSettings().readTitles !== false ? 'checked' : ''}>
            Ler os títulos das passagens
          </label>
        </div>
        </div>


        <div class="setting-row">
          <div class="setting-row-header">
            <span class="setting-label">Velocidade da leitura</span>
            <span class="setting-value" id="rateValue">${rateLabel(settings.rate)}</span>
          </div>
          <input type="range" class="range-slider" id="rateSlider" min="0.5" max="1.5" step="0.1" value="${settings.rate}">
          <div class="setting-scale"><span>Lenta</span><span>Rápida</span></div>
        </div>

        <div class="setting-row">
          <details class="settings-advanced"><summary class="setting-label" style="cursor:pointer;">Avançado: voz específica</summary>
          <select class="select-input" id="voiceSelect" style="margin-top:12px;">${voiceOptionsHtml(getAvailableVoices(), settings.voiceURI)}</select><div class="setting-scale" style="justify-content:flex-start;"><span>As vozes disponíveis dependem do seu aparelho.</span></div><button class="tool-btn" id="btnDebugVoices" type="button" style="margin-top:12px;">Diagnóstico de vozes</button></details>
          <div class="setting-scale" style="justify-content:flex-start;">
            
          </div>
        </div>

      </div>

      <div class="settings-actions">
        <button class="tool-btn" id="btnTestVoice">Testar voz</button>
        <button class="tool-btn" id="btnResetVoice">Restaurar padrão</button>
        
      </div>
    </div>

    <div class="settings-section">
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

    <div class="settings-section">
      <div class="settings-section-title">Assistente Bíblico</div>
      <div class="settings-card">
        <p class="ministry-plain-text" id="assistantUsage">Consultando...</p>
        <p style="margin-top:8px;font-size:13px;opacity:.65;">Respostas já geradas antes não gastam sua cota.</p>
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

    <div class="settings-section">
      <div class="settings-section-title">Backup</div>
      <div class="settings-card">
        <p class="ministry-plain-text" style="margin-bottom:14px;">Salve seus favoritos, anotações, grifos, planos e a sequência de leitura em um arquivo, ou restaure de um backup. Importar nunca apaga nada: só acrescenta ou atualiza.</p>
        <div class="settings-actions">
          <button class="tool-btn" id="btnBackupExport" type="button">Exportar</button>
          <button class="tool-btn" id="btnBackupImport" type="button">Importar</button>
        </div>
        <input type="file" id="backupFile" accept="application/json,.json" hidden>
        <p style="margin-top:10px;font-size:13px;opacity:.65;">O arquivo não é criptografado. Guarde-o em local seguro.</p>
      </div>
    </div>

    <div class="settings-section" id="installSection" ${isInstallAvailable() ? '' : 'hidden'}>
      <div class="settings-section-title">Aplicativo</div>
      <div class="settings-card">
        <p class="ministry-plain-text" style="margin-bottom:14px;">Instale o app na tela inicial para abrir em tela cheia, sem a barra de endereço do navegador.</p>
        <button class="read-btn read-btn--primary" id="btnInstallApp" style="width:100%;">📲 Instalar aplicativo</button>
      </div>
    </div>

    <div class="app-info">
      Bíblia de Estudo — v${APP_VERSION} · build ${APP_BUILD}<br>
    Atualizado em ${APP_DATE}<br>
      Versões: ACF, BLIVRE e ARC 1911<br>
      Referências cruzadas: OpenBible.info (CC BY 4.0)
    </div>
  `;
}

export const settingsPage = {
  render(container) {
    let settings = getVoiceSettings();
    container.innerHTML = template(settings);

    if (!isSpeechSupported()) {
      qs('#btnTestVoice', container).disabled = true;
      toast.info('Leitura por voz não é suportada neste navegador');
    }

    const rateSlider = qs('#rateSlider', container);
    const voiceSelect = qs('#voiceSelect', container);
    const rateValue = qs('#rateValue', container);
    const genderToggle = qs('#genderToggle', container);
    const voiceHint = qs('#voiceHint', container);
    const readTitlesToggle = qs('#readTitlesToggle', container);
    if (readTitlesToggle) {
      readTitlesToggle.addEventListener('change', () => {
        setVoiceSettings({ readTitles: readTitlesToggle.checked });
      });
    }

    function setActiveGenderButton(pref) {
      qsa('button', genderToggle).forEach((btn) => btn.classList.toggle('active', btn.dataset.gender === pref));
    }

    function showVoiceHint(message) {
      voiceHint.textContent = message;
      voiceHint.hidden = false;
    }

    function hideVoiceHint() {
      voiceHint.hidden = true;
    }

    genderToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-gender]');
      if (!btn) return;
      const pref = btn.dataset.gender;

      if (pref === 'auto') {
        setVoiceSettings({ voiceURI: null });
        voiceSelect.value = '';
        setActiveGenderButton('auto');
        hideVoiceHint();
        return;
      }

      const voice = findVoiceByGender(pref);
      if (!voice) {
        // Em vários aparelhos (sobretudo Android) as vozes vêm com nome
        // genérico ("português do Brasil"), sem nenhuma pista de gênero —
        // não tem como adivinhar automaticamente. Em vez de só mostrar um
        // toast que some sozinho, deixa uma dica fixa e guia para o teste
        // manual de cada voz disponível.
        const genderWord = pref === 'male' ? 'masculina' : 'feminina';
        toast.info(`Nenhuma voz ${genderWord} identificada automaticamente neste aparelho.`);
        showVoiceHint(
          `Não conseguimos identificar pelo nome qual voz deste aparelho é ${genderWord} — isso depende do sistema/navegador. Escolha uma opção em "Avançado" abaixo e toque em "Testar voz" para ouvir qual combina.`
        );
        setVoiceSettings({ voiceURI: null });
        voiceSelect.value = '';
        setActiveGenderButton('auto');
        qs('.settings-advanced', container).open = true;
        voiceSelect.focus();
        return;
      }
      hideVoiceHint();
      setVoiceSettings({ voiceURI: voice.voiceURI });
      voiceSelect.value = voice.voiceURI;
      setActiveGenderButton(pref);
    });


    rateSlider.addEventListener('input', () => {
      const rate = Number(rateSlider.value);
      rateValue.textContent = rateLabel(rate);
      setVoiceSettings({ rate });
    });

    voiceSelect.addEventListener('change', () => {
      const voiceURI = voiceSelect.value || null;
      setVoiceSettings({ voiceURI });
      const voice = getAvailableVoices().find((v) => v.voiceURI === voiceURI);
      const gender = voiceURI === VOZ_MASCULINA_PADRAO ? 'male' : (voiceURI ? guessVoiceGender(voice) : 'auto');
      setActiveGenderButton(gender === 'unknown' ? 'auto' : gender);
      if (voiceURI) hideVoiceHint();
    });

    // A lista de vozes do navegador pode carregar de forma assíncrona.
    const unsubscribeVoices = onVoicesChanged((voices) => {
      const current = getVoiceSettings().voiceURI;
      voiceSelect.innerHTML = voiceOptionsHtml(voices, current);
    });

    qs('#btnTestVoice', container).addEventListener('click', () => {
      stopSpeech();
      speak(SAMPLE_TEXT, {
        onError: () => toast.error('Não foi possível testar a voz'),
      });
    });

    qs('#btnDebugVoices', container).addEventListener('click', () => alert(JSON.stringify(getAvailableVoices(), null, 2)));
    qs('#btnResetVoice', container).addEventListener('click', () => {
      if (!confirm('Restaurar as configurações de voz para o padrão?')) return;
      resetVoiceSettings();
      settings = { ...DEFAULT_VOICE_SETTINGS };
      rateSlider.value = settings.rate;
      rateValue.textContent = rateLabel(settings.rate);
      voiceSelect.innerHTML = voiceOptionsHtml(getAvailableVoices(), null);
      setActiveGenderButton('auto');
      hideVoiceHint();
      toast.success('Configurações de voz restauradas');
    });

    const fontSlider = qs('#fontSlider', container);
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

    const usoEl = qs('#assistantUsage', container);
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
        usoEl.textContent = data.restantes > 0
          ? `Restam ${data.restantes} de ${data.limite} perguntas hoje · zera à meia-noite`
          : `Você usou as ${data.limite} perguntas de hoje. Volta à meia-noite.`;
      } catch {
        usoEl.textContent = 'Não foi possível consultar agora.';
      }
    })();

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

    const btnExp = qs('#btnBackupExport', container);
    const btnImp = qs('#btnBackupImport', container);
    const arquivoEl = qs('#backupFile', container);
    btnExp.addEventListener('click', async () => {
      btnExp.disabled = true;
      try {
        const r = await exportarBackup();
        toast.success(`Backup pronto: ${r.favoritos} favoritos/anotações, ${r.grifos} grifos, ${r.planos} planos e ${r.diasLidos} dias de leitura.`);
      } catch (err) {
        toast.error(err && err.message ? err.message : 'Não foi possível gerar o backup.');
      } finally {
        btnExp.disabled = false;
      }
    });
    btnImp.addEventListener('click', () => arquivoEl.click());
    arquivoEl.addEventListener('change', async () => {
      const arquivo = arquivoEl.files && arquivoEl.files[0];
      arquivoEl.value = '';
      if (!arquivo) return;
      if (!confirm('Importar este backup? Nada será apagado: itens novos são acrescentados e, se um item já existir, vale o mais recente.')) return;
      btnImp.disabled = true;
      try {
        const r = await importarBackup(arquivo);
        toast.success(`Importado: ${r.favoritos.adicionados} novos, ${r.favoritos.atualizados} atualizados, ${r.grifos.adicionados} grifos novos, ${r.planos.adicionados} dias de planos, ${r.leitura.adicionados} dias de leitura.`);
      } catch (err) {
        toast.error(err && err.message ? err.message : 'Não foi possível importar o backup.');
      } finally {
        btnImp.disabled = false;
      }
    });

    const installSection = qs('#installSection', container);
    const installBtn = qs('#btnInstallApp', container);
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        const outcome = await promptInstall();
        if (outcome === 'accepted') toast.success('Instalando o aplicativo...');
      });
    }
    const unsubscribeInstall = onInstallAvailabilityChange((available) => {
      if (installSection) installSection.hidden = !available;
    });

    return () => {
      unsubscribeVoices();
      unsubscribeInstall();
      stopSpeech();
    };
  },
};
