# Bíblia de Estudo V2.3 — Android

Esta versão é a ponte entre a V2.2 (web/PWA) e o APK Android. O conteúdo do aplicativo foi colocado em `www/` e o projeto recebeu a configuração do Capacitor.

## Opção recomendada: gerar o APK pelo GitHub Actions

1. Crie um repositório no GitHub.
2. Envie **todo o conteúdo desta pasta `biblia-app`** para o repositório.
3. No GitHub, abra **Actions**.
4. Execute o workflow **Build Android APK**.
5. Ao terminar, abra a execução e baixe o artefato `biblia-estudo-debug-apk`.
6. O APK ficará dentro do ZIP do artefato.

O workflow gera o projeto Android automaticamente com Capacitor, sincroniza `www/` e compila o APK de debug.

## Pelo Termux

No diretório do projeto:

```bash
pkg update
pkg install nodejs git
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

O APK de debug será criado em:

`android/app/build/outputs/apk/debug/app-debug.apk`

> Para o build local pelo Termux também é necessário ter Java e o Android SDK configurados. O GitHub Actions evita essa instalação pesada no celular.

## Observações

- A V2.3 mantém o PWA dentro de `www/`.
- O roteador usa hash (`#/...`), então não depende de reescrita de servidor.
- A narrativa usa Web Speech/TTS do dispositivo. A disponibilidade da voz masculina depende das vozes instaladas no Android.
- O APK de debug é para testes. Antes de publicar na Play Store, será necessário gerar uma chave de assinatura e um build release.
