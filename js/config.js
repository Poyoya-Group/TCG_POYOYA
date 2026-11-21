export const CONFIG = {
  // Identifiants de ton projet Firebase POYOYA
  FIREBASE: {
    apiKey: "AIzaSy...",
    authDomain: "poyochat.firebaseapp.com",
    databaseURL: "https://poyochat-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "poyochat",
    storageBucket: "poyochat.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  },

  // Application Discord (Developer Portal > OAuth2)
  DISCORD: {
    CLIENT_ID: "1428020477699424357",
    REDIRECT_URI: "https://literate-space-barnacle-jr9vqr9jwx6jcpp6p-5500.app.github.dev",
    SCOPES: "identify"
  },

  // Mets ton vrai ID Discord ici pour être admin direct
  SUPER_ADMINS: [
    "1046406575998382160", // <--- TON VRAI ID DISCORD ICI
    "DEV_ADMIN_LOCAL"
  ],

  DB_ROOT: "poyoya_tcg"
};