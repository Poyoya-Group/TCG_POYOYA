import { AppState, db, showToast } from "../firebase-bridge.js";
import { CONFIG } from "../config.js";

let tradeOfferCoins = 0;
let tradeRequestCoins = 0;
let tradeOfferCards = []; 
let tradeRequestCards = []; 
let targetSelectedUser = null;
let currentTradeSubTab = "active"; // "active" ou "history"

export function renderEchanges(container) {
  const myId = AppState.user ? String(AppState.user.id) : "";
  const sym = AppState.settings.identity.currencySymbol;

  // Effacer la pastille rouge de l'onglet échanges dès qu'on y accède
  clearTradesNotificationBadge();

  container.innerHTML = `
    <div class="panel-box section-header">
      <div>
        <h3>Centre d'Échanges</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Échange des cartes et des ${AppState.settings.identity.currencyName} en toute sécurité.</p>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center; position: relative;">
        <div style="position: relative;">
          <input type="text" id="search-player-input" placeholder="Chercher un joueur..." style="width: 200px;" autocomplete="off" />
          <div id="autocomplete-dropdown" class="hidden" style="position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 0 0 6px 6px; z-index: 50; max-height: 150px; overflow-y: auto;"></div>
        </div>
        <button class="btn-primary" id="btn-new-trade" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fa-solid fa-plus"></i> Nouvel échange</button>
      </div>
    </div>

    <!-- ONGLETS ACTIF / HISTORIQUE -->
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <button class="btn-secondary ${currentTradeSubTab === "active" ? "active-subtab" : ""}" id="tab-active-trades" style="flex: 1;"><i class="fa-solid fa-handshake"></i> Échanges en cours</button>
      <button class="btn-secondary ${currentTradeSubTab === "history" ? "active-subtab" : ""}" id="tab-history-trades" style="flex: 1;"><i class="fa-solid fa-clock-rotate-left"></i> Historique des échanges</button>
    </div>

    <div id="trades-container-area"></div>

    <!-- MODAL DE CRÉATION D'ÉCHANGE -->
    <div id="trade-modal" class="modal-backdrop hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div class="panel-box" style="width: 780px; max-width: 95vw; max-height: 90vh; overflow-y: auto; background: var(--bg-panel);">
        <div class="section-header">
          <h3 id="modal-trade-title">Nouvel échange</h3>
          <button class="btn-secondary" id="close-trade-modal" style="padding: 0.3rem 0.6rem;"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div style="background: var(--bg-card); padding: 1rem; border-radius: var(--radius-sm);">
            <h4>Votre offre</h4>
            <div class="form-group" style="margin-top: 0.75rem;">
              <label>PoyoCoins proposés (Max: <span id="my-max-coins">0</span> ${sym})</label>
              <input type="number" id="input-offer-coins" value="0" min="0" />
              <span id="my-coins-warning" class="hidden" style="color: var(--danger); font-size: 0.75rem; margin-top: 2px;">Solde insuffisant !</span>
            </div>
            <div class="form-group">
              <label>Cartes offertes (<span id="count-offer-cards">0</span>)</label>
              <div id="picker-my-cards" style="display: flex; flex-wrap: wrap; gap: 0.5rem; max-height: 160px; overflow-y: auto; border: 1px solid var(--border-color); padding: 6px; border-radius: 4px;"></div>
            </div>
          </div>

          <div style="background: var(--bg-card); padding: 1rem; border-radius: var(--radius-sm);">
            <h4 id="target-player-label">Offre demandée</h4>
            <div class="form-group" style="margin-top: 0.75rem;">
              <label>PoyoCoins demandés (Max: <span id="target-max-coins">0</span> ${sym})</label>
              <input type="number" id="input-request-coins" value="0" min="0" />
              <span id="target-coins-warning" class="hidden" style="color: var(--danger); font-size: 0.75rem; margin-top: 2px;">Le joueur n'a pas assez de pièces !</span>
            </div>
            <div class="form-group">
              <label>Cartes demandées (<span id="count-request-cards">0</span>)</label>
              <div id="picker-target-cards" style="display: flex; flex-wrap: wrap; gap: 0.5rem; max-height: 160px; overflow-y: auto; border: 1px solid var(--border-color); padding: 6px; border-radius: 4px;"></div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn-secondary" id="cancel-trade-btn">Annuler</button>
          <button class="btn-primary" id="submit-trade-btn">Envoyer la proposition</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("tab-active-trades").onclick = () => { currentTradeSubTab = "active"; renderEchanges(container); };
  document.getElementById("tab-history-trades").onclick = () => { currentTradeSubTab = "history"; renderEchanges(container); };

  const area = document.getElementById("trades-container-area");

  if (currentTradeSubTab === "active") {
    area.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div class="panel-box">
          <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-inbox"></i> Propositions à répondre</h4>
          <div id="trades-incoming" style="display: flex; flex-direction: column; gap: 0.75rem; min-height: 100px;">
            <p style="color: var(--text-muted); font-size: 0.85rem;">Aucune proposition reçue.</p>
          </div>
        </div>
        <div class="panel-box">
          <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-paper-plane"></i> Propositions envoyées / en attente</h4>
          <div id="trades-outgoing" style="display: flex; flex-direction: column; gap: 0.75rem; min-height: 100px;">
            <p style="color: var(--text-muted); font-size: 0.85rem;">Aucune proposition envoyée.</p>
          </div>
        </div>
      </div>
    `;
  } else {
    area.innerHTML = `
      <div class="panel-box">
        <h4 style="margin-bottom: 1rem;"><i class="fa-solid id="history-title"></i> Historique des Échanges (Terminés / Refusés)</h4>
        <div id="trades-history-list" style="display: flex; flex-direction: column; gap: 0.75rem; min-height: 150px;">
          <p style="color: var(--text-muted); font-size: 0.85rem;">Chargement de l'historique...</p>
        </div>
      </div>
    `;
  }

  // --- RECHERCHE ET AUTOCOMPLÉTION ---
  const searchInput = document.getElementById("search-player-input");
  const dropdown = document.getElementById("autocomplete-dropdown");
  const newTradeBtn = document.getElementById("btn-new-trade");

  searchInput.addEventListener("input", async (e) => {
    const val = e.target.value.trim().toLowerCase();
    dropdown.innerHTML = "";
    targetSelectedUser = null;
    newTradeBtn.disabled = true;
    newTradeBtn.style.opacity = "0.5";
    newTradeBtn.style.cursor = "not-allowed";

    if (!val) {
      dropdown.classList.add("hidden");
      return;
    }

    const snap = await db.ref(`${CONFIG.DB_ROOT}/users`).once("value");
    const users = snap.val() || {};
    let matches = [];

    Object.values(users).forEach((u) => {
      if (String(u.id) !== myId && u.username.toLowerCase().includes(val)) {
        matches.push(u);
      }
    });

    if (matches.length === 0) {
      dropdown.classList.add("hidden");
      return;
    }

    matches.forEach((u) => {
      const item = document.createElement("div");
      item.style.cssText = "padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.88rem;";
      item.innerHTML = `<img src="${u.avatar || ''}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;" /> ${u.username}`;
      item.onclick = () => {
        searchInput.value = u.username;
        targetSelectedUser = u;
        dropdown.classList.add("hidden");
        newTradeBtn.disabled = false;
        newTradeBtn.style.opacity = "1";
        newTradeBtn.style.cursor = "pointer";
      };
      dropdown.appendChild(item);
    });

    dropdown.classList.remove("hidden");
  });

  newTradeBtn.addEventListener("click", async () => {
    let target = targetSelectedUser;
    if (!target) {
      const typedName = searchInput.value.trim();
      const snap = await db.ref(`${CONFIG.DB_ROOT}/users`).once("value");
      const users = snap.val() || {};
      Object.values(users).forEach((u) => {
        if (u.username.toLowerCase() === typedName.toLowerCase()) target = u;
      });
    }

    if (!target) return showToast("Sélectionne un joueur valide !", "error");

    openTradeModal({
      id: null,
      senderId: myId,
      senderName: AppState.user.username,
      targetId: target.id,
      targetName: target.username,
      offerCoins: 0,
      offerCards: [],
      requestCoins: 0,
      requestCards: []
    });
  });

  // --- ÉCOUTE TEMPS RÉEL DES TRADES & NOTIFICATIONS ---
  db.ref(`${CONFIG.DB_ROOT}/trades`).on("value", (snap) => {
    const trades = snap.val() || {};
    
    if (currentTradeSubTab === "active") {
      const incomingContainer = document.getElementById("trades-incoming");
      const outgoingContainer = document.getElementById("trades-outgoing");
      if (!incomingContainer || !outgoingContainer) return;

      incomingContainer.innerHTML = "";
      outgoingContainer.innerHTML = "";

      let incCount = 0;
      let outCount = 0;

      Object.entries(trades).forEach(([tradeId, t]) => {
        if (!t) return;
        const isMySend = String(t.senderId) === myId || t.senderName === AppState.user.username;
        const isMyReceive = String(t.targetId) === myId || t.targetName === AppState.user.username;

        if (t.status === "pending") {
          if (isMyReceive) {
            incCount++;
            incomingContainer.appendChild(createTradeCardElement(tradeId, t, true));
          } else if (isMySend) {
            outCount++;
            outgoingContainer.appendChild(createTradeCardElement(tradeId, t, false));
          }
        }
      });

      if (incCount === 0) incomingContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Aucune proposition reçue.</p>`;
      if (outCount === 0) outgoingContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Aucune proposition envoyée.</p>`;
    } else {
      // Affichage de l'historique
      const historyContainer = document.getElementById("trades-history-list");
      if (!historyContainer) return;
      historyContainer.innerHTML = "";
      let histCount = 0;

      Object.entries(trades).forEach(([tradeId, t]) => {
        if (!t) return;
        const isMyRel = String(t.senderId) === myId || String(t.targetId) === myId || t.senderName === AppState.user.username || t.targetName === AppState.user.username;
        if (isMyRel && t.status !== "pending") {
          histCount++;
          historyContainer.appendChild(createHistoryCardElement(t, myId));
        }
      });

      if (histCount === 0) {
        historyContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Aucun échange dans l'historique.</p>`;
      }
    }
  });

  document.getElementById("close-trade-modal").addEventListener("click", closeTradeModal);
  document.getElementById("cancel-trade-btn").addEventListener("click", closeTradeModal);
}

