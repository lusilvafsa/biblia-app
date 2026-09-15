package com.biblia.deestudo;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private final BroadcastReceiver mediaReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null) {
                return;
            }

            String action = intent.getAction();

            if (MediaNotificationService.ACTION_PLAY.equals(action)) {
                dispatchToWeb("media-notification-play");
                return;
            }

            if (MediaNotificationService.ACTION_PAUSE.equals(action)) {
                dispatchToWeb("media-notification-pause");
                return;
            }

            if (MediaNotificationService.ACTION_PREV.equals(action)) {
                if (intent.getBooleanExtra("chapter_navigation", false)) {
                    boolean chapterPrevious =
                            intent.getBooleanExtra("chapter_previous", false);

                    dispatchToWeb(
                            chapterPrevious
                                    ? "media-notification-prev-chapter"
                                    : "media-notification-next-chapter"
                    );
                    return;
                }

                dispatchToWeb("media-notification-prev");
                return;
            }

            if (MediaNotificationService.ACTION_NEXT.equals(action)) {
                if (intent.getBooleanExtra("chapter_navigation", false)) {
                    dispatchToWeb("media-notification-next-chapter");
                    return;
                }

                dispatchToWeb("media-notification-next");
                return;
            }

            if (MediaNotificationService.ACTION_PREV_CHAPTER.equals(action)) {
                Log.d(
                        "BIBLIA_MEDIA",
                        "ACTION_PREV_CHAPTER recebido na MainActivity"
                );

                dispatchToWeb("media-notification-prev-chapter");
                return;
            }

            if (MediaNotificationService.ACTION_NEXT_CHAPTER.equals(action)) {
                Log.d(
                        "BIBLIA_MEDIA",
                        "ACTION_NEXT_CHAPTER recebido na MainActivity"
                );

                dispatchToWeb("media-notification-next-chapter");
                return;
            }

            if (MediaNotificationService.ACTION_STOP.equals(action)) {
                dispatchToWeb("media-notification-stop");
            }
        }
    };

    private void dispatchToWeb(final String eventName) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    Log.w(
                            "BIBLIA_MEDIA",
                            "WebView indisponível para evento: " + eventName
                    );
                    return;
                }

                Log.d(
                        "BIBLIA_MEDIA",
                        "Disparando evento no WebView: " + eventName
                );

                String javascript =
                        "window.dispatchEvent(new CustomEvent('" +
                        eventName +
                        "'));";

                getBridge().getWebView().evaluateJavascript(
                        javascript,
                        null
                );
            }
        });
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MediaNotificationPlugin.class);

        super.onCreate(savedInstanceState);

        // Android 13+: solicita permissão de notificações na primeira abertura.
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(
                        Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED) {

            requestPermissions(
                    new String[]{
                            Manifest.permission.POST_NOTIFICATIONS
                    },
                    1001
            );
        }

        IntentFilter filter = new IntentFilter();

        filter.addAction(MediaNotificationService.ACTION_PLAY);
        filter.addAction(MediaNotificationService.ACTION_PAUSE);
        filter.addAction(MediaNotificationService.ACTION_PREV);
        filter.addAction(MediaNotificationService.ACTION_NEXT);
        filter.addAction(MediaNotificationService.ACTION_PREV_CHAPTER);
        filter.addAction(MediaNotificationService.ACTION_NEXT_CHAPTER);
        filter.addAction(MediaNotificationService.ACTION_STOP);

        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(
                    mediaReceiver,
                    filter,
                    Context.RECEIVER_NOT_EXPORTED
            );
        } else {
            registerReceiver(
                    mediaReceiver,
                    filter
            );
        }

        Log.d(
                "BIBLIA_MEDIA",
                "MainActivity: receptor de mídia registrado"
        );
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(mediaReceiver);
        } catch (Exception e) {
            Log.w(
                    "BIBLIA_MEDIA",
                    "Receptor de mídia já estava desregistrado"
            );
        }

        super.onDestroy();
    }
}
