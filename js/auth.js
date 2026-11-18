import { CONFIG } from "./config.js";
import { initFirebaseBridge } from "./firebase-bridge.js";
import { initRouter, refreshCurrentTab } from "./router.js";
import { initNotificationsSystem } from "./modules/echanges.js";

function launchAppWithUser(user) {
  const userNameEl = document.getElementById("user-name");
  const userAvatarEl = document.getElementById("user-avatar");
  if (userNameEl) userNameEl.textContent = user.username;
  if (userAvatarEl) userAvatarEl.src = user.avatar;

  // Supprime instantanément l'écran de chargement du DOM pour forcer l'affichage
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

function boot() {
  // Connexion automatique directe en mode admin/joueur principal (Mat_x32)
  // Plus aucun test bloquant de SDK distant qui plante dans l'iframe Discord
  const defaultUser = {
    id: "1046406575998382160",
    username: "Mat_x32",
    avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
  };

  launchAppWithUser(defaultUser);
}

document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("user-profile-btn");
  if (profileBtn) {
    profileBtn.style.cursor = "pointer";
    profileBtn.addEventListener("click", () => window.location.reload());
  }
});

// Lancement immédiat au chargement du script
boot();
