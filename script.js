var items = [];
var currentRateType = 'job';
var estimateNumber = 1;
var editingIndex = -1;

// Define category order (matches dropdown menu order)
var categoryOrder = [
    'Downtakings', 'General Building', 'Building work', 'Carpentry', 'Joinery',
    'Electrical', 'Electricals', 'Plumbing', 'Gas work/Plumbing', 'Plastering',
    'Skimming /Painting', 'Painting & Decorating', 'Tiling', 'Roofing',
    'Kitchen Fitting', 'Bathroom Fitting', 'Bathrooms', 'Flooring', 'Bricklaying',
    'HVAC', 'Groundworks', 'Scaffolding', 'Glazing', 'Insulation', 'Materials'
];

// Edinburgh 2025 standard trade rates
var tradeRates = {
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

// Load estimate counter
if (localStorage.getItem('traderBrosEstimateCount')) {
    estimateNumber = parseInt(localStorage.getItem('traderBrosEstimateCount')) + 1;
}
updateEstimateCounter();

function updateEstimateCounter() {
    var counter = document.getElementById('estimateCounter');
    if (counter) counter.textContent = '#' + String(estimateNumber).padStart(4, '0');
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    var clientNameInput = document.getElementById('clientName');
    if (clientNameInput) {
        clientNameInput.addEventListener('input', function() {
            var name = this.value.trim();
            if (name) {
                var parts = name.split(' ');
                var customerId = '';
                if (parts.length >= 2) {
                    customerId = parts[0].substring(0, 3).toUpperCase() + parts[parts.length - 1].substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
                } else {
                    customerId = parts[0].substring(0, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
                }
                document.getElementById('customerId').value = customerId;
            } else {
                document.getElementById('customerId').value = '';
            }
        });
    }

    var tradeCategorySelect = document.getElementById('tradeCategory');
    if (tradeCategorySelect) {
        tradeCategorySelect.addEventListener('change', function() {
            var selectedTrade = this.value;
            var rateInfo = document.getElementById('tradeRateInfo');
            if (selectedTrade && tradeRates[selectedTrade]) {
                var rates = tradeRates[selectedTrade];
                var rateParts = [];
                if (rates.hourly > 0) rateParts.push('Â£' + rates.hourly + '/hr');
                if (rates.daily > 0) rateParts.push('Â£' + rates.daily + '/day');
                if (rates.job > 0) rateParts.push('Â£' + rates.job + '/job');
                rateInfo.textContent = rateParts.length > 0 ? 'Standard rates: ' + rateParts.join(' | ') : '';
                updatePriceFromTrade();
            } else {
                rateInfo.textContent = '';
                document.getElementById('unitPrice').value = '';
            }
        });
    }

    document.querySelectorAll('.rate-type-btn:not(.invoice-rate-btn)').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.rate-type-btn:not(.invoice-rate-btn)').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentRateType = this.getAttribute('data-type');
            var customUnitGroup = document.getElementById('customUnitGroup');
            var rateLabel = document.getElementById('rateLabel');
            if (currentRateType === 'custom') {
                customUnitGroup.classList.remove('hidden');
                rateLabel.textContent = 'Unit Price (Â£) *';
            } else {
                customUnitGroup.classList.add('hidden');
                rateLabel.textContent = currentRateType === 'daily' ? 'Day Rate (Â£) *' : currentRateType === 'job' ? 'Per Job Rate (Â£) *' : 'Hourly Rate (Â£) *';
            }
            updatePriceFromTrade();
        });
    });
});

function updatePriceFromTrade() {
    var selectedTrade = document.getElementById('tradeCategory').value;
    if (selectedTrade && tradeRates[selectedTrade]) {
        var rates = tradeRates[selectedTrade];
        var price = currentRateType === 'hourly' ? rates.hourly : currentRateType === 'daily' ? rates.daily : currentRateType === 'job' ? rates.job : 0;
        if (price > 0) document.getElementById('unitPrice').value = price;
    }
}

function addItem() {
    var category = document.getElementById('tradeCategory').value || 'General';
    var description = document.getElementById('description').value;
    var quantity = parseFloat(document.getElementById('quantity').value);
    var unitPrice = parseFloat(document.getElementById('unitPrice').value);
    var customUnit = document.getElementById('customUnit').value;

    if (!description || !unitPrice) { alert('Please enter description and unit price'); return; }

    var unit = currentRateType === 'hourly' ? 'hour' : currentRateType === 'daily' ? 'day' : currentRateType === 'job' ? 'job' : customUnit || 'item';
    items.push({ category: category, description: description, quantity: quantity, unit: unit, unitPrice: unitPrice, lineTotal: unitPrice * quantity });
    updateQuoteTable();
    clearForm();
}