// --- GESTION DES NOTIFICATIONS UTILISATEUR ---
export function initNotificationsSystem(user) {
  const myId = String(user.id);
  const notifRef = db.ref(`${CONFIG.DB_ROOT}/notifications/${myId}`);

  // Écouter les changements dans les trades pour générer des notifications automatiques
  db.ref(`${CONFIG.DB_ROOT}/trades`).on("value", async (snap) => {
    const trades = snap.val() || {};
    const existingNotifsSnap = await notifRef.once("value");
    const notifs = existingNotifsSnap.val() || {};

    let hasNew = false;

    Object.entries(trades).forEach(([tradeId, t]) => {
      if (!t) return;
      const isMyReceive = String(t.targetId) === myId || t.targetName === user.username;
      const isMySend = String(t.senderId) === myId || t.senderName === user.username;

      // Clé unique pour chaque notification d'échange
      const notifKey = `trade_${tradeId}_${t.status}`;

      if (!notifs[notifKey]) {
        let msg = "";
        if (t.status === "pending" && isMyReceive) {
          msg = `Nouvelle proposition d'échange reçue de ${t.senderName} !`;
          hasNew = true;
          triggerTradeTabBadge(); // Allumer la pastille rouge sur l'onglet Échanges
        } else if (t.status === "completed" && (isMyReceive || isMySend)) {
          msg = `L'échange avec ${isMyReceive ? t.senderName : t.targetName} a été accepté et validé ! 🎉`;
          hasNew = true;
        } else if (t.status === "refused" && isMySend) {
          msg = `Ton échange avec ${t.targetName} a été refusé.`;
          hasNew = true;
        }

        if (msg) {
          db.ref(`${CONFIG.DB_ROOT}/notifications/${myId}/${notifKey}`).set({
            id: notifKey,
            message: msg,
            timestamp: Date.now(),
            read: false
          });
        }
      }
    });

    renderBellBadgeAndDropdown(myId);
  });
}

