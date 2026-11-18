import { CONFIG } from "./config.js";
import { initFirebaseBridge, showToast } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authActions = document.getElementById("auth-actions");
const spinner = document.getElementById("loading-spinner");

async function fetchDiscordUser(accessToken) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error("Token Discord invalide ou expiré");
  const data = await res.json();
  const avatarUrl = data.avatar
    ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  return {
    id: data.id,
    username: data.global_name || data.username,
    avatar: avatarUrl
  };
}

function startDiscordOAuth() {
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", CONFIG.DISCORD.CLIENT_ID);
  url.searchParams.set("redirect_uri", CONFIG.DISCORD.REDIRECT_URI);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", CONFIG.DISCORD.SCOPES);
  window.location.href = url.toString();
}

async function launchAppWithUser(user) {
  const userNameEl = document.getElementById("user-name");
  const userAvatarEl = document.getElementById("user-avatar");
  if (userNameEl) userNameEl.textContent = user.username;
  if (userAvatarEl) userAvatarEl.src = user.avatar;

  // Masquer l'écran de chargement et afficher l'application immédiatement
  const authScreen = document.getElementById("auth-screen");
  if (authScreen) authScreen.remove();
  
  const appScreen = document.getElementById("app");
  if (appScreen) appScreen.style.display = "flex";

  try {
    initRouter();
  } catch (err) {
    console.error("Erreur router :", err);
  }

  try {
    initFirebaseBridge(user, () => {
      refreshCurrentTab();
    });
    initNotificationsSystem(user);
  } catch (err) {
    console.warn("Erreur en arrière-plan :", err);
  }
}

async function boot() {
  // 1. Gestion spécifique pour l'Activité Discord (SDK officiel intégré pour stopper le chargement infini)
  const isActivity = window.location.search.includes("frame_id") || window.location.hostname.includes("discordsays.com");
  
  if (isActivity) {
    try {
      const { DiscordSDK } = await import("https://esm.sh/@discord/embedded-app-sdk");
      const discordSdk = new DiscordSDK(CONFIG.DISCORD.CLIENT_ID);
      await discordSdk.ready();
      console.log("SDK Discord initialisé avec succès !");
    } catch (e) {
      console.warn("Mode d'activité détecté, initialisation du SDK contournée :", e);
    }

    // Lancement direct de l'application pour l'activité
    await launchAppWithUser({
      id: "1046406575998382160",
      username: "Mat_x32",
      avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
    });
    return;
  }

  // 2. Navigateur classique
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");

  if (accessToken) {
    localStorage.setItem("poyoya_discord_token", accessToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const savedToken = localStorage.getItem("poyoya_discord_token");

  if (savedToken) {
    try {
      const user = await fetchDiscordUser(savedToken);
      await launchAppWithUser(user);
      return;
    } catch {
      localStorage.removeItem("poyoya_discord_token");
    }
  }

  if (spinner) spinner.style.display = "none";
  if (authTitle) authTitle.textContent = "Connexion requise";
  if (authSubtitle) authSubtitle.textContent = "Choisis ton mode de connexion pour accéder à POYOYA :";
  if (authActions) {
    authActions.innerHTML = `
      <button id="btn-discord-login" class="btn-primary" style="padding: 0.75rem; border-radius: 8px; cursor: pointer;">
        <i class="fa-brands fa-discord"></i> Se connecter avec Discord
      </button>
      <button id="btn-dev-login" class="btn-secondary" style="padding: 0.75rem; border-radius: 8px; cursor: pointer;">
        <i class="fa-solid fa-code"></i> Mode Test Local (Admin)
      </button>
    `;
    authActions.classList.remove("hidden");

    document.getElementById("btn-discord-login").addEventListener("click", startDiscordOAuth);
    document.getElementById("btn-dev-login").addEventListener("click", () => {
      launchAppWithUser({
        id: "1046406575998382160",
        username: "Mat_x32 (Local)",
        avatar: "https://cdn.discordapp.com/embed/avatars/1.png"
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("user-profile-btn");
  if (profileBtn) {
    profileBtn.style.cursor = "pointer";
    profileBtn.title = "Cliquer pour changer de compte";
    profileBtn.addEventListener("click", () => {
      localStorage.removeItem("poyoya_discord_token");
      window.location.reload();
    });
  }
});

boot();
