// js/firebase.js

// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAC3qCkDfdS2X8YA6deg01lXif7qAStfQQ",
  authDomain: "neostore-81b57.firebaseapp.com",
  projectId: "neostore-81b57",
  storageBucket: "neostore-81b57.firebasestorage.app",
  messagingSenderId: "760637387702",
  appId: "1:760637387702:web:3c7c231c34a3513d1a4717"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getFirestore(app);

// Cloudinary
const CLOUDINARY_CLOUD_NAME = "diqrjgobk";
const CLOUDINARY_UPLOAD_PRESET = "starcode";

// Export everything
export {
  auth,
  db,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET
};