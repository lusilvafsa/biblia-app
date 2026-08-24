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
  findVoiceByGender,
} from '../../utils/speech.js';
import { getVoiceSettings, setVoiceSettings, resetVoiceSettings, DEFAULT_VOICE_SETTINGS } from '../../state/voiceSettings.js';
import { isInstallAvailable, onInstallAvailabilityChange, promptInstall } from '../../state/installPrompt.js';

const SAMPLE_TEXT = 'O Senhor é o meu pastor; nada me faltará.';

function pitchLabel(v) {
  if (v <= 0.8) return 'Grave';
  if (v >= 1.5) return 'Agudo';
  return 'Normal';
}

function rateLabel(v) {
  if (v <= 0.7) return 'Lenta';
  if (v >= 1.15) return 'Rápida';
  return 'Normal';
}

function genderSuffix(voice) {
  const gender = findVoiceByGender(voice);
  if (gender === 'male') return ' — masculina';
  if (gender === 'female') return ' — feminina';
  return '';
}

function voiceOptionsHtml(voices, selectedURI) {
  const autoSelected = !selectedURI ? 'selected' : '';
  let html = `<option value="" ${autoSelected}>Automática (masculina, pt-BR quando disponível)</option>`;
  voices.forEach((v) => {
    const sel = v.voiceURI === selectedURI ? 'selected' : '';
    html += `<option value="${v.voiceURI}" ${sel}>${v.name} (${v.lang})${genderSuffix(v)}</option>`;
  });
  return html;
}

/** Determina qual botão do seletor rápido (Masculina/Feminina/Automática)
 * deve aparecer marcado como ativo, a partir da voz selecionada agora. */
function currentGenderPreference(settings) {
  if (!settings.voiceURI) return 'auto';
  const voice = getAvailableVoices().find((v) => v.voiceURI === settings.voiceURI);
  return findVoiceByGender(voice) === 'female' ? 'female' : findVoiceByGender(voice) === 'male' ? 'male' : 'auto';
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
        </div>

        <div class="setting-row">
          <div class="setting-row-header">
            <span class="setting-label">Tom de voz</span>
            <span class="setting-value" id="pitchValue">${pitchLabel(settings.pitch)}</span>
          </div>
          <input type="range" class="range-slider" id="pitchSlider" min="0.5" max="2" step="0.1" value="${settings.pitch}">
          <div class="setting-scale"><span>Grave</span><span>Agudo</span></div>
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
          <div class="setting-row-header"><span class="setting-label">Voz específica</span></div>
          <select class="select-input" id="voiceSelect">${voiceOptionsHtml(getAvailableVoices(), settings.voiceURI)}</select>
          <div class="setting-scale" style="justify-content:flex-start;">
            <span>As vozes disponíveis dependem do seu aparelho e navegador.</span>
          </div>
        </div>

      </div>

      <div class="settings-actions">
        <button class="tool-btn" id="btnTestVoice">Testar voz</button>
        <button class="tool-btn" id="btnResetVoice">Restaurar padrão</button>
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
      Bíblia de Estudo<br>
      Texto: versão ACF (Almeida Corrigida Fiel)
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

    const pitchSlider = qs('#pitchSlider', container);
    const rateSlider = qs('#rateSlider', container);
    const voiceSelect = qs('#voiceSelect', container);
    const pitchValue = qs('#pitchValue', container);
    const rateValue = qs('#rateValue', container);
    const genderToggle = qs('#genderToggle', container);
    const voiceHint = qs('#voiceHint', container);

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
          `Não conseguimos identificar pelo nome qual voz deste aparelho é ${genderWord} — isso depende do sistema/navegador. Escolha uma opção em "Voz específica" abaixo e toque em "Testar voz" para ouvir qual combina.`
        );
        setVoiceSettings({ voiceURI: null });
        voiceSelect.value = '';
        setActiveGenderButton('auto');
        voiceSelect.focus();
        return;
      }
      hideVoiceHint();
      setVoiceSettings({ voiceURI: voice.voiceURI });
      voiceSelect.value = voice.voiceURI;
      setActiveGenderButton(pref);
    });

    pitchSlider.addEventListener('input', () => {
      const pitch = Number(pitchSlider.value);
      pitchValue.textContent = pitchLabel(pitch);
      setVoiceSettings({ pitch });
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
      const gender = voiceURI ? findVoiceByGender(voice) : 'auto';
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

    qs('#btnResetVoice', container).addEventListener('click', () => {
      resetVoiceSettings();
      settings = { ...DEFAULT_VOICE_SETTINGS };
      pitchSlider.value = settings.pitch;
      rateSlider.value = settings.rate;
      pitchValue.textContent = pitchLabel(settings.pitch);
      rateValue.textContent = rateLabel(settings.rate);
      voiceSelect.innerHTML = voiceOptionsHtml(getAvailableVoices(), null);
      setActiveGenderButton('auto');
      hideVoiceHint();
      toast.success('Configurações de voz restauradas');
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
