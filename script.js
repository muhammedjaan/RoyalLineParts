/**
 * OEM Parts Management System - Multi-Tenant Pro Edition
 */

// 1. Initialize Cloud Database Connection
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

// 2. Local App Memory State
let inventory = {};
let cart = [];
let totalCost = 0;
let userDatabaseRef = null; // Dynamically holds the path to the logged-in user's data

// 3. Database Utility Handlers
function parseDbKey(dbKey) {
    const segments = dbKey.split('|');
    return {
        brand: segments[0], model: segments[1], year: segments[2],
        condition: segments[3], partName: segments[4]
    };
}

function safeFirebaseKey(keyString) {
    return keyString.replace(/[\.\#\$\[\]]/g, '-');
}

function pushStateToCloud() {
    if (userDatabaseRef) {
        userDatabaseRef.set(inventory);
    }
}

// 4. Interface View Controller
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
    refreshShopDropdowns();
    updateInventoryUI();
}

// 5. Registration: Add Components
function addNewComponent() {
    const brand = document.getElementById('newBrand').value.trim();
    const model = document.getElementById('newModel').value.trim();
    const year = document.getElementById('newYear').value.trim();
    const condition = document.getElementById('newCondition').value;
    const partName = document.getElementById('newPartName').value.trim();
    const price = parseInt(document.getElementById('newPrice').value, 10);
    const stock = parseInt(document.getElementById('newStock').value, 10);

    if (!brand || !model || !year || !partName || isNaN(price) || isNaN(stock)) {
        return alert("Action Denied: All configuration fields must be filled out correctly.");
    }

    const rawKey = `${brand}|${model}|${year}|${condition}|${partName}`;
    const newDbKey = safeFirebaseKey(rawKey);

    if (inventory[newDbKey]) {
        return alert("This exact component configuration already exists in the cloud registry!");
    }

    inventory[newDbKey] = { price: price, stock: stock };
    pushStateToCloud();

    document.getElementById('newBrand').value = '';
    document.getElementById('newModel').value = '';
    document.getElementById('newYear').value = '';
    document.getElementById('newPartName').value = '';
    document.getElementById('newPrice').value = '';
    document.getElementById('newStock').value = '';
    alert(`Success: ${brand} ${partName} added to live cloud engine!`);
}

// 6. Dynamic Select Builders
function refreshShopDropdowns() {
    const brands = new Set(), models = new Set(), years = new Set(), conditions = new Set();
    for (const key of Object.keys(inventory)) {
        const item = parseDbKey(key);
        brands.add(item.brand); models.add(item.model);
        years.add(item.year); conditions.add(item.condition);
    }
    populateSelectElement('brand', brands);
    populateSelectElement('model', models);
    populateSelectElement('year', years);
    populateSelectElement('condition', conditions);
    updateAvailableParts();
}

function populateSelectElement(elementId, dataSet) {
    const select = document.getElementById(elementId);
    const currentValue = select.value; 
    select.innerHTML = '';
    if (dataSet.size === 0) {
        select.innerHTML = '<option value="">-- Empty Registry --</option>';
        return;
    }
    dataSet.forEach(value => {
        const option = document.createElement('option');
        option.value = value; option.innerText = value;
        if (value === currentValue) option.selected = true;
        select.appendChild(option);
    });
}

function updateAvailableParts() {
    const partSelect = document.getElementById('part');
    const currentBrand = document.getElementById('brand').value;
    const currentModel = document.getElementById('model').value;
    const currentYear = document.getElementById('year').value;
    const currentCondition = document.getElementById('condition').value;
    
    partSelect.innerHTML = ''; 
    let partsFound = false;
    
    for (const [dbKey, data] of Object.entries(inventory)) {
        const item = parseDbKey(dbKey);
        if (item.brand === currentBrand && item.model === currentModel && item.year === currentYear && item.condition === currentCondition) {
            partsFound = true;
            const option = document.createElement('option');
            option.value = dbKey; 
            option.setAttribute('data-price', data.price);
            if (data.stock > 0) {
                option.innerText = `${item.partName} (AED ${data.price}) - Stock: ${data.stock}`;
            } else {
                option.innerText = `${item.partName} (OUT OF STOCK)`;
                option.disabled = true;
            }
            partSelect.appendChild(option);
        }
    }
    if (!partsFound) {
        const option = document.createElement('option');
        option.innerText = "No parts registered for this configuration";
        option.disabled = true;
        partSelect.appendChild(option);
    }
}

// 7. Transaction Logics
function addToCart() {
    const partSelect = document.getElementById('part');
    if (partSelect.options.length === 0 || partSelect.options[partSelect.selectedIndex].disabled) {
        return alert("Selected component is unavailable or out of stock.");
    }

    const dbItemKey = partSelect.value; 
    const item = parseDbKey(dbItemKey);
    const price = parseInt(partSelect.options[partSelect.selectedIndex].getAttribute('data-price'), 10);

    const countInCart = cart.filter(cItem => cItem.dbKey === dbItemKey).length;
    if (countInCart >= inventory[dbItemKey].stock) {
        return alert("Cannot append more items than physically remaining in workshop stock.");
    }

    cart.push({ dbKey: dbItemKey, description: `(${item.condition}) ${item.year} ${item.brand} ${item.model} ${item.partName}`, price: price });
    totalCost += price;
    renderCartUI();
}

function renderCartUI() {
    const container = document.getElementById('cartItems');
    container.innerHTML = '';
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `<span>${item.description}</span> <span>AED ${item.price} <button class="btn-remove" data-index="${index}">X</button></span>`;
        container.appendChild(div);
    });
    document.getElementById('cartTotal').innerText = totalCost;
}

