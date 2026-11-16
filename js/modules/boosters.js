import { AppState, db, showToast } from "../firebase-bridge.js";
import { CONFIG } from "../config.js";
import { createCardElement } from "../card-renderer.js";

export function renderBoosters(container) {
  const stock = AppState.user?.boostersStock ?? 0;
  const maxStock = AppState.settings.core.maxFreeBoosters;
  const price = AppState.settings.core.boosterPrice;
  const sym = AppState.settings.identity.currencySymbol;

  container.innerHTML = `
    <div class="booster-stage">
      <h2>Ouvrir un booster classique</h2>
      <p style="color: var(--text-muted); margin-top: 0.35rem;">
        Saison 1 • <strong>${stock}/${maxStock}</strong> boosters disponibles
      </p>

      <div class="booster-pack" id="btn-open-booster">
        <i class="fa-solid fa-sparkles" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <h3>${AppState.settings.identity.name}</h3>
        <span style="font-size: 0.85rem; opacity: 0.85; margin-top: 0.4rem;">Booster Saison 1</span>
      </div>

      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
        Clique sur le booster pour l'ouvrir
      </p>

      <button class="btn-secondary" id="btn-buy-booster">
        Acheter un booster • ${price} ${sym}
      </button>

      <div id="booster-reveal-zone" class="cards-grid" style="margin-top: 2rem; justify-content: center;"></div>
    </div>
  `;

  document.getElementById("btn-buy-booster").addEventListener("click", async () => {
    if (AppState.user.poyocoins < price) {
      return showToast("Pas assez de PoyoCoins !", "error");
    }
    const userRef = db.ref(`${CONFIG.DB_ROOT}/users/${AppState.user.id}`);
    await userRef.update({
      poyocoins: AppState.user.poyocoins - price,
      boostersStock: stock + 1
    });
    showToast("Booster acheté !", "success");
  });

  document.getElementById("btn-open-booster").addEventListener("click", async () => {
    if (stock <= 0) return showToast("Aucun booster en stock !", "error");
    const allCards = Object.values(AppState.cards);
    if (!allCards.length) return showToast("Aucune carte créée par les admins pour l'instant !", "error");

    const count = AppState.settings.core.cardsPerBooster || 5;
    const pulled = [];
    const collection = { ...(AppState.user.collection || {}) };

    for (let i = 0; i < count; i++) {
      const card = allCards[Math.floor(Math.random() * allCards.length)];
      pulled.push(card);
      collection[card.id] = (collection[card.id] || 0) + 1;
    }

    await db.ref(`${CONFIG.DB_ROOT}/users/${AppState.user.id}`).update({
      boostersStock: stock - 1,
      collection
    });

    const zone = document.getElementById("booster-reveal-zone");
    zone.innerHTML = "";
    pulled.forEach((c) => zone.appendChild(createCardElement(c)));
    showToast(`Booster ouvert ! ${count} cartes obtenues.`, "success");
  });
}