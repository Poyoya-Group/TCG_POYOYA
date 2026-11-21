// ⚠️ discord.js DOIT rester le premier import (il patche le réseau avant Firebase).
import { isInDiscord, initDiscord } from "./discord.js";

import "@fortawesome/fontawesome-free/css/all.min.css";
import { initFirebaseBridge, showToast } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

// Utilisateur de test, utilisé UNIQUEMENT en développement (npm run dev) hors Discord.
const DEV_USER = {
  id: "DEV_LOCAL",
  username: "Dev Local",
  avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
};

const $ = (id) => document.getElementById(id);

function showAuthError(message) {
  const spinner = $("loading-spinner");
  const subtitle = $("auth-subtitle");
  const errBox = $("auth-error");
  if (spinner) spinner.style.display = "none";
  if (subtitle) subtitle.textContent = "Impossible de lancer le TCG";
  if (errBox) {
    errBox.textContent = message;
    errBox.style.display = "block";
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Firebase déclenche plusieurs mises à jour d'affilée au démarrage :
// on regroupe pour ne pas redessiner l'onglet (et casser les animations) 5 fois.
const refreshDebounced = debounce(() => refreshCurrentTab(), 80);

function launchAppWithUser(user) {
  const userNameEl = $("user-name");
  const userAvatarEl = $("user-avatar");
  if (userNameEl) userNameEl.textContent = user.username;
  if (userAvatarEl) userAvatarEl.src = user.avatar;

  const authScreen = $("auth-screen");
  if (authScreen) authScreen.remove();

  const appScreen = $("app");
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
    initFirebaseBridge(user, () => refreshDebounced());
    initNotificationsSystem(user);
  } catch (err) {
    console.error("Erreur Firebase :", err);
    showToast("Connexion à la base impossible : " + (err.message || err), "error");
  }
}

async function boot() {
  try {
    let user = await initDiscord();

    if (!user) {
      if (import.meta.env.DEV) {
        user = DEV_USER;
      } else {
        showAuthError("Lance le TCG depuis Discord (activité POYOYA TCG).");
        return;
      }
    }

    launchAppWithUser(user);
  } catch (err) {
    console.error("Erreur au démarrage :", err);
    showAuthError(err && err.message ? err.message : String(err));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = $("user-profile-btn");
  if (profileBtn) {
    profileBtn.style.cursor = "pointer";
    profileBtn.addEventListener("click", () => window.location.reload());
  }
});

boot();
