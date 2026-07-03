// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBunX1zU7704yYAtvehXZzeuX-AxV2v7wo",
  authDomain: "royallinepartsdatabase.firebaseapp.com",
  databaseURL: "https://royallinepartsdatabase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "royallinepartsdatabase",
  storageBucket: "royallinepartsdatabase.firebasestorage.app",
  messagingSenderId: "977529905889",
  appId: "1:977529905889:web:7572790a140538aa774da0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const loginError = document.getElementById('loginError');

    // Handle Auth State
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginScreen.style.display = 'none';
            mainApp.style.display = 'block';
            
            // Sync Data
            db.ref('aftersalesInventory').on('value', (snapshot) => {
                const data = snapshot.val() || {};
                document.getElementById('inventoryList').innerHTML = JSON.stringify(data, null, 2);
            });
        } else {
            loginScreen.style.display = 'block';
            mainApp.style.display = 'none';
        }
    });

    // Login Action
    document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
            loginError.style.display = 'block';
            loginError.innerText = err.message;
        });
    });

    // Logout Action
    document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());
});
