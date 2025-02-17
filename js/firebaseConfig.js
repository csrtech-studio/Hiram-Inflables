// js/firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCG3Jbz5ArQ2NkyU1qbpy5vUwsEWab6ty4",
  authDomain: "e-commerce-f1820.firebaseapp.com",
  projectId: "e-commerce-f1820",
  storageBucket: "e-commerce-f1820.appspot.com",
  messagingSenderId: "511457956407",
  appId: "1:511457956407:web:6671ee033458f3ba9225b2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore y exportar
export const db = getFirestore(app);
export const auth = getAuth(app);

