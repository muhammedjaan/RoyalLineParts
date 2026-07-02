// 1. Vehicle Configurations Dictionary (Links models to their specific brands)
const modelsByBrand = {
    "Cadillac": ["CT5", "Escalade"],
    "Chevrolet": ["Camaro", "Corvette"],
    "GMC": ["Yukon", "Sierra"]
};

// 2. Comprehensive Inventory Dataset (All models, years 2020-2026, and specific pricing in AED)
const defaultInventory = {
    // --- CHEVROLET CAMARO ---
    "Chevrolet-Camaro-2026-Brake Pads": { price: 1250, stock: 5 },
    "Chevrolet-Camaro-2026-Oil Filter": { price: 110, stock: 12 },
    "Chevrolet-Camaro-2025-Brake Pads": { price: 1150, stock: 4 },
    "Chevrolet-Camaro-2025-Oil Filter": { price: 105, stock: 10 },
    "Chevrolet-Camaro-2024-Brake Pads": { price: 1050, stock: 6 },
    "Chevrolet-Camaro-2024-Oil Filter": { price: 95, stock: 15 },
    "Chevrolet-Camaro-2023-Brake Pads": { price: 980, stock: 3 },
    "Chevrolet-Camaro-2022-Brake Pads": { price: 920, stock: 4 },
    "Chevrolet-Camaro-2021-Brake Pads": { price: 850, stock: 5 },
    "Chevrolet-Camaro-2020-Brake Pads": { price: 800, stock: 7 },

    // --- CHEVROLET CORVETTE ---
    "Chevrolet-Corvette-2026-Brake Pads": { price: 2450, stock: 2 },
    "Chevrolet-Corvette-2026-Oil Filter": { price: 180, stock: 8 },
    "Chevrolet-Corvette-2025-Brake Pads": { price: 2300, stock: 3 },
    "Chevrolet-Corvette-2024-Brake Pads": { price: 2150, stock: 4 },
    "Chevrolet-Corvette-2023-Brake Pads": { price: 1950, stock: 2 },
    "Chevrolet-Corvette-2022-Brake Pads": { price: 1800, stock: 5 },
    "Chevrolet-Corvette-2021-Brake Pads": { price: 1700, stock: 3 },
    "Chevrolet-Corvette-2020-Brake Pads": { price: 1600, stock: 4 },

    // --- CADILLAC CT5 ---
    "Cadillac-CT5-2026-Brake Pads": { price: 1450, stock: 6 },
    "Cadillac-CT5-2026-Oil Filter": { price: 140, stock: 10 },
    "Cadillac-CT5-2025-Brake Pads": { price: 1350, stock: 5 },
    "Cadillac-CT5-2024-Brake Pads": { price: 1250, stock: 4 },
    "Cadillac-CT5-2023-Brake Pads": { price: 1150, stock: 6 },
    "Cadillac-CT5-2022-Brake Pads": { price: 1050, stock: 8 },
    "Cadillac-CT5-2021-Brake Pads": { price: 980, stock: 5 },
    "Cadillac-CT5-2020-Brake Pads": { price: 900, stock: 6 },

    // --- CADILLAC ESCALADE ---
    "Cadillac-Escalade-2026-Brake Pads": { price: 1950, stock: 4 },
    "Cadillac-Escalade-2026-Air Filter": { price: 260, stock: 10 },
    "Cadillac-Escalade-2025-Brake Pads": { price: 1850, stock: 3 },
    "Cadillac-Escalade-2025-Air Filter": { price: 240, stock: 8 },
    "Cadillac-Escalade-2024-Brake Pads": { price: 1750, stock: 5 },
    "Cadillac-Escalade-2023-Brake Pads": { price: 1650, stock: 4 },
    "Cadillac-Escalade-2022-Brake Pads": { price: 1550, stock: 6 },
    "Cadillac-Escalade-2021-Brake Pads": { price: 1400, stock: 4 },
    "Cadillac-Escalade-2020-Brake Pads": { price: 1300, stock: 5 },

    // --- GMC YUKON ---
    "GMC-Yukon-2026-Brake Pads": { price: 1350, stock: 8 },
    "GMC-Yukon-2026-Alternator": { price: 1800, stock: 2 },
    "GMC-Yukon-2025-Brake Pads": { price: 1250, stock: 6 },
    "GMC-Yukon-2024-Alternator": { price: 1650, stock: 3 },
    "GMC-Yukon-2023-Brake Pads": { price: 1150, stock: 5 },
    "GMC-Yukon-2022-Brake Pads": { price: 1050, stock: 7 },
    "GMC-Yukon-2021-Brake Pads": { price: 950, stock: 6 },
    "GMC-Yukon-2020-Brake Pads": { price: 880, stock: 8 },

    // --- GMC SIERRA ---
    "GMC-Sierra-2025-Brake Pads": { price: 1150, stock: 7 },
    "GMC-Sierra-2024-Brake Pads": { price: 1050, stock: 8 },
    "GMC-Sierra-2023-Brake Pads": { price: 980, stock: 10 },
    "GMC-Sierra-2022-Brake Pads": { price: 920, stock: 5 },
    "GMC-Sierra-2021-Brake Pads": { price: 850, stock: 6 },
    "GMC-Sierra-2020-Brake Pads": { price: 800, stock: 9 }
};

let inventory = JSON.parse(localStorage.getItem('shopInventory')) || defaultInventory;
let cart = [];
let totalCost = 0;

// 3. Navigation Controls (Handles switching tabs)
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

// 4. Model Populator (Changes the models dropdown based on selected Brand)
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

