package com.biblia.deestudo;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

// Abre a janela de salvar do próprio Android (Downloads, Documentos, cartão SD...)
// para gravar o arquivo de backup. Não precisa de nenhuma permissão.
@CapacitorPlugin(name = "FileSaver")
public class FileSaverPlugin extends Plugin {

    @PluginMethod
    public void saveFile(PluginCall call) {
        String name = call.getString("name");
        String data = call.getString("data");
        if (name == null || name.isEmpty() || data == null) {
            call.reject("Faltam o nome ou o conteudo do arquivo.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, name);
        startActivityForResult(call, intent, "saveFileResult");
    }

    @ActivityCallback
    private void saveFileResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        JSObject resposta = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK
                || result.getData() == null
                || result.getData().getData() == null) {
            resposta.put("saved", false);
            call.resolve(resposta);
            return;
        }
        Uri uri = result.getData().getData();
        String data = call.getString("data");
        try (OutputStream out = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (out == null) {
                call.reject("Nao foi possivel abrir o local escolhido.");
                return;
            }
            out.write(data.getBytes(StandardCharsets.UTF_8));
            out.flush();
            resposta.put("saved", true);
            call.resolve(resposta);
        } catch (Exception e) {
            call.reject("Nao foi possivel gravar o arquivo: " + e.getMessage());
        }
    }
}
