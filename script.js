// 1. Vehicle Configurations Dictionary
const modelsByBrand = {
    "Cadillac": ["CT5", "Escalade"],
    "Chevrolet": ["Camaro", "Corvette"],
    "GMC": ["Yukon", "Sierra"]
};

// 2. Comprehensive Inventory Dataset 
// Here, OEM New and OEM Used are treated as entirely different items in the database.
const defaultInventory = {
    "Cadillac-CT5-2026-Brake Pads (OEM New)": { price: 1450, stock: 6 },
    "Cadillac-CT5-2026-Brake Pads (OEM Used)": { price: 870, stock: 4 },
    "Cadillac-Escalade-2026-Air Filter (OEM New)": { price: 250, stock: 15 },
    "Cadillac-Escalade-2026-Air Filter (OEM Used)": { price: 100, stock: 2 },
    "Chevrolet-Camaro-2026-Brake Pads (OEM New)": { price: 1250, stock: 5 },
    "Chevrolet-Camaro-2026-Brake Pads (OEM Used)": { price: 750, stock: 2 },
    "GMC-Yukon-2026-Brake Pads (OEM New)": { price: 1350, stock: 8 }
};

// Using a new storage key so your browser loads the fresh separated data
let inventory = JSON.parse(localStorage.getItem('aftersalesInventory')) || defaultInventory;

let cart = [];
let totalCost = 0;

// 3. Navigation Controls
function switchTab(tabId) {
    document.getElementById('shop').classList.remove('active');
    document.getElementById('inventory').classList.remove('active');
    document.getElementById('btn-shop').classList.remove('active');
    document.getElementById('btn-inventory').classList.remove('active');
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('active');

    updateShopDropdown();
    updateInventoryUI();
}

// 4. Model Populator
function handleBrandChange() {
    const selectedBrand = document.getElementById('brand').value;
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '';

    const models = modelsByBrand[selectedBrand] || [];
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.innerText = model;
        modelSelect.appendChild(option);
    });

    updateShopDropdown();
}

// 5. Parts Populator Matrix
function updateShopDropdown() {
    const partSelect = document.getElementById('part');
    const currentBrand = document.getElementById('brand').value;
    const currentModel = document.getElementById('model').value;
    const currentYear = document.getElementById('year').value;
    
    partSelect.innerHTML = ''; 
    let partsFound = false;
    
    for (const [dbKey, data] of Object.entries(inventory)) {
        const segments = dbKey.split('-');
        const invBrand = segments[0];
        const invModel = segments[1];
        const invYear = segments[2];
        const invPartName = segments.slice(3).join('-'); 
        
        if (invBrand === currentBrand && invModel === currentModel && invYear === currentYear) {
            partsFound = true;
            const option = document.createElement('option');
            
            option.value = dbKey; 
            option.setAttribute('data-price', data.price);
            
            if (data.stock > 0) {
                option.innerText = `${invPartName} (AED ${data.price}) - In Stock: ${data.stock}`;
            } else {
                option.innerText = `${invPartName} (OUT OF STOCK)`;
                option.disabled = true;
            }
            partSelect.appendChild(option);
        }
    }

    if (!partsFound) {
        const option = document.createElement('option');
        option.innerText = `No parts registered for this variant`;
        option.disabled = true;
        partSelect.appendChild(option);
    }
}

// 6. Shop Terminal Operations Logic
function addToCart() {
    const partSelect = document.getElementById('part');
    if (partSelect.options.length === 0 || partSelect.options[partSelect.selectedIndex].disabled) {
        alert("This selection is unavailable or out of stock!");
        return;
    }

    const dbItemKey = partSelect.value; 
    const segments = dbItemKey.split('-');
    const brand = segments[0];
    const model = segments[1];
    const year = segments[2];
    const partName = segments.slice(3).join('-');
    
    const price = parseInt(partSelect.options[partSelect.selectedIndex].getAttribute('data-price'));

    const countInCart = cart.filter(item => item.dbKey === dbItemKey).length;
    if (countInCart >= inventory[dbItemKey].stock) {
        alert(`Insufficient physical stock remaining.`);
        return;
    }

    const description = `${year} ${brand} ${model} ${partName}`;
    
    cart.push({ dbKey: dbItemKey, description: description, price: price });
    totalCost += price;
    cartUIUpdate();
}

