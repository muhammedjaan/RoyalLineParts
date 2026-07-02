/**
 * OEM Parts Management System - Production Engine
 */

// 1. Core Config Dependencies
const modelsByBrand = {
    "Cadillac": ["CT5", "Escalade"],
    "Chevrolet": ["Camaro", "Corvette"],
    "GMC": ["Yukon", "Sierra"]
};

const defaultInventory = {
    "Cadillac-CT5-2026-Brake Pads (OEM New)": { price: 1450, stock: 6 },
    "Cadillac-CT5-2026-Brake Pads (OEM Used)": { price: 870, stock: 4 },
    "Cadillac-Escalade-2026-Air Filter (OEM New)": { price: 250, stock: 15 },
    "Cadillac-Escalade-2026-Air Filter (OEM Used)": { price: 100, stock: 2 },
    "Chevrolet-Camaro-2026-Brake Pads (OEM New)": { price: 1250, stock: 5 },
    "Chevrolet-Camaro-2026-Brake Pads (OEM Used)": { price: 750, stock: 2 },
    "GMC-Yukon-2026-Brake Pads (OEM New)": { price: 1350, stock: 8 }
};

// State Encapsulation
let inventory = JSON.parse(localStorage.getItem('aftersalesInventory')) || defaultInventory;
let cart = [];
let totalCost = 0;

// 2. Structural Helper Utilities (DRY Implementation)
function parseDbKey(dbKey) {
    const segments = dbKey.split('-');
    return {
        brand: segments[0],
        model: segments[1],
        year: segments[2],
        partName: segments.slice(3).join('-')
    };
}

function saveState() {
    localStorage.setItem('aftersalesInventory', JSON.stringify(inventory));
}

// 3. Navigation View Controller
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');

    updateShopDropdown();
    updateInventoryUI();
}

// 4. Interface Dynamic Populators
function handleBrandChange() {
    const selectedBrand = document.getElementById('brand').value;
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '';

    (modelsByBrand[selectedBrand] || []).forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.innerText = model;
        modelSelect.appendChild(option);
    });

    updateShopDropdown();
}

function updateShopDropdown() {
    const partSelect = document.getElementById('part');
    const currentBrand = document.getElementById('brand').value;
    const currentModel = document.getElementById('model').value;
    const currentYear = document.getElementById('year').value;
    
    partSelect.innerHTML = ''; 
    let partsFound = false;
    
    for (const [dbKey, data] of Object.entries(inventory)) {
        const item = parseDbKey(dbKey);
        
        if (item.brand === currentBrand && item.model === currentModel && item.year === currentYear) {
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

// 5. Checkout / Transaction Logic
function addToCart() {
    const partSelect = document.getElementById('part');
    if (partSelect.options.length === 0 || partSelect.options[partSelect.selectedIndex].disabled) {
        alert("Selected component variant is unavailable or out of stock.");
        return;
    }

    const dbItemKey = partSelect.value; 
    const item = parseDbKey(dbItemKey);
    const price = parseInt(partSelect.options[partSelect.selectedIndex].getAttribute('data-price'), 10);

    const countInCart = cart.filter(cartItem => cartItem.dbKey === dbItemKey).length;
    if (countInCart >= inventory[dbItemKey].stock) {
        alert("Cannot add more items than physically available in stock.");
        return;
    }

    cart.push({ 
        dbKey: dbItemKey, 
        description: `${item.year} ${item.brand} ${item.model} ${item.partName}`, 
        price: price 
    });
    
    totalCost += price;
    renderCartUI();
}

function renderCartUI() {
    const container = document.getElementById('cartItems');
    container.innerHTML = '';
    
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `
            <span>${item.description}</span> 
            <span>
                AED ${item.price} 
                <button class="btn-remove" data-index="${index}">X</button>
            </span>`;
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
    if (cart.length === 0) {
        alert("The structural execution sheet is empty.");
        return;
    }

    cart.forEach(item => {
        if (inventory[item.dbKey].stock > 0) {
            inventory[item.dbKey].stock -= 1;
        }
    });

    saveState();
    alert(`Transaction processing complete. Invoiced Total: AED ${totalCost}`);
    
    cart = [];
    totalCost = 0;
    renderCartUI();
    updateShopDropdown();
}

// 6. Administrative Management Matrix
function updateInventoryUI() {
    const container = document.getElementById('inventoryList');
    const filter = document.getElementById('inventorySearch').value.toLowerCase();
    container.innerHTML = '';

    for (const [dbKey, data] of Object.entries(inventory)) {
        const item = parseDbKey(dbKey);
        const matchString = `${item.brand} ${item.model} ${item.year} ${item.partName}`.toLowerCase();
        
        if (!matchString.includes(filter)) continue;
        
        const div = document.createElement('div');
        div.className = 'row-item';
        div.innerHTML = `
            <div class="item-details">
                <strong>${item.brand} ${item.model} (${item.year}) - ${item.partName}</strong>
                <div class="item-meta">
                    Current Valuation: <strong style="color: var(--primary);">AED ${data.price}</strong> | Available Volume: <strong>${data.stock} units</strong>
                </div>
            </div>
            <div class="item-controls">
                <div class="control-group">
                    <input type="number" min="0" id="price-${dbKey}" class="stock-input" placeholder="New Price">
                    <button class="action-btn btn-price" data-update="price" data-key="${dbKey}">Set Price</button>
                </div>
                <div class="control-group">
                    <input type="number" min="1" id="stock-${dbKey}" class="stock-input" placeholder="Qty">
                    <button class="action-btn btn-stock" data-update="stock" data-key="${dbKey}">Add</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

function updatePrice(dbKey) {
    const input = document.getElementById(`price-${dbKey}`);
    const newPrice = parseInt(input.value, 10);

    if (isNaN(newPrice) || newPrice < 0) {
        alert("Please assign a valid positive numeric threshold.");
        return;
    }

    inventory[dbKey].price = newPrice;
    saveState();
    
    updateInventoryUI();
    updateShopDropdown();
}

function addStock(dbKey) {
    const input = document.getElementById(`stock-${dbKey}`);
    const delta = parseInt(input.value, 10);

    if (isNaN(delta) || delta <= 0) {
        alert("Allocation adjustment volume must be greater than zero.");
        return;
    }

    inventory[dbKey].stock += delta;
    saveState();
    
    updateInventoryUI();
    updateShopDropdown();
}

// 7. Event Listener Initializers (Decoupled Front-end Strategy)
document.addEventListener('DOMContentLoaded', () => {
    // Dropdown hooks
    document.getElementById('brand').addEventListener('change', handleBrandChange);
    document.getElementById('model').addEventListener('change', updateShopDropdown);
    document.getElementById('year').addEventListener('change', updateShopDropdown);
    
    // Core interaction buttons
    document.getElementById('addToCartBtn').addEventListener('click', addToCart);
    document.getElementById('checkoutBtn').addEventListener('click', checkoutOrder);
    document.getElementById('inventorySearch').addEventListener('input', updateInventoryUI);

    // Tab switcher links
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Dynamic event capture hooks (for runtime objects)
    document.getElementById('cartItems').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
            removeFromCart(parseInt(e.target.dataset.index, 10));
        }
    });

    document.getElementById('inventoryList').addEventListener('click', (e) => {
        if (!e.target.classList.contains('action-btn')) return;
        
        const action = e.target.dataset.update;
        const targetKey = e.target.dataset.key;
        
        if (action === 'price') updatePrice(targetKey);
        if (action === 'stock') addStock(targetKey);
    });

    // Initial sequence execution
    handleBrandChange();
});
