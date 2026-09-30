package com.biblia.deestudo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MediaNotificationService extends Service implements TextToSpeech.OnInitListener {

    public static final String ACTION_NEXT = "com.biblia.deestudo.MEDIA_NEXT";
    public static final String ACTION_PREV_CHAPTER = "com.biblia.deestudo.MEDIA_PREV_CHAPTER";
    public static final String ACTION_NEXT_CHAPTER = "com.biblia.deestudo.MEDIA_NEXT_CHAPTER";
    public static final String ACTION_PAUSE = "com.biblia.deestudo.MEDIA_PAUSE";
    public static final String ACTION_PLAY = "com.biblia.deestudo.MEDIA_PLAY";
    public static final String ACTION_PREV = "com.biblia.deestudo.MEDIA_PREV";
    public static final String ACTION_STOP = "com.biblia.deestudo.MEDIA_STOP";
    public static final String ACTION_UPDATE = "com.biblia.deestudo.MEDIA_UPDATE";
    public static final String ACTION_START_NARRATION = "com.biblia.deestudo.MEDIA_START_NARRATION";

    public static final String EVENT_VERSE_CHANGED = "com.biblia.deestudo.NARRATION_VERSE_CHANGED";
    public static final String EVENT_CHAPTER_COMPLETE = "com.biblia.deestudo.NARRATION_CHAPTER_COMPLETE";
    public static final String EVENT_BOOK_COMPLETE = "com.biblia.deestudo.NARRATION_BOOK_COMPLETE";
    public static final String EVENT_REQUEST_PREV_CHAPTER = "com.biblia.deestudo.NARRATION_REQUEST_PREV_CHAPTER";
    public static final String EVENT_REQUEST_NEXT_CHAPTER = "com.biblia.deestudo.NARRATION_REQUEST_NEXT_CHAPTER";

    public static final String CHANNEL_ID = "biblia_media";
    public static final String EXTRA_ARTIST = "artist";
    public static final String EXTRA_PLAYING = "playing";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_VERSES = "verses";
    public static final String EXTRA_START_INDEX = "start_index";
    public static final String EXTRA_RATE = "rate";
    public static final String EXTRA_VOICE = "voice_name";
    public static final String EXTRA_VERSE_INDEX = "verse_index";
    public static final int NOTIFICATION_ID = 9001;

    private String title = "Bíblia de Estudo";
    private String artist = "Bíblia em Áudio";
    private boolean playing = false;
    private PowerManager.WakeLock wakeLock;

    private TextToSpeech tts;
    private boolean ttsPronto = false;
    private final ArrayList<String> verses = new ArrayList<>();
    private int currentIndex = 0;
    private float rate = 1.0f;
    private String vozDesejada = null;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();

        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "BibliaDeEstudo:NarracaoWakeLock"
            );
            wakeLock.setReferenceCounted(false);
        }

        tts = new TextToSpeech(this, this);

        Log.d("BIBLIA_MEDIA", "MediaNotificationService criado");
    }

    @Override
    public void onInit(int status) {
        ttsPronto = (status == TextToSpeech.SUCCESS);

        if (!ttsPronto) {
            Log.e("BIBLIA_MEDIA", "Falha ao iniciar o motor de voz nativo.");
            return;
        }

        tts.setLanguage(new Locale("pt", "BR"));
        aplicarVoz();
        aplicarVelocidade();

        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) { }

            @Override
            public void onDone(String utteranceId) {
                avancarENarrar();
            }

            @Override
            public void onError(String utteranceId) {
                avancarENarrar();
            }
        });

        Log.d("BIBLIA_MEDIA", "Motor de voz nativo pronto.");
    }

    private void aplicarVoz() {
        if (vozDesejada == null || vozDesejada.isEmpty()) return;
        try {
            Set<Voice> vozes = tts.getVoices();
            if (vozes == null) return;
            for (Voice v : vozes) {
                if (v.getName() != null && v.getName().equals(vozDesejada)) {
                    tts.setVoice(v);
                    break;
                }
            }
        } catch (Exception e) {
            Log.w("BIBLIA_MEDIA", "Não foi possível aplicar a voz desejada: " + e.getMessage());
        }
    }

    private void aplicarVelocidade() {
        try {
            tts.setSpeechRate(rate);
        } catch (Exception e) {
            Log.w("BIBLIA_MEDIA", "Não foi possível aplicar a velocidade: " + e.getMessage());
        }
    }

    private void avancarENarrar() {
        currentIndex++;
        if (currentIndex < verses.size()) {
            falarVersiculoAtual();
        } else {
            playing = false;
            updateWakeLock();
            notificarSemDado(EVENT_CHAPTER_COMPLETE);
            atualizarNotificacao();
        }
    }

    private void falarVersiculoAtual() {
        if (tts == null || !ttsPronto) return;
        if (currentIndex < 0 || currentIndex >= verses.size()) return;

        String texto = verses.get(currentIndex);
        String utteranceId = "verso_" + currentIndex;

        tts.speak(texto, TextToSpeech.QUEUE_FLUSH, null, utteranceId);

        playing = true;
        updateWakeLock();
        notificarVersiculo(currentIndex);
        atualizarNotificacao();
    }

    private void notificarVersiculo(int index) {
        Intent intent = new Intent(EVENT_VERSE_CHANGED);
        intent.setPackage(getPackageName());
        intent.putExtra(EXTRA_VERSE_INDEX, index);
        sendBroadcast(intent);
    }

    private void notificarSemDado(String acao) {
        Intent intent = new Intent(acao);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    private void updateWakeLock() {
        if (wakeLock == null) return;

        if (playing && !wakeLock.isHeld()) {
            wakeLock.acquire(2 * 60 * 60 * 1000L);
            Log.d("BIBLIA_MEDIA", "Wake lock adquirido (narração ativa).");
        } else if (!playing && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d("BIBLIA_MEDIA", "Wake lock liberado (narração parada/pausada).");
        }
    }

    private void atualizarNotificacao() {
        startForeground(NOTIFICATION_ID, buildNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d("BIBLIA_MEDIA", "SERVICE onStartCommand()");

        if (intent != null) {
            String action = intent.getAction();

            if (ACTION_START_NARRATION.equals(action)) {
                String newTitle = intent.getStringExtra(EXTRA_TITLE);
                String newArtist = intent.getStringExtra(EXTRA_ARTIST);
                ArrayList<String> novosVersiculos = intent.getStringArrayListExtra(EXTRA_VERSES);
                int startIndex = intent.getIntExtra(EXTRA_START_INDEX, 0);
                float novaVelocidade = intent.getFloatExtra(EXTRA_RATE, 1.0f);
                String novaVoz = intent.getStringExtra(EXTRA_VOICE);

                if (newTitle != null) title = newTitle;
                if (newArtist != null) artist = newArtist;
                rate = novaVelocidade;
                vozDesejada = novaVoz;

                verses.clear();
                if (novosVersiculos != null) verses.addAll(novosVersiculos);
                currentIndex = Math.max(0, Math.min(startIndex, verses.size() - 1));

                if (ttsPronto) {
                    aplicarVoz();
                    aplicarVelocidade();
                }

                if (!verses.isEmpty()) {
                    falarVersiculoAtual();
                }

            } else if (ACTION_PLAY.equals(action)) {
                if (!verses.isEmpty()) {
                    falarVersiculoAtual();
                }

            } else if (ACTION_PAUSE.equals(action)) {
                if (tts != null) tts.stop();
                playing = false;
                updateWakeLock();
                atualizarNotificacao();

            } else if (ACTION_NEXT.equals(action)) {
                if (tts != null) tts.stop();
                if (currentIndex < verses.size() - 1) {
                    currentIndex++;
                    falarVersiculoAtual();
                }

            } else if (ACTION_PREV.equals(action)) {
                if (tts != null) tts.stop();
                if (currentIndex > 0) {
                    currentIndex--;
                    falarVersiculoAtual();
                }

            } else if (ACTION_PREV_CHAPTER.equals(action)) {
                if (tts != null) tts.stop();
                playing = false;
                updateWakeLock();
                notificarSemDado(EVENT_REQUEST_PREV_CHAPTER);

            } else if (ACTION_NEXT_CHAPTER.equals(action)) {
                if (tts != null) tts.stop();
                playing = false;
                updateWakeLock();
                notificarSemDado(EVENT_REQUEST_NEXT_CHAPTER);

            } else if (ACTION_STOP.equals(action)) {
                if (tts != null) tts.stop();
                playing = false;
                verses.clear();
                currentIndex = 0;
                updateWakeLock();
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            }
        }

        atualizarNotificacao();

        return START_STICKY;
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());

        PendingIntent contentIntent = PendingIntent.getActivity(
                this, 100, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle("Bíblia de Estudo")
                .setContentText(title)
                .setSubText(artist)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        builder.addAction(android.R.drawable.ic_media_rew, "Capítulo anterior",
                actionPendingIntent(ACTION_PREV_CHAPTER, 206));

        builder.addAction(android.R.drawable.ic_media_previous, "Anterior",
                actionPendingIntent(ACTION_PREV, 201));

        if (!playing) {
            builder.addAction(android.R.drawable.ic_media_play, "Reproduzir",
                    actionPendingIntent(ACTION_PLAY, 203));
        } else {
            builder.addAction(android.R.drawable.ic_media_pause, "Pausar",
                    actionPendingIntent(ACTION_PAUSE, 202));
        }

        builder.addAction(android.R.drawable.ic_media_next, "Próxima",
                actionPendingIntent(ACTION_NEXT, 204));

        builder.addAction(android.R.drawable.ic_media_ff, "Próximo capítulo",
                actionPendingIntent(ACTION_NEXT_CHAPTER, 207));

        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Parar",
                actionPendingIntent(ACTION_STOP, 205));

        builder.setStyle(
                new androidx.media.app.NotificationCompat.MediaStyle()
                        .setShowActionsInCompactView(0, 1, 2)
        );

        return builder.build();
    }

    private PendingIntent actionPendingIntent(String action, int requestCode) {
        Intent intent = new Intent(this, MediaNotificationService.class);
        intent.setAction(action);
        intent.setPackage(getPackageName());
        return PendingIntent.getService(
                this, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Bíblia em Áudio", NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Controles da reprodução da Bíblia");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager manager = (NotificationManager) getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
