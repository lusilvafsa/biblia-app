import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "./firebaseConfig.js";

const REMEMBERED_ACCOUNTS_KEY = "biblia:remembered-accounts";

function readRememberedAccounts() {
  try {
    const raw = window.localStorage.getItem(
      REMEMBERED_ACCOUNTS_KEY
    );

    if (!raw) return [];

    const accounts = JSON.parse(raw);

    return Array.isArray(accounts)
      ? accounts.filter(
          email => typeof email === "string" && email.trim()
        )
      : [];

  } catch (error) {
    console.warn(
      "[Firebase Auth] Erro ao ler contas lembradas:",
      error
    );

    return [];
  }
}

function saveRememberedAccounts(accounts) {
  try {
    window.localStorage.setItem(
      REMEMBERED_ACCOUNTS_KEY,
      JSON.stringify(accounts)
    );
  } catch (error) {
    console.warn(
      "[Firebase Auth] Erro ao salvar contas lembradas:",
      error
    );
  }
}

export function lembrarConta(email) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) return;

  const accounts = readRememberedAccounts();

  const filtered = accounts.filter(
    item => item !== normalizedEmail
  );

  filtered.unshift(normalizedEmail);

  saveRememberedAccounts(
    filtered.slice(0, 10)
  );
}

export function contasLembradas() {
  return readRememberedAccounts();
}

export async function criarConta(email, senha) {
  const resultado = await createUserWithEmailAndPassword(
    auth,
    email,
    senha
  );

  const user = resultado.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email || email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  lembrarConta(user.email || email);

  console.log(
    "[Firebase] Usuário criado no Authentication e Firestore:",
    user.uid
  );

  return user;
}

export async function entrar(email, senha) {
  const resultado = await signInWithEmailAndPassword(
    auth,
    email,
    senha
  );

  const user = resultado.user;

  lembrarConta(user.email || email);

  console.log(
    "[Firebase] Login realizado:",
    user.uid
  );

  return user;
}

export async function entrarComGoogle() {
  let user;

  const capacitor =
    typeof window !== "undefined"
      ? window.Capacitor
      : null;

  const isNative =
    !!(
      capacitor &&
      typeof capacitor.isNativePlatform === "function" &&
      capacitor.isNativePlatform()
    );

  const firebaseAuthentication =
    capacitor?.Plugins?.FirebaseAuthentication || null;

  if (isNative && firebaseAuthentication) {
    console.log(
      "[Firebase Auth] Android detectado. Usando Google Sign-In nativo."
    );

    const resultado =
      await firebaseAuthentication.signInWithGoogle({
        skipNativeAuth: true
      });

    const tokenResult =
      await firebaseAuthentication.getIdToken();

    const idToken = tokenResult?.token;

    if (!idToken) {
      throw new Error(
        "O login Google nativo não retornou um ID token válido."
      );
    }

    const credential =
      GoogleAuthProvider.credential(idToken);

    const webResultado =
      await signInWithCredential(auth, credential);

    user = webResultado.user;

    if (!user?.uid) {
      throw new Error(
        "O Firebase Web não retornou um usuário válido."
      );
    }
  } else {
    console.log(
      "[Firebase Auth] Web detectada. Usando signInWithPopup."
    );

    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    const resultado = await signInWithPopup(
      auth,
      provider
    );

    user = resultado.user;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  lembrarConta(user.email || "");

  console.log(
    "[Firebase] Login com Google realizado:",
    user.uid
  );

  return user;
}

export async function sair() {
  await signOut(auth);
}

export function observarUsuario(callback) {
  return onAuthStateChanged(auth, callback);
}

export function usuarioAtual() {
  return auth.currentUser;
}
