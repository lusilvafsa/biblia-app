import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "./firebaseConfig.js";

function getUser() {
  return auth.currentUser;
}

function userRoot(uid) {
  return doc(db, "users", uid);
}

function favoritesCollection(uid) {
  return collection(userRoot(uid), "favorites");
}

function progressDocument(uid) {
  return doc(userRoot(uid), "progress", "current");
}

function statsDocument(uid) {
  return doc(userRoot(uid), "stats", "current");
}

/* =========================
   FAVORITOS / ANOTAÇÕES
   ========================= */

export async function sincronizarFavoritosComNuvem(localItems = []) {
  const user = getUser();

  if (!user) {
    console.log("[Firebase Sync] Usuário não autenticado.");
    return localItems;
  }

  const ref = favoritesCollection(user.uid);
  const snapshot = await getDocs(ref);

  const cloudItems = [];

  snapshot.forEach((item) => {
    cloudItems.push({
      id: item.id,
      ...item.data()
    });
  });

  const merged = new Map();

  for (const item of cloudItems) {
    merged.set(item.id, item);
  }

  for (const item of localItems) {
    const cloudItem = merged.get(item.id);

    if (!cloudItem) {
      merged.set(item.id, item);
      continue;
    }

    const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
    const cloudTime = new Date(
      cloudItem.updatedAt || cloudItem.createdAt || 0
    ).getTime();

    if (localTime >= cloudTime) {
      merged.set(item.id, item);
    }
  }

  const result = Array.from(merged.values());

  for (const item of result) {
    await setDoc(
      doc(ref, item.id),
      {
        ...item,
        syncedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  console.log(
    "[Firebase Sync] Favoritos/anotações sincronizados:",
    result.length
  );

  return result;
}

/* =========================
   PROGRESSO
   ========================= */

export async function sincronizarProgressoComNuvem(localProgress) {
  const user = getUser();

  if (!user) {
    console.log("[Firebase Sync] Usuário não autenticado.");
    return localProgress;
  }

  const ref = progressDocument(user.uid);
  const snapshot = await getDoc(ref);

  const cloudProgress = snapshot.exists()
    ? snapshot.data()
    : null;

  if (!cloudProgress) {
    await setDoc(
      ref,
      {
        ...localProgress,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    console.log("[Firebase Sync] Progresso enviado para a nuvem.");
    return localProgress;
  }

  const localDate = new Date(localProgress.updatedAt || 0).getTime();
  const cloudDate = cloudProgress.updatedAt?.toDate
    ? cloudProgress.updatedAt.toDate().getTime()
    : new Date(cloudProgress.updatedAt || 0).getTime();

  if (localDate >= cloudDate) {
    await setDoc(
      ref,
      {
        ...localProgress,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    return localProgress;
  }

  return {
    book: typeof cloudProgress.book === "number"
      ? cloudProgress.book
      : 0,

    chapter: typeof cloudProgress.chapter === "number"
      ? cloudProgress.chapter
      : 0,

    verse: typeof cloudProgress.verse === "number"
      ? cloudProgress.verse
      : 0
  };
}

/* =========================
   ESTATÍSTICAS
   ========================= */

export async function sincronizarEstatisticasComNuvem(localStats) {
  const user = getUser();

  if (!user) {
    console.log("[Firebase Sync] Usuário não autenticado.");
    return localStats;
  }

  const ref = statsDocument(user.uid);
  const snapshot = await getDoc(ref);

  const cloudStats = snapshot.exists()
    ? snapshot.data()
    : null;

  if (!cloudStats) {
    await setDoc(
      ref,
      {
        ...localStats,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    console.log("[Firebase Sync] Estatísticas enviadas para a nuvem.");
    return localStats;
  }

  const readVerses = Array.from(
    new Set([
      ...(Array.isArray(cloudStats.readVerses)
        ? cloudStats.readVerses
        : []),
      ...(Array.isArray(localStats.readVerses)
        ? localStats.readVerses
        : [])
    ])
  );

  const audioVerses = Array.from(
    new Set([
      ...(Array.isArray(cloudStats.audioVerses)
        ? cloudStats.audioVerses
        : []),
      ...(Array.isArray(localStats.audioVerses)
        ? localStats.audioVerses
        : [])
    ])
  );

  const prayerCount = Math.max(
    Number(cloudStats.prayerCount) || 0,
    Number(localStats.prayerCount) || 0
  );

  const merged = {
    readVerses,
    audioVerses,
    prayerCount
  };

  await setDoc(
    ref,
    {
      ...merged,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  console.log("[Firebase Sync] Estatísticas sincronizadas.");

  return merged;
}
