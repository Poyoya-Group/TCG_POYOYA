import { AppState } from "../firebase-bridge.js";
import { createCardElement } from "../card-renderer.js";

export function renderCatalogue(container) {
  const allCards = Object.values(AppState.cards);
  const collection = AppState.user?.collection || {};
  const ownedCount = allCards.filter((c) => (collection[c.id] || 0) > 0).length;

  container.innerHTML = `
    <div class="panel-box section-header">
      <div>
        <strong>Saison 1</strong> • ${ownedCount}/${allCards.length} cartes obtenues
      </div>
      <button class="btn-secondary" id="btn-recycle">
        <i class="fa-solid fa-recycle"></i> Recycler mes doublons
      </button>
    </div>
    <div id="catalogue-grid" class="cards-grid"></div>
  `;

  const grid = document.getElementById("catalogue-grid");
  if (!allCards.length) {
    grid.innerHTML = `<p style="color: var(--text-muted);">Aucune carte disponible dans cette saison.</p>`;
    return;
  }

  allCards.forEach((card) => {
    const qty = collection[card.id] || 0;
    const el = createCardElement(card, { quantity: qty });
    if (qty === 0) el.style.opacity = "0.35";
    grid.appendChild(el);
  });
}