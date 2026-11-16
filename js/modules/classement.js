import { AppState } from "../firebase-bridge.js";

export function renderClassement(container) {
  container.innerHTML = `
    <div class="panel-box section-header">
      <strong>Saison 1 • Classement des joueurs</strong>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-primary">Complétion</button>
        <button class="btn-secondary">Boosters ouverts</button>
        <button class="btn-secondary">Cartes au total</button>
      </div>
    </div>
    <div class="panel-box" style="text-align: center; padding: 3rem;">
      <img src="${AppState.user?.avatar || ""}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid var(--gold-text);" />
      <h3 style="margin-top: 0.75rem;">${AppState.user?.username || "Joueur"} <span class="badge" style="position: static; background: var(--primary-color);">VOUS</span></h3>
      <p style="color: var(--text-muted); margin-top: 0.3rem;">1er du classement POYOYA</p>
    </div>
  `;
}