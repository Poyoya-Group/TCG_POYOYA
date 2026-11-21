export function renderDuels(container) {
  container.innerHTML = `
    <div class="panel-box section-header">
      <div>
        <h3>Duels</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Trois terrains, cinq tours : gagnez 2 terrains sur 3.</p>
      </div>
      <input type="text" placeholder="Défier un joueur : cherchez son nom..." style="width: 280px;" />
    </div>
    <div class="form-grid">
      <div class="panel-box" style="border-color: var(--success); cursor: pointer;">
        <h4><i class="fa-solid fa-compass" style="color: var(--success);"></i> Tutoriel</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.4rem;">Un duel guidé contre le Maître des duels pour apprendre les règles.</p>
      </div>
      <div class="panel-box" style="cursor: pointer;">
        <h4><i class="fa-solid fa-robot" style="color: var(--primary-color);"></i> Entraînement contre l'IA</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.4rem;">Avec votre deck de 15 cartes, sans récompense ni enjeu.</p>
      </div>
      <div class="panel-box" style="cursor: pointer;">
        <h4><i class="fa-solid fa-shield" style="color: var(--danger);"></i> Défier un joueur</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.4rem;">Affrontez un joueur du serveur en duel asynchrone.</p>
      </div>
    </div>
  `;
}