cd ~/biblia-app || exit 1
ok=1
for f in $(find www/js -name "*.js"); do
  cp "$f" ~/chk.mjs
  node --check ~/chk.mjs 2>/dev/null || { echo "ERRO DE SINTAXE: $f"; ok=0; }
done
[ $ok = 1 ] || { echo "Build cancelado."; exit 1; }
echo "SINTAXE OK"
node scripts/atualizar-versao.cjs || exit 1
npx cap sync android || exit 1
(cd android && ./gradlew assembleDebug) || { echo "ERRO NA COMPILAÇÃO"; exit 1; }
cp android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/BibliaDeEstudoLS.apk || exit 1
echo "APK PRONTO: /sdcard/Download/BibliaDeEstudoLS.apk"
grep -o "APP_BUILD = '[0-9]*'" www/js/version.js
