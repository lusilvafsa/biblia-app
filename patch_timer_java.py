base = 'android/app/src/main/java/com/biblia/deestudo/'
svc = base + 'MediaNotificationService.java'
plg = base + 'MediaNotificationPlugin.java'
act = base + 'MainActivity.java'
s = open(svc, encoding='utf-8').read()
p = open(plg, encoding='utf-8').read()
a = open(act, encoding='utf-8').read()

if 'ACTION_SET_SLEEP_TIMER' in s or 'setSleepTimer' in p:
    raise SystemExit('Patch já aplicado antes. Nada a fazer.')

def troca(txt, antigo, novo):
    n = txt.count(antigo)
    if n != 1:
        raise SystemExit('Trecho não encontrado exatamente 1 vez (%d): %s' % (n, antigo))
    return txt.replace(antigo, novo)

# --- Serviço ---
ancora_const = 'public static final String ACTION_NEXT = "com.biblia.deestudo.MEDIA_NEXT";'
s = troca(s, ancora_const, ancora_const + '''
    public static final String ACTION_SET_SLEEP_TIMER = "com.biblia.deestudo.MEDIA_SET_SLEEP_TIMER";
    public static final String EXTRA_SLEEP_MINUTES = "sleep_minutes";''')

s = troca(s, 'private void pararFala() {', r'''private final android.os.Handler sleepHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private Runnable sleepRunnable = null;

    private void configurarSleepTimer(int minutos) {
        if (sleepRunnable != null) {
            sleepHandler.removeCallbacks(sleepRunnable);
            sleepRunnable = null;
        }
        if (minutos <= 0) return;
        sleepRunnable = new Runnable() {
            @Override
            public void run() {
                sleepRunnable = null;
                encerrarPorTemporizador();
            }
        };
        sleepHandler.postDelayed(sleepRunnable, minutos * 60L * 1000L);
    }

    private void encerrarPorTemporizador() {
        pararFala();
        playing = false;
        verses.clear();
        currentIndex = 0;
        updateWakeLock();
        notificarSemDado(ACTION_STOP);
        stopForeground(true);
        stopSelf();
    }

    private void pararFala() {''')

s = troca(s, '} else if (ACTION_PAUSE.equals(action)) {',
 '''} else if (ACTION_SET_SLEEP_TIMER.equals(action)) {
                configurarSleepTimer(intent.getIntExtra(EXTRA_SLEEP_MINUTES, 0));
            } else if (ACTION_PAUSE.equals(action)) {''')

s = troca(s, 'public void onDestroy() {',
 '''public void onDestroy() {
        if (sleepRunnable != null) {
            sleepHandler.removeCallbacks(sleepRunnable);
            sleepRunnable = null;
        }''')

# --- Plugin ---
ancora_plg = 'public static volatile boolean isNarrating = false;'
p = troca(p, ancora_plg, ancora_plg + r'''

    @PluginMethod
    public void setSleepTimer(PluginCall call) {
        Integer minutos = call.getInt("minutes", 0);
        if (!isNarrating) {
            if (minutos.intValue() > 0) {
                call.reject("A narração não está ativa");
            } else {
                call.resolve();
            }
            return;
        }
        Intent intent = new Intent(getContext(), (Class<?>) MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_SET_SLEEP_TIMER);
        intent.putExtra(MediaNotificationService.EXTRA_SLEEP_MINUTES, minutos.intValue());
        getContext().startService(intent);
        call.resolve();
    }''')

# --- MainActivity: garante que o aviso de "parar" chega ao app ---
if 'filter.addAction(MediaNotificationService.ACTION_STOP)' not in a:
    ev = 'filter.addAction(MediaNotificationService.EVENT_CHAPTER_COMPLETE);'
    a = troca(a, ev, ev + '\n        filter.addAction(MediaNotificationService.ACTION_STOP);')

for arq, txt in ((svc, s), (plg, p), (act, a)):
    original = open(arq, encoding='utf-8').read()
    open(arq + '.BACKUP-ANTES-TEMPORIZADOR', 'w', encoding='utf-8').write(original)
    open(arq, 'w', encoding='utf-8').write(txt)
print('Java atualizado (serviço, plugin e MainActivity).')
