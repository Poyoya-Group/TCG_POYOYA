import { AppState, db, showToast } from "../firebase-bridge.js";
import { CONFIG } from "../config.js";

let currentSubTab = "identity";

export function renderParametres(container) {
  const settings = AppState.settings;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; align-items: start;">
      <div class="panel-box" style="padding: 0.75rem;">
        <nav style="display: flex; flex-direction: column; gap: 0.35rem;" id="param-subtabs">
          <button class="nav-tab ${currentSubTab === "identity" ? "active" : ""}" data-sub="identity" style="width: 100%; justify-content: flex-start;"><i class="fa-solid fa-id-card"></i> Identité</button>
          <button class="nav-tab ${currentSubTab === "seasons" ? "active" : ""}" data-sub="seasons" style="width: 100%; justify-content: flex-start;"><i class="fa-solid fa-calendar-days"></i> Saisons</button>
          <button class="nav-tab ${currentSubTab === "core" ? "active" : ""}" data-sub="core" style="width: 100%; justify-content: flex-start;"><i class="fa-solid fa-cogs"></i> Core & Économie</button>
          <button class="nav-tab ${currentSubTab === "rates" ? "active" : ""}" data-sub="rates" style="width: 100%; justify-content: flex-start;"><i class="fa-solid fa-percent"></i> Raretés & Taux</button>
          <button class="nav-tab ${currentSubTab === "duels" ? "active" : ""}" data-sub="duels" style="width: 100%; justify-content: flex-start;"><i class="fa-solid fa-shield-halved"></i> Duels</button>
          <button class="nav-tab ${currentSubTab === "discord" ? "active" : ""}" data-sub="discord" style="width: 100%; justify-content: flex-start;"><i class="fa-brands fa-discord"></i> Discord & Admins</button>
          <button class="nav-tab ${currentSubTab === "twitch" ? "active" : ""}" data-sub="twitch" style="width: 100%; justify-content: flex-start;"><i class="fa-brands fa-twitch"></i> Twitch</button>
          <button class="nav-tab ${currentSubTab === "history" ? "active" : ""}" data-sub="history" style="width: 100%; justify-content: flex-start;"><i class="fa-solid fa-clock-rotate-left"></i> Historique</button>
        </nav>
      </div>

      <div class="panel-box" id="param-content-area"></div>
    </div>
  `;

  document.querySelectorAll("#param-subtabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSubTab = btn.dataset.sub;
      renderParametres(container);
    });
  });

  renderSubTabContent(document.getElementById("param-content-area"), settings);
}

function renderSubTabContent(area, settings) {
  if (currentSubTab === "identity") {
    const idt = settings.identity || {};
    area.innerHTML = `
      <div class="section-header">
        <h3>Identité du TCG</h3>
        <button class="btn-primary" id="save-identity"><i class="fa-solid fa-check"></i> Enregistrer</button>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Nom du TCG</label><input type="text" id="p-name" value="${idt.name || ""}" /></div>
        <div class="form-group"><label>Nom de la monnaie</label><input type="text" id="p-cname" value="${idt.currencyName || ""}" /></div>
        <div class="form-group"><label>Symbole monnaie</label><input type="text" id="p-csym" value="${idt.currencySymbol || ""}" /></div>
        <div class="form-group"><label>Couleur principale</label><input type="color" id="p-prime" value="${idt.primaryColor || "#1a9fcb"}" style="height: 40px;" /></div>
        <div class="form-group"><label>Couleur secondaire</label><input type="color" id="p-sec" value="${idt.secondaryColor || "#125487"}" style="height: 40px;" /></div>
      </div>
      <div class="form-group" style="margin-top: 1rem;"><label>Description</label><textarea id="p-desc" rows="3">${idt.description || ""}</textarea></div>
    `;
    document.getElementById("save-identity").addEventListener("click", async () => {
      await db.ref(`${CONFIG.DB_ROOT}/settings/identity`).update({
        name: document.getElementById("p-name").value,
        currencyName: document.getElementById("p-cname").value,
        currencySymbol: document.getElementById("p-csym").value,
        primaryColor: document.getElementById("p-prime").value,
        secondaryColor: document.getElementById("p-sec").value,
        description: document.getElementById("p-desc").value
      });
      showToast("Identité mise à jour avec succès !", "success");
    });

  } else if (currentSubTab === "core") {
    const core = settings.core || {};
    area.innerHTML = `
      <div class="section-header">
        <h3>Core & Économie</h3>
        <button class="btn-primary" id="save-core"><i class="fa-solid fa-check"></i> Enregistrer</button>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Prix d'un booster</label><input type="number" id="c-price" value="${core.boosterPrice || 100}" /></div>
        <div class="form-group"><label>Cartes par booster</label><input type="number" id="c-count" value="${core.cardsPerBooster || 5}" /></div>
        <div class="form-group"><label>Cooldown booster gratuit (min)</label><input type="number" id="c-cooldown" value="${core.freeBoosterCooldownMinutes || 240}" /></div>
        <div class="form-group"><label>Stock max de boosters</label><input type="number" id="c-max" value="${core.maxFreeBoosters || 100}" /></div>
      </div>
    `;
    document.getElementById("save-core").addEventListener("click", async () => {
      await db.ref(`${CONFIG.DB_ROOT}/settings/core`).update({
        boosterPrice: Number(document.getElementById("c-price").value),
        cardsPerBooster: Number(document.getElementById("c-count").value),
        freeBoosterCooldownMinutes: Number(document.getElementById("c-cooldown").value),
        maxFreeBoosters: Number(document.getElementById("c-max").value)
      });
      showToast("Réglages Core mis à jour !", "success");
    });

  } else if (currentSubTab === "rates") {
    const rarities = settings.rarities || {};
    let raritiesHtml = Object.values(rarities).map((r) => `
      <div class="panel-box" style="margin-bottom: 0.75rem; background: var(--bg-card);">
        <h4 style="color: ${r.color}; margin-bottom: 0.5rem;"><i class="fa-solid fa-crown"></i> ${r.name} (${r.id})</h4>
        <div class="form-grid">
          <div class="form-group"><label>Couleur du cadre</label><input type="color" value="${r.color}" data-rarity="${r.id}" data-field="color" class="r-input" style="height: 36px;" /></div>
          <div class="form-group"><label>Taux de drop (%)</label><input type="number" step="0.1" value="${r.dropRate}" data-rarity="${r.id}" data-field="dropRate" class="r-input" /></div>
          <div class="form-group"><label>Valeur de recyclage (${settings.identity?.currencySymbol || "P"})</label><input type="number" value="${r.recycleValue}" data-rarity="${r.id}" data-field="recycleValue" class="r-input" /></div>
        </div>
      </div>
    `).join("");

    area.innerHTML = `
      <div class="section-header">
        <h3>Raretés & Taux de drop</h3>
        <button class="btn-primary" id="save-rates"><i class="fa-solid fa-check"></i> Enregistrer les taux</button>
      </div>
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 5px;">${raritiesHtml}</div>
    `;

    document.getElementById("save-rates").addEventListener("click", async () => {
      const updatedRarities = { ...rarities };
      document.querySelectorAll(".r-input").forEach((input) => {
        const id = input.dataset.rarity;
        const field = input.dataset.field;
        let val = input.value;
        if (field === "dropRate" || field === "recycleValue") val = Number(val);
        updatedRarities[id][field] = val;
      });
      await db.ref(`${CONFIG.DB_ROOT}/settings/rarities`).set(updatedRarities);
      showToast("Taux et raretés mis à jour !", "success");
    });

  } else if (currentSubTab === "duels") {
    const duels = settings.duels || {};
    area.innerHTML = `
      <div class="section-header">
        <h3>Paramètres des Duels</h3>
        <button class="btn-primary" id="save-duels"><i class="fa-solid fa-check"></i> Enregistrer</button>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Taille du deck (cartes)</label><input type="number" id="d-size" value="${duels.deckSize || 15}" /></div>
        <div class="form-group"><label>Nombre de tours</label><input type="number" id="d-turns" value="${duels.turns || 5}" /></div>
        <div class="form-group"><label>Nombre de terrains</label><input type="number" id="d-lanes" value="${duels.lanes || 3}" /></div>
        <div class="form-group"><label>Récompense victoire (P)</label><input type="number" id="d-win" value="${duels.winReward || 50}" /></div>
        <div class="form-group"><label>Pénalité défaite (P)</label><input type="number" id="d-lose" value="${duels.loseReward || 10}" /></div>
      </div>
    `;
    document.getElementById("save-duels").addEventListener("click", async () => {
      await db.ref(`${CONFIG.DB_ROOT}/settings/duels`).update({
        deckSize: Number(document.getElementById("d-size").value),
        turns: Number(document.getElementById("d-turns").value),
        lanes: Number(document.getElementById("d-lanes").value),
        winReward: Number(document.getElementById("d-win").value),
        loseReward: Number(document.getElementById("d-lose").value)
      });
      showToast("Paramètres des duels mis à jour !", "success");
    });

  } else if (currentSubTab === "discord") {
    area.innerHTML = `
      <div class="section-header">
        <h3>Discord & Administrateurs</h3>
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        Les super-administrateurs principaux sont configurés directement dans <code>js/config.js</code> (via <code>SUPER_ADMINS</code>).
      </p>
      <div class="form-group">
        <label>ID Discord d'un administrateur à ajouter</label>
        <div style="display: flex; gap: 0.5rem;">
          <input type="text" id="new-admin-id" placeholder="Ex: 38291029384756" />
          <button class="btn-primary" id="btn-add-admin">Ajouter</button>
        </div>
      </div>
    `;
    document.getElementById("btn-add-admin").addEventListener("click", async () => {
      const id = document.getElementById("new-admin-id").value.trim();
      if (!id) return showToast("Entre un ID valide", "error");
      await db.ref(`${CONFIG.DB_ROOT}/settings/admins/${id}`).set(true);
      showToast(`Administrateur ${id} ajouté !`, "success");
    });

  } else if (currentSubTab === "seasons") {
    area.innerHTML = `
      <h3>Gestion des Saisons</h3>
      <p style="color: var(--text-muted); margin-top: 0.5rem; font-size: 0.9rem;">Créez et gérez les différentes saisons du TCG.</p>
    `;
  } else if (currentSubTab === "twitch") {
    area.innerHTML = `
      <h3>Intégration Twitch</h3>
      <p style="color: var(--text-muted); margin-top: 0.5rem; font-size: 0.9rem;">Configuration des alertes de stream et drops communautaires.</p>
    `;
  } else if (currentSubTab === "history") {
    area.innerHTML = `
      <h3>Historique & Logs</h3>
      <p style="color: var(--text-muted); margin-top: 0.5rem; font-size: 0.9rem;">Journal d'audit en temps réel de toutes les actions administratives.</p>
    `;
  }
}