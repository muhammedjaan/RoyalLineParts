const modelsByBrand = { "Cadillac": ["CT5", "Escalade"], "Chevrolet": ["Camaro", "Corvette"], "GMC": ["Yukon", "Sierra"] };
let inventory = JSON.parse(localStorage.getItem('shopInventory')) || {
    "Chevrolet-Camaro-2026-Brake Pads": { price: 1250, stock: 5 },
    "Chevrolet-Camaro-2026-Oil Filter": { price: 110, stock: 12 }
};
let cart = [];

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'inventory') updateInventoryUI();
}

function handleBrandChange() {
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model');
    model.innerHTML = '';
    modelsByBrand[brand].forEach(m => {
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
            list.innerHTML += `
            <div class="row-item">
                <div style="width: 40%; font-weight: bold;">${key.replace(/-/g, ' ')}</div>
                <div class="controls-group">
                    <div class="control-box">
                        <small>AED</small>
                        <input type="number" id="p-${key}" value="${inventory[key].price}" style="width:60px">
                        <button onclick="updatePrice('${key}')">Set</button>
                    </div>
                    <div class="control-box">
                        <small>Stock: ${inventory[key].stock}</small>
                        <input type="number" id="s-${key}" placeholder="Qty" style="width:50px">
                        <button onclick="addStock('${key}')">+</button>
                    </div>
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
    let qty = parseInt(document.getElementById('s-' + key).value);
    if(!isNaN(qty)) {
        inventory[key].stock += qty;
        localStorage.setItem('shopInventory', JSON.stringify(inventory));
        updateInventoryUI();
    }
}

// Initialization
window.onload = () => {
    const b = document.getElementById('brand');
    Object.keys(modelsByBrand).forEach(br => b.innerHTML += `<option value="${br}">${br}</option>`);
    ['2026','2025','2024','2023','2022','2021','2020'].forEach(y => document.getElementById('year').innerHTML += `<option value="${y}">${y}</option>`);
    handleBrandChange();
};
