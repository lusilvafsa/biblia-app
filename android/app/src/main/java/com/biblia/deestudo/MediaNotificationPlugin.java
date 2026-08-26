package com.biblia.deestudo;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "MediaNotification")
public class MediaNotificationPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String title = call.getString("title", "Bíblia de Estudo");
        String artist = call.getString("artist", "Bíblia em Áudio");
        boolean playing = call.getBoolean("playing", false);

        Intent intent = new Intent(
                getContext(),
                MediaNotificationService.class
        );

        intent.setAction(MediaNotificationService.ACTION_UPDATE);
        intent.putExtra(MediaNotificationService.EXTRA_TITLE, title);
        intent.putExtra(MediaNotificationService.EXTRA_ARTIST, artist);
        intent.putExtra(MediaNotificationService.EXTRA_PLAYING, playing);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
        Intent intent = new Intent(
                getContext(),
                MediaNotificationService.class
        );

        intent.setAction(MediaNotificationService.ACTION_STOP);
        getContext().startService(intent);

        call.resolve();
    }
}