function clearForm() {
    document.getElementById('description').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('unitPrice').value = '';
    document.getElementById('customUnit').value = '';
    document.getElementById('tradeCategory').selectedIndex = 0;
    document.getElementById('tradeRateInfo').textContent = '';
}

function editItem(index) {
    if (editingIndex >= 0) cancelEdit();
    editingIndex = index;
    var item = items[index];
    var categoryOptions = '<option value="General">General</option>';
    Object.keys(tradeRates).forEach(function(cat) {
        categoryOptions += '<option value="' + cat + '"' + (cat === item.category ? ' selected' : '') + '>' + cat + '</option>';
    });
    var row = document.getElementById('quoteItems').rows[index];
    row.classList.add('editing-row');
    row.innerHTML = '<td><select class="inline-edit-input" id="edit-category-' + index + '" style="width:100%">' + categoryOptions + '</select></td>' +
        '<td><input type="text" class="inline-edit-input" id="edit-description-' + index + '" value="' + item.description + '" style="width:100%"></td>' +
        '<td class="text-center"><input type="number" class="inline-edit-input" id="edit-quantity-' + index + '" value="' + item.quantity + '" step="0.1" min="0.1" style="width:80px"></td>' +
        '<td class="text-right"><input type="number" class="inline-edit-input" id="edit-price-' + index + '" value="' + item.unitPrice + '" step="0.01" min="0" style="width:100px"></td>' +
        '<td class="text-right" style="font-weight:600">Â£' + item.lineTotal.toFixed(2) + '</td>' +
        '<td class="text-center"><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap"><button class="btn-action btn-save" onclick="saveEdit(' + index + ')">Save</button><button class="btn-action btn-cancel" onclick="cancelEdit()">Cancel</button></div></td>';
    document.getElementById('edit-quantity-' + index).addEventListener('input', function() { updateEditTotal(index); });
    document.getElementById('edit-price-' + index).addEventListener('input', function() { updateEditTotal(index); });
}

function updateEditTotal(index) {
    var qty = parseFloat(document.getElementById('edit-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-price-' + index).value) || 0;
    document.getElementById('quoteItems').rows[index].cells[4].textContent = 'Â£' + (qty * price).toFixed(2);
}

function saveEdit(index) {
    var category = document.getElementById('edit-category-' + index).value;
    var description = document.getElementById('edit-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-price-' + index).value);
    if (!description || !unitPrice || !quantity) { alert('Please fill in all fields'); return; }
    items[index] = { category: category, description: description, quantity: quantity, unit: items[index].unit, unitPrice: unitPrice, lineTotal: unitPrice * quantity };
    editingIndex = -1;
    updateQuoteTable();
}

function cancelEdit() { editingIndex = -1; updateQuoteTable(); }

function removeItem(index) { if (confirm('Delete this item?')) { items.splice(index, 1); editingIndex = -1; updateQuoteTable(); } }

function moveItem(index, direction) {
    if (editingIndex >= 0) { alert('Save or cancel edit first'); return; }
    if (direction === 'up' && index > 0) { var temp = items[index]; items[index] = items[index - 1]; items[index - 1] = temp; }
    else if (direction === 'down' && index < items.length - 1) { var temp = items[index]; items[index] = items[index + 1]; items[index + 1] = temp; }
    updateQuoteTable();
}

function repositionItem(index) {
    if (editingIndex >= 0) { alert('Save or cancel edit first'); return; }
    var newPos = prompt('Enter new position (1 to ' + items.length + '):', index + 1);
    if (newPos === null) return;
    newPos = parseInt(newPos);
    if (isNaN(newPos) || newPos < 1 || newPos > items.length) { alert('Invalid position'); return; }
    var item = items.splice(index, 1)[0];
    items.splice(newPos - 1, 0, item);
    updateQuoteTable();
}

function sortItemsByCategory(arr) {
    return arr.slice().sort(function(a, b) {
        var iA = categoryOrder.indexOf(a.category); var iB = categoryOrder.indexOf(b.category);
        return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
    });
}

function groupItemsByCategory(arr) {
    var grouped = {};
    arr.forEach(function(item) { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item); });
    return grouped;
}

