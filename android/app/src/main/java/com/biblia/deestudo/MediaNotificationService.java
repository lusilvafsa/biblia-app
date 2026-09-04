package com.biblia.deestudo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/* JADX INFO: loaded from: classes6.dex */
public class MediaNotificationService extends Service {
    public static final String ACTION_NEXT = "com.biblia.deestudo.MEDIA_NEXT";
    public static final String ACTION_PREV_CHAPTER = "com.biblia.deestudo.MEDIA_PREV_CHAPTER";
    public static final String ACTION_NEXT_CHAPTER = "com.biblia.deestudo.MEDIA_NEXT_CHAPTER";
    public static final String ACTION_PAUSE = "com.biblia.deestudo.MEDIA_PAUSE";
    public static final String ACTION_PLAY = "com.biblia.deestudo.MEDIA_PLAY";
    public static final String ACTION_PREV = "com.biblia.deestudo.MEDIA_PREV";
    public static final String ACTION_STOP = "com.biblia.deestudo.MEDIA_STOP";
    public static final String ACTION_UPDATE = "com.biblia.deestudo.MEDIA_UPDATE";
    public static final String CHANNEL_ID = "biblia_media";
    public static final String EXTRA_ARTIST = "artist";
    public static final String EXTRA_PLAYING = "playing";
    public static final String EXTRA_TITLE = "title";
    public static final int NOTIFICATION_ID = 9001;
    private String title = "Bíblia de Estudo";
    private String artist = "Bíblia em Áudio";
    private boolean playing = false;

    @Override // android.app.Service
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override // android.app.Service
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d("BIBLIA_MEDIA", "SERVICE onStartCommand()");
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_UPDATE.equals(action)) {
                String newTitle = intent.getStringExtra(EXTRA_TITLE);
                String newArtist = intent.getStringExtra(EXTRA_ARTIST);
                if (newTitle != null && !newTitle.isEmpty()) {
                    this.title = newTitle;
                }
                if (newArtist != null && !newArtist.isEmpty()) {
                    this.artist = newArtist;
                }
                this.playing = intent.getBooleanExtra(EXTRA_PLAYING, false);
            } else if (ACTION_PLAY.equals(action)) {
                sendActionToApp(ACTION_PLAY);
            } else if (ACTION_PAUSE.equals(action)) {
                sendActionToApp(ACTION_PAUSE);
            } else if (ACTION_PREV_CHAPTER.equals(action)) {
                Log.d("BIBLIA_MEDIA", "ACTION_PREV_CHAPTER recebido no Service");
                sendActionToApp(ACTION_PREV_CHAPTER);
                Log.d("BIBLIA_MEDIA", "ACTION_PREV_CHAPTER enviado para MainActivity");
            } else if (ACTION_NEXT_CHAPTER.equals(action)) {
                Log.d("BIBLIA_MEDIA", "ACTION_NEXT_CHAPTER recebido no Service");
                sendActionToApp(ACTION_NEXT_CHAPTER);
                Log.d("BIBLIA_MEDIA", "ACTION_NEXT_CHAPTER enviado para MainActivity");
            } else if (ACTION_PREV.equals(action)) {
                sendActionToApp(ACTION_PREV);
            } else if (ACTION_NEXT.equals(action)) {
                sendActionToApp(ACTION_NEXT);
            } else if (ACTION_STOP.equals(action)) {
                sendActionToApp(ACTION_STOP);
                stopForeground(1);
                stopSelf();
                return 2;
            }
        }
        Log.d("BIBLIA_MEDIA", "Chamando startForeground()");
        startForeground(NOTIFICATION_ID, buildNotification());
        Log.d("BIBLIA_MEDIA", "Notificação criada");
        return 1;
    }

    private void sendActionToApp(String action) {
        Intent intent = new Intent(action);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    private void sendChapterActionToApp(String action, boolean previous) {
        Intent intent = new Intent(action);
        intent.setPackage(getPackageName());
        intent.putExtra("chapter_navigation", true);
        intent.putExtra("chapter_previous", previous);
        sendBroadcast(intent);
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = PendingIntent.getActivity(this, 100, launchIntent, 201326592);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID).setSmallIcon(android.R.drawable.ic_media_play).setContentTitle("Bíblia de Estudo").setContentText(this.title).setContentIntent(contentIntent).setOngoing(true).setOnlyAlertOnce(true).setVisibility(1).setPriority(-1);
        builder.addAction(android.R.drawable.ic_media_rew, "Capítulo anterior", actionPendingIntent(ACTION_PREV_CHAPTER, 206));
        builder.addAction(android.R.drawable.ic_media_previous, "Anterior", actionPendingIntent(ACTION_PREV, 201));
        if (!this.playing) {
            builder.addAction(android.R.drawable.ic_media_play, "Reproduzir", actionPendingIntent(ACTION_PLAY, 203));
        } else {
            builder.addAction(android.R.drawable.ic_media_pause, "Pausar", actionPendingIntent(ACTION_PAUSE, 202));
        }
        builder.addAction(android.R.drawable.ic_media_next, "Próxima", actionPendingIntent(ACTION_NEXT, 204));
        builder.addAction(android.R.drawable.ic_media_ff, "Próximo capítulo", actionPendingIntent(ACTION_NEXT_CHAPTER, 207));
        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Parar", actionPendingIntent(ACTION_STOP, 205));
        builder.setStyle(new androidx.media.app.NotificationCompat.MediaStyle().setShowActionsInCompactView(0, 1, 2));
        return builder.build();
    }

    private PendingIntent actionPendingIntent(String action, int requestCode) {
        Intent intent = new Intent(this, (Class<?>) MediaNotificationService.class);
        intent.setAction(action);
        intent.setPackage(getPackageName());

        return PendingIntent.getService(
                this,
                requestCode,
                intent,
                201326592
        );
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Bíblia em Áudio", 2);
            channel.setDescription("Controles da reprodução da Bíblia");
            channel.setLockscreenVisibility(1);
            NotificationManager manager = (NotificationManager) getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    @Override // android.app.Service
    public IBinder onBind(Intent intent) {
        return null;
    }
}
