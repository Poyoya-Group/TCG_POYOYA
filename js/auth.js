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
  user: {
    id: "1046406575998382160",
    username: "Mat_x32",
    avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    poyocoins: 500,
    boostersStock: 5,
    collection: {},
    deck: [],
    stats: { boostersOpened: 0, duelsWon: 0 }
  },
  isAdmin: true,
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
  if (discordUser) {
    AppState.user = { ...AppState.user, ...discordUser };
  }

  const rootRef = db.ref(CONFIG.DB_ROOT);

  // Vérification et initialisation de base en arrière-plan
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
  }).catch(() => {});

  const userRef = rootRef.child(`users/${AppState.user.id}`);
  userRef.once("value").then((userSnap) => {
    if (!userSnap.exists()) {
      userRef.set(AppState.user);
    }
  }).catch(() => {});

  // Écoutes temps réel non bloquantes
  rootRef.child("settings").on("value", (snap) => {
    if (snap.exists()) {
      AppState.settings = { ...DEFAULT_SETTINGS, ...snap.val() };
      applyDynamicTheme(AppState.settings.identity);
      checkAdminPermissions();
      if (typeof onStateUpdated === "function") onStateUpdated("settings");
    }
  });

  rootRef.child("seasons").on("value", (snap) => {
    AppState.seasons = snap.val() || {};
    if (typeof onStateUpdated === "function") onStateUpdated("seasons");
  });

  rootRef.child("cards").on("value", (snap) => {
    AppState.cards = snap.val() || {};
    if (typeof onStateUpdated === "function") onStateUpdated("cards");
  });

  rootRef.child("encheres").on("value", (snap) => {
    AppState.encheres = snap.val() || {};
    if (typeof onStateUpdated === "function") onStateUpdated("encheres");
  });

  userRef.on("value", (snap) => {
    if (snap.exists()) {
      AppState.user = snap.val();
      const balEl = document.getElementById("user-balance");
      if (balEl) balEl.textContent = (AppState.user.poyocoins ?? 0).toLocaleString("fr-FR");
      checkAdminPermissions();
      if (typeof onStateUpdated === "function") onStateUpdated("user");
    }
  });
}

function checkAdminPermissions() {
  if (!AppState.user) return;
  const uid = AppState.user.id;
  const isSuper = CONFIG.SUPER_ADMINS.includes(uid);
  const isConfiguredAdmin = Boolean(AppState.settings.admins && AppState.settings.admins[uid]);
  
  AppState.isAdmin = isSuper || isConfiguredAdmin || uid === "1046406575998382160";

  const adminNav = document.getElementById("admin-nav-group");
  if (adminNav) {
    adminNav.classList.toggle("hidden", !AppState.isAdmin);
  }
}