function triggerTradeTabBadge() {
  const badge = document.getElementById("trades-tab-badge");
  if (badge) badge.classList.remove("hidden");
}

function clearTradesNotificationBadge() {
  const badge = document.getElementById("trades-tab-badge");
  if (badge) badge.classList.add("hidden");
}

function renderBellBadgeAndDropdown(myId) {
  let bellContainer = document.getElementById("notification-bell-container");
  if (!bellContainer) {
    // Insérer la cloche près du profil utilisateur en haut à droite
    const userProfileEl = document.getElementById("user-profile-btn")?.parentElement;
    if (!userProfileEl) return;

    bellContainer = document.createElement("div");
    bellContainer.id = "notification-bell-container";
    bellContainer.style.cssText = "position: relative; display: flex; align-items: center; margin-right: 1rem; cursor: pointer;";
    bellContainer.innerHTML = `
      <div id="bell-icon-btn" style="position: relative; font-size: 1.2rem; color: var(--text-main);">
        <i class="fa-solid fa-bell"></i>
        <span id="bell-badge" class="hidden" style="position: absolute; top: -5px; right: -5px; background: var(--danger); width: 10px; height: 10px; border-radius: 50%;"></span>
      </div>
      <div id="bell-dropdown" class="hidden panel-box" style="position: absolute; top: 40px; right: 0; width: 320px; max-height: 350px; overflow-y: auto; z-index: 2000; background: var(--bg-panel); box-shadow: 0 10px 25px rgba(0,0,0,0.5); padding: 0.75rem;">
        <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Notifications</h4>
        <div id="bell-notifs-list" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
      </div>
    `;
    userProfileEl.insertBefore(bellContainer, userProfileEl.firstChild);

    document.getElementById("bell-icon-btn").onclick = (e) => {
      e.stopPropagation();
      const drop = document.getElementById("bell-dropdown");
      drop.classList.toggle("hidden");
    };

    document.addEventListener("click", () => {
      const drop = document.getElementById("bell-dropdown");
      if (drop) drop.classList.add("hidden");
    });
  }

  // Écouter les notifs non lues
  db.ref(`${CONFIG.DB_ROOT}/notifications/${myId}`).on("value", (snap) => {
    const notifs = snap.val() || {};
    const listEl = document.getElementById("bell-notifs-list");
    const badgeEl = document.getElementById("bell-badge");
    if (!listEl || !badgeEl) return;

    listEl.innerHTML = "";
    let unreadCount = 0;

    const sortedNotifs = Object.values(notifs).sort((a, b) => b.timestamp - a.timestamp);

    if (sortedNotifs.length === 0) {
      listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 10px;">Aucune notification</p>`;
    }

    sortedNotifs.forEach((n) => {
      if (!n.read) unreadCount++;

      const item = document.createElement("div");
      item.style.cssText = `background: ${n.read ? "var(--bg-card)" : "rgba(26, 159, 203, 0.15)"}; padding: 8px; border-radius: 6px; font-size: 0.82rem; border-left: 3px solid ${n.read ? "var(--border-color)" : "var(--primary-color)"};`;
      item.innerHTML = `
        <div style="margin-bottom: 4px;">${n.message}</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          ${!n.read ? `<button class="btn-secondary" style="font-size: 0.7rem; padding: 2px 6px;" id="read-${n.id}">Marqué comme lu</button>` : ""}
        </div>
      `;

      listEl.appendChild(item);

      setTimeout(() => {
        const btn = document.getElementById(`read-${n.id}`);
        if (btn) {
          btn.onclick = async (ev) => {
            ev.stopPropagation();
            await db.ref(`${CONFIG.DB_ROOT}/notifications/${myId}/${n.id}`).update({ read: true });
          };
        }
      }, 0);
    });

    if (unreadCount > 0) {
      badgeEl.classList.remove("hidden");
    } else {
      badgeEl.classList.add("hidden");
    }
  });
}