function cartUIUpdate() {
    const cartItemsContainer = document.getElementById('cartItems');
    cartItemsContainer.innerHTML = '';
    
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `<span>${item.description}</span> 
                         <span>AED ${item.price} <button onclick="removeFromCart(${index})" style="margin-left:10px; color:red; cursor:pointer; background:none; border:none; font-weight:bold;">X</button></span>`;
        cartItemsContainer.appendChild(div);
    });

    document.getElementById('cartTotal').innerText = totalCost;
}

function removeFromCart(index) {
    totalCost -= cart[index].price;
    cart.splice(index, 1);
    cartUIUpdate();
}

function checkoutOrder() {
    if (cart.length === 0) {
        alert("Your processing sheet is empty!");
        return;
    }

    cart.forEach(item => {
        inventory[item.dbKey].stock -= 1;
    });

    localStorage.setItem('aftersalesInventory', JSON.stringify(inventory));

    alert(`Transaction Invoiced! Total: AED ${totalCost}`);
    cart = [];
    totalCost = 0;
    cartUIUpdate();
    updateShopDropdown();
}

// 7. Backend Administration Logic 
function updateInventoryUI() {
    const invContainer = document.getElementById('inventoryList');
    const searchFilter = document.getElementById('inventorySearch') ? document.getElementById('inventorySearch').value.toLowerCase() : "";
    invContainer.innerHTML = '';

    for (const [dbKey, data] of Object.entries(inventory)) {
        const segments = dbKey.split('-');
        const brand = segments[0];
        const model = segments[1];
        const year = segments[2];
        const partName = segments.slice(3).join('-');
        
        const displayName = `${brand} ${model} (${year}) ${partName}`;
        
        if (!displayName.toLowerCase().includes(searchFilter)) continue;
        
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `
            <div style="flex: 1; padding-right: 10px;">
                <strong style="vertical-align: middle;">${brand} ${model} (${year}) - ${partName}</strong>
                <div style="font-size: 14px; margin-top: 6px; color: #555;">
                    Current Price: <strong style="color: #007bff;">AED ${data.price}</strong> | Available Stock: <strong>${data.stock} units</strong>
                </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <div>
                    <input type="number" id="editPrice-${dbKey}" class="stock-input" placeholder="New Price" style="width: 95px;">
                    <button class="action-btn" style="width: auto; padding: 6px 12px; margin: 0; background-color: #17a2b8;" onclick="updatePrice('${dbKey}')">Set Price</button>
                </div>
                <div>
                    <input type="number" id="addStock-${dbKey}" class="stock-input" placeholder="Qty" style="width: 60px;">
                    <button class="action-btn" style="width: auto; padding: 6px 12px; margin: 0; background-color: #343a40;" onclick="addStock('${dbKey}')">Add</button>
                </div>
            </div>
        `;
        invContainer.appendChild(div);
    }
}

function updatePrice(dbKey) {
    const inputField = document.getElementById(`editPrice-${dbKey}`);
    const newPrice = parseInt(inputField.value);

    if (isNaN(newPrice) || newPrice < 0) {
        alert("Provide a valid numeric price value.");
        return;
    }

    inventory[dbKey].price = newPrice;
    localStorage.setItem('aftersalesInventory', JSON.stringify(inventory));
    
    inputField.value = ''; 
    updateInventoryUI();
    updateShopDropdown();
    alert(`Price updated successfully.`);
}

function addStock(dbKey) {
    const inputField = document.getElementById(`addStock-${dbKey}`);
    const qtyToAdd = parseInt(inputField.value);

    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
        alert("Provide a valid numeric quantity value.");
        return;
    }

    inventory[dbKey].stock += qtyToAdd;
    localStorage.setItem('aftersalesInventory', JSON.stringify(inventory));
    
    inputField.value = ''; 
    updateInventoryUI();
    updateShopDropdown();
    alert(`Stock configuration adjusted.`);
}

// Global Startup Initializers
window.onload = function() {
    if(document.getElementById('brand')) document.getElementById('brand').addEventListener('change', handleBrandChange);
    if(document.getElementById('model')) document.getElementById('model').addEventListener('change', updateShopDropdown);
    if(document.getElementById('year')) document.getElementById('year').addEventListener('change', updateShopDropdown);
    if(document.getElementById('inventorySearch')) document.getElementById('inventorySearch').addEventListener('input', updateInventoryUI);
    
    handleBrandChange();
};
