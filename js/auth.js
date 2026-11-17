import { CONFIG } from "./config.js";
import { initFirebaseBridge, showToast } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authActions = document.getElementById("auth-actions");

function isDiscordActivity() {
  return window.location.search.includes("frame_id") || window.location.hostname.includes("discordsays.com");
}

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

  try {
    // Initialisation non bloquante de Firebase
    initFirebaseBridge(user, () => {
      refreshCurrentTab();
    });

    // Activation du système de notifications
    try {
      initNotificationsSystem(user);
    } catch (e) {
      console.warn("Notifications non initialisées :", e);
    }

    // Masquer l'écran de connexion et afficher l'application immédiatement
    const authScreen = document.getElementById("auth-screen");
    const appScreen = document.getElementById("app");
    
    if (authScreen) authScreen.classList.add("hidden");
    if (appScreen) appScreen.classList.remove("hidden");
    
    initRouter();
  } catch (err) {
    console.error("Erreur lancement :", err);
    showToast("Erreur de connexion à Firebase", "error");
    
    // Forcer l'affichage de l'app même en cas de souci mineur
    document.getElementById("auth-screen")?.classList.add("hidden");
    document.getElementById("app")?.classList.remove("hidden");
    initRouter();
  }
}

async function boot() {
  // Si on est dans l'Activité Discord, on connecte directement l'admin sans bloquer sur l'UI de chargement
  if (isDiscordActivity()) {
    await launchAppWithUser({
      id: "1046406575998382160",
      username: "Mat_x32",
      avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
    });
    return;
  }

  // Navigateur classique
  await new Promise((r) => setTimeout(r, 300));

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

  authTitle.textContent = "Connexion requise";
  authSubtitle.textContent = "Lie ton compte Discord pour accéder à tes PoyoCoins et tes cartes.";
  authActions.innerHTML = `
    <button id="btn-discord-login" class="btn-primary">
      <i class="fa-brands fa-discord"></i> Se connecter avec Discord
    </button>
    <button id="btn-dev-login" class="btn-secondary">
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
