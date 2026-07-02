const modelsByBrand = { "Cadillac": ["CT5", "Escalade"], "Chevrolet": ["Camaro", "Corvette"], "GMC": ["Yukon", "Sierra"] };
let inventory = JSON.parse(localStorage.getItem('shopInventory')) || {
    "Chevrolet-Camaro-2026-Brake Pads": { price: 1250, stock: 5 },
    "Chevrolet-Camaro-2026-Oil Filter": { price: 110, stock: 12 }
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.navbar button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('active');
    if(tabId === 'inventory') updateInventoryUI();
}

function handleBrandChange() {
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model');
    model.innerHTML = '';
    (modelsByBrand[brand] || []).forEach(m => {
        model.innerHTML += `<option value="${m}">${m}</option>`;
    });
    updateShopDropdown();
}

function updateShopDropdown() {
    const b = document.getElementById('brand').value, m = document.getElementById('model').value, y = document.getElementById('year').value;
    const partSelect = document.getElementById('part');
    partSelect.innerHTML = '';
    for(let key in inventory) {
        if(key.includes(`${b}-${m}-${y}`)) {
            partSelect.innerHTML += `<option value="${key}">${key.split('-')[3]} (Stock: ${inventory[key].stock})</option>`;
        }
    }
}

function addToCart() {
    const key = document.getElementById('part').value;
    if(key && inventory[key].stock > 0) {
        inventory[key].stock--;
        localStorage.setItem('shopInventory', JSON.stringify(inventory));
        updateShopDropdown();
        alert("Added to order!");
    } else { alert("Out of stock or none selected."); }
}

function updateInventoryUI() {
    const list = document.getElementById('inventoryList');
    list.innerHTML = '';
    for(let key in inventory) {
        list.innerHTML += `<div class="row-item">
            <div>${key.replace(/-/g, ' ')}</div>
            <div class="control-box">Stock: ${inventory[key].stock}
            <button onclick="addStock('${key}')">+</button></div>
        </div>`;
    }
}

function addStock(key) {
    inventory[key].stock++;
    localStorage.setItem('shopInventory', JSON.stringify(inventory));
    updateInventoryUI();
    updateShopDropdown();
}

window.onload = () => {
    const b = document.getElementById('brand');
    Object.keys(modelsByBrand).forEach(br => b.innerHTML += `<option value="${br}">${br}</option>`);
    ['2026','2025','2024'].forEach(y => document.getElementById('year').innerHTML += `<option value="${y}">${y}</option>`);
    handleBrandChange();
};