function updateQuoteTable() {
    var tbody = document.getElementById('quoteItems');
    var quoteSection = document.getElementById('quoteSection');
    var generateSection = document.getElementById('generateSection');
    if (items.length === 0) { quoteSection.style.display = 'none'; generateSection.style.display = 'none'; return; }
    quoteSection.style.display = 'block';
    generateSection.style.display = 'block';
    var html = '';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        html += '<tr><td>' + item.category + '</td><td>' + item.description + '</td><td class="text-center">' + item.quantity + '</td><td class="text-right">Â£' + item.unitPrice.toFixed(2) + '</td><td class="text-right" style="font-weight:600">Â£' + item.lineTotal.toFixed(2) + '</td><td class="text-center"><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap"><button class="btn-action btn-edit" onclick="editItem(' + i + ')">Edit</button><button class="btn-action btn-move" onclick="moveItem(' + i + ',\'up\')"' + (i === 0 ? ' disabled' : '') + '>â†‘</button><button class="btn-action btn-move" onclick="moveItem(' + i + ',\'down\')"' + (i === items.length - 1 ? ' disabled' : '') + '>â†“</button><button class="btn-action btn-reposition" onclick="repositionItem(' + i + ')">#</button><button class="btn-action btn-delete" onclick="removeItem(' + i + ')">Del</button></div></td></tr>';
    }
    var subtotal = items.reduce(function(sum, item) { return sum + item.lineTotal; }, 0);
    var vat = subtotal * 0.20;
    var total = subtotal + vat;
    html += '<tr class="total-row"><td colspan="4" class="text-right">Subtotal:</td><td class="text-right">Â£' + subtotal.toFixed(2) + '</td><td></td></tr>';
    html += '<tr class="total-row"><td colspan="4" class="text-right">VAT (20%):</td><td class="text-right">Â£' + vat.toFixed(2) + '</td><td></td></tr>';
    html += '<tr class="total-row"><td colspan="4" class="text-right" style="font-size:16px"><strong>TOTAL:</strong></td><td class="text-right" style="font-size:16px"><strong>Â£' + total.toFixed(2) + '</strong></td><td></td></tr>';
    tbody.innerHTML = html;
}

