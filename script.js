/**
 * OEM Parts Management System - Multi-Tenant Pro Edition
 */

// 1. Initialize Cloud Database Connection
const firebaseConfig = {
  apiKey: "AIzaSyBunX1zU77O4yYAtvehXZzeuX-AxV2v7wo",
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
let transactionHistory = []; 

let userDatabaseRef = null; 
let historyDatabaseRef = null; 

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
    renderHistoryUI(); 
}

// 5. Registration: Add Components
function addNewComponent() {
    const brand = document.getElementById('newBrand').value.trim().toUpperCase();
    const model = document.getElementById('newModel').value.trim().toUpperCase();
    const year = document.getElementById('newYear').value.trim();
    const condition = document.getElementById('newCondition').value.toUpperCase();
    const partName = document.getElementById('newPartName').value.trim().toUpperCase();
    
    const partNumber = document.getElementById('newPartNumber') ? document.getElementById('newPartNumber').value.trim().toUpperCase() : "N/A";
    const cost = document.getElementById('newCost') ? parseInt(document.getElementById('newCost').value, 10) : 0; 
    
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

    inventory[newDbKey] = { price: price, cost: cost, stock: stock, partNumber: partNumber };
    pushStateToCloud();

    document.getElementById('newBrand').value = '';
    document.getElementById('newModel').value = '';
    document.getElementById('newYear').value = '';
    document.getElementById('newPartName').value = '';
    document.getElementById('newPrice').value = '';
    document.getElementById('newStock').value = '';
    if(document.getElementById('newPartNumber')) document.getElementById('newPartNumber').value = '';
    if(document.getElementById('newCost')) document.getElementById('newCost').value = '';
    
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
            
            const pnDisplay = data.partNumber && data.partNumber !== "N/A" ? ` [PN: ${data.partNumber}]` : "";
            
            if (data.stock > 0) {
                option.innerText = `${item.partName}${pnDisplay} (AED ${data.price}) - Stock: ${data.stock}`;
            } else {
                option.innerText = `${item.partName}${pnDisplay} (OUT OF STOCK)`;
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

// 8. Transaction Logics
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

function addCustomCharge() {
    const name = document.getElementById('customChargeName').value.trim();
    const amount = parseInt(document.getElementById('customChargeAmount').value, 10);
    
    if (!name || isNaN(amount) || amount <= 0) {
        return alert("Please enter a valid description and amount for the charge.");
    }

    cart.push({ dbKey: null, description: `[FEE] ${name}`, price: amount });
    totalCost += amount;
    renderCartUI();

    document.getElementById('customChargeName').value = '';
    document.getElementById('customChargeAmount').value = '';
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
    
    // Deduct Stock
    cart.forEach(item => { 
        if (item.dbKey && inventory[item.dbKey] && inventory[item.dbKey].stock > 0) {
            inventory[item.dbKey].stock -= 1; 
        }
    });
    pushStateToCloud();

    // UPDATED: Push transaction securely to Firebase to prevent array corruption
    const timestamp = new Date().toLocaleString();
    const newTransaction = {
        date: timestamp,
        orderTime: Date.now(), // Added so we can sort properly after reloading
        items: cart.map(c => `${c.description} - AED ${c.price}`),
        total: totalCost
    };
    
    if (historyDatabaseRef) {
        historyDatabaseRef.push(newTransaction); // .push() forces a permanent cloud save
    }
    
    alert(`Transaction Invoiced! Total: AED ${totalCost}`);
    cart = []; totalCost = 0;
    renderCartUI();
}

// 9. Management Matrix Engine
function updateInventoryUI() {
    const container = document.getElementById('inventoryList');
    if (!container) return;
    const filter = document.getElementById('inventorySearch').value.toLowerCase();
    container.innerHTML = '';

    for (const [dbKey, data] of Object.entries(inventory)) {
        const item = parseDbKey(dbKey);
        const matchString = `${item.brand} ${item.model} ${item.year} ${item.condition} ${item.partName}`.toLowerCase();
        if (!matchString.includes(filter)) continue;
        
        const pnDisplay = data.partNumber && data.partNumber !== "N/A" ? ` [PN: ${data.partNumber}]` : "";
        
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `
            <div style="flex: 1;">
                <strong>${item.brand} ${item.model} (${item.year}) - ${item.partName}${pnDisplay}</strong>
                <div style="font-size: 13px; margin-top: 6px; color: #666;">
                    Condition: <span style="font-weight:bold; color:var(--dark);">${item.condition}</span> | 
                    Cost: <span style="font-weight:bold; color:var(--danger);">AED ${data.cost || 0}</span> | 
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
                <div>
                    <button class="action-btn btn-delete" data-update="delete" data-key="${dbKey}" style="background-color: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

// History UI Engine
function renderHistoryUI() {
    const container = document.getElementById('historyList');
    if (!container) return;
    container.innerHTML = '';
    
    if (transactionHistory.length === 0) {
        container.innerHTML = '<p style="color: #666;">No past transactions found.</p>';
        return;
    }

    transactionHistory.forEach(tx => {
        const div = document.createElement('div');
        div.className = 'row-item';
        div.style.display = 'block'; 
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 8px;">
                <strong>${tx.date}</strong>
                <strong style="color: var(--primary);">Total: AED ${tx.total}</strong>
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #444;">
                ${tx.items.map(i => `<li>${i}</li>`).join('')}
            </ul>
        `;
        container.appendChild(div);
    });
}

// UPDATED: Completely removes history from the cloud database node
function clearHistory() {
    if (confirm("WARNING: Are you sure you want to permanently delete all transaction history?")) {
        if (historyDatabaseRef) {
            historyDatabaseRef.remove(); 
        }
        transactionHistory = [];
        renderHistoryUI();
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

function deletePart(dbKey) {
    if (confirm("WARNING: Are you sure you want to permanently delete this part from the registry?")) {
        delete inventory[dbKey]; 
        pushStateToCloud();      
    }
}

// 10. Core Runtime Hook 
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const loginError = document.getElementById('loginError');

    auth.onAuthStateChanged((user) => {
        if (user) {
            loginScreen.style.display = 'none';
            mainApp.style.display = 'block';

            userDatabaseRef = db.ref('tenant_databases/' + user.uid);
            historyDatabaseRef = db.ref('tenant_history/' + user.uid); 

            userDatabaseRef.on('value', (snapshot) => {
                inventory = snapshot.val() || {};
                refreshShopDropdowns();
                updateInventoryUI();
            });

            // UPDATED: Fetches cloud data and forces it into a strict array for sorting and rendering
            historyDatabaseRef.on('value', (snapshot) => {
                const data = snapshot.val();
                transactionHistory = [];
                if (data) {
                    Object.keys(data).forEach(key => {
                        transactionHistory.push(data[key]);
                    });
                    // Sort newest items to the top
                    transactionHistory.sort((a, b) => b.orderTime - a.orderTime);
                }
                renderHistoryUI();
            });

        } else {
            loginScreen.style.display = 'block';
            mainApp.style.display = 'none';
            if (userDatabaseRef) userDatabaseRef.off(); 
            if (historyDatabaseRef) historyDatabaseRef.off(); 
            userDatabaseRef = null;
            historyDatabaseRef = null;
            inventory = {};
            transactionHistory = [];
        }
    });

    document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value;
        loginError.style.display = 'none';
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
            loginError.style.display = 'block';
            loginError.innerText = err.message;
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        });
    });

    document.getElementById('addNewPartBtn').addEventListener('click', addNewComponent);
    document.getElementById('brand').addEventListener('change', updateAvailableParts);
    document.getElementById('model').addEventListener('change', updateAvailableParts);
    document.getElementById('year').addEventListener('change', updateAvailableParts);
    document.getElementById('condition').addEventListener('change', updateAvailableParts);
    document.getElementById('addToCartBtn').addEventListener('click', addToCart);
    document.getElementById('checkoutBtn').addEventListener('click', checkoutOrder);
    document.getElementById('inventorySearch').addEventListener('input', updateInventoryUI);
    
    document.getElementById('addCustomChargeBtn').addEventListener('click', addCustomCharge);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

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
        if (action === 'delete') deletePart(targetKey); 
    });
});
