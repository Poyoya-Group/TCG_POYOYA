import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { CONFIG } from "./config.js";

// Garde le global `firebase` pour tes modules (ex: firebase.database.ServerValue.TIMESTAMP)
window.firebase = firebase;

if (!firebase.apps.length) {
  firebase.initializeApp(CONFIG.FIREBASE);
}
export const db = firebase.database();

export const DEFAULT_SETTINGS = {
  identity: {
    name: "POYOYA TCG",
    description: "Le jeu de cartes officiel de l'univers POYOYA !",
    currencyName: "PoyoCoins",
    currencySymbol: "P",
    primaryColor: "#1a9fcb",
    secondaryColor: "#125487"
  },
  core: {
    boosterPrice: 100,
    cardsPerBooster: 5,
    freeBoosterCooldownMinutes: 240,
    maxFreeBoosters: 100
  },
  rarities: {
    commune: { id: "commune", name: "Commune", color: "#9ca3af", dropRate: 60, recycleValue: 10, holo: false },
    rare: { id: "rare", name: "Rare", color: "#3b82f6", dropRate: 25, recycleValue: 25, holo: false },
    epique: { id: "epique", name: "Épique", color: "#a855f7", dropRate: 11, recycleValue: 75, holo: true },
    legendaire: { id: "legendaire", name: "Légendaire", color: "#eab308", dropRate: 3.5, recycleValue: 200, holo: true },
    mythique: { id: "mythique", name: "Mythique", color: "#ef4444", dropRate: 0.5, recycleValue: 500, holo: true }
  },
  duels: {
    deckSize: 15,
    turns: 5,
    lanes: 3,
    winReward: 50,
    loseReward: 10
  },
  admins: {}
};

export const AppState = {
  // L'identité réelle est injectée par initFirebaseBridge() depuis Discord.
  user: {
    id: "",
    username: "Invité",
    avatar: "",
    poyocoins: 500,
    boostersStock: 5,
    collection: {},
    deck: [],
    stats: { boostersOpened: 0, duelsWon: 0 }
  },
  isAdmin: false, // calculé par checkAdminPermissions()
  online: false,
  settings: structuredClone(DEFAULT_SETTINGS),
  seasons: {},
  cards: {},
  users: {},
  encheres: {}
};

export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  if (type === "error") toast.style.borderLeftColor = "var(--danger)";
  if (type === "success") toast.style.borderLeftColor = "var(--success)";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

export function applyDynamicTheme(identity) {
  if (!identity) return;
  document.documentElement.style.setProperty("--primary-color", identity.primaryColor || "#1a9fcb");
  document.documentElement.style.setProperty("--secondary-color", identity.secondaryColor || "#125487");
  const brandEl = document.getElementById("tcg-brand-name");
  const symEl = document.getElementById("currency-symbol");
  if (brandEl) brandEl.textContent = identity.name || "POYOYA TCG";
  if (symEl) symEl.textContent = identity.currencySymbol || "P";
}

export function initFirebaseBridge(discordUser, onStateUpdated) {
  if (!discordUser || !discordUser.id) {
    throw new Error("Utilisateur Discord manquant : impossible d'initialiser Firebase.");
  }

  // Identité "fraîche" venant de Discord (pseudo/avatar peuvent changer)
  const identity = {
    id: discordUser.id,
    username: discordUser.username,
    avatar: discordUser.avatar
  };
  AppState.user = { ...AppState.user, ...identity };

  const notify = (what) => {
    if (typeof onStateUpdated === "function") onStateUpdated(what);
  };
  const onError = (err) => console.error("Firebase :", err && err.message ? err.message : err);

  // --- Diagnostic de connexion (utile pour déboguer le proxy Discord) ---
  db.ref(".info/connected").on("value", (snap) => {
    AppState.online = snap.val() === true;
  });
  setTimeout(() => {
    if (!AppState.online) {
      showToast("Connexion à la base Firebase impossible (vérifie le mapping /firebase).", "error");
    }
  }, 8000);

  const rootRef = db.ref(CONFIG.DB_ROOT);

  rootRef.child("settings").once("value").then((snap) => {
    if (!snap.exists()) {
      rootRef.child("settings").set(DEFAULT_SETTINGS);
      rootRef.child("seasons/s1").set({
        id: "s1",
        name: "Saison 1",
        active: true,
        maxCards: 100
      });
    }
  }).catch(onError);

  const userRef = rootRef.child(`users/${identity.id}`);
  userRef.once("value").then((userSnap) => {
    if (!userSnap.exists()) {
      userRef.set(AppState.user);
    } else {
      userRef.update({ username: identity.username, avatar: identity.avatar });
    }
  }).catch(onError);

  rootRef.child("settings").on("value", (snap) => {
    if (snap.exists()) {
      AppState.settings = { ...DEFAULT_SETTINGS, ...snap.val() };
      applyDynamicTheme(AppState.settings.identity);
      checkAdminPermissions();
      notify("settings");
    }
  }, onError);

  rootRef.child("seasons").on("value", (snap) => {
    AppState.seasons = snap.val() || {};
    notify("seasons");
  }, onError);

  rootRef.child("cards").on("value", (snap) => {
    AppState.cards = snap.val() || {};
    notify("cards");
  }, onError);

  rootRef.child("encheres").on("value", (snap) => {
    AppState.encheres = snap.val() || {};
    notify("encheres");
  }, onError);

  userRef.on("value", (snap) => {
    if (snap.exists()) {
      // On garde les données du jeu, mais on impose l'identité Discord actuelle
      AppState.user = { ...snap.val(), ...identity };
      const balEl = document.getElementById("user-balance");
      if (balEl) balEl.textContent = (AppState.user.poyocoins ?? 0).toLocaleString("fr-FR");
      checkAdminPermissions();
      notify("user");
    }
  }, onError);

  // Calcul immédiat des droits (sans attendre Firebase)
  checkAdminPermissions();
}

function checkAdminPermissions() {
  if (!AppState.user || !AppState.user.id) return;
  const uid = AppState.user.id;

  const isSuper = CONFIG.SUPER_ADMINS.includes(uid);
  const isConfiguredAdmin = Boolean(AppState.settings.admins && AppState.settings.admins[uid]);
  const isDevAdmin = import.meta.env.DEV && uid === "DEV_LOCAL";

  AppState.isAdmin = isSuper || isConfiguredAdmin || isDevAdmin;

  const adminNav = document.getElementById("admin-nav-group");
  if (adminNav) {
    adminNav.classList.toggle("hidden", !AppState.isAdmin);
    adminNav.style.display = AppState.isAdmin ? "flex" : "none";
  }
}
