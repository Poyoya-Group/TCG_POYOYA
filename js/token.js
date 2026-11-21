// Fonction serverless Vercel : échange le "code" Discord contre un access_token.
// Variables d'environnement à définir dans Vercel :
//   DISCORD_CLIENT_ID      (1428020477699424357)
//   DISCORD_CLIENT_SECRET  (Developer Portal > OAuth2 > Client Secret)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: "code manquant" });
  }

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ error: data });
    }
    return res.status(200).json({ access_token: data.access_token });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
