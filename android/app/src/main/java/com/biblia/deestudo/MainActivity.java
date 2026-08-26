package com.biblia.deestudo;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(MediaNotificationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
