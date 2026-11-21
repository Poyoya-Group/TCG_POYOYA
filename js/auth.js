import "./firebase-shim.js"; // doit rester en premier : définit window.firebase
import "@fortawesome/fontawesome-free/css/all.min.css";
import { CONFIG } from "./config.js";
import { initDiscord } from "./discord.js";
import { initFirebaseBridge } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

function showAuthError(message) {
  const subtitle = document.getElementById("auth-subtitle");
  const spinner = document.getElementById("loading-spinner");
  if (subtitle) {
    subtitle.textContent = message;
    subtitle.style.color = "#ef4444";
  }
  if (spinner) spinner.style.display = "none";
}

window.addEventListener("error", (e) => showAuthError("Erreur : " + e.message));
window.addEventListener("unhandledrejection", (e) =>
  showAuthError("Erreur : " + (e.reason?.message || e.reason))
);

function launchAppWithUser(user) {
  const userNameEl = document.getElementById("user-name");
  const userAvatarEl = document.getElementById("user-avatar");
  if (userNameEl) userNameEl.textContent = user.username;
  if (userAvatarEl) userAvatarEl.src = user.avatar;

  document.getElementById("auth-screen")?.remove();

  const appScreen = document.getElementById("app");
  if (appScreen) {
    appScreen.classList.remove("hidden");
    appScreen.style.display = "flex";
  }

  try {
    initFirebaseBridge(user, () => refreshCurrentTab());
    initNotificationsSystem(user);
  } catch (err) {
    console.warn("Erreur Firebase :", err);
  }

  try {
    initRouter();
  } catch (err) {
    console.error("Erreur router :", err);
  }
}

async function boot() {
  try {
    let user = await initDiscord();

    // Développement local uniquement (npm run dev)
    if (!user && import.meta.env.DEV) {
      user = {
        id: CONFIG.SUPER_ADMINS[1] || "DEV_ADMIN_LOCAL",
        username: "Dev local",
        avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
      };
    }

    if (!user) {
      showAuthError("Ouvre POYOYA TCG depuis Discord (commande /tcg ou bouton Activités).");
      return;
    }

    launchAppWithUser(user);
  } catch (err) {
    console.error(err);
    showAuthError("Connexion impossible : " + (err?.message || err));
  }
}

boot();