// --- MODAL DE CRÉATION ET GESTION DES OFFRES ---
async function openTradeModal(tradeData) {
  tradeOfferCoins = tradeData.offerCoins || 0;
  tradeRequestCoins = tradeData.requestCoins || 0;
  tradeOfferCards = Array.isArray(tradeData.offerCards) ? [...tradeData.offerCards] : [];
  tradeRequestCards = Array.isArray(tradeData.requestCards) ? [...tradeData.requestCards] : [];

  const partnerId = String(tradeData.senderId) === String(AppState.user.id) ? tradeData.targetId : tradeData.senderId;
  const partnerSnap = await db.ref(`${CONFIG.DB_ROOT}/users/${partnerId}`).once("value");
  const partnerData = partnerSnap.val() || { username: tradeData.targetName, poyocoins: 0, collection: {} };

  document.getElementById("modal-trade-title").textContent = `Échange avec ${partnerData.username}`;
  document.getElementById("target-player-label").textContent = `Offre demandée à ${partnerData.username}`;
  
  const myMaxCoins = AppState.user.poyocoins || 0;
  const partnerMaxCoins = partnerData.poyocoins || 0;

  document.getElementById("my-max-coins").textContent = myMaxCoins;
  document.getElementById("target-max-coins").textContent = partnerMaxCoins;

  document.getElementById("input-offer-coins").value = tradeOfferCoins;
  document.getElementById("input-request-coins").value = tradeRequestCoins;

  renderCardPickers(partnerData);
  document.getElementById("trade-modal").classList.remove("hidden");

  const offerCoinsInput = document.getElementById("input-offer-coins");
  const requestCoinsInput = document.getElementById("input-request-coins");

  offerCoinsInput.oninput = (e) => {
    tradeOfferCoins = Number(e.target.value);
    const warning = document.getElementById("my-coins-warning");
    if (tradeOfferCoins > myMaxCoins) {
      warning.classList.remove("hidden");
      offerCoinsInput.style.borderColor = "var(--danger)";
    } else {
      warning.classList.add("hidden");
      offerCoinsInput.style.borderColor = "var(--border-color)";
    }
  };

  requestCoinsInput.oninput = (e) => {
    tradeRequestCoins = Number(e.target.value);
    const warning = document.getElementById("target-coins-warning");
    if (tradeRequestCoins > partnerMaxCoins) {
      warning.classList.remove("hidden");
      requestCoinsInput.style.borderColor = "var(--danger)";
    } else {
      warning.classList.add("hidden");
      requestCoinsInput.style.borderColor = "var(--border-color)";
    }
  };

  document.getElementById("submit-trade-btn").onclick = async () => {
    if (tradeOfferCoins > myMaxCoins || tradeRequestCoins > partnerMaxCoins) {
      return showToast("Montant de PoyoCoins invalide (dépasse le solde disponible).", "error");
    }

    const tradeRef = tradeData.id ? db.ref(`${CONFIG.DB_ROOT}/trades/${tradeData.id}`) : db.ref(`${CONFIG.DB_ROOT}/trades`).push();

    const newTrade = {
      id: tradeRef.key,
      senderId: AppState.user.id,
      senderName: AppState.user.username,
      targetId: partnerId,
      targetName: partnerData.username,
      offerCoins: tradeOfferCoins,
      offerCards: tradeOfferCards,
      requestCoins: tradeRequestCoins,
      requestCards: tradeRequestCards,
      status: "pending",
      timestamp: Date.now()
    };

    await tradeRef.set(newTrade);
    showToast("Proposition d'échange envoyée avec succès !", "success");
    closeTradeModal();
  };
}

