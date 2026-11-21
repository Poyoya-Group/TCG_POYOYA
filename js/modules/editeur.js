import { AppState, db, showToast } from "../firebase-bridge.js";
import { CONFIG } from "../config.js";
import { createCardElement } from "../card-renderer.js";

let draftCard = getNewCardTemplate();

function getNewCardTemplate() {
  return {
    id: "",
    number: "001",
    season: "s1",
    name: "NOUVELLE CARTE",
    rarity: "commune",
    type: "Créature",
    bgImage: "",
    charImage: "",
    holoEffect: "full",
    parallax: "strong",
    bgBlur: 0,
    popOut: true,
    description: "Description de la carte...",
    atk: 100,
    def: 100,
    artist: "Poyoya Group"
  };
}

export function renderEditeur(container) {
  const raritiesOptions = Object.values(AppState.settings.rarities)
    .map((r) => `<option value="${r.id}" ${draftCard.rarity === r.id ? "selected" : ""}>${r.name}</option>`)
    .join("");

  // Construire la liste des cartes existantes pour le sélecteur de modification
  const existingCards = AppState.cards || {};
  let cardSelectOptions = `<option value="NEW">➕ Créer une nouvelle carte</option>`;
  Object.values(existingCards).forEach((c) => {
    cardSelectOptions += `<option value="${c.id}" ${draftCard.id === c.id ? "selected" : ""}>[#${c.number}] ${c.name} (${c.rarity})</option>`;
  });

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start;">
      <div class="panel-box">
        <!-- SÉLECTEUR DE CARTE (CRÉATION OU MODIFICATION) -->
        <div style="background: var(--bg-card); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center;">
          <div style="flex: 1;" class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.8rem; margin-bottom: 2px;">Mode Éditeur / Sélection</label>
            <select id="ed-select-mode">${cardSelectOptions}</select>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: flex-end; padding-top: 18px;">
            <button class="btn-primary" id="btn-save-card"><i class="fa-solid fa-floppy-disk"></i> Enregistrer</button>
            <button class="btn-danger ${!draftCard.id ? "hidden" : ""}" id="btn-delete-card"><i class="fa-solid fa-trash"></i> Supprimer</button>
          </div>
        </div>

        <div class="section-header" style="margin-bottom: 1rem;">
          <h3 id="editor-panel-title">${draftCard.id ? "Modification : " + draftCard.name : "Création d'une carte"}</h3>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Nom de la carte</label>
            <input type="text" id="ed-name" value="${draftCard.name}" />
          </div>
          <div class="form-group">
            <label>Numéro (#)</label>
            <input type="text" id="ed-number" value="${draftCard.number}" />
          </div>
          <div class="form-group">
            <label>Rareté</label>
            <select id="ed-rarity">${raritiesOptions}</select>
          </div>
          <div class="form-group">
            <label>Type de carte</label>
            <select id="ed-type">
              <option value="Créature" ${draftCard.type === "Créature" ? "selected" : ""}>Créature</option>
              <option value="Sort" ${draftCard.type === "Sort" ? "selected" : ""}>Sort</option>
              <option value="Terrain" ${draftCard.type === "Terrain" ? "selected" : ""}>Terrain</option>
            </select>
          </div>
        </div>

        <h4 style="margin: 1rem 0 0.5rem; font-size: 0.9rem; color: var(--text-muted);">Images & Visuels</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Fond de carte</label>
            <input type="file" id="ed-bg-file" accept="image/*" />
          </div>
          <div class="form-group">
            <label>Personnage détouré (PNG)</label>
            <input type="file" id="ed-char-file" accept="image/*" />
          </div>
        </div>

        <h4 style="margin: 1rem 0 0.5rem; font-size: 0.9rem; color: var(--text-muted);">Effets & Style 3D</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Effet Holo</label>
            <select id="ed-holo">
              <option value="full" ${draftCard.holoEffect === "full" ? "selected" : ""}>Holo arc-en-ciel</option>
              <option value="none" ${draftCard.holoEffect === "none" ? "selected" : ""}>Aucun (Mat)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Parallaxe 3D</label>
            <select id="ed-parallax">
              <option value="strong" ${draftCard.parallax === "strong" ? "selected" : ""}>Forte</option>
              <option value="medium" ${draftCard.parallax === "medium" ? "selected" : ""}>Moyenne</option>
              <option value="none" ${draftCard.parallax === "none" ? "selected" : ""}>Aucune</option>
            </select>
          </div>
          <div class="form-group">
            <label>Flou du fond (px)</label>
            <input type="range" id="ed-blur" min="0" max="15" value="${draftCard.bgBlur}" />
          </div>
          <div class="form-group" style="justify-content: flex-end; display: flex; flex-direction: column;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-top: 5px;">
              <input type="checkbox" id="ed-popout" ${draftCard.popOut ? "checked" : ""} style="width: 18px; height: 18px;" />
              Personnage dépassant du cadre (Pop-out)
            </label>
          </div>
        </div>

        <h4 style="margin: 1rem 0 0.5rem; font-size: 0.9rem; color: var(--text-muted);">Stats & Description</h4>
        <div class="form-group">
          <label>Description</label>
          <textarea id="ed-desc" rows="2">${draftCard.description}</textarea>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>ATK</label>
            <input type="number" id="ed-atk" value="${draftCard.atk}" />
          </div>
          <div class="form-group">
            <label>DEF</label>
            <input type="number" id="ed-def" value="${draftCard.def}" />
          </div>
          <div class="form-group">
            <label>Artiste</label>
            <input type="text" id="ed-artist" value="${draftCard.artist}" />
          </div>
        </div>
      </div>

      <div class="panel-box" style="text-align: center; position: sticky; top: 80px;">
        <h4 style="margin-bottom: 1rem;">Aperçu en direct</h4>
        <div id="ed-live-preview"></div>
      </div>
    </div>
  `;

  function updatePreview() {
    const preview = document.getElementById("ed-live-preview");
    if (!preview) return;
    preview.innerHTML = "";
    preview.appendChild(createCardElement(draftCard));
  }

  // Changement entre Nouvelle carte / Carte existante
  document.getElementById("ed-select-mode").addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "NEW") {
      draftCard = getNewCardTemplate();
    } else {
      const found = AppState.cards[val];
      if (found) {
        draftCard = structuredClone(found);
      }
    }
    renderEditeur(container); // Recharger l'éditeur avec la carte sélectionnée
  });

  function handleFileUpload(inputEl, key) {
    inputEl.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        draftCard[key] = reader.result;
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  handleFileUpload(document.getElementById("ed-bg-file"), "bgImage");
  handleFileUpload(document.getElementById("ed-char-file"), "charImage");

  document.getElementById("ed-name").addEventListener("input", (e) => { draftCard.name = e.target.value; updatePreview(); });
  document.getElementById("ed-number").addEventListener("input", (e) => { draftCard.number = e.target.value; updatePreview(); });
  document.getElementById("ed-rarity").addEventListener("change", (e) => { draftCard.rarity = e.target.value; updatePreview(); });
  document.getElementById("ed-type").addEventListener("change", (e) => { draftCard.type = e.target.value; updatePreview(); });
  document.getElementById("ed-holo").addEventListener("change", (e) => { draftCard.holoEffect = e.target.value; updatePreview(); });
  document.getElementById("ed-parallax").addEventListener("change", (e) => { draftCard.parallax = e.target.value; updatePreview(); });
  document.getElementById("ed-blur").addEventListener("input", (e) => { draftCard.bgBlur = Number(e.target.value); updatePreview(); });
  document.getElementById("ed-popout").addEventListener("change", (e) => { draftCard.popOut = e.target.checked; updatePreview(); });
  document.getElementById("ed-desc").addEventListener("input", (e) => { draftCard.description = e.target.value; updatePreview(); });
  document.getElementById("ed-atk").addEventListener("input", (e) => { draftCard.atk = Number(e.target.value); updatePreview(); });
  document.getElementById("ed-def").addEventListener("input", (e) => { draftCard.def = Number(e.target.value); updatePreview(); });
  document.getElementById("ed-artist").addEventListener("input", (e) => { draftCard.artist = e.target.value; updatePreview(); });

  // Bouton Enregistrer
  document.getElementById("btn-save-card").addEventListener("click", async () => {
    // Si la carte n'a pas d'ID, on génère un ID unique propre
    if (!draftCard.id) {
      draftCard.id = `card_${draftCard.season || "s1"}_${draftCard.number || Date.now()}`;
    }
    await db.ref(`${CONFIG.DB_ROOT}/cards/${draftCard.id}`).set(draftCard);
    showToast(`Carte "${draftCard.name}" enregistrée avec succès !`, "success");
    renderEditeur(container); // Actualiser le sélecteur
  });

  // Bouton Supprimer
  const deleteBtn = document.getElementById("btn-delete-card");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!draftCard.id) return;
      if (confirm(`Es-tu sûr de vouloir supprimer définitivement la carte "${draftCard.name}" ?`)) {
        await db.ref(`${CONFIG.DB_ROOT}/cards/${draftCard.id}`).remove();
        showToast("Carte supprimée !", "info");
        draftCard = getNewCardTemplate();
        renderEditeur(container);
      }
    });
  }

  updatePreview();
}