import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "./firebaseConfig.js";

function getUser() {
  return auth.currentUser;
}

function favoritesRef(uid) {
  return collection(db, "users", uid, "favorites");
}

function timeValue(value) {
  if (!value) return 0;

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

export async function enviarFavoritoParaNuvem(item) {
  const user = getUser();

  if (!user) {
    alert(
      "FAVORITO NÃO ENVIADO\\n\\n" +
      "Firebase não encontrou usuário autenticado."
    );
    return false;
  }

  if (!item?.id) {
    alert(
      "FAVORITO NÃO ENVIADO\\n\\n" +
      "O favorito não possui ID."
    );
    return false;
  }

  const caminho = "users/" + user.uid + "/favorites/" + item.id;

  try {
    await setDoc(
      doc(favoritesRef(user.uid), item.id),
      {
        ...item,
        syncedAt: serverTimestamp()
      },
      { merge: true }
    );

    console.log(
      "[Firebase Sync] Item enviado:",
      item.id
    );

    alert(
      "FAVORITO ENVIADO PARA O FIRESTORE\\n\\n" +
      caminho
    );

    return true;

  } catch (error) {
    console.error(
      "[Firebase Sync] ERRO AO ENVIAR FAVORITO:",
      error
    );

    alert(
      "ERRO AO ENVIAR FAVORITO\\n\\n" +
      "Código: " + (error.code || "sem código") + "\\n\\n" +
      "Mensagem: " + (error.message || error)
    );

    throw error;
  }
}

export async function removerFavoritoDaNuvem(id) {
  const user = getUser();

  if (!user || !id) return false;

  await deleteDoc(
    doc(favoritesRef(user.uid), id)
  );

  console.log(
    "[Firebase Sync] Item removido:",
    id
  );

  return true;
}

export async function sincronizarFavoritos(localItems = []) {
  const user = getUser();

  if (!user) {
    return localItems;
  }

  const ref = favoritesRef(user.uid);
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

    const localTime = timeValue(
      item.updatedAt || item.createdAt
    );

    const cloudTime = timeValue(
      cloudItem.updatedAt || cloudItem.createdAt
    );

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
    "[Firebase Sync] Favoritos/anotações:",
    result.length
  );

  return result;
}
