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
    }

    private void enviarAoServico(Intent intent, boolean emPrimeiroPlano) {
        if (emPrimeiroPlano && Build.VERSION.SDK_INT >= 26) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }

    @PluginMethod
    public void startChapterNarration(PluginCall call) {
        String title = call.getString("title", "Bíblia de Estudo");
        String artist = call.getString("artist", "Bíblia em Áudio");
        Integer startIndex = call.getInt("startIndex", 0);
        Double rate = call.getDouble("rate", 1.0);
        String voiceName = call.getString("voiceName", "");

        java.util.ArrayList<String> lista = new java.util.ArrayList<>();
        try {
            org.json.JSONArray arr = call.getArray("verses");
            if (arr != null) {
                for (int i = 0; i < arr.length(); i++) {
                    lista.add(arr.getString(i));
                }
            }
        } catch (Exception e) {
            call.reject("Lista de versículos inválida: " + e.getMessage());
            return;
        }
        if (lista.isEmpty()) {
            call.reject("Nenhum versículo para narrar");
            return;
        }

        Log.d("BIBLIA_MEDIA", "PLUGIN startChapterNarration: " + lista.size() + " itens");
        isNarrating = true;

        Intent intent = new Intent(getContext(), (Class<?>) MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_START_NARRATION);
        intent.putExtra(MediaNotificationService.EXTRA_TITLE, title);
        intent.putExtra(MediaNotificationService.EXTRA_ARTIST, artist);
        intent.putStringArrayListExtra(MediaNotificationService.EXTRA_VERSES, lista);
        intent.putExtra(MediaNotificationService.EXTRA_START_INDEX, startIndex.intValue());
        intent.putExtra(MediaNotificationService.EXTRA_RATE, rate.floatValue());
        intent.putExtra(MediaNotificationService.EXTRA_VOICE, voiceName);
        enviarAoServico(intent, true);

        call.resolve();
    }

    @PluginMethod
    public void pauseNarration(PluginCall call) {
        Intent intent = new Intent(getContext(), (Class<?>) MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_PAUSE);
        enviarAoServico(intent, false);
        call.resolve();
    }

    @PluginMethod
    public void resumeNarration(PluginCall call) {
        Intent intent = new Intent(getContext(), (Class<?>) MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_PLAY);
        enviarAoServico(intent, false);
        call.resolve();
    }


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