function removeFromCart(index) {
    totalCost -= cart[index].price;
    cart.splice(index, 1);
    renderCartUI();
}

function checkoutOrder() {
    if (cart.length === 0) return alert("The order sheet is empty.");
    cart.forEach(item => { if (inventory[item.dbKey].stock > 0) inventory[item.dbKey].stock -= 1; });
    pushStateToCloud();
    alert(`Transaction Invoiced! Total: AED ${totalCost}`);
    cart = []; totalCost = 0;
    renderCartUI();
}

// 8. Management Matrix Engine
function updateInventoryUI() {
    const container = document.getElementById('inventoryList');
    if (!container) return;
    const filter = document.getElementById('inventorySearch').value.toLowerCase();
    container.innerHTML = '';

    for (const [dbKey, data] of Object.entries(inventory)) {
        const item = parseDbKey(dbKey);
        const matchString = `${item.brand} ${item.model} ${item.year} ${item.condition} ${item.partName}`.toLowerCase();
        if (!matchString.includes(filter)) continue;
        
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `
            <div style="flex: 1;">
                <strong>${item.brand} ${item.model} (${item.year}) - ${item.partName}</strong>
                <div style="font-size: 13px; margin-top: 6px; color: #666;">
                    Condition: <span style="font-weight:bold; color:var(--dark);">${item.condition}</span> | 
                    Price: <span style="font-weight:bold; color:var(--primary);">AED ${data.price}</span> | 
                    Stock: <strong>${data.stock}</strong>
                </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <div>
                    <input type="number" id="price-${dbKey}" class="stock-input" placeholder="AED">
                    <button class="action-btn btn-price" data-update="price" data-key="${dbKey}">Price</button>
                </div>
                <div>
                    <input type="number" id="stock-${dbKey}" class="stock-input" placeholder="Qty">
                    <button class="action-btn btn-stock" data-update="stock" data-key="${dbKey}">Stock</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

function updatePrice(dbKey) {
    const newPrice = parseInt(document.getElementById(`price-${dbKey}`).value, 10);
    if (isNaN(newPrice) || newPrice < 0) return alert("Invalid price.");
    inventory[dbKey].price = newPrice;
    pushStateToCloud();
}

function addStock(dbKey) {
    const delta = parseInt(document.getElementById(`stock-${dbKey}`).value, 10);
    if (isNaN(delta) || delta === 0) return alert("Invalid quantity.");
    inventory[dbKey].stock += delta;
    pushStateToCloud();
}

// 9. Core Runtime Hook (Multi-Tenant Auth Engine)
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const loginError = document.getElementById('loginError');

    // Monitor Account State
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginScreen.style.display = 'none';
            mainApp.style.display = 'block';

            // SECURE ROUTING: Mount the database branch unique to this account's UID
            userDatabaseRef = db.ref('tenant_databases/' + user.uid);

            userDatabaseRef.on('value', (snapshot) => {
                inventory = snapshot.val() || {};
                refreshShopDropdowns();
                updateInventoryUI();
            });
        } else {
            loginScreen.style.display = 'block';
            mainApp.style.display = 'none';
            if (userDatabaseRef) userDatabaseRef.off(); 
            userDatabaseRef = null;
            inventory = {};
        }
    });

    // Login Action
    document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value;
        loginError.style.display = 'none';
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
            loginError.style.display = 'block';
            loginError.innerText = err.message;
        });
    });

    // Logout Action
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        });
    });

    // App Bindings
    document.getElementById('addNewPartBtn').addEventListener('click', addNewComponent);
    document.getElementById('brand').addEventListener('change', updateAvailableParts);
    document.getElementById('model').addEventListener('change', updateAvailableParts);
    document.getElementById('year').addEventListener('change', updateAvailableParts);
    document.getElementById('condition').addEventListener('change', updateAvailableParts);
    document.getElementById('addToCartBtn').addEventListener('click', addToCart);
    document.getElementById('checkoutBtn').addEventListener('click', checkoutOrder);
    document.getElementById('inventorySearch').addEventListener('input', updateInventoryUI);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    document.getElementById('cartItems').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) removeFromCart(parseInt(e.target.dataset.index, 10));
    });

    document.getElementById('inventoryList').addEventListener('click', (e) => {
        if (!e.target.classList.contains('action-btn')) return;
        const action = e.target.dataset.update;
        const targetKey = e.target.dataset.key;
        if (action === 'price') updatePrice(targetKey);
        if (action === 'stock') addStock(targetKey);
    });
});
