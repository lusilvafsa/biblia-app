arq = 'www/js/features/bible/reader.js'
c = open(arq, encoding='utf-8').read()

if 'btnSleep' in c:
    raise SystemExit('Patch já aplicado antes. Nada a fazer.')

def troca(txt, antigo, novo):
    n = txt.count(antigo)
    if n != 1:
        raise SystemExit('Trecho não encontrado exatamente 1 vez (%d): %s' % (n, antigo))
    return txt.replace(antigo, novo)

botao = '<button class="tool-btn" id="btnFontMinus" aria-label="Diminuir fonte">A-</button>'
c = troca(c, botao,
 '<button class="tool-btn" id="btnSleep" title="Temporizador para dormir" aria-label="Temporizador para dormir">🌙</button>\n        ' + botao)

c = troca(c, 'function nativeStop() {', 'function nativeStop() {\n      window.__sleepTimer = null;')

bloco = r'''// Temporizador para dormir: quem conta o tempo é o serviço nativo.
    const sleepBtn = qs('#btnSleep', container);
    let sleepMenu = null;
    const sleepOptions = [5, 15, 30, 45, 60];

    function sleepNativeCall(minutes) {
      try {
        const p = getNativeNarrator();
        if (p && p.setSleepTimer) p.setSleepTimer({ minutes: minutes });
      } catch (e) { console.warn('Temporizador:', e); }
    }

    function sleepRemaining() {
      const t = window.__sleepTimer;
      if (!t) return 0;
      const left = Math.ceil((t.endsAt - Date.now()) / 60000);
      if (left <= 0) { window.__sleepTimer = null; return 0; }
      return left;
    }

    function updateSleepBtn() {
      if (!sleepBtn) return;
      const left = sleepRemaining();
      sleepBtn.classList.toggle('active-audio', left > 0);
      sleepBtn.title = left > 0 ? 'Temporizador: faltam cerca de ' + left + ' min' : 'Temporizador para dormir';
    }

    function closeSleepMenu() {
      if (sleepMenu) { sleepMenu.remove(); sleepMenu = null; }
    }

    function applySleepTimer(minutes) {
      if (minutes > 0 && !nativeNarrationActive) {
        toast.info('Inicie a leitura para usar o temporizador.');
        return;
      }
      sleepNativeCall(minutes);
      window.__sleepTimer = minutes > 0 ? { minutes: minutes, endsAt: Date.now() + minutes * 60000 } : null;
      updateSleepBtn();
      toast.info(minutes > 0 ? 'A leitura vai parar em ' + minutes + ' minutos' : 'Temporizador desativado');
    }

    function openSleepMenu() {
      closeSleepMenu();
      if (typeof closeSpeedMenu === 'function') closeSpeedMenu();
      sleepMenu = document.createElement('div');
      sleepMenu.className = 'speed-selection-menu';
      const ativo = sleepRemaining() > 0 ? window.__sleepTimer.minutes : 0;
      sleepOptions.forEach((m) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'speed-option';
        option.textContent = m + ' min';
        if (m === ativo) option.classList.add('selected');
        option.addEventListener('click', (event) => {
          event.stopPropagation();
          applySleepTimer(m);
          closeSleepMenu();
        });
        sleepMenu.appendChild(option);
      });
      if (ativo > 0) {
        const off = document.createElement('button');
        off.type = 'button';
        off.className = 'speed-option';
        off.textContent = 'Desativar';
        off.addEventListener('click', (event) => {
          event.stopPropagation();
          applySleepTimer(0);
          closeSleepMenu();
        });
        sleepMenu.appendChild(off);
      }
      sleepBtn.parentElement.appendChild(sleepMenu);
    }

    if (sleepBtn) {
      sleepBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (sleepMenu) closeSleepMenu(); else openSleepMenu();
      });
      document.addEventListener('click', (event) => {
        if (sleepMenu && !sleepMenu.contains(event.target) && event.target !== sleepBtn) closeSleepMenu();
      });
      updateSleepBtn();
    }

    '''
c = troca(c, "stopBtn.addEventListener('click', () => {", bloco + "stopBtn.addEventListener('click', () => {")

open(arq + '.BACKUP-ANTES-TEMPORIZADOR', 'w', encoding='utf-8').write(open(arq, encoding='utf-8').read())
open(arq, 'w', encoding='utf-8').write(c)
print('Botão do temporizador adicionado.')
