// src/firebase.js


// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAIT9FdTjvu1kSUJNl5lb7wyZtU3cuuWK0",
    authDomain: "capitalrush-77e1a.firebaseapp.com",
    databaseURL: "https://capitalrush-77e1a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "capitalrush-77e1a",
    storageBucket: "capitalrush-77e1a.appspot.com",
    messagingSenderId: "494460990422",
    appId: "1:494460990422:web:d34947ee5894d3b83eaa77",
    measurementId: "G-JJWN43PQYC"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);

