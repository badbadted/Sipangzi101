import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqB7fNRuzDyL5-E1f42joKR0qOp5489Go",
  authDomain: "sipangzi101.firebaseapp.com",
  projectId: "sipangzi101",
  storageBucket: "sipangzi101.firebasestorage.app",
  messagingSenderId: "736619169182",
  appId: "1:736619169182:web:2a99105199591fc407828f",
  measurementId: "G-X5PLY4H2PJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
