const modelsByBrand = { "Cadillac": ["CT5", "Escalade"], "Chevrolet": ["Camaro", "Corvette"], "GMC": ["Yukon", "Sierra"] };
let inventory = JSON.parse(localStorage.getItem('shopInventory')) || {
    "Chevrolet-Camaro-2026-Brake Pads": { price: 1250, stock: 5 }
};

// These functions must be in the global scope
window.handleBrandChange = function() {
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model');
    model.innerHTML = '';
    (modelsByBrand[brand] || []).forEach(m => model.innerHTML += `<option value="${m}">${m}</option>`);
    updateShopDropdown();
};

window.updateShopDropdown = function() {
    const b = document.getElementById('brand').value, m = document.getElementById('model').value, y = document.getElementById('year').value;
    const partSelect = document.getElementById('part');
    partSelect.innerHTML = '';
    for(let key in inventory) {
        if(key.includes(`${b}-${m}-${y}`)) {
            partSelect.innerHTML += `<option value="${key}">${key.split('-')[3]} (AED ${inventory[key].price})</option>`;
        }
    }
};

window.addToCart = function() {
    alert("Added to order!");
};

window.checkoutOrder = function() {
    alert("Checkout processed!");
};

window.onload = function() {
    const b = document.getElementById('brand');
    Object.keys(modelsByBrand).forEach(br => b.innerHTML += `<option value="${br}">${br}</option>`);
    ['2026','2025'].forEach(y => document.getElementById('year').innerHTML += `<option value="${y}">${y}</option>`);
    handleBrandChange();
};