function closeTradeModal() {
  document.getElementById("trade-modal").classList.add("hidden");
  targetSelectedUser = null;
  const searchInput = document.getElementById("search-player-input");
  if (searchInput) searchInput.value = "";
}

function renderCardPickers(partnerData) {
  const myCollection = AppState.user.collection || {};
  const partnerCollection = partnerData.collection || {};

  const offerPicker = document.getElementById("picker-my-cards");
  const requestPicker = document.getElementById("picker-target-cards");
  offerPicker.innerHTML = "";
  requestPicker.innerHTML = "";

  let hasMyCards = false;
  Object.entries(myCollection).forEach(([cardId, qty]) => {
    if (qty <= 0) return;
    hasMyCards = true;
    const card = AppState.cards[cardId];
    if (!card) return;

    const isSelected = tradeOfferCards.includes(cardId);
    const item = document.createElement("div");
    item.style.cssText = `cursor: pointer; border: 2px solid ${isSelected ? "var(--primary-color)" : "transparent"}; border-radius: 6px; padding: 2px;`;
    item.innerHTML = `<img src="${card.charImage || card.bgImage || ""}" style="width: 48px; height: 68px; object-fit: cover; border-radius: 4px;" title="${card.name}" />`;
    
    item.onclick = () => {
      if (isSelected) {
        tradeOfferCards = tradeOfferCards.filter(id => id !== cardId);
      } else {
        tradeOfferCards.push(cardId);
      }
      document.getElementById("count-offer-cards").textContent = tradeOfferCards.length;
      renderCardPickers(partnerData);
    };
    offerPicker.appendChild(item);
  });

  if (!hasMyCards) {
    offerPicker.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; padding: 10px;">Tu ne possèdes aucune carte à échanger !</p>`;
  }
  document.getElementById("count-offer-cards").textContent = tradeOfferCards.length;

  let hasPartnerCards = false;
  Object.entries(partnerCollection).forEach(([cardId, qty]) => {
    if (qty <= 0) return;
    hasPartnerCards = true;
    const card = AppState.cards[cardId];
    if (!card) return;

    const isSelected = tradeRequestCards.includes(cardId);
    const item = document.createElement("div");
    item.style.cssText = `cursor: pointer; border: 2px solid ${isSelected ? "var(--primary-color)" : "transparent"}; border-radius: 6px; padding: 2px;`;
    item.innerHTML = `<img src="${card.charImage || card.bgImage || ""}" style="width: 48px; height: 68px; object-fit: cover; border-radius: 4px;" title="${card.name}" />`;
    
    item.onclick = () => {
      if (isSelected) {
        tradeRequestCards = tradeRequestCards.filter(id => id !== cardId);
      } else {
        tradeRequestCards.push(cardId);
      }
      document.getElementById("count-request-cards").textContent = tradeRequestCards.length;
      renderCardPickers(partnerData);
    };
    requestPicker.appendChild(item);
  });

  if (!hasPartnerCards) {
    requestPicker.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; padding: 10px;">Ce joueur ne possède aucune carte dans sa collection.</p>`;
  }
  document.getElementById("count-request-cards").textContent = tradeRequestCards.length;
}

