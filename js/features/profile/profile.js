import { icons } from '../../components/icons.js';
import { favoritesRepository } from '../../data-access/favoritesRepository.js';
import { progressRepository } from '../../data-access/progressRepository.js';
import { navigateTo } from '../../router.js';
import { statsRepository } from '../../data-access/statsRepository.js';

import {
  criarConta,
  entrar,
  entrarComGoogle,
  sair,
  observarUsuario,
  contasLembradas
} from '../../firebase/auth.js';

import { auth } from '../../firebase/firebaseConfig.js';

const BADGES = [
  { icon: icons.badgeFirst, name: 'Primeira Leitura', unlocked: true },
  { icon: icons.badgeStreak, name: '7 Dias Seguidos', unlocked: true },
  { icon: icons.prayer, name: 'Guerreiro de Oração', unlocked: true },
  { icon: icons.badgeDouble, name: 'Estudioso da Bíblia', unlocked: false },
  { icon: icons.badgeQuiz, name: 'Mestre do Quiz', unlocked: false },
  { icon: icons.badgeFull, name: 'Bíblia Completa', unlocked: false },
];

let currentContainer = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function accountTemplate(user = null) {
  const accounts = contasLembradas();

  if (user) {
    return `
      <div class="section-title">Minha Conta</div>

      <div class="menu-item" style="margin-bottom:16px;">
        <div class="menu-icon">👤</div>
        <div class="menu-title">
          ${escapeHtml(user.email || 'Usuário')}
        </div>
        <div class="menu-desc">
          Conta sincronizada com a nuvem
        </div>
      </div>

      ${
        accounts.length > 1
          ? `
            <button
              type="button"
              class="menu-item profile-action-item"
              id="btnProfileSwitch"
              style="width:100%;border:none;cursor:pointer;margin-bottom:10px;"
            >
              <div class="menu-icon">🔄</div>
              <div class="menu-title">Alternar conta</div>
              <div class="menu-desc">
                Usar outra conta salva neste aparelho
              </div>
            </button>
          `
          : ''
      }

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileAddAccount"
        style="width:100%;border:none;cursor:pointer;margin-bottom:10px;"
      >
        <div class="menu-icon">➕</div>
        <div class="menu-title">Adicionar conta</div>
        <div class="menu-desc">
          Entrar com outra conta
        </div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileLogout"
        style="width:100%;border:none;cursor:pointer;"
      >
        <div class="menu-icon">↪</div>
        <div class="menu-title">Sair</div>
        <div class="menu-desc">
          Encerrar todas as sessões neste dispositivo
        </div>
      </button>
    `;
  }

  return `
    <div class="section-title">Minha Conta</div>

    <div class="menu-item" style="margin-bottom:16px;">
      <div class="menu-icon">👤</div>
      <div class="menu-title">Sincronize seus dados</div>
      <div class="menu-desc">
        Entre ou crie uma conta para sincronizar
        favoritos, progresso e estatísticas.
      </div>
    </div>

    ${
      accounts.length
        ? `
          <div
            style="
              margin-bottom:16px;
              padding:14px;
              border-radius:12px;
              background:var(--card-bg, rgba(127,127,127,.08));
            "
          >
            <div
              style="
                font-weight:600;
                margin-bottom:10px;
              "
            >
              Contas neste aparelho
            </div>

            ${accounts.map(email => `
              <button
                type="button"
                class="remembered-account-btn"
                data-account-email="${escapeHtml(email)}"
                style="
                  width:100%;
                  text-align:left;
                  padding:10px;
                  margin-bottom:6px;
                  border:none;
                  border-radius:8px;
                  cursor:pointer;
                  background:transparent;
                "
              >
                👤 ${escapeHtml(email)}
              </button>
            `).join('')}

            <button
              type="button"
              id="btnProfileAddAccount"
              style="
                width:100%;
                padding:10px;
                border:none;
                background:transparent;
                cursor:pointer;
                text-align:left;
              "
            >
              ➕ Adicionar outra conta
            </button>
          </div>
        `
        : `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
            <button
              type="button"
              class="menu-item profile-action-item"
              id="btnProfileLogin"
              style="border:none;cursor:pointer;"
            >
              <div class="menu-icon">🔐</div>
              <div class="menu-title">Entrar</div>
              <div class="menu-desc">Acessar conta</div>
            </button>

            <button
              type="button"
              class="menu-item profile-action-item"
              id="btnProfileCreate"
              style="border:none;cursor:pointer;"
            >
              <div class="menu-icon">➕</div>
              <div class="menu-title">Criar conta</div>
              <div class="menu-desc">Nova conta</div>
            </button>
          </div>
        `
    }
  `;
}

