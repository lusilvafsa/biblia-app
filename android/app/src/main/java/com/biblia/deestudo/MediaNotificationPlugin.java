package com.biblia.deestudo;

import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaNotification")
public class MediaNotificationPlugin extends Plugin {

    // Indica se a narração está ativa neste momento. Usado pela
    // MainActivity para decidir se deve manter os timers do WebView
    // rodando mesmo com a tela apagada ou o app em segundo plano.
    public static volatile boolean isNarrating = false;

    @PluginMethod
    public void update(PluginCall call) {
        Log.d("BIBLIA_MEDIA", "PLUGIN update() chamado");

        String title = call.getString(MediaNotificationService.EXTRA_TITLE, "Bíblia de Estudo");
        String artist = call.getString(MediaNotificationService.EXTRA_ARTIST, "Bíblia em Áudio");
        boolean playing = call.getBoolean(MediaNotificationService.EXTRA_PLAYING, false).booleanValue();

        isNarrating = playing;

        Log.d("BIBLIA_MEDIA", "playing=" + playing + " title=" + title);

        Intent intent = new Intent(getContext(), (Class<?>) MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_UPDATE);
        intent.putExtra(MediaNotificationService.EXTRA_TITLE, title);
        intent.putExtra(MediaNotificationService.EXTRA_ARTIST, artist);
        intent.putExtra(MediaNotificationService.EXTRA_PLAYING, playing);

        Log.d("BIBLIA_MEDIA", "Iniciando MediaNotificationService");

        if (Build.VERSION.SDK_INT >= 26) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        isNarrating = false;
        Intent intent = new Intent(getContext(), (Class<?>) MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }
}