function createTradeCardElement(tradeId, t, isIncoming) {
  const div = document.createElement("div");
  div.className = "panel-box";
  div.style.cssText = "background: var(--bg-card); padding: 0.85rem; margin-bottom: 0;";
  
  const partnerName = isIncoming ? t.senderName : t.targetName;
  const sym = AppState.settings.identity.currencySymbol;
  const offerCardsLen = Array.isArray(t.offerCards) ? t.offerCards.length : 0;
  const requestCardsLen = Array.isArray(t.requestCards) ? t.requestCards.length : 0;

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <strong>${isIncoming ? "De : " + partnerName : "Vers : " + partnerName}</strong>
      <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(t.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
      Offre : <strong>${t.offerCoins || 0} ${sym}</strong> + ${offerCardsLen} carte(s) <br/>
      Demande : <strong>${t.requestCoins || 0} ${sym}</strong> + ${requestCardsLen} carte(s)
    </div>
    <div style="display: flex; gap: 0.5rem;">
      ${isIncoming ? `
        <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" id="accept-${tradeId}">Accepter</button>
        <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" id="counter-${tradeId}">Contre-offre</button>
        <button class="btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" id="refuse-${tradeId}">Refuser</button>
      ` : `
        <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" id="edit-${tradeId}">Modifier</button>
        <button class="btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" id="cancel-${tradeId}">Annuler</button>
      `}
    </div>
  `;

  setTimeout(() => {
    if (isIncoming) {
      const acceptBtn = document.getElementById(`accept-${tradeId}`);
      const refuseBtn = document.getElementById(`refuse-${tradeId}`);
      const counterBtn = document.getElementById(`counter-${tradeId}`);

      if (acceptBtn) acceptBtn.onclick = () => executeTrade(tradeId, t);
      if (refuseBtn) refuseBtn.onclick = async () => {
        await db.ref(`${CONFIG.DB_ROOT}/trades/${tradeId}`).update({ status: "refused" });
        showToast("Échange refusé.", "info");
      };
      if (counterBtn) counterBtn.onclick = () => {
        openTradeModal({
          id: tradeId,
          senderId: t.targetId,
          senderName: t.targetName,
          targetId: t.senderId,
          targetName: t.senderName,
          offerCoins: t.requestCoins || 0,
          offerCards: t.requestCards || [],
          requestCoins: t.offerCoins || 0,
          requestCards: t.offerCards || []
        });
      };
    } else {
      const cancelBtn = document.getElementById(`cancel-${tradeId}`);
      const editBtn = document.getElementById(`edit-${tradeId}`);

      if (cancelBtn) cancelBtn.onclick = async () => {
        await db.ref(`${CONFIG.DB_ROOT}/trades/${tradeId}`).update({ status: "cancelled" });
        showToast("Échange annulé.", "info");
      };
      if (editBtn) editBtn.onclick = () => {
        openTradeModal(t);
      };
    }
  }, 0);

  return div;
}

function createHistoryCardElement(t, myId) {
  const div = document.createElement("div");
  div.className = "panel-box";
  div.style.cssText = "background: var(--bg-card); padding: 0.85rem; margin-bottom: 0;";

  const partnerName = String(t.senderId) === myId || t.senderName === AppState.user.username ? t.targetName : t.senderName;
  const sym = AppState.settings.identity.currencySymbol;
  
  let statusText = "";
  let statusColor = "var(--text-muted)";
  if (t.status === "completed") { statusText = "Terminé (Accepté)"; statusColor = "var(--success)"; }
  else if (t.status === "refused") { statusText = "Refusé"; statusColor = "var(--danger)"; }
  else if (t.status === "cancelled") { statusText = "Annulé"; statusColor = "var(--text-muted)"; }

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <strong>Échange avec ${partnerName}</strong>
      <span style="font-size: 0.75rem; color: ${statusColor}; font-weight: bold;">${statusText}</span>
    </div>
    <div style="font-size: 0.82rem; color: var(--text-muted);">
      Offre initiale : <strong>${t.offerCoins || 0} ${sym}</strong> • Demandé : <strong>${t.requestCoins || 0} ${sym}</strong><br/>
      Date : ${new Date(t.timestamp || Date.now()).toLocaleDateString()} à ${new Date(t.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
    </div>
  `;
  return div;
}

async function executeTrade(tradeId, t) {
  const myId = AppState.user.id;
  const partnerId = t.senderId;

  const snap = await db.ref(`${CONFIG.DB_ROOT}/users`).once("value");
  const users = snap.val() || {};
  const me = users[myId];
  const partner = users[partnerId];

  if (!me || !partner) return showToast("Erreur lors du chargement des joueurs.", "error");

  const reqCoins = t.requestCoins || 0;
  const offCoins = t.offerCoins || 0;

  if (me.poyocoins < reqCoins) return showToast("Tu n'as pas assez de PoyoCoins pour cet échange !", "error");
  if (partner.poyocoins < offCoins) return showToast("Le partenaire n'a plus assez de PoyoCoins !", "error");

  me.poyocoins = me.poyocoins - reqCoins + offCoins;
  partner.poyocoins = partner.poyocoins - offCoins + reqCoins;

  me.collection = me.collection || {};
  partner.collection = partner.collection || {};

  const offerCards = Array.isArray(t.offerCards) ? t.offerCards : [];
  const requestCards = Array.isArray(t.requestCards) ? t.requestCards : [];

  for (const cid of offerCards) {
    if ((partner.collection[cid] || 0) <= 0) return showToast("Le partenaire ne possède plus les cartes offertes !", "error");
    partner.collection[cid]--;
    me.collection[cid] = (me.collection[cid] || 0) + 1;
  }

  for (const cid of requestCards) {
    if ((me.collection[cid] || 0) <= 0) return showToast("Tu ne possèdes plus les cartes demandées !", "error");
    me.collection[cid]--;
    partner.collection[cid] = (partner.collection[cid] || 0) + 1;
  }

  await db.ref(`${CONFIG.DB_ROOT}/users/${myId}`).update({ poyocoins: me.poyocoins, collection: me.collection });
  await db.ref(`${CONFIG.DB_ROOT}/users/${partnerId}`).update({ poyocoins: partner.poyocoins, collection: partner.collection });
  await db.ref(`${CONFIG.DB_ROOT}/trades/${tradeId}`).update({ status: "completed" });

  showToast("Échange réussi avec succès ! 🎉", "success");
}