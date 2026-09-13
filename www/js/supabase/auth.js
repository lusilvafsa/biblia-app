import { supabase } from "./supabaseClient.js";

const REMEMBERED_ACCOUNTS_KEY = "biblia:remembered-accounts";

let authInicializadoResolve;
const authInicializado = new Promise((resolve) => {
  authInicializadoResolve = resolve;
});

let primeiroEstadoRecebido = false;

supabase.auth.onAuthStateChange((event, session) => {
  if (!primeiroEstadoRecebido) {
    primeiroEstadoRecebido = true;

    if (authInicializadoResolve) {
      authInicializadoResolve(session?.user ?? null);
      authInicializadoResolve = null;
    }
  }

  console.log(
    "[Supabase Auth] Estado:",
    event,
    session?.user?.id || null
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
  const { data, error } =
    await supabase.auth.signUp({
      email: String(email || "").trim(),
      password: senha,
      options: {
        data: {
          email: String(email || "").trim().toLowerCase(),
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

  lembrarConta(
    user.email || email
  );

  console.log(
    "[Supabase Auth] Usuário criado:",
    user.id
  );

  return user;
}

export async function entrar(email, senha) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: String(email || "").trim(),
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

  lembrarConta(
    user.email || email
  );

  console.log(
    "[Supabase Auth] Login realizado:",
    user.id
  );

  return user;
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
  return supabase.auth.getUser().then(
    ({ data }) => data?.user ?? null
  );
}

export async function sessaoAtual() {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data?.session ?? null;
}
