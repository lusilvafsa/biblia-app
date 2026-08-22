import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bibliadeestudo.app',
  appName: 'Bíblia de Estudo',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#0f1729',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
