import { auth, db } from "./firebaseConfig.js";

console.log("[Firebase] inicializado");
console.log("[Firebase] projeto:", auth.app.options.projectId);
console.log("[Firebase] Auth:", !!auth);
console.log("[Firebase] Firestore:", !!db);

window.__BIBLIA_FIREBASE__ = { auth, db };

export { auth, db };


import { sincronizarFavoritos } from "./favoritesSync.js";

window.__BIBLIA_FIREBASE__.sincronizarFavoritos = sincronizarFavoritos;
