var invoiceItems = [];
var currentInvoiceRateType = 'job';
var invoiceNumber = 1;
var editingInvoiceIndex = -1;

// Define category order
var categoryOrder = [
    'Downtakings', 'General Building', 'Building work', 'Carpentry', 'Joinery',
    'Electrical', 'Electricals', 'Plumbing', 'Gas work/Plumbing', 'Plastering',
    'Skimming /Painting', 'Painting & Decorating', 'Tiling', 'Roofing',
    'Kitchen Fitting', 'Bathroom Fitting', 'Bathrooms', 'Flooring', 'Bricklaying',
    'HVAC', 'Groundworks', 'Scaffolding', 'Glazing', 'Insulation', 'Materials'
];

// Edinburgh 2025 standard trade rates
var invoiceTradeRates = {
    'Downtakings': { hourly: 30, daily: 220, job: 0 },
    'General Building': { hourly: 30, daily: 230, job: 0 },
    'Building work': { hourly: 30, daily: 230, job: 0 },
    'Carpentry': { hourly: 32, daily: 240, job: 0 },
    'Joinery': { hourly: 32, daily: 240, job: 0 },
    'Electrical': { hourly: 45, daily: 320, job: 200 },
    'Electricals': { hourly: 45, daily: 320, job: 200 },
    'Plumbing': { hourly: 45, daily: 300, job: 200 },
    'Gas work/Plumbing': { hourly: 50, daily: 340, job: 250 },
    'Plastering': { hourly: 30, daily: 240, job: 0 },
    'Skimming /Painting': { hourly: 28, daily: 220, job: 0 },
    'Painting & Decorating': { hourly: 28, daily: 220, job: 0 },
    'Tiling': { hourly: 32, daily: 250, job: 0 },
    'Roofing': { hourly: 35, daily: 260, job: 0 },
    'Kitchen Fitting': { hourly: 32, daily: 250, job: 3000 },
    'Bathroom Fitting': { hourly: 32, daily: 250, job: 2200 },
    'Bathrooms': { hourly: 32, daily: 250, job: 2200 },
    'Flooring': { hourly: 28, daily: 220, job: 0 },
    'Bricklaying': { hourly: 32, daily: 250, job: 0 },
    'HVAC': { hourly: 40, daily: 300, job: 0 },
    'Groundworks': { hourly: 30, daily: 230, job: 0 },
    'Scaffolding': { hourly: 0, daily: 200, job: 0 },
    'Glazing': { hourly: 32, daily: 250, job: 0 },
    'Insulation': { hourly: 28, daily: 220, job: 0 },
    'Materials': { hourly: 0, daily: 0, job: 0 }
};

// Load invoice counter
if (localStorage.getItem('traderBrosInvoiceCount')) {
    invoiceNumber = parseInt(localStorage.getItem('traderBrosInvoiceCount')) + 1;
}
updateInvoiceCounter();

function updateInvoiceCounter() {
    var counter = document.getElementById('invoiceCounter');
    if (counter) counter.textContent = '#' + String(invoiceNumber).padStart(4, '0');
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    var invoiceClientName = document.getElementById('invoiceClientName');
    if (invoiceClientName) {
        invoiceClientName.addEventListener('input', function() {
            var name = this.value.trim();
            if (name) {
                var parts = name.split(' ');
                var customerId = '';
                if (parts.length >= 2) {
                    customerId = parts[0].substring(0, 3).toUpperCase() + parts[parts.length - 1].substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
                } else {
                    customerId = parts[0].substring(0, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
                }
                document.getElementById('invoiceCustomerId').value = customerId;
            } else {
                document.getElementById('invoiceCustomerId').value = '';
            }
        });
    }

    var invoiceTradeCategory = document.getElementById('invoiceTradeCategory');
    if (invoiceTradeCategory) {
        invoiceTradeCategory.addEventListener('change', function() {
            var selectedTrade = this.value;
            var rateInfo = document.getElementById('invoiceTradeRateInfo');
            if (selectedTrade && invoiceTradeRates[selectedTrade]) {
                var rates = invoiceTradeRates[selectedTrade];
                var rateParts = [];
                if (rates.hourly > 0) rateParts.push('Â£' + rates.hourly + '/hr');
                if (rates.daily > 0) rateParts.push('Â£' + rates.daily + '/day');
                if (rates.job > 0) rateParts.push('Â£' + rates.job + '/job');
                rateInfo.textContent = rateParts.length > 0 ? 'Standard rates: ' + rateParts.join(' | ') : '';
                updateInvoicePriceFromTrade();
            } else {
                rateInfo.textContent = '';
                document.getElementById('invoiceUnitPrice').value = '';
            }
        });
    }

    document.querySelectorAll('.invoice-rate-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.invoice-rate-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentInvoiceRateType = this.getAttribute('data-type');
            var customUnitGroup = document.getElementById('invoiceCustomUnitGroup');
            var rateLabel = document.getElementById('invoiceRateLabel');
            if (currentInvoiceRateType === 'custom') {
                customUnitGroup.classList.remove('hidden');
                rateLabel.textContent = 'Unit Price (Â£) *';
            } else {
                customUnitGroup.classList.add('hidden');
                rateLabel.textContent = currentInvoiceRateType === 'daily' ? 'Day Rate (Â£) *' : currentInvoiceRateType === 'job' ? 'Per Job Rate (Â£) *' : 'Hourly Rate (Â£) *';
            }
            updateInvoicePriceFromTrade();
        });
    });
});

