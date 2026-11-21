export const CONFIG = {
  // ⚠️ Garde tes VRAIES valeurs ici (apiKey, messagingSenderId, appId...)
  FIREBASE: {
    apiKey: "AIzaSy...",
    authDomain: "poyochat.firebaseapp.com",
    databaseURL: "https://poyochat-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "poyochat",
    storageBucket: "poyochat.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  },

  // Application Discord (Developer Portal)
  // Plus de REDIRECT_URI : une Activité n'en a pas besoin.
  DISCORD: {
    CLIENT_ID: "1428020477699424357",
    SCOPES: ["identify"] // tableau, requis par le SDK
  },

  // IDs Discord des admins du TCG
  SUPER_ADMINS: [
    "1046406575998382160" // Mat_x32
  ],

  DB_ROOT: "poyoya_tcg"
};