function template(user = null) {
  const favoritesCount =
    favoritesRepository.getFavorites().length;

  const notesCount =
    favoritesRepository.getNotes().length;

  const readVersesCount =
    statsRepository.getReadVersesCount();

  const audioVersesCount =
    statsRepository.getAudioVersesCount();

  const prayerCount =
    statsRepository.getPrayerCount();

  const badgesHtml = BADGES.map(
    (b) => `
      <div class="badge-item ${b.unlocked ? 'unlocked' : ''}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>
    `
  ).join('');

  return `
    ${accountTemplate(user)}

    <div class="streak-banner">
      <div class="streak-flame">${icons.bible}</div>
      <div class="streak-info">
        <h4>Sequência de leitura de 7 dias</h4>
        <p>Melhor: 14 dias</p>
      </div>
    </div>

    <div class="section-title">Insígnias de Fé</div>

    <div class="badge-grid">
      ${badgesHtml}
    </div>

    <div class="section-title">Estatísticas</div>

    <div class="menu-grid">

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileBible"
      >
        <div class="menu-icon">${icons.bible}</div>
        <div class="menu-title">${readVersesCount}</div>
        <div class="menu-desc">Versículos lidos</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileAudio"
      >
        <div class="menu-icon">${icons.audio}</div>
        <div class="menu-title">${audioVersesCount}</div>
        <div class="menu-desc">Áudio ouvido</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfilePrayer"
      >
        <div class="menu-icon">${icons.prayer}</div>
        <div class="menu-title">${prayerCount}</div>
        <div class="menu-desc">Orações feitas</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileFavorites"
      >
        <div class="menu-icon">♥</div>
        <div class="menu-title">${favoritesCount}</div>
        <div class="menu-desc">Favoritos</div>
      </button>

      <button
        type="button"
        class="menu-item profile-action-item"
        id="btnProfileNotes"
      >
        <div class="menu-icon">📝</div>
        <div class="menu-title">${notesCount}</div>
        <div class="menu-desc">Anotações</div>
      </button>

    </div>
  `;
}

function showMessage(message) {
  alert(message);
}