function updateInvoicePriceFromTrade() {
    var selectedTrade = document.getElementById('invoiceTradeCategory').value;
    if (selectedTrade && invoiceTradeRates[selectedTrade]) {
        var rates = invoiceTradeRates[selectedTrade];
        var price = currentInvoiceRateType === 'hourly' ? rates.hourly : currentInvoiceRateType === 'daily' ? rates.daily : currentInvoiceRateType === 'job' ? rates.job : 0;
        if (price > 0) document.getElementById('invoiceUnitPrice').value = price;
    }
}

function addInvoiceItem() {
    var category = document.getElementById('invoiceTradeCategory').value || 'General';
    var description = document.getElementById('invoiceDescription').value;
    var quantity = parseFloat(document.getElementById('invoiceQuantity').value);
    var unitPrice = parseFloat(document.getElementById('invoiceUnitPrice').value);
    var customUnit = document.getElementById('invoiceCustomUnit').value;

    if (!description || !unitPrice) { alert('Please enter description and unit price'); return; }

    var unit = currentInvoiceRateType === 'hourly' ? 'hour' : currentInvoiceRateType === 'daily' ? 'day' : currentInvoiceRateType === 'job' ? 'job' : customUnit || 'item';
    invoiceItems.push({ category: category, description: description, quantity: quantity, unit: unit, unitPrice: unitPrice, lineTotal: unitPrice * quantity });
    updateInvoiceTable();
    clearInvoiceForm();
}

function clearInvoiceForm() {
    document.getElementById('invoiceDescription').value = '';
    document.getElementById('invoiceQuantity').value = '1';
    document.getElementById('invoiceUnitPrice').value = '';
    document.getElementById('invoiceCustomUnit').value = '';
    document.getElementById('invoiceTradeCategory').selectedIndex = 0;
    document.getElementById('invoiceTradeRateInfo').textContent = '';
}

function editInvoiceItem(index) {
    if (editingInvoiceIndex >= 0) cancelInvoiceEdit();
    editingInvoiceIndex = index;
    var item = invoiceItems[index];
    var categoryOptions = '<option value="General">General</option>';
    Object.keys(invoiceTradeRates).forEach(function(cat) {
        categoryOptions += '<option value="' + cat + '"' + (cat === item.category ? ' selected' : '') + '>' + cat + '</option>';
    });
    var row = document.getElementById('invoiceItems').rows[index];
    row.classList.add('editing-row');
    row.innerHTML = '<td><select class="inline-edit-input" id="edit-invoice-category-' + index + '" style="width:100%">' + categoryOptions + '</select></td>' +
        '<td><input type="text" class="inline-edit-input" id="edit-invoice-description-' + index + '" value="' + item.description + '" style="width:100%"></td>' +
        '<td class="text-center"><input type="number" class="inline-edit-input" id="edit-invoice-quantity-' + index + '" value="' + item.quantity + '" step="0.1" min="0.1" style="width:80px"></td>' +
        '<td class="text-right"><input type="number" class="inline-edit-input" id="edit-invoice-price-' + index + '" value="' + item.unitPrice + '" step="0.01" min="0" style="width:100px"></td>' +
        '<td class="text-right" style="font-weight:600">Â£' + item.lineTotal.toFixed(2) + '</td>' +
        '<td class="text-center"><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap"><button class="btn-action btn-save" onclick="saveInvoiceEdit(' + index + ')">Save</button><button class="btn-action btn-cancel" onclick="cancelInvoiceEdit()">Cancel</button></div></td>';
    document.getElementById('edit-invoice-quantity-' + index).addEventListener('input', function() { updateInvoiceEditTotal(index); });
    document.getElementById('edit-invoice-price-' + index).addEventListener('input', function() { updateInvoiceEditTotal(index); });
}

function updateInvoiceEditTotal(index) {
    var qty = parseFloat(document.getElementById('edit-invoice-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-invoice-price-' + index).value) || 0;
    document.getElementById('invoiceItems').rows[index].cells[4].textContent = 'Â£' + (qty * price).toFixed(2);
}

