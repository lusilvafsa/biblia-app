package com.biblia.deestudo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

public class MediaNotificationService extends Service {

    public static final String CHANNEL_ID = "biblia_media";
    public static final int NOTIFICATION_ID = 9001;

    public static final String ACTION_PLAY =
            "com.biblia.deestudo.MEDIA_PLAY";

    public static final String ACTION_PAUSE =
            "com.biblia.deestudo.MEDIA_PAUSE";

    public static final String ACTION_PREV =
            "com.biblia.deestudo.MEDIA_PREV";

    public static final String ACTION_NEXT =
            "com.biblia.deestudo.MEDIA_NEXT";

    public static final String ACTION_STOP =
            "com.biblia.deestudo.MEDIA_STOP";

    public static final String ACTION_UPDATE =
            "com.biblia.deestudo.MEDIA_UPDATE";

    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ARTIST = "artist";
    public static final String EXTRA_PLAYING = "playing";

    private String title = "Bíblia de Estudo";
    private String artist = "Bíblia em Áudio";
    private boolean playing = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (intent != null) {

            String action = intent.getAction();

            if (ACTION_UPDATE.equals(action)) {
                String newTitle = intent.getStringExtra(EXTRA_TITLE);
                String newArtist = intent.getStringExtra(EXTRA_ARTIST);

                if (newTitle != null && !newTitle.isEmpty()) {
                    title = newTitle;
                }

                if (newArtist != null && !newArtist.isEmpty()) {
                    artist = newArtist;
                }

                playing = intent.getBooleanExtra(
                        EXTRA_PLAYING,
                        false
                );

            } else if (ACTION_PLAY.equals(action)) {
                sendActionToApp(ACTION_PLAY);

            } else if (ACTION_PAUSE.equals(action)) {
                sendActionToApp(ACTION_PAUSE);

            } else if (ACTION_PREV.equals(action)) {
                sendActionToApp(ACTION_PREV);

            } else if (ACTION_NEXT.equals(action)) {
                sendActionToApp(ACTION_NEXT);

            } else if (ACTION_STOP.equals(action)) {
                sendActionToApp(ACTION_STOP);
                stopForeground(STOP_FOREGROUND_REMOVE);
                stopSelf();
                return START_NOT_STICKY;
            }
        }

        startForeground(
                NOTIFICATION_ID,
                buildNotification()
        );

        return START_STICKY;
    }

    private void sendActionToApp(String action) {
        Intent intent = new Intent(action);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    private Notification buildNotification() {

        Intent launchIntent =
                getPackageManager()
                        .getLaunchIntentForPackage(getPackageName());

        PendingIntent contentIntent =
                PendingIntent.getActivity(
                        this,
                        100,
                        launchIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(
                        this,
                        CHANNEL_ID
                )
                .setSmallIcon(
                        android.R.drawable.ic_media_play
                )
                .setContentTitle(title)
                .setContentText(artist)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setVisibility(
                        NotificationCompat.VISIBILITY_PUBLIC
                )
                .setPriority(
                        NotificationCompat.PRIORITY_LOW
                );

        builder.addAction(
                android.R.drawable.ic_media_previous,
                "Anterior",
                actionPendingIntent(ACTION_PREV, 201)
        );

        if (playing) {
            builder.addAction(
                    android.R.drawable.ic_media_pause,
                    "Pausar",
                    actionPendingIntent(ACTION_PAUSE, 202)
            );
        } else {
            builder.addAction(
                    android.R.drawable.ic_media_play,
                    "Reproduzir",
                    actionPendingIntent(ACTION_PLAY, 203)
            );
        }

        builder.addAction(
                android.R.drawable.ic_media_next,
                "Próxima",
                actionPendingIntent(ACTION_NEXT, 204)
        );

        builder.addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Parar",
                actionPendingIntent(ACTION_STOP, 205)
        );

        return builder.build();
    }

    private PendingIntent actionPendingIntent(
            String action,
            int requestCode
    ) {

        Intent intent = new Intent(
                this,
                MediaNotificationService.class
        );

        intent.setAction(action);

        return PendingIntent.getService(
                this,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT |
                        PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void createChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "Bíblia em Áudio",
                            NotificationManager.IMPORTANCE_LOW
                    );

            channel.setDescription(
                    "Controles da reprodução da Bíblia"
            );

            channel.setLockscreenVisibility(
                    Notification.VISIBILITY_PUBLIC
            );

            NotificationManager manager =
                    getSystemService(
                            NotificationManager.class
                    );

            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
