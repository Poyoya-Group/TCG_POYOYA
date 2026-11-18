import { CONFIG } from "./config.js";
import { initFirebaseBridge } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

async function fetchDiscordUser(accessToken) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error("Token Discord invalide");
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

function launchAppWithUser(user) {
  const userNameEl = document.getElementById("user-name");
  const userAvatarEl = document.getElementById("user-avatar");
  if (userNameEl) userNameEl.textContent = user.username;
  if (userAvatarEl) userAvatarEl.src = user.avatar;

  // Suppression forcée de l'écran de chargement
  const authScreen = document.getElementById("auth-screen");
  if (authScreen) authScreen.remove();

  const appScreen = document.getElementById("app");
  if (appScreen) {
    appScreen.classList.remove("hidden");
    appScreen.style.display = "flex";
  }

  try {
    initRouter();
  } catch (err) {
    console.error("Erreur router :", err);
  }

  try {
    initFirebaseBridge(user, () => refreshCurrentTab());
    initNotificationsSystem(user);
  } catch (err) {
    console.warn("Erreur Firebase :", err);
  }
}

async function boot() {
  const isActivity =
    window.location.search.includes("frame_id") ||
    window.location.hostname.includes("discordsays.com");

  // 1. Mode Activité Discord : lancement garanti en max 1 seconde
  if (isActivity) {
    // On tente le handshake SDK en parallèle sans jamais bloquer l'affichage
    import("https://esm.sh/@discord/embedded-app-sdk")
      .then(async ({ DiscordSDK }) => {
        const sdk = new DiscordSDK(CONFIG.DISCORD.CLIENT_ID);
        await sdk.ready();
      })
      .catch(() => {});

    // On lance l'interface immédiatement avec le profil par défaut (ou récupéré)
    launchAppWithUser({
      id: "1046406575998382160",
      username: "Mat_x32",
      avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
    });
    return;
  }

  // 2. Mode Navigateur classique
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
      launchAppWithUser(user);
      return;
    } catch {
      localStorage.removeItem("poyoya_discord_token");
    }
  }

  // Fallback direct navigateur
  launchAppWithUser({
    id: "1046406575998382160",
    username: "Mat_x32 (Local)",
    avatar: "https://cdn.discordapp.com/embed/avatars/1.png"
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("user-profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => window.location.reload());
  }
});

boot();
