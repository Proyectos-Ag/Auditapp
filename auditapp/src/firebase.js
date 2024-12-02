import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCqlmhaoE6cjvYjZ4QmzrD72yl522vTyWw",
    authDomain: "imagenes-auditapp.firebaseapp.com",
    projectId:"imagenes-auditapp",
    storageBucket:"imagenes-auditapp.appspot.com",
    measurementId:"676480788035",
    appId:"1:676480788035:web:17294749f32412d7e596f6"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
