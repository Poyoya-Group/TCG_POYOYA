import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";
import { CONFIG } from "./config.js";

/**
 * Dans une Activité Discord, l'URL contient toujours ?frame_id=...
 * Dans un onglet de navigateur normal, non.
 */
export const isInDiscord = new URLSearchParams(window.location.search).has("frame_id");

/**
 * ⚠️ Ce patch s'exécute dès que ce fichier est chargé.
 * C'est pour ça que auth.js doit l'importer EN PREMIER : Firebase ouvre sa
 * connexion WebSocket très tôt, et elle doit déjà passer par le proxy Discord.
 *
 * Il faut le même mapping dans le Developer Portal :
 *   /firebase  ->  poyochat-default-rtdb.europe-west1.firebasedatabase.app
 */
if (isInDiscord) {
  const firebaseHost = new URL(CONFIG.FIREBASE.databaseURL).host;
  patchUrlMappings([{ prefix: "/firebase", target: firebaseHost }]);
}

let sdk = null;
export const discordContext = { guildId: null, channelId: null, instanceId: null };

export function getDiscordSdk() {
  return sdk;
}

function buildAvatarUrl(u) {
  if (u.avatar) {
    return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
  }
  const idx = Number((BigInt(u.id) >> BigInt(22)) % BigInt(6));
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

/**
 * Initialise l'Activité et renvoie l'utilisateur Discord { id, username, avatar }.
 * Renvoie null si on n'est pas dans Discord.
 */
export async function initDiscord() {
  if (!isInDiscord) return null;

  sdk = new DiscordSDK(CONFIG.DISCORD.CLIENT_ID);

  // Sans cet appel, Discord affiche son chargement à l'infini.
  await sdk.ready();

  discordContext.guildId = sdk.guildId;
  discordContext.channelId = sdk.channelId;
  discordContext.instanceId = sdk.instanceId;

  // 1) Demande l'autorisation (popup uniquement la toute première fois)
  const { code } = await sdk.commands.authorize({
    client_id: CONFIG.DISCORD.CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: CONFIG.DISCORD.SCOPES // ["identify"]
  });

  // 2) Échange du code contre un token (le client_secret reste côté serveur)
  const res = await fetch("/.proxy/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  if (!res.ok) {
    throw new Error(
      `Échange du token impossible (HTTP ${res.status}).\n` +
      `Vérifie que /api/token est déployé et que le mapping "/" du Developer Portal pointe vers ton site.`
    );
  }
  const { access_token } = await res.json();
  if (!access_token) throw new Error("Le serveur n'a pas renvoyé d'access_token.");

  // 3) Authentification auprès du SDK
  const auth = await sdk.commands.authenticate({ access_token });
  if (!auth || !auth.user) throw new Error("Authentification Discord refusée.");

  const u = auth.user;
  return {
    id: u.id,
    username: u.global_name || u.username,
    avatar: buildAvatarUrl(u)
  };
}