function saveInvoiceEdit(index) {
    var category = document.getElementById('edit-invoice-category-' + index).value;
    var description = document.getElementById('edit-invoice-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-invoice-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-invoice-price-' + index).value);
    if (!description || !unitPrice || !quantity) { alert('Please fill in all fields'); return; }
    invoiceItems[index] = { category: category, description: description, quantity: quantity, unit: invoiceItems[index].unit, unitPrice: unitPrice, lineTotal: unitPrice * quantity };
    editingInvoiceIndex = -1;
    updateInvoiceTable();
}

function cancelInvoiceEdit() { editingInvoiceIndex = -1; updateInvoiceTable(); }

function removeInvoiceItem(index) { if (confirm('Delete this item?')) { invoiceItems.splice(index, 1); editingInvoiceIndex = -1; updateInvoiceTable(); } }

function moveInvoiceItem(index, direction) {
    if (editingInvoiceIndex >= 0) { alert('Save or cancel edit first'); return; }
    if (direction === 'up' && index > 0) { var temp = invoiceItems[index]; invoiceItems[index] = invoiceItems[index - 1]; invoiceItems[index - 1] = temp; }
    else if (direction === 'down' && index < invoiceItems.length - 1) { var temp = invoiceItems[index]; invoiceItems[index] = invoiceItems[index + 1]; invoiceItems[index + 1] = temp; }
    updateInvoiceTable();
}

function repositionInvoiceItem(index) {
    if (editingInvoiceIndex >= 0) { alert('Save or cancel edit first'); return; }
    var newPos = prompt('Enter new position (1 to ' + invoiceItems.length + '):', index + 1);
    if (newPos === null) return;
    newPos = parseInt(newPos);
    if (isNaN(newPos) || newPos < 1 || newPos > invoiceItems.length) { alert('Invalid position'); return; }
    var item = invoiceItems.splice(index, 1)[0];
    invoiceItems.splice(newPos - 1, 0, item);
    updateInvoiceTable();
}

function sortInvoiceItemsByCategory(arr) {
    return arr.slice().sort(function(a, b) {
        var iA = categoryOrder.indexOf(a.category); var iB = categoryOrder.indexOf(b.category);
        return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
    });
}

function groupInvoiceItemsByCategory(arr) {
    var grouped = {};
    arr.forEach(function(item) { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item); });
    return grouped;
}

function updateInvoiceTable() {
    var tbody = document.getElementById('invoiceItems');
    var itemsSection = document.getElementById('invoiceItemsSection');
    var generateSection = document.getElementById('generateInvoiceSection');
    if (invoiceItems.length === 0) { itemsSection.style.display = 'none'; generateSection.style.display = 'none'; return; }
    itemsSection.style.display = 'block';
    generateSection.style.display = 'block';
    var html = '';
    for (var i = 0; i < invoiceItems.length; i++) {
        var item = invoiceItems[i];
        html += '<tr><td>' + item.category + '</td><td>' + item.description + '</td><td class="text-center">' + item.quantity + '</td><td class="text-right">Â£' + item.unitPrice.toFixed(2) + '</td><td class="text-right" style="font-weight:600">Â£' + item.lineTotal.toFixed(2) + '</td><td class="text-center"><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap"><button class="btn-action btn-edit" onclick="editInvoiceItem(' + i + ')">Edit</button><button class="btn-action btn-move" onclick="moveInvoiceItem(' + i + ',\'up\')"' + (i === 0 ? ' disabled' : '') + '>â†‘</button><button class="btn-action btn-move" onclick="moveInvoiceItem(' + i + ',\'down\')"' + (i === invoiceItems.length - 1 ? ' disabled' : '') + '>â†“</button><button class="btn-action btn-reposition" onclick="repositionInvoiceItem(' + i + ')">#</button><button class="btn-action btn-delete" onclick="removeInvoiceItem(' + i + ')">Del</button></div></td></tr>';
    }
    var subtotal = invoiceItems.reduce(function(sum, item) { return sum + item.lineTotal; }, 0);
    var vat = subtotal * 0.20;
    var total = subtotal + vat;
    html += '<tr class="total-row"><td colspan="4" class="text-right">Subtotal:</td><td class="text-right">Â£' + subtotal.toFixed(2) + '</td><td></td></tr>';
    html += '<tr class="total-row"><td colspan="4" class="text-right">VAT (20%):</td><td class="text-right">Â£' + vat.toFixed(2) + '</td><td></td></tr>';
    html += '<tr class="total-row"><td colspan="4" class="text-right" style="font-size:16px"><strong>TOTAL:</strong></td><td class="text-right" style="font-size:16px"><strong>Â£' + total.toFixed(2) + '</strong></td><td></td></tr>';
    tbody.innerHTML = html;
}

function closeInvoicePreview() { document.getElementById('invoicePreviewModal').style.display = 'none'; }
window.addEventListener('click', function(e) { if (e.target == document.getElementById('invoicePreviewModal')) closeInvoicePreview(); });
