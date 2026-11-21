import { AppState } from "./firebase-bridge.js";

export function createCardElement(card, options = {}) {
  const { quantity = null, interactive = true } = options;
  const rarity = AppState.settings.rarities?.[card.rarity] || {
    name: card.rarity || "Commune",
    color: "#9ca3af",
    holo: false
  };

  const hasHolo = card.holoEffect && card.holoEffect !== "none" ? true : rarity.holo;
  const popOutClass = card.popOut ? "pop-out" : "";
  const parallaxStrength = card.parallax === "strong" ? 18 : card.parallax === "medium" ? 10 : 0;

  const wrapper = document.createElement("div");
  wrapper.className = "tcg-card-wrapper";

  wrapper.innerHTML = `
    <div class="tcg-card ${hasHolo ? "has-holo" : ""} ${popOutClass}"
         style="--card-border: ${rarity.color}; --card-glow: ${rarity.color}66; --bg-blur: ${card.bgBlur || 0}px;">
      <div class="card-layer-bg" style="background-image: url('${card.bgImage || ""}')"></div>
      ${card.charImage ? `<img class="card-layer-char" src="${card.charImage}" alt="${card.name}" />` : ""}
      <div class="card-holo-overlay"></div>

      <div class="card-ui-overlay">
        <div class="card-header">
          <span class="card-title">${card.name || "Sans nom"}</span>
          ${quantity !== null ? `<span class="card-qty-badge">x${quantity}</span>` : ""}
        </div>

        <div class="card-footer">
          <div class="card-rarity-tag">
            <i class="fa-solid fa-crown"></i> ${rarity.name} • ${card.type || "Créature"}
          </div>
          <div class="card-stats-row">
            <span>⚔️ ATK ${card.atk ?? 0}</span>
            <span>🛡️ DEF ${card.def ?? 0}</span>
          </div>
          ${card.description ? `<div class="card-desc-box">${card.description}</div>` : ""}
          <div class="card-meta-bottom">
            <span>Illus. ${card.artist || "Poyoya Group"}</span>
            <span>${(card.season || "S1").toUpperCase()} • #${card.number || "001"}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  if (interactive) {
    const cardEl = wrapper.querySelector(".tcg-card");
    cardEl.addEventListener("mousemove", (e) => {
      const rect = cardEl.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 à 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      cardEl.style.transform = `rotateY(${nx * 22}deg) rotateX(${-ny * 22}deg)`;
      cardEl.style.setProperty("--holo-x", `${(nx + 0.5) * 100}%`);
      cardEl.style.setProperty("--holo-y", `${(ny + 0.5) * 100}%`);

      if (parallaxStrength > 0) {
        cardEl.style.setProperty("--px-bg-x", `${-nx * parallaxStrength}px`);
        cardEl.style.setProperty("--px-bg-y", `${-ny * parallaxStrength}px`);
        cardEl.style.setProperty("--px-char-x", `${nx * parallaxStrength * 1.4}px`);
        cardEl.style.setProperty("--px-char-y", `${ny * parallaxStrength * 1.4}px`);
      }
    });

    cardEl.addEventListener("mouseleave", () => {
      cardEl.style.transform = "rotateY(0deg) rotateX(0deg)";
      cardEl.style.setProperty("--px-bg-x", "0px");
      cardEl.style.setProperty("--px-bg-y", "0px");
      cardEl.style.setProperty("--px-char-x", "0px");
      cardEl.style.setProperty("--px-char-y", "0px");
    });
  }

  return wrapper;
}