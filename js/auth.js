import { CONFIG } from "./config.js";
import { initFirebaseBridge, showToast } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

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

async function launchAppWithUser(user) {
  const userNameEl = document.getElementById("user-name");
  const userAvatarEl = document.getElementById("user-avatar");
  if (userNameEl) userNameEl.textContent = user.username;
  if (userAvatarEl) userAvatarEl.src = user.avatar;

  // Supprime l'écran de chargement instantanément
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
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");
  const username = urlParams.get("username");
  const avatar = urlParams.get("avatar");

  // 1. Si le bot a transmis les infos dans l'URL, connexion directe !
  if (userId && username) {
    const user = {
      id: userId,
      username: decodeURIComponent(username),
      avatar: avatar ? decodeURIComponent(avatar) : "https://cdn.discordapp.com/embed/avatars/0.png"
    };
    await launchAppWithUser(user);
    return;
  }

  // 2. Si on est dans l'activité Discord sans paramètres URL, fallback sur ton compte admin par défaut
  const isActivity = window.location.search.includes("frame_id") || window.location.hostname.includes("discordsays.com");
  if (isActivity) {
    await launchAppWithUser({
      id: "1046406575998382160",
      username: "Mat_x32",
      avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
    });
    return;
  }

  // 3. Navigateur classique (token sauvegardé)
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

  // Si vraiment rien n'est trouvé, mode dev local direct
  await launchAppWithUser({
    id: "1046406575998382160",
    username: "Mat_x32 (Local)",
    avatar: "https://cdn.discordapp.com/embed/avatars/1.png"
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("user-profile-btn");
  if (profileBtn) {
    profileBtn.style.cursor = "pointer";
    profileBtn.title = "Cliquer pour recharger";
    profileBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }
});

boot();
