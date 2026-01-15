var invoiceItems = [];
var currentInvoiceRateType = 'job';
var invoiceNumber = 1;
var editingInvoiceIndex = -1;

// Define category order (matches dropdown menu order)
var categoryOrder = [
    'Downtakings',
    'General Building',
    'Building work',
    'Carpentry',
    'Joinery',
    'Electrical',
    'Electricals',
    'Plumbing',
    'Gas work/Plumbing',
    'Plastering',
    'Skimming /Painting',
    'Painting & Decorating',
    'Tiling',
    'Roofing',
    'Kitchen Fitting',
    'Bathroom Fitting',
    'Bathrooms',
    'Flooring',
    'Bricklaying',
    'HVAC',
    'Groundworks',
    'Scaffolding',
    'Glazing',
    'Insulation',
    'Materials'
];

// Edinburgh 2025 standard trade rates (same as quotation tool)
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
    document.getElementById('invoiceCounter').textContent = '#' + String(invoiceNumber).padStart(4, '0');
}

// Auto-generate Customer ID from client name
document.getElementById('invoiceClientName').addEventListener('input', function() {
    var name = this.value.trim();
    if (name) {
        var parts = name.split(' ');
        var customerId = '';
        
        if (parts.length >= 2) {
            var firstName = parts[0].substring(0, 3).toUpperCase();
            var lastName = parts[parts.length - 1].substring(0, 3).toUpperCase();
            var randomNum = Math.floor(1000 + Math.random() * 9000);
            customerId = firstName + lastName + randomNum;
        } else if (parts.length === 1) {
            var singleName = parts[0].substring(0, 6).toUpperCase();
            var randomNum = Math.floor(1000 + Math.random() * 9000);
            customerId = singleName + randomNum;
        }
        
        document.getElementById('invoiceCustomerId').value = customerId;
    } else {
        document.getElementById('invoiceCustomerId').value = '';
    }
});

// Trade category change handler
document.getElementById('invoiceTradeCategory').addEventListener('change', function() {
    var selectedTrade = this.value;
    var rateInfo = document.getElementById('invoiceTradeRateInfo');
    
    if (selectedTrade && invoiceTradeRates[selectedTrade]) {
        var rates = invoiceTradeRates[selectedTrade];
        var infoText = 'Standard rates: ';
        var rateParts = [];
        
        if (rates.hourly > 0) rateParts.push('£' + rates.hourly + '/hr');
        if (rates.daily > 0) rateParts.push('£' + rates.daily + '/day');
        if (rates.job > 0) rateParts.push('£' + rates.job + '/job');
        
        if (rateParts.length > 0) {
            infoText += rateParts.join(' | ');
            rateInfo.textContent = infoText;
        } else {
            rateInfo.textContent = '';
        }
        
        updateInvoicePriceFromTrade();
    } else {
        rateInfo.textContent = '';
        document.getElementById('invoiceUnitPrice').value = '';
    }
});

function updateInvoicePriceFromTrade() {
    var selectedTrade = document.getElementById('invoiceTradeCategory').value;
    if (selectedTrade && invoiceTradeRates[selectedTrade]) {
        var rates = invoiceTradeRates[selectedTrade];
        var price = 0;
        
        if (currentInvoiceRateType === 'hourly' && rates.hourly > 0) {
            price = rates.hourly;
        } else if (currentInvoiceRateType === 'daily' && rates.daily > 0) {
            price = rates.daily;
        } else if (currentInvoiceRateType === 'job' && rates.job > 0) {
            price = rates.job;
        }
        
        if (price > 0) {
            document.getElementById('invoiceUnitPrice').value = price;
        }
    }
}

// Rate type selector
document.querySelectorAll('.invoice-rate-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.invoice-rate-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentInvoiceRateType = this.getAttribute('data-type');
        
        var customUnitGroup = document.getElementById('invoiceCustomUnitGroup');
        var rateLabel = document.getElementById('invoiceRateLabel');
        
        if (currentInvoiceRateType === 'custom') {
            customUnitGroup.classList.remove('hidden');
            rateLabel.textContent = 'Unit Price (£) *';
        } else if (currentInvoiceRateType === 'daily') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Day Rate (£) *';
        } else if (currentInvoiceRateType === 'job') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Per Job Rate (£) *';
        } else {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Hourly Rate (£) *';
        }
        
        updateInvoicePriceFromTrade();
    });
});

