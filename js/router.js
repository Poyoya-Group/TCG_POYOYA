import { AppState } from "./firebase-bridge.js";
import { renderBoosters } from "./modules/boosters.js";
import { renderCatalogue } from "./modules/catalogue.js";
import { renderEchanges } from "./modules/echanges.js";
import { renderEncheres } from "./modules/encheres.js";
import { renderEditeur } from "./modules/editeur.js";
import { renderParametres } from "./modules/parametres.js";

let currentTab = "boosters";

export function initRouter() {
  const navButtons = document.querySelectorAll(".nav-tab");
  
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  updateAdminNavVisibility();
  switchTab(currentTab);
}

export function switchTab(tabName) {
  currentTab = tabName;
  
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  
  const container = document.getElementById("app-content") || document.getElementById("main-content") || document.querySelector("main");
  if (!container) {
    alert("ERREUR : Impossible de trouver le conteneur principal dans index.html !");
    return;
  }
  
  container.innerHTML = "";

  try {
    switch (tabName) {
      case "boosters":
        renderBoosters(container);
        break;
      case "catalogue":
        renderCatalogue(container);
        break;
      case "echanges":
        renderEchanges(container);
        break;
      case "encheres":
        renderEncheres(container);
        break;
      case "duels":
        container.innerHTML = `<div class="panel-box"><h3>Duels</h3><p style="color: var(--text-muted);">Bientôt disponible !</p></div>`;
        break;
      case "classement":
        container.innerHTML = `<div class="panel-box"><h3>Classement</h3><p style="color: var(--text-muted);">Bientôt disponible !</p></div>`;
        break;
      case "editeur":
        if (AppState.isAdmin) renderEditeur(container);
        else switchTab("boosters");
        break;
      case "parametres":
        if (AppState.isAdmin) renderParametres(container);
        else switchTab("boosters");
        break;
      default:
        renderBoosters(container);
    }
  } catch (err) {
    console.error("Erreur :", err);
    container.innerHTML = `<div class="panel-box" style="border: 1px solid red; padding: 1rem;">
      <h3 style="color: #ef4444;">Erreur dans l'onglet ${tabName} :</h3>
      <pre style="color: white; margin-top: 0.5rem;">${err.stack || err.message}</pre>
    </div>`;
  }
}

export function refreshCurrentTab() {
  switchTab(currentTab);
}

export function updateAdminNavVisibility() {
  const adminGroup = document.getElementById("admin-nav-group");
  if (adminGroup) {
    adminGroup.classList.toggle("hidden", !AppState.isAdmin);
  }
}