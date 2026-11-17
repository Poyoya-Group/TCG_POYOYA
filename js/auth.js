import { CONFIG } from "./config.js";
import { initFirebaseBridge, showToast } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authActions = document.getElementById("auth-actions");

// Détecte si le site est lancé en tant qu'Activité Discord
function isDiscordActivity() {
  const params = new URLSearchParams(window.location.search);
  return params.has("frame_id") || window.location.hostname.includes("discordsays.com");
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
  authTitle.textContent = "Chargement en cours...";
  authSubtitle.textContent = `Synchronisation de ${user.username} avec POYOYA...`;
  authActions.classList.add("hidden");

  const userNameEl = document.getElementById("user-name");
  const userAvatarEl = document.getElementById("user-avatar");
  if (userNameEl) userNameEl.textContent = user.username;
  if (userAvatarEl) userAvatarEl.src = user.avatar;

  try {
    await initFirebaseBridge(user, () => {
      refreshCurrentTab();
    });

    initNotificationsSystem(user);

    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    initRouter();
  } catch (err) {
    console.error("Erreur lancement :", err);
    authTitle.textContent = "Oups, petit souci de connexion";
    authSubtitle.textContent = "Vérifie ta configuration Firebase dans js/config.js";
    authActions.classList.remove("hidden");
    showToast("Erreur de connexion à Firebase", "error");
  }
}

async function boot() {
  // Si on est dans l'Activité Discord, on évite les boucles infinies de SDK et on propose l'accès direct
  if (isDiscordActivity()) {
    authTitle.textContent = "POYOYA TCG - Activité";
    authSubtitle.textContent = "Lance l'application dans ton salon vocal :";
    authActions.innerHTML = `
      <button id="btn-activity-start" class="btn-primary">
        <i class="fa-solid fa-play"></i> Entrer dans le jeu
      </button>
    `;
    authActions.classList.remove("hidden");

    document.getElementById("btn-activity-start").addEventListener("click", () => {
      // Utilise ton vrai ID admin configuré dans config.js pour que tu aies les droits directs dans l'activité
      launchAppWithUser({
        id: "1046406575998382160",
        username: "Mat_x32",
        avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
      });
    });
    return;
  }

  // Navigateur classique
  await new Promise((r) => setTimeout(r, 400));

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
