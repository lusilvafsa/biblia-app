package com.biblia.deestudo;

import android.Manifest;
import android.util.Log;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/* JADX INFO: loaded from: classes6.dex */
public class MainActivity extends BridgeActivity {
    private final BroadcastReceiver mediaReceiver = new AnonymousClass1();

    /* JADX INFO: renamed from: com.biblia.deestudo.MainActivity$1, reason: invalid class name */
    class AnonymousClass1 extends BroadcastReceiver {
        AnonymousClass1() {
        }

        @Override // android.content.BroadcastReceiver
        public void onReceive(Context context, Intent intent) {
            if (intent == null) {
                return;
            }
            String action = intent.getAction();
            if (MediaNotificationService.ACTION_PLAY.equals(action)) {
                MainActivity.this.runOnUiThread(new Runnable() { // from class: com.biblia.deestudo.MainActivity$1$$ExternalSyntheticLambda0
                    @Override // java.lang.Runnable
                    public final void run() {
                        AnonymousClass1.this.lambda$onReceive$0();
                    }
                });
                return;
            }
            if (MediaNotificationService.ACTION_PAUSE.equals(action)) {
                MainActivity.this.runOnUiThread(new Runnable() { // from class: com.biblia.deestudo.MainActivity$1$$ExternalSyntheticLambda1
                    @Override // java.lang.Runnable
                    public final void run() {
                        AnonymousClass1.this.lambda$onReceive$1();
                    }
                });
                return;
            }
            if (MediaNotificationService.ACTION_PREV.equals(action)) {
                if (intent.getBooleanExtra("chapter_navigation", false)) {
                    final boolean chapterPrevious =
                            intent.getBooleanExtra("chapter_previous", false);

                    MainActivity.this.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            String eventName = chapterPrevious
                                    ? "media-notification-prev-chapter"
                                    : "media-notification-next-chapter";

                            MainActivity.this.getBridge().getWebView().evaluateJavascript(
                                    "window.dispatchEvent(new CustomEvent('" + eventName + "'));",
                                    null
                            );
                        }
                    });
                    return;
                }

                MainActivity.this.runOnUiThread(new Runnable() { // from class: com.biblia.deestudo.MainActivity$1$$ExternalSyntheticLambda2
                    @Override // java.lang.Runnable
                    public final void run() {
                        AnonymousClass1.this.lambda$onReceive$2();
                    }
                });
            } else if (MediaNotificationService.ACTION_PREV_CHAPTER.equals(action)) {
                Log.d("BIBLIA_MEDIA", "ACTION_PREV_CHAPTER recebido na MainActivity");
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Log.d("BIBLIA_MEDIA", "Disparando media-notification-prev-chapter no WebView");
                        MainActivity.this.getBridge().getWebView().evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('media-notification-prev-chapter'));",
                                null
                        );
                    }
                });
            } else if (MediaNotificationService.ACTION_NEXT_CHAPTER.equals(action)) {
                Log.d("BIBLIA_MEDIA", "ACTION_NEXT_CHAPTER recebido na MainActivity");
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Log.d("BIBLIA_MEDIA", "Disparando media-notification-next-chapter no WebView");
                        MainActivity.this.getBridge().getWebView().evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('media-notification-next-chapter'));",
                                null
                        );
                    }
                });
            } else if (MediaNotificationService.ACTION_NEXT.equals(action)) {
                if (intent.getBooleanExtra("chapter_navigation", false)) {
                    MainActivity.this.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            MainActivity.this.getBridge().getWebView().evaluateJavascript(
                                    "window.dispatchEvent(new CustomEvent('media-notification-next-chapter'));",
                                    null
                            );
                        }
                    });
                    return;
                }

                MainActivity.this.runOnUiThread(new Runnable() { // from class: com.biblia.deestudo.MainActivity$1$$ExternalSyntheticLambda3
                    @Override // java.lang.Runnable
                    public final void run() {
                        AnonymousClass1.this.lambda$onReceive$3();
                    }
                });
            } else if (MediaNotificationService.ACTION_STOP.equals(action)) {
                MainActivity.this.runOnUiThread(new Runnable() { // from class: com.biblia.deestudo.MainActivity$1$$ExternalSyntheticLambda4
                    @Override // java.lang.Runnable
                    public final void run() {
                        AnonymousClass1.this.lambda$onReceive$4();
                    }
                });
            }
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$onReceive$0() {
            MainActivity.this.getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('media-notification-play'));", null);
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$onReceive$1() {
            MainActivity.this.getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('media-notification-pause'));", null);
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$onReceive$2() {
            MainActivity.this.getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('media-notification-prev'));", null);
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$onReceive$3() {
            MainActivity.this.getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('media-notification-next'));", null);
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$onReceive$4() {
            MainActivity.this.getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('media-notification-stop'));", null);
        }
    }

    @Override // com.getcapacitor.BridgeActivity, androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, androidx.core.app.ComponentActivity, android.app.Activity
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MediaNotificationPlugin.class);
        super.onCreate(savedInstanceState);

        // Android 13+: solicita a permissão de notificações na primeira abertura.
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {

            requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
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
            registerReceiver(this.mediaReceiver, filter, 4);
        } else {
            registerReceiver(this.mediaReceiver, filter);
        }
    }

    @Override // com.getcapacitor.BridgeActivity, androidx.appcompat.app.AppCompatActivity, androidx.fragment.app.FragmentActivity, android.app.Activity
    public void onDestroy() {
        try {
            unregisterReceiver(this.mediaReceiver);
        } catch (Exception e) {
        }
        super.onDestroy();
    }
}
