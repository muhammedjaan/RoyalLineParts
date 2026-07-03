/**
 * OEM Parts Management System - Dynamic Build
 */

// 1. Core State (Starts completely empty)
let inventory = JSON.parse(localStorage.getItem('aftersalesInventory')) || {};
let cart = [];
let totalCost = 0;

// 2. Database Helper Utilities
function parseDbKey(dbKey) {
    const segments = dbKey.split('|');
    return {
        brand: segments[0],
        model: segments[1],
        year: segments[2],
        condition: segments[3],
        partName: segments[4]
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

    refreshShopDropdowns();
    updateInventoryUI();
}

// 4. Admin Feature: Add New Component
function addNewComponent() {
    const brand = document.getElementById('newBrand').value.trim();
    const model = document.getElementById('newModel').value.trim();
    const year = document.getElementById('newYear').value.trim();
    const condition = document.getElementById('newCondition').value;
    const partName = document.getElementById('newPartName').value.trim();
    const price = parseInt(document.getElementById('newPrice').value, 10);
    const stock = parseInt(document.getElementById('newStock').value, 10);

    if (!brand || !model || !year || !partName || isNaN(price) || isNaN(stock)) {
        alert("Action Denied: All configuration fields must be filled out correctly.");
        return;
    }

    // Creating the strict database key
    const newDbKey = `${brand}|${model}|${year}|${condition}|${partName}`;

    if (inventory[newDbKey]) {
        alert("This exact component configuration already exists in the registry!");
        return;
    }

    // Add to database
    inventory[newDbKey] = { price: price, stock: stock };
    saveState();

    // Clear inputs
    document.getElementById('newBrand').value = '';
    document.getElementById('newModel').value = '';
    document.getElementById('newYear').value = '';
    document.getElementById('newPartName').value = '';
    document.getElementById('newPrice').value = '';
    document.getElementById('newStock').value = '';

    alert(`Success: ${brand} ${model} ${partName} added to registry!`);
    updateInventoryUI();
    refreshShopDropdowns();
}

// 5. Dynamic Shop Populators
function refreshShopDropdowns() {
    const brands = new Set(), models = new Set(), years = new Set(), conditions = new Set();

    // Extract unique values from whatever is currently in the database
    for (const key of Object.keys(inventory)) {
        const item = parseDbKey(key);
        brands.add(item.brand);
        models.add(item.model);
        years.add(item.year);
        conditions.add(item.condition);
    }

    populateSelectElement('brand', brands);
    populateSelectElement('model', models);
    populateSelectElement('year', years);
    populateSelectElement('condition', conditions);

    updateAvailableParts();
}

function populateSelectElement(elementId, dataSet) {
    const select = document.getElementById(elementId);
    // Keep the currently selected value if it exists, so the UI doesn't jump
    const currentValue = select.value; 
    
    select.innerHTML = '';
    
    if (dataSet.size === 0) {
        select.innerHTML = '<option value="">-- Empty Database --</option>';
        return;
    }

    dataSet.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.innerText = value;
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
        
        // Only show parts that perfectly match all 4 dropdowns
        if (item.brand === currentBrand && item.model === currentModel && 
            item.year === currentYear && item.condition === currentCondition) {
            
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
        option.innerText = "No parts registered for this specific configuration";
        option.disabled = true;
        partSelect.appendChild(option);
    }
}

// 6. Checkout / Transaction Logic
function addToCart() {
    const partSelect = document.getElementById('part');
    if (partSelect.options.length === 0 || partSelect.options[partSelect.selectedIndex].disabled) {
        alert("Selected component is unavailable or out of stock.");
        return;
    }

    const dbItemKey = partSelect.value; 
    const item = parseDbKey(dbItemKey);
    const price = parseInt(partSelect.options[partSelect.selectedIndex].getAttribute('data-price'), 10);

    const countInCart = cart.filter(cItem => cItem.dbKey === dbItemKey).length;
    if (countInCart >= inventory[dbItemKey].stock) {
        alert("Cannot add more items than physically available in stock.");
        return;
    }

    cart.push({ 
        dbKey: dbItemKey, 
        description: `(${item.condition}) ${item.year} ${item.brand} ${item.model} ${item.partName}`, 
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
            <span>AED ${item.price} <button class="btn-remove" data-index="${index}">X</button></span>`;
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
    saveState();
    
    alert(`Transaction Invoiced! Total: AED ${totalCost}`);
    cart = [];
    totalCost = 0;
    renderCartUI();
    updateAvailableParts();
    updateInventoryUI();
}

// 7. Inventory UI Render
function updateInventoryUI() {
    const container = document.getElementById('inventoryList');
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

// Inventory Adjustments
function updatePrice(dbKey) {
    const newPrice = parseInt(document.getElementById(`price-${dbKey}`).value, 10);
    if (isNaN(newPrice) || newPrice < 0) return alert("Invalid price.");
    inventory[dbKey].price = newPrice;
    saveState(); updateInventoryUI(); updateAvailableParts();
}

function addStock(dbKey) {
    const delta = parseInt(document.getElementById(`stock-${dbKey}`).value, 10);
    if (isNaN(delta) || delta === 0) return alert("Invalid quantity.");
    inventory[dbKey].stock += delta;
    saveState(); updateInventoryUI(); updateAvailableParts();
}

// 8. Initializers
document.addEventListener('DOMContentLoaded', () => {
    // Add Item button
    document.getElementById('addNewPartBtn').addEventListener('click', addNewComponent);

    // Cascading Shop Selectors
    document.getElementById('brand').addEventListener('change', updateAvailableParts);
    document.getElementById('model').addEventListener('change', updateAvailableParts);
    document.getElementById('year').addEventListener('change', updateAvailableParts);
    document.getElementById('condition').addEventListener('change', updateAvailableParts);
    
    // UI Events
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

    // Boot up
    refreshShopDropdowns();
    updateInventoryUI();
});
