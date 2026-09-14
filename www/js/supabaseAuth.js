import { supabase } from "./supabaseClient.js";

const REMEMBERED_ACCOUNTS_KEY = "biblia:remembered-accounts";

let usuarioAtualEmMemoria = null;
let authInicializadoResolve;

const authInicializado = new Promise((resolve) => {
  authInicializadoResolve = resolve;
});

let primeiroEstadoRecebido = false;

supabase.auth.onAuthStateChange((event, session) => {
  usuarioAtualEmMemoria = session?.user ?? null;

  if (!primeiroEstadoRecebido) {
    primeiroEstadoRecebido = true;

    if (authInicializadoResolve) {
      authInicializadoResolve(usuarioAtualEmMemoria);
      authInicializadoResolve = null;
    }
  }

  console.log(
    "[Supabase Auth] Estado:",
    event,
    usuarioAtualEmMemoria?.id || null
  );
});

export function aguardarAuthInicial() {
  return authInicializado;
}

function readRememberedAccounts() {
  try {
    const raw = window.localStorage.getItem(
      REMEMBERED_ACCOUNTS_KEY
    );

    if (!raw) return [];

    const accounts = JSON.parse(raw);

    return Array.isArray(accounts)
      ? accounts.filter(
          (email) =>
            typeof email === "string" &&
            email.trim()
        )
      : [];
  } catch (error) {
    console.warn(
      "[Supabase Auth] Erro ao ler contas lembradas:",
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
      "[Supabase Auth] Erro ao salvar contas lembradas:",
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
    (item) => item !== normalizedEmail
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
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const { data, error } =
    await supabase.auth.signUp({
      email: normalizedEmail,
      password: senha,
      options: {
        data: {
          email: normalizedEmail,
        },
      },
    });

  if (error) {
    console.error(
      "[Supabase Auth] Erro ao criar conta:",
      error
    );
    throw error;
  }

  const user = data?.user;

  if (!user) {
    throw new Error(
      "O Supabase não retornou um usuário após o cadastro."
    );
  }

  lembrarConta(user.email || normalizedEmail);

  console.log(
    "[Supabase Auth] Usuário criado:",
    user.id
  );

  if (!data.session) {
    console.log(
      "[Supabase Auth] Cadastro criado. Confirmação de e-mail pode ser necessária."
    );
  }

  return user;
}

export async function entrar(email, senha) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: senha,
    });

  if (error) {
    console.error(
      "[Supabase Auth] Erro no login:",
      error
    );
    throw error;
  }

  const user = data?.user;

  if (!user) {
    throw new Error(
      "O Supabase não retornou um usuário após o login."
    );
  }

  lembrarConta(user.email || normalizedEmail);

  console.log(
    "[Supabase Auth] Login realizado:",
    user.id
  );

  return user;
}

export async function entrarComGoogle() {
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

  if (isNative) {
    const firebaseAuthentication =
      capacitor?.Plugins?.FirebaseAuthentication || null;

    if (!firebaseAuthentication) {
      throw new Error(
        "O login Google nativo não está disponível neste aplicativo."
      );
    }

    console.log(
      "[Supabase Auth] Android detectado. Obtendo credencial Google nativa."
    );

    const resultado =
      await firebaseAuthentication.signInWithGoogle({
        skipNativeAuth: true,
        useCredentialManager: false,
      });

    const idToken =
      resultado?.credential?.idToken;

    if (!idToken) {
      throw new Error(
        "O login Google nativo não retornou um ID token válido."
      );
    }

    const { data, error } =
      await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

    if (error) {
      console.error(
        "[Supabase Auth] Erro no login Google:",
        error
      );
      throw error;
    }

    const user = data?.user;

    if (!user) {
      throw new Error(
        "O Supabase não retornou um usuário após o login Google."
      );
    }

    lembrarConta(user.email || "");

    console.log(
      "[Supabase Auth] Login Google realizado:",
      user.id
    );

    return user;
  }

  console.log(
    "[Supabase Auth] Web detectada. Iniciando OAuth Google."
  );

  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

  if (error) {
    console.error(
      "[Supabase Auth] Erro ao iniciar Google OAuth:",
      error
    );
    throw error;
  }

  console.log(
    "[Supabase Auth] Redirecionamento Google iniciado:",
    data?.url || null
  );

  return null;
}

export async function sair() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    console.error(
      "[Supabase Auth] Erro ao sair:",
      error
    );
    throw error;
  }
}

export function observarUsuario(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

export function usuarioAtual() {
  return usuarioAtualEmMemoria;
}

export async function sessaoAtual() {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data?.session ?? null;
}