function addInvoiceItem() {
    var category = document.getElementById('invoiceTradeCategory').value || 'General';
    var description = document.getElementById('invoiceDescription').value;
    var quantity = parseFloat(document.getElementById('invoiceQuantity').value);
    var unitPrice = parseFloat(document.getElementById('invoiceUnitPrice').value);
    var customUnit = document.getElementById('invoiceCustomUnit').value;

    if (!description || !unitPrice) {
        alert('Please enter description and unit price');
        return;
    }

    var unit = '';
    if (currentInvoiceRateType === 'hourly') {
        unit = 'hour';
    } else if (currentInvoiceRateType === 'daily') {
        unit = 'day';
    } else if (currentInvoiceRateType === 'job') {
        unit = 'job';
    } else {
        unit = customUnit || 'item';
    }

    var lineTotal = unitPrice * quantity;

    invoiceItems.push({
        category: category,
        description: description,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    });

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
    if (editingInvoiceIndex >= 0) {
        cancelInvoiceEdit();
    }
    
    editingInvoiceIndex = index;
    var item = invoiceItems[index];
    
    var categoryOptions = '';
    var categories = Object.keys(invoiceTradeRates);
    categories.unshift('General');
    for (var i = 0; i < categories.length; i++) {
        var selected = categories[i] === item.category ? 'selected' : '';
        categoryOptions += '<option value="' + categories[i] + '" ' + selected + '>' + categories[i] + '</option>';
    }
    
    var row = document.getElementById('invoiceItems').rows[index];
    row.classList.add('editing-row');
    row.innerHTML = `
        <td>
            <select class="inline-edit-input" id="edit-invoice-category-${index}" style="width: 100%;">
                ${categoryOptions}
            </select>
        </td>
        <td>
            <input type="text" class="inline-edit-input" id="edit-invoice-description-${index}" value="${item.description}" style="width: 100%;">
        </td>
        <td class="text-center">
            <input type="number" class="inline-edit-input" id="edit-invoice-quantity-${index}" value="${item.quantity}" step="0.1" min="0.1" style="width: 80px;">
        </td>
        <td class="text-right">
            <input type="number" class="inline-edit-input" id="edit-invoice-price-${index}" value="${item.unitPrice}" step="0.01" min="0" style="width: 100px;">
        </td>
        <td class="text-right" style="font-weight: 600;">£${item.lineTotal.toFixed(2)}</td>
        <td class="text-center">
            <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-action btn-save" onclick="saveInvoiceEdit(${index})" title="Save">Save</button>
                <button class="btn-action btn-cancel" onclick="cancelInvoiceEdit()" title="Cancel">Cancel</button>
            </div>
        </td>
    `;
    
    document.getElementById('edit-invoice-quantity-' + index).addEventListener('input', function() {
        updateInvoiceEditTotal(index);
    });
    document.getElementById('edit-invoice-price-' + index).addEventListener('input', function() {
        updateInvoiceEditTotal(index);
    });
}

function updateInvoiceEditTotal(index) {
    var quantity = parseFloat(document.getElementById('edit-invoice-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-invoice-price-' + index).value) || 0;
    var total = quantity * price;
    
    var row = document.getElementById('invoiceItems').rows[index];
    row.cells[4].textContent = '£' + total.toFixed(2);
}

function saveInvoiceEdit(index) {
    var category = document.getElementById('edit-invoice-category-' + index).value;
    var description = document.getElementById('edit-invoice-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-invoice-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-invoice-price-' + index).value);
    
    if (!description || !unitPrice || !quantity) {
        alert('Please fill in all fields');
        return;
    }
    
    var lineTotal = unitPrice * quantity;
    
    invoiceItems[index] = {
        category: category,
        description: description,
        quantity: quantity,
        unit: invoiceItems[index].unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    };
    
    editingInvoiceIndex = -1;
    updateInvoiceTable();
}

function cancelInvoiceEdit() {
    editingInvoiceIndex = -1;
    updateInvoiceTable();
}

function removeInvoiceItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        invoiceItems.splice(index, 1);
        editingInvoiceIndex = -1;
        updateInvoiceTable();
    }
}

