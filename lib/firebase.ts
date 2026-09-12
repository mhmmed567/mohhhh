import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAhoYYC7t1gU5janf55mMXtb5jCoF2faFs",
  authDomain: "devana-digital.firebaseapp.com",
  projectId: "devana-digital",
  storageBucket: "devana-digital.firebasestorage.app",
  messagingSenderId: "449990020811",
  appId: "1:449990020811:web:2ba32dac2252ee26dd954e"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;