function createAuthModal({
  mode = 'login',
  email = ''
} = {}) {
  const old = document.getElementById(
    'bibliaAuthModal'
  );

  if (old) old.remove();

  const isCreate = mode === 'create';

  const modal = document.createElement('div');

  modal.id = 'bibliaAuthModal';

  modal.innerHTML = `
    <div
      style="
        position:fixed;
        inset:0;
        z-index:99999;
        background:rgba(0,0,0,.55);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
      "
    >
      <div
        style="
          width:min(440px,100%);
          max-height:90vh;
          overflow:auto;
          background:var(--bg,#fff);
          color:var(--text,#111);
          border-radius:18px;
          padding:22px;
          box-shadow:0 10px 40px rgba(0,0,0,.3);
        "
      >

        <h2 style="margin-top:0;">
          ${isCreate ? 'Criar conta' : 'Entrar'}
        </h2>

        <p style="opacity:.75;">
          ${
            isCreate
              ? 'Crie sua conta para sincronizar seus dados.'
              : 'Entre para acessar seus favoritos e anotações.'
          }
        </p>

        <label
          for="bibliaAuthEmail"
          style="display:block;margin-top:16px;margin-bottom:6px;"
        >
          E-mail
        </label>

        <input
          id="bibliaAuthEmail"
          type="email"
          autocomplete="email"
          value="${escapeHtml(email)}"
          placeholder="seu@email.com"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border-radius:10px;
            border:1px solid rgba(127,127,127,.4);
            font-size:16px;
          "
        >

        <label
          for="bibliaAuthPassword"
          style="display:block;margin-top:16px;margin-bottom:6px;"
        >
          Senha
        </label>

        <div
          style="
            display:flex;
            align-items:center;
            border:1px solid rgba(127,127,127,.4);
            border-radius:10px;
            overflow:hidden;
          "
        >
          <input
            id="bibliaAuthPassword"
            type="password"
            autocomplete="${isCreate ? 'new-password' : 'current-password'}"
            placeholder="${isCreate ? 'Mínimo de 6 caracteres' : 'Sua senha'}"
            style="
              flex:1;
              min-width:0;
              padding:12px;
              border:none;
              outline:none;
              font-size:16px;
              background:transparent;
              color:inherit;
            "
          >

          <button
            type="button"
            id="btnTogglePassword"
            aria-label="Mostrar senha"
            style="
              border:none;
              background:transparent;
              padding:10px 12px;
              cursor:pointer;
              font-size:20px;
            "
          >
            👁️
          </button>
        </div>

        <div
          id="bibliaAuthError"
          style="
            display:none;
            margin-top:12px;
            padding:10px;
            border-radius:8px;
            background:rgba(220,0,0,.1);
          "
        ></div>

        <div
          style="
            display:flex;
            gap:10px;
            margin-top:20px;
          "
        >
        <div
          style="
            margin-top:18px;
            padding-top:16px;
            border-top:1px solid rgba(127,127,127,.2);
          "
        >
          <button
            type="button"
            id="btnGoogleLogin"
            style="
              width:100%;
              padding:12px;
              border:1px solid rgba(127,127,127,.4);
              border-radius:10px;
              cursor:pointer;
              font-weight:600;
              background:var(--bg,#fff);
              color:inherit;
              display:flex;
              align-items:center;
              justify-content:center;
              gap:10px;
            "
          >
            <img src="./assets/icons/google.svg" width="18" height="18" alt="Google" style="vertical-align:middle;margin-right:8px;">
            Continuar com Google
          </button>
        </div>

          <button
            type="button"
            id="btnAuthCancel"
            style="
              flex:1;
              padding:12px;
              border:none;
              border-radius:10px;
              cursor:pointer;
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            id="btnAuthSubmit"
            style="
              flex:1;
              padding:12px;
              border:none;
              border-radius:10px;
              cursor:pointer;
              font-weight:600;
            "
          >
            ${isCreate ? 'Criar conta' : 'Entrar'}
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const emailInput =
    modal.querySelector('#bibliaAuthEmail');

  const passwordInput =
    modal.querySelector('#bibliaAuthPassword');

  const togglePassword =
    modal.querySelector('#btnTogglePassword');

  const submit =
    modal.querySelector('#btnAuthSubmit');

  const cancel =
    modal.querySelector('#btnAuthCancel');

  const googleLogin =
    modal.querySelector('#btnGoogleLogin');

  const errorBox =
    modal.querySelector('#bibliaAuthError');

  togglePassword.addEventListener(
    'click',
    () => {
      const visible =
        passwordInput.type === 'text';

      passwordInput.type =
        visible ? 'password' : 'text';

      togglePassword.textContent =
        visible ? '👁️' : '🙈';

      togglePassword.setAttribute(
        'aria-label',
        visible
          ? 'Mostrar senha'
          : 'Ocultar senha'
      );
    }
  );

  googleLogin.addEventListener(
    'click',
    async () => {
      googleLogin.disabled = true;
      googleLogin.textContent = 'Abrindo Google...';
      errorBox.style.display = 'none';

      try {
        await entrarComGoogle();

        modal.remove();
        renderCurrentUser();

        showMessage(
          'Login com Google realizado com sucesso.'
        );
      } catch (error) {
        console.error(
          '[Firebase Auth Google]',
          error
        );

        googleLogin.disabled = false;
        googleLogin.innerHTML =
          '<img src="./assets/icons/google.svg" width="18" height="18" alt="Google" style="vertical-align:middle;margin-right:8px;"> Continuar com Google';

        let message =
          'Não foi possível entrar com Google.';

        if (error.code === 'auth/popup-closed-by-user') {
          message =
            'A janela do Google foi fechada antes do login.';
        } else if (error.code === 'auth/popup-blocked') {
          message =
            'O navegador bloqueou a janela do Google.';
        } else if (
          error.code === 'auth/cancelled-popup-request'
        ) {
          message =
            'A tentativa de login com Google foi cancelada.';
        } else if (
          error.code === 'auth/account-exists-with-different-credential'
        ) {
          message =
            'Este e-mail já possui uma conta usando outro método de login.';
        } else if (
          error.code === 'auth/unauthorized-domain'
        ) {
          message =
            'Este endereço do aplicativo ainda não está autorizado no Firebase.';
        } else if (
          error.code === 'auth/operation-not-allowed'
        ) {
          message =
            'O login com Google ainda não está habilitado no Firebase.';
        }

        errorBox.textContent = message;
        errorBox.style.display = 'block';
      }
    }
  );

  cancel.addEventListener(
    'click',
    () => modal.remove()
  );

  submit.addEventListener(
    'click',
    async () => {
      const enteredEmail =
        emailInput.value.trim();

      const password =
        passwordInput.value;

      if (!enteredEmail) {
        errorBox.textContent =
          'Digite seu e-mail.';

        errorBox.style.display =
          'block';

        return;
      }

      if (!password) {
        errorBox.textContent =
          'Digite sua senha.';

        errorBox.style.display =
          'block';

        return;
      }

      submit.disabled = true;
      submit.textContent = 'Aguarde...';
      errorBox.style.display = 'none';

      try {
        if (isCreate) {
          await criarConta(
            enteredEmail,
            password
          );
        } else {
          await entrar(
            enteredEmail,
            password
          );
        }

        modal.remove();

        renderCurrentUser();

        showMessage(
          isCreate
            ? 'Conta criada com sucesso.'
            : 'Login realizado com sucesso.'
        );

      } catch (error) {
        console.error(
          '[Firebase Auth]',
          error
        );

        submit.disabled = false;
        submit.textContent =
          isCreate
            ? 'Criar conta'
            : 'Entrar';

        let message =
          'Não foi possível concluir a operação.';

        if (
          error.code ===
          'auth/invalid-credential'
        ) {
          message =
            'E-mail ou senha incorretos.';
        } else if (
          error.code ===
          'auth/invalid-email'
        ) {
          message =
            'Digite um e-mail válido.';
        } else if (
          error.code ===
          'auth/email-already-in-use'
        ) {
          message =
            'Este e-mail já possui uma conta.';
        } else if (
          error.code ===
          'auth/weak-password'
        ) {
          message =
            'A senha precisa ter pelo menos 6 caracteres.';
        }

        errorBox.textContent = message;
        errorBox.style.display = 'block';
      }
    }
  );

  emailInput.focus();
}

function bindAccountEvents(container) {

  const loginBtn =
    container.querySelector(
      '#btnProfileLogin'
    );

  if (loginBtn) {
    loginBtn.addEventListener(
      'click',
      () => {
        createAuthModal({
          mode: 'login'
        });
      }
    );
  }

  const createBtn =
    container.querySelector(
      '#btnProfileCreate'
    );

  if (createBtn) {
    createBtn.addEventListener(
      'click',
      () => {
        createAuthModal({
          mode: 'create'
        });
      }
    );
  }

  const addAccountBtn =
    container.querySelector(
      '#btnProfileAddAccount'
    );

  if (addAccountBtn) {
    addAccountBtn.addEventListener(
      'click',
      () => {
        createAuthModal({
          mode: 'login'
        });
      }
    );
  }

  const switchBtn =
    container.querySelector(
      '#btnProfileSwitch'
    );

  if (switchBtn) {
    switchBtn.addEventListener(
      'click',
      () => {
        const accounts =
          contasLembradas();

        const currentEmail =
          auth.currentUser?.email
            ?.trim()
            .toLowerCase();

        const otherAccounts =
          accounts.filter(
            email =>
              email !== currentEmail
          );

        if (!otherAccounts.length) {
          createAuthModal({
            mode: 'login'
          });

          return;
        }

        const modal =
          document.createElement('div');

        modal.id =
          'bibliaAccountSwitchModal';

        modal.innerHTML = `
          <div
            style="
              position:fixed;
              inset:0;
              z-index:99999;
              display:flex;
              align-items:center;
              justify-content:center;
              padding:20px;
              background:rgba(0,0,0,.65);
            "
          >
            <div
              style="
                width:min(420px,100%);
                max-height:80vh;
                overflow:auto;
                background:var(--card-bg,#fff);
                color:var(--text-color,#222);
                border-radius:18px;
                padding:20px;
                box-shadow:0 10px 40px rgba(0,0,0,.35);
              "
            >
              <div
                style="
                  font-size:20px;
                  font-weight:700;
                  margin-bottom:6px;
                "
              >
                Alternar conta
              </div>

              <div
                style="
                  font-size:14px;
                  opacity:.75;
                  margin-bottom:16px;
                "
              >
                Toque na conta que deseja usar:
              </div>

              <div
                id="bibliaAccountList"
                style="
                  display:flex;
                  flex-direction:column;
                  gap:8px;
                "
              >
                ${otherAccounts.map(email => `
                  <button
                    type="button"
                    class="biblia-account-choice"
                    data-account-email="${escapeHtml(email)}"
                    style="
                      width:100%;
                      padding:14px;
                      border:none;
                      border-radius:12px;
                      cursor:pointer;
                      text-align:left;
                      font-size:15px;
                      background:var(--button-bg,rgba(127,127,127,.12));
                      color:inherit;
                    "
                  >
                    👤 ${escapeHtml(email)}
                  </button>
                `).join('')}
              </div>

              <button
                type="button"
                id="btnCloseAccountSwitch"
                style="
                  width:100%;
                  margin-top:14px;
                  padding:12px;
                  border:none;
                  border-radius:12px;
                  cursor:pointer;
                  background:transparent;
                  color:inherit;
                "
              >
                Cancelar
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
          modal.remove();
        };

        modal.querySelector(
          '#btnCloseAccountSwitch'
        ).addEventListener(
          'click',
          closeModal
        );

        modal.querySelectorAll(
          '.biblia-account-choice'
        ).forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const email =
                button.dataset.accountEmail;

              closeModal();

              createAuthModal({
                mode: 'login',
                email
              });
            }
          );
        });
      }
    );
  }

  const rememberedButtons =
    container.querySelectorAll(
      '.remembered-account-btn'
    );

  rememberedButtons.forEach(
    button => {
      button.addEventListener(
        'click',
        () => {
          createAuthModal({
            mode: 'login',
            email:
              button.dataset.accountEmail || ''
          });
        }
      );
    }
  );

  const logoutBtn =
    container.querySelector(
      '#btnProfileLogout'
    );

  if (logoutBtn) {
    logoutBtn.addEventListener(
      'click',
      async () => {
        try {
          await sair();

          renderCurrentUser();

          showMessage(
            'Sessão encerrada.'
          );

        } catch (error) {
          console.error(
            '[Firebase Auth] Erro ao sair:',
            error
          );

          showMessage(
            'Não foi possível encerrar a sessão.'
          );
        }
      }
    );
  }
}