function moveInvoiceItem(index, direction) {
    if (editingInvoiceIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    if (direction === 'up' && index > 0) {
        var temp = invoiceItems[index];
        invoiceItems[index] = invoiceItems[index - 1];
        invoiceItems[index - 1] = temp;
    } else if (direction === 'down' && index < invoiceItems.length - 1) {
        var temp = invoiceItems[index];
        invoiceItems[index] = invoiceItems[index + 1];
        invoiceItems[index + 1] = temp;
    }
    updateInvoiceTable();
}

function repositionInvoiceItem(index) {
    if (editingInvoiceIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var newPosition = prompt('Enter new position (1 to ' + invoiceItems.length + '):', (index + 1));
    if (newPosition === null) return;
    
    newPosition = parseInt(newPosition);
    if (isNaN(newPosition) || newPosition < 1 || newPosition > invoiceItems.length) {
        alert('Invalid position. Please enter a number between 1 and ' + invoiceItems.length);
        return;
    }
    
    var item = invoiceItems.splice(index, 1)[0];
    invoiceItems.splice(newPosition - 1, 0, item);
    updateInvoiceTable();
}

// Helper function to sort items by category order
function sortInvoiceItemsByCategory(itemsArray) {
    return itemsArray.slice().sort(function(a, b) {
        var indexA = categoryOrder.indexOf(a.category);
        var indexB = categoryOrder.indexOf(b.category);
        
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        
        return indexA - indexB;
    });
}

// Helper function to group items by category
function groupInvoiceItemsByCategory(itemsArray) {
    var grouped = {};
    itemsArray.forEach(function(item) {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    return grouped;
}

function updateInvoiceTable() {
    var tbody = document.getElementById('invoiceItems');
    var itemsSection = document.getElementById('invoiceItemsSection');
    var generateSection = document.getElementById('generateInvoiceSection');

    if (invoiceItems.length === 0) {
        itemsSection.style.display = 'none';
        generateSection.style.display = 'none';
        return;
    }

    itemsSection.style.display = 'block';
    generateSection.style.display = 'block';

    var html = '';
    for (var i = 0; i < invoiceItems.length; i++) {
        var item = invoiceItems[i];
        html += '<tr>';
        html += '<td>' + item.category + '</td>';
        html += '<td>' + item.description + '</td>';
        html += '<td class="text-center">' + item.quantity + '</td>';
        html += '<td class="text-right">£' + item.unitPrice.toFixed(2) + '</td>';
        html += '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>';
        html += '<td class="text-center">';
        html += '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">';
        html += '<button class="btn-action btn-edit" onclick="editInvoiceItem(' + i + ')" title="Edit">Edit</button>';
        html += '<button class="btn-action btn-move" onclick="moveInvoiceItem(' + i + ', \'up\')" title="Move Up" ' + (i === 0 ? 'disabled' : '') + '>↑</button>';
        html += '<button class="btn-action btn-move" onclick="moveInvoiceItem(' + i + ', \'down\')" title="Move Down" ' + (i === invoiceItems.length - 1 ? 'disabled' : '') + '>↓</button>';
        html += '<button class="btn-action btn-reposition" onclick="repositionInvoiceItem(' + i + ')" title="Move to Position">#</button>';
        html += '<button class="btn-action btn-delete" onclick="removeInvoiceItem(' + i + ')" title="Delete">Del</button>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
    }

    var subtotal = 0;
    for (var j = 0; j < invoiceItems.length; j++) {
        subtotal += invoiceItems[j].lineTotal;
    }

    var vat = subtotal * 0.20;
    var total = subtotal + vat;
    
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right">Subtotal:</td>';
    html += '<td class="text-right">£' + subtotal.toFixed(2) + '</td>';
    html += '<td></td>';
    html += '</tr>';
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right">VAT (20%):</td>';
    html += '<td class="text-right">£' + vat.toFixed(2) + '</td>';
    html += '<td></td>';
    html += '</tr>';
    html += '<tr class="total-row">';
    html += '<td colspan="4" class="text-right" style="font-size: 16px;"><strong>TOTAL:</strong></td>';
    html += '<td class="text-right" style="font-size: 16px;"><strong>£' + total.toFixed(2) + '</strong></td>';
    html += '<td></td>';
    html += '</tr>';

    tbody.innerHTML = html;
}

function closeInvoicePreview() {
    document.getElementById('invoicePreviewModal').style.display = 'none';
}

window.onclick = function(event) {
    var modal = document.getElementById('invoicePreviewModal');
    if (event.target == modal) {
        closeInvoicePreview();
    }
};
