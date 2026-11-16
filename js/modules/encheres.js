import { AppState, db, showToast } from "../firebase-bridge.js";
import { CONFIG } from "../config.js";

export function renderEncheres(container) {
  const sym = AppState.settings.identity.currencySymbol;

  container.innerHTML = `
    <div class="panel-box section-header">
      <div>
        <h3>Hôtel des Ventes (Enchères)</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Misez vos ${AppState.settings.identity.currencyName} ou mettez vos cartes aux enchères !</p>
      </div>
      <button class="btn-primary" id="btn-open-create-enchere"><i class="fa-solid fa-gavel"></i> Mettre une carte aux enchères</button>
    </div>

    <div id="encheres-list-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
      <p style="color: var(--text-muted);">Chargement des enchères...</p>
    </div>

    <!-- MODAL DE CRÉATION D'ENCHÈRE -->
    <div id="enchere-modal" class="modal-backdrop hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div class="panel-box" style="width: 650px; max-width: 95vw; max-height: 90vh; overflow-y: auto; background: var(--bg-panel);">
        <div class="section-header">
          <h3>Mettre une carte aux enchères</h3>
          <button class="btn-secondary" id="close-enchere-modal" style="padding: 0.3rem 0.6rem;"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label>1. Choisis une carte dans ta collection :</label>
          <div id="picker-collection-cards" style="display: flex; flex-wrap: wrap; gap: 0.5rem; max-height: 180px; overflow-y: auto; border: 1px solid var(--border-color); padding: 8px; border-radius: 6px; background: var(--bg-card);"></div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Mise de départ (${sym})</label>
            <input type="number" id="input-start-bid" value="50" min="1" />
          </div>
          <div class="form-group">
            <label>Durée de l'enchère</label>
            <select id="select-duration">
              <option value="1">1 heure</option>
              <option value="6" selected>6 heures</option>
              <option value="24">24 heures (1 jour)</option>
              <option value="72">72 heures (3 jours)</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button class="btn-secondary" id="cancel-enchere-btn">Annuler</button>
          <button class="btn-primary" id="submit-enchere-btn">Lancer l'enchère</button>
        </div>
      </div>
    </div>
  `;

  // Gestion de la modale de création
  document.getElementById("btn-open-create-enchere").onclick = () => {
    openCreateEnchereModal();
  };
  document.getElementById("close-enchere-modal").onclick = closeEnchereModal;
  document.getElementById("cancel-enchere-btn").onclick = closeEnchereModal;

  // Affichage des enchères en temps réel depuis AppState
  renderEncheresList();
}

function renderEncheresList() {
  const container = document.getElementById("encheres-list-container");
  if (!container) return;
  container.innerHTML = "";

  const encheres = AppState.encheres || {};
  const now = Date.now();
  let activeCount = 0;

  Object.entries(encheres).forEach(([enchereId, e]) => {
    if (!e || e.status !== "active") return;

    // Vérifier si le temps est écoulé
    if (now >= e.endTime) {
      // Clôturer automatiquement l'enchère
      closeExpiredEnchere(enchereId, e);
      return;
    }

    activeCount++;
    const card = AppState.cards[e.cardId];
    if (!card) return;

    const timeLeft = formatTimeLeft(e.endTime - now);
    const sym = AppState.settings.identity.currencySymbol;
    const isMyEnchere = String(e.sellerId) === String(AppState.user.id);

    const cardDiv = document.createElement("div");
    cardDiv.className = "panel-box";
    cardDiv.style.cssText = "background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between; position: relative;";

    cardDiv.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">Vendeur : <strong>${e.sellerName}</strong></span>
          <span style="font-size: 0.75rem; background: rgba(26,159,203,0.15); color: var(--primary-color); padding: 2px 6px; border-radius: 4px;"><i class="fa-solid fa-clock"></i> ${timeLeft}</span>
        </div>

        <div style="text-align: center; margin: 0.5rem 0;">
          <img src="${card.charImage || card.bgImage || ""}" style="width: 90px; height: 125px; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
          <h4 style="margin-top: 0.5rem; font-size: 0.95rem;">${card.name}</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);"> #${card.number} • ${card.rarity}</span>
        </div>

        <div style="background: var(--bg-panel); padding: 0.5rem; border-radius: 6px; margin: 0.75rem 0; font-size: 0.85rem; text-align: center;">
          Mise actuelle : <strong>${e.currentBid} ${sym}</strong><br/>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Par : ${e.currentBidderName || "Aucun enchérisseur"}</span>
        </div>
      </div>

      <div>
        ${!isMyEnchere ? `
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <input type="number" id="bid-input-${enchereId}" value="${e.currentBid + 10}" min="${e.currentBid + 1}" style="flex: 1; padding: 0.35rem;" />
            <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;" id="bid-btn-${enchereId}">Miser</button>
          </div>
        ` : `
          <p style="text-align: center; font-size: 0.75rem; color: var(--text-muted); font-style: italic;">C'est votre mise en vente</p>
        `}
      </div>
    `;

    container.appendChild(cardDiv);

    // Événement du bouton de mise
    setTimeout(() => {
      const btn = document.getElementById(`bid-btn-${enchereId}`);
      const input = document.getElementById(`bid-input-${enchereId}`);
      if (btn && input) {
        btn.onclick = () => placeBid(enchereId, e, Number(input.value));
      }
    }, 0);
  });

  if (activeCount === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 2rem;">Aucune enchère active pour le moment. Lancez-en une !</p>`;
  }
}

let selectedEnchereCardId = null;

