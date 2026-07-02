const modelsByBrand = {
    "Cadillac": ["CT5", "Escalade"],
    "Chevrolet": ["Camaro", "Corvette"],
    "GMC": ["Yukon", "Sierra"]
};

let inventory = JSON.parse(localStorage.getItem('shopInventory')) || {
    "Chevrolet-Camaro-2026-Brake Pads": { price: 1250, stock: 5 },
    "Cadillac-Escalade-2026-Brake Pads": { price: 1950, stock: 4 },
    "GMC-Yukon-2026-Alternator": { price: 1800, stock: 2 }
};

let cart = [];

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.navbar button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('active');
    if(tabId === 'inventory') updateInventoryUI();
}

function handleBrandChange() {
    const brand = document.getElementById('brand');
    const model = document.getElementById('model');
    model.innerHTML = '';
    modelsByBrand[brand.value].forEach(m => {
        let opt = document.createElement('option');
        opt.value = m; opt.innerText = m;
        model.appendChild(opt);
    });
    updateShopDropdown();
}

function updateInventoryUI() {
    const list = document.getElementById('inventoryList');
    const term = document.getElementById('searchInventory').value.toLowerCase();
    list.innerHTML = '';
    for(let key in inventory) {
        if(key.toLowerCase().includes(term)) {
            list.innerHTML += `<div class="row-item">
                <span>${key.replace(/-/g, ' ')}</span>
                <div>
                    AED <input type="number" id="p-${key}" value="${inventory[key].price}" style="width:60px">
                    <button onclick="updatePrice('${key}')">Set</button>
                    Stock: ${inventory[key].stock} 
                    <input type="number" id="s-${key}" placeholder="Qty" style="width:50px">
                    <button onclick="addStock('${key}')">+</button>
                </div>
            </div>`;
        }
    }
}

function updatePrice(key) {
    inventory[key].price = parseFloat(document.getElementById('p-' + key).value);
    localStorage.setItem('shopInventory', JSON.stringify(inventory));
    updateInventoryUI();
}

function addStock(key) {
    inventory[key].stock += parseInt(document.getElementById('s-' + key).value);
    localStorage.setItem('shopInventory', JSON.stringify(inventory));
    updateInventoryUI();
}

function updateShopDropdown() { /* Logic for dropdowns */ }

// Initialize
window.onload = () => {
    const b = document.getElementById('brand');
    Object.keys(modelsByBrand).forEach(br => b.innerHTML += `<option value="${br}">${br}</option>`);
    handleBrandChange();
};