// 5. Parts Populator Matrix (Filters and drops parts matching Brand, Model, and Year)
function updateShopDropdown() {
    const partSelect = document.getElementById('part');
    const currentBrand = document.getElementById('brand').value;
    const currentModel = document.getElementById('model').value;
    const currentYear = document.getElementById('year').value;
    
    partSelect.innerHTML = ''; 
    let partsFound = false;
    
    for (const [dbKey, data] of Object.entries(inventory)) {
        const [invBrand, invModel, invYear, ...partNameArray] = dbKey.split('-');
        const invPartName = partNameArray.join('-');
        
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
        option.innerText = "No parts registered for this variant";
        option.disabled = true;
        partSelect.appendChild(option);
    }
}

// 6. Shop Terminal Operations Logic (Cart Management)
function addToCart() {
    const partSelect = document.getElementById('part');
    if (partSelect.options.length === 0 || partSelect.options[partSelect.selectedIndex].disabled) {
        alert("This selection is unavailable or out of stock!");
        return;
    }

    const condition = document.getElementById('condition').value;
    const dbItemKey = partSelect.value; 
    const [brand, model, year, ...partNameArray] = dbItemKey.split('-');
    const partName = partNameArray.join('-');
    const price = parseInt(partSelect.options[partSelect.selectedIndex].getAttribute('data-price'));

    const countInCart = cart.filter(item => item.dbKey === dbItemKey).length;
    if (countInCart >= inventory[dbItemKey].stock) {
        alert(`Insufficient inventory. Maximum stock limit hit.`);
        return;
    }

    const description = `${year} ${brand} ${model} ${partName} (${condition})`;
    
    cart.push({ dbKey: dbItemKey, description: description, price: price });
    totalCost += price;
    cartUIUpdate();
}

// UI Cart View Refresh Setup
function cartUIUpdate() {
    const cartItemsContainer = document.getElementById('cartItems');
    cartItemsContainer.innerHTML = '';
    
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `<span>${item.description}</span> 
                         <span>AED ${item.price} <button onclick="removeFromCart(${index})" style="margin-left:10px; color:red; cursor:pointer;">X</button></span>`;
        cartItemsContainer.appendChild(div);
    });

    document.getElementById('cartTotal').innerText = totalCost;
}

// Remove item from cart
function removeFromCart(index) {
    totalCost -= cart[index].price;
    cart.splice(index, 1);
    cartUIUpdate();
}

// Complete checkout processing
function checkoutOrder() {
    if (cart.length === 0) {
        alert("Your repair order card is empty!");
        return;
    }

    cart.forEach(item => {
        inventory[item.dbKey].stock -= 1;
    });

    localStorage.setItem('shopInventory', JSON.stringify(inventory));

    alert(`Checkout Processed Successfully! Grand Total: AED ${totalCost}`);
    cart = [];
    totalCost = 0;
    cartUIUpdate();
    updateShopDropdown();
}

// 7. Backend Administration Logic (Live search filter view + Price/Stock updates)
function updateInventoryUI() {
    const invContainer = document.getElementById('inventoryList');
    const searchFilter = document.getElementById('inventorySearch').value.toLowerCase();
    invContainer.innerHTML = '';

    for (const [dbKey, data] of Object.entries(inventory)) {
        const displayName = dbKey.replace(/-/g, ' '); 
        
        // Dynamic search checking filter matches
        if (!displayName.toLowerCase().includes(searchFilter)) {
            continue;
        }
        
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `
            <div style="flex: 1; padding-right: 10px;">
                <strong>${displayName}</strong>
                <div style="font-size: 14px; margin-top: 4px; color: #555;">
                    Price: <strong>AED ${data.price}</strong> | Stock: <strong>${data.stock}</strong>
                </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <div>
                    <input type="number" id="editPrice-${dbKey}" class="stock-input" placeholder="New Price" style="width: 90px;">
                    <button class="action-btn" style="width: auto; padding: 6px 12px; margin: 0; background-color: #17a2b8;" onclick="updatePrice('${dbKey}')">Set Price</button>
                </div>
                <div>
                    <input type="number" id="addStock-${dbKey}" class="stock-input" placeholder="Qty">
                    <button class="action-btn" style="width: auto; padding: 6px 12px; margin: 0; background-color: #28a745;" onclick="addStock('${dbKey}')">Add Stock</button>
                </div>
            </div>
        `;
        invContainer.appendChild(div);
    }
}

// Modify database price values directly
function updatePrice(dbKey) {
    const inputField = document.getElementById(`editPrice-${dbKey}`);
    const newPrice = parseInt(inputField.value);

    if (isNaN(newPrice) || newPrice < 0) {
        alert("Provide a valid numeric price value.");
        return;
    }

    inventory[dbKey].price = newPrice;
    localStorage.setItem('shopInventory', JSON.stringify(inventory));
    
    inputField.value = ''; 
    updateInventoryUI();
    updateShopDropdown();
    alert(`Price successfully updated.`);
}

// Update database quantity updates
function addStock(dbKey) {
    const inputField = document.getElementById(`addStock-${dbKey}`);
    const qtyToAdd = parseInt(inputField.value);

    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
        alert("Provide a valid numeric quantity value.");
        return;
    }

    inventory[dbKey].stock += qtyToAdd;
    localStorage.setItem('shopInventory', JSON.stringify(inventory));
    
    inputField.value = ''; 
    updateInventoryUI();
    updateShopDropdown();
    alert(`Stock level successfully adjusted.`);
}

// Global Event Listener Handlers Hook
window.onload = function() {
    document.getElementById('brand').addEventListener('change', handleBrandChange);
    document.getElementById('model').addEventListener('change', updateShopDropdown);
    document.getElementById('year').addEventListener('change', updateShopDropdown);
    
    // Live processing binding event tracker hook on key changes for the search input
    document.getElementById('inventorySearch').addEventListener('input', updateInventoryUI);
    
    handleBrandChange();
};
