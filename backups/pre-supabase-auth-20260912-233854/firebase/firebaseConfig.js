import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7HUhoG5uCJEVSJ4Cm332fdFeuwfvM1O8",
  authDomain: "biblia-de-estudos.firebaseapp.com",
  projectId: "biblia-de-estudos",
  storageBucket: "biblia-de-estudos.firebasestorage.app",
  messagingSenderId: "373152141681",
  appId: "1:373152141681:web:4408fa82e97f1c3f9926d0"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export {
  app,
  auth,
  db
};