function renderCurrentUser() {
  if (!currentContainer) return;

  currentContainer.innerHTML =
    template(auth.currentUser);

  bindAccountEvents(
    currentContainer
  );

  bindNavigationEvents(
    currentContainer
  );
}

function bindNavigationEvents(container) {

  const bibleBtn =
    container.querySelector(
      '#btnProfileBible'
    );

  if (bibleBtn) {
    bibleBtn.addEventListener(
      'click',
      () => navigateTo('/biblia')
    );
  }

  const audioBtn =
    container.querySelector(
      '#btnProfileAudio'
    );

  if (audioBtn) {
    audioBtn.addEventListener(
      'click',
      () => navigateTo('/audio')
    );
  }

  const prayerBtn =
    container.querySelector(
      '#btnProfilePrayer'
    );

  if (prayerBtn) {
    prayerBtn.addEventListener(
      'click',
      () => navigateTo('/oracao')
    );
  }

  const favoritesBtn =
    container.querySelector(
      '#btnProfileFavorites'
    );

  if (favoritesBtn) {
    favoritesBtn.addEventListener(
      'click',
      () => navigateTo('/favoritos')
    );
  }

  const notesBtn =
    container.querySelector(
      '#btnProfileNotes'
    );

  if (notesBtn) {
    notesBtn.addEventListener(
      'click',
      () => navigateTo('/anotacoes')
    );
  }
}

export const profilePage = {

  render(container) {
    currentContainer = container;

    container.innerHTML =
      template(auth.currentUser);

    bindAccountEvents(container);
    bindNavigationEvents(container);
  }
};

observarUsuario(async (user) => {

  if (user) {
    try {
      await favoritesRepository.syncWithCloud();

      console.log(
        '[Firebase Sync] Favoritos sincronizados após login.'
      );

      await progressRepository.syncWithCloud();

      console.log(
        '[Firebase Sync] Progresso de leitura sincronizado após login.'
      );

    } catch (error) {
      console.error(
        '[Firebase Sync] Falha após login:',
        error
      );
    }
  }

  if (currentContainer) {
    currentContainer.innerHTML =
      template(user);

    bindAccountEvents(
      currentContainer
    );

    bindNavigationEvents(
      currentContainer
    );
  }
});