function openCreateEnchereModal() {
  selectedEnchereCardId = null;
  const collection = AppState.user.collection || {};
  const picker = document.getElementById("picker-collection-cards");
  picker.innerHTML = "";

  let hasCards = false;
  Object.entries(collection).forEach(([cardId, qty]) => {
    if (qty <= 0) return;
    hasCards = true;
    const card = AppState.cards[cardId];
    if (!card) return;

    const item = document.createElement("div");
    item.style.cssText = "cursor: pointer; border: 2px solid transparent; border-radius: 6px; padding: 2px; position: relative;";
    item.innerHTML = `<img src="${card.charImage || card.bgImage || ""}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;" title="${card.name} (x${qty})" />`;
    
    item.onclick = () => {
      document.querySelectorAll("#picker-collection-cards div").forEach(d => d.style.borderColor = "transparent");
      item.style.borderColor = "var(--primary-color)";
      selectedEnchereCardId = cardId;
    };
    picker.appendChild(item);
  });

  if (!hasCards) {
    picker.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; padding: 10px;">Tu ne possèdes aucune carte à mettre aux enchères.</p>`;
  }

  document.getElementById("enchere-modal").classList.remove("hidden");

  document.getElementById("submit-enchere-btn").onclick = async () => {
    if (!selectedEnchereCardId) return showToast("Sélectionne une carte à mettre aux enchères !", "error");
    
    const startBid = Number(document.getElementById("input-start-bid").value) || 10;
    const durationHours = Number(document.getElementById("select-duration").value) || 6;

    // Retirer la carte de la collection du vendeur immédiatement
    const myId = AppState.user.id;
    const myCol = { ...(AppState.user.collection || {}) };
    if ((myCol[selectedEnchereCardId] || 0) <= 0) return showToast("Tu ne possèdes plus cette carte !", "error");
    
    myCol[selectedEnchereCardId]--;
    if (myCol[selectedEnchereCardId] <= 0) delete myCol[selectedEnchereCardId];

    const enchereRef = db.ref(`${CONFIG.DB_ROOT}/encheres`).push();
    const newEnchere = {
      id: enchereRef.key,
      sellerId: myId,
      sellerName: AppState.user.username,
      cardId: selectedEnchereCardId,
      currentBid: startBid,
      currentBidderId: null,
      currentBidderName: null,
      endTime: Date.now() + (durationHours * 3600 * 1000),
      status: "active"
    };

    await db.ref(`${CONFIG.DB_ROOT}/users/${myId}/collection`).set(myCol);
    await enchereRef.set(newEnchere);

    showToast("Carte mise aux enchères avec succès !", "success");
    closeEnchereModal();
  };
}

function closeEnchereModal() {
  document.getElementById("enchere-modal").classList.add("hidden");
}

async function placeBid(enchereId, e, bidAmount) {
  const myId = AppState.user.id;
  const myName = AppState.user.username;
  const myCoins = AppState.user.poyocoins || 0;

  if (bidAmount <= e.currentBid) {
    return showToast(`La mise doit être supérieure à ${e.currentBid} PoyoCoins !`, "error");
  }
  if (myCoins < bidAmount) {
    return showToast("Tu n'as pas assez de PoyoCoins pour cette mise !", "error");
  }

  // Effectuer la transaction dans Firebase
  const usersRef = db.ref(`${CONFIG.DB_ROOT}/users`);
  const enchereRef = db.ref(`${CONFIG.DB_ROOT}/encheres/${enchereId}`);

  // 1. Rembourser l'ancien enchérisseur s'il y en a un
  if (e.currentBidderId) {
    const prevBidderSnap = await usersRef.child(`${e.currentBidderId}/poyocoins`).once("value");
    const prevCoins = prevBidderSnap.val() || 0;
    await usersRef.child(`${e.currentBidderId}`).update({ poyocoins: prevCoins + e.currentBid });
  }

  // 2. Débiter le nouveau enchérisseur
  await usersRef.child(`${myId}`).update({ poyocoins: myCoins - bidAmount });

  // 3. Mettre à jour l'enchère
  await enchereRef.update({
    currentBid: bidAmount,
    currentBidderId: myId,
    currentBidderName: myName
  });

  showToast(`Mise de ${bidAmount} PoyoCoins placée avec succès !`, "success");
}

async function closeExpiredEnchere(enchereId, e) {
  // Clôture automatique de l'enchère expirée
  const enchereRef = db.ref(`${CONFIG.DB_ROOT}/encheres/${enchereId}`);
  await enchereRef.update({ status: "closed" });

  const usersRef = db.ref(`${CONFIG.DB_ROOT}/users`);

  if (e.currentBidderId) {
    // Il y a un acheteur : donner la carte à l'acheteur et l'argent au vendeur
    const buyerSnap = await usersRef.child(`${e.currentBidderId}`).once("value");
    const buyer = buyerSnap.val();

    const sellerSnap = await usersRef.child(`${e.sellerId}`).once("value");
    const seller = sellerSnap.val();

    if (buyer) {
      buyer.collection = buyer.collection || {};
      buyer.collection[e.cardId] = (buyer.collection[e.cardId] || 0) + 1;
      await usersRef.child(`${e.currentBidderId}/collection`).set(buyer.collection);
    }

    if (seller) {
      seller.poyocoins = (seller.poyocoins || 0) + e.currentBid;
      await usersRef.child(`${e.sellerId}/poyocoins`).set(seller.poyocoins);
    }
  } else {
    // Aucun enchérisseur : rendre la carte au vendeur
    const sellerSnap = await usersRef.child(`${e.sellerId}`).once("value");
    const seller = sellerSnap.val();
    if (seller) {
      seller.collection = seller.collection || {};
      seller.collection[e.cardId] = (seller.collection[e.cardId] || 0) + 1;
      await usersRef.child(`${e.sellerId}/collection`).set(seller.collection);
    }
  }
}

function formatTimeLeft(ms) {
  if (ms <= 0) return "Expiré";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
}