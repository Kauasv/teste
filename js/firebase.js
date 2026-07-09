import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWifeA7tQMw_HvZE5zgy8dWtyBHZWIEb4",
  authDomain: "cardapio-bolos-26264.firebaseapp.com",
  projectId: "cardapio-bolos-26264",
  storageBucket: "cardapio-bolos-26264.firebasestorage.app",
  messagingSenderId: "943163144883",
  appId: "1:943163144883:web:04c7a630e94010b4ec0ec6",
  measurementId: "G-VJZ43G9BWJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
};