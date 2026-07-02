import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase dari firebase-applet-config.json
const firebaseConfig = {
  projectId: "project-d767032e-597e-4eaf-967",
  appId: "1:80881409015:web:0e8c75fd3a819588672cf2",
  apiKey: "AIzaSyDjzEDxQCuDpxmP-Hox3U41AsjAQOyoAbA",
  authDomain: "project-d767032e-597e-4eaf-967.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-91e23a5b-f29a-4f37-81e6-051369a1e64a",
  storageBucket: "project-d767032e-597e-4eaf-967.firebasestorage.app",
  messagingSenderId: "80881409015"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