function previewQuote() {
    if (editingIndex >= 0) { alert('Save or cancel edit first'); return; }
    var company = window.omegaUserData || { companyName: 'Your Company', address: '', phone: '', email: '', logo: null };
    var clientName = document.getElementById('clientName').value || '[Client Name]';
    var clientPhone = document.getElementById('clientPhone').value;
    var clientEmail = document.getElementById('clientEmail').value;
    var projectAddress = document.getElementById('projectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('projectPostcode').value;
    var customerId = document.getElementById('customerId').value || 'N/A';
    var depositPercent = document.getElementById('depositPercent').value || '30';
    var customNotes = document.getElementById('customNotes').value.trim();
    var today = new Date();
    var quoteDate = today.toLocaleDateString('en-GB');
    var expiryDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    var estNumber = String(estimateNumber).padStart(4, '0');
    var subtotal = items.reduce(function(sum, item) { return sum + item.lineTotal; }, 0);
    var vat = subtotal * 0.20;
    var total = subtotal + vat;
    var sortedItems = sortItemsByCategory(items);
    var groupedItems = groupItemsByCategory(sortedItems);
    var companyAddressLines = company.address ? company.address.split(',').join('<br>') : '';

    var previewHtml = '<style>*{margin:0;padding:0;box-sizing:border-box}.est-prev{font-family:Arial,sans-serif;background:#fff;padding:30px}.hdr-prev{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #333}.co-info{flex:1}.co-name{font-size:24px;font-weight:bold;margin-bottom:10px;color:#333}.co-det{font-size:11px;line-height:1.6;color:#666}.logo-prev{width:120px;height:auto;max-height:80px;object-fit:contain}.est-ban{background:linear-gradient(135deg,#bc9c22,#d4af37);padding:15px 20px;margin-bottom:25px;display:inline-block;font-weight:bold;font-size:16px;color:#fff}.info-sec{display:flex;justify-content:space-between;margin-bottom:30px;gap:50px}.info-row{font-size:13px;line-height:2;display:flex}.info-lbl{color:#333;font-weight:bold;margin-right:10px;min-width:80px}.info-val{color:#333}.exp-date{background:linear-gradient(135deg,#bc9c22,#d4af37);padding:5px 10px;color:#fff}.items-tbl{width:100%;border-collapse:collapse;margin:30px 0}.items-tbl thead{background:#f5f5f5}.items-tbl th{padding:12px;text-align:left;font-size:12px;font-weight:bold;color:#333;border-bottom:2px solid #ddd}.items-tbl th:nth-child(2),.items-tbl th:nth-child(3),.items-tbl th:nth-child(4){text-align:right;width:100px}.items-tbl td{padding:12px;font-size:13px;border-bottom:1px solid #eee;color:#333}.items-tbl td:nth-child(2),.items-tbl td:nth-child(3),.items-tbl td:nth-child(4){text-align:right}.cat-row{background:#f9f9f9;font-weight:bold}.cat-row td{padding:10px 12px;border-bottom:2px solid #ddd}.notes-sec{margin:30px 0;padding:20px;background:#f9f9f9;border-left:3px solid #bc9c22}.notes-sec h3{font-size:13px;margin-bottom:10px;color:#333}.notes-sec ol{margin-left:20px;font-size:12px;line-height:1.8;color:#666}.totals-sec{margin-top:30px;display:flex;justify-content:flex-end}.totals-box{width:300px}.tot-row{display:flex;justify-content:space-between;padding:10px 15px;font-size:13px}.tot-row.sub{border-top:1px solid #ddd}.tot-row.vat{color:#666}.tot-row.final{background:linear-gradient(135deg,#bc9c22,#d4af37);color:#fff;font-weight:bold;font-size:16px;margin-top:5px}.footer-note{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;text-align:center;font-size:11px;color:#666;font-style:italic}.thank-you{margin-top:15px;font-weight:bold;color:#333;font-size:12px}</style>';
    previewHtml += '<div class="est-prev"><div class="hdr-prev"><div class="co-info"><div class="co-name">' + company.companyName + '</div><div class="co-det">' + companyAddressLines + '<br>' + company.phone + '<br>' + company.email + '</div></div>' + (company.logo ? '<img src="' + company.logo + '" class="logo-prev">' : '') + '</div>';
    previewHtml += '<div class="est-ban">Estimate for</div><div class="info-sec"><div><div class="info-row"><span class="info-lbl">Name:</span><span class="info-val">' + clientName + '</span></div><div class="info-row"><span class="info-lbl">Address:</span><span class="info-val">' + projectAddress + '</span></div><div class="info-row"><span class="info-lbl">Postcode:</span><span class="info-val">' + (projectPostcode || 'N/A') + '</span></div><div class="info-row"><span class="info-lbl">Phone:</span><span class="info-val">' + (clientPhone || 'N/A') + '</span></div>' + (clientEmail ? '<div class="info-row"><span class="info-lbl">Email:</span><span class="info-val">' + clientEmail + '</span></div>' : '') + '</div>';
    previewHtml += '<div><div class="info-row"><span class="info-lbl">Date:</span><span class="info-val">' + quoteDate + '</span></div><div class="info-row"><span class="info-lbl">Estimate #:</span><span class="info-val">' + estNumber + '</span></div><div class="info-row"><span class="info-lbl">Customer ID:</span><span class="info-val">' + customerId + '</span></div><div class="info-row"><span class="info-lbl">Expiry:</span><span class="exp-date">' + expiryDate + '</span></div></div></div>';
    previewHtml += '<table class="items-tbl"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>';
    categoryOrder.forEach(function(cat) {
        if (groupedItems[cat]) {
            previewHtml += '<tr class="cat-row"><td colspan="4"><strong>' + cat + '</strong></td></tr>';
            groupedItems[cat].forEach(function(item) {
                previewHtml += '<tr><td>' + item.description + '</td><td>' + item.quantity + '</td><td>Â£' + item.unitPrice.toFixed(2) + '</td><td>Â£' + item.lineTotal.toFixed(2) + '</td></tr>';
            });
        }
    });
    previewHtml += '</tbody></table>';
    previewHtml += '<div class="notes-sec"><h3>Notes:</h3><ol><li>Estimate valid for 31 days</li><li>Payment of ' + depositPercent + '% required to secure start date</li><li>Parking to be supplied by customer</li><li>Any extras charged accordingly</li></ol>' + (customNotes ? '<div style="margin-top:15px;font-size:12px;line-height:1.8;color:#666"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : '') + '</div>';
    previewHtml += '<div class="totals-sec"><div class="totals-box"><div class="tot-row sub"><span>Subtotal</span><span>Â£' + subtotal.toFixed(2) + '</span></div><div class="tot-row vat"><span>VAT</span><span>Â£' + vat.toFixed(2) + '</span></div><div class="tot-row final"><span>Total</span><span>Â£' + total.toFixed(2) + '</span></div></div></div>';
    previewHtml += '<div class="footer-note">Questions? Contact ' + company.email + (company.phone ? ' or ' + company.phone : '') + '<div class="thank-you">Thank you for your business</div></div></div>';
    document.getElementById('previewBody').innerHTML = previewHtml;
    document.getElementById('previewModal').style.display = 'block';
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; }
window.onclick = function(e) { if (e.target == document.getElementById('previewModal')) closePreview(); };
