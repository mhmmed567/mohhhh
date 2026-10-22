import "server-only";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function almEnabled() {
  return process.env.ALM_REWARDS_ENABLED === "true";
}

function serverApp() {
  const existing = getApps().find((app) => app.name === "hammar-server");
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return initializeApp(
    {
      credential: raw ? cert(JSON.parse(raw)) : applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || "devana-digital",
    },
    "hammar-server",
  );
}

export function serverAuth() {
  return getAuth(serverApp());
}

export function orderDatabase() {
  return getFirestore(serverApp());
}

// Never use the storefront database for reward ledgers. Its client rules are
// managed outside this repository; the separate database has deny-all rules.
export function rewardDatabase() {
  const databaseId = process.env.ALM_FIRESTORE_DATABASE_ID || "alm-rewards";
  if (databaseId === "(default)")
    throw new Error("ALM requires a private named database.");
  return getFirestore(serverApp(), databaseId);
}
