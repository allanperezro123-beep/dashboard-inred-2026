import { getApp, getApps, initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'dashboard-tickets-operaciones',
  appId: '1:637963953858:web:1fa0150bee9f4fe87dbd5b',
  storageBucket: 'dashboard-tickets-operaciones.firebasestorage.app',
  apiKey: 'AIzaSyBBfBfT4o10DM4d_bSImUgIJanCEtwVziE',
  authDomain: 'dashboard-tickets-operaciones.firebaseapp.com',
  messagingSenderId: '637963953858',
  measurementId: 'G-19WQ8NZ5T6',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseStorage = getStorage(app);
