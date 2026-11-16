import { CONFIG } from "./config.js";

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
  user: null,
  isAdmin: false,
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

export async function initFirebaseBridge(discordUser, onStateUpdated) {
  const rootRef = db.ref(CONFIG.DB_ROOT);

  const settingsSnap = await rootRef.child("settings").once("value");
  if (!settingsSnap.exists()) {
    await rootRef.child("settings").set(DEFAULT_SETTINGS);
    await rootRef.child("seasons/s1").set({
      id: "s1",
      name: "Saison 1",
      active: true,
      maxCards: 100
    });
  }

  const userRef = rootRef.child(`users/${discordUser.id}`);
  const userSnap = await userRef.once("value");
  if (!userSnap.exists()) {
    await userRef.set({
      id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      poyocoins: 500,
      boostersStock: 5,
      lastFreeBooster: Date.now(),
      collection: {},
      deck: [],
      stats: { boostersOpened: 0, duelsWon: 0 }
    });
  } else {
    await userRef.update({
      username: discordUser.username,
      avatar: discordUser.avatar
    });
  }

  rootRef.child("settings").on("value", (snap) => {
    if (snap.exists()) {
      AppState.settings = { ...DEFAULT_SETTINGS, ...snap.val() };
      applyDynamicTheme(AppState.settings.identity);
      checkAdminPermissions();
      onStateUpdated("settings");
    }
  });

  rootRef.child("seasons").on("value", (snap) => {
    AppState.seasons = snap.val() || {};
    onStateUpdated("seasons");
  });

  rootRef.child("cards").on("value", (snap) => {
    AppState.cards = snap.val() || {};
    onStateUpdated("cards");
  });

  // Écoute temps réel des enchères
  rootRef.child("encheres").on("value", (snap) => {
    AppState.encheres = snap.val() || {};
    onStateUpdated("encheres");
  });

  userRef.on("value", (snap) => {
    if (snap.exists()) {
      AppState.user = snap.val();
      const balEl = document.getElementById("user-balance");
      if (balEl) balEl.textContent = (AppState.user.poyocoins ?? 0).toLocaleString("fr-FR");
      checkAdminPermissions();
      onStateUpdated("user");
    }
  });
}

function checkAdminPermissions() {
  if (!AppState.user) return;
  const uid = AppState.user.id;
  const isSuper = CONFIG.SUPER_ADMINS.includes(uid);
  const isConfiguredAdmin = Boolean(AppState.settings.admins && AppState.settings.admins[uid]);
  
  AppState.isAdmin = isSuper || isConfiguredAdmin;

  const adminNav = document.getElementById("admin-nav-group");
  if (adminNav) {
    adminNav.classList.toggle("hidden", !AppState.isAdmin);
  }
}