var items = [];
var currentRateType = 'job';
var estimateNumber = 1;
var editingIndex = -1;

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
    document.getElementById('estimateCounter').textContent = '#' + String(estimateNumber).padStart(4, '0');
}

// Auto-generate Customer ID from client name
document.getElementById('clientName').addEventListener('input', function() {
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
        
        document.getElementById('customerId').value = customerId;
    } else {
        document.getElementById('customerId').value = '';
    }
});

// Trade category change handler
document.getElementById('tradeCategory').addEventListener('change', function() {
    var selectedTrade = this.value;
    var rateInfo = document.getElementById('tradeRateInfo');
    
    if (selectedTrade && tradeRates[selectedTrade]) {
        var rates = tradeRates[selectedTrade];
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
        
        updatePriceFromTrade();
    } else {
        rateInfo.textContent = '';
        document.getElementById('unitPrice').value = '';
    }
});

function updatePriceFromTrade() {
    var selectedTrade = document.getElementById('tradeCategory').value;
    if (selectedTrade && tradeRates[selectedTrade]) {
        var rates = tradeRates[selectedTrade];
        var price = 0;
        
        if (currentRateType === 'hourly' && rates.hourly > 0) {
            price = rates.hourly;
        } else if (currentRateType === 'daily' && rates.daily > 0) {
            price = rates.daily;
        } else if (currentRateType === 'job' && rates.job > 0) {
            price = rates.job;
        }
        
        if (price > 0) {
            document.getElementById('unitPrice').value = price;
        }
    }
}

// Rate type selector
document.querySelectorAll('.rate-type-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.rate-type-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentRateType = this.getAttribute('data-type');
        
        var customUnitGroup = document.getElementById('customUnitGroup');
        var rateLabel = document.getElementById('rateLabel');
        
        if (currentRateType === 'custom') {
            customUnitGroup.classList.remove('hidden');
            rateLabel.textContent = 'Unit Price (£) *';
        } else if (currentRateType === 'daily') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Day Rate (£) *';
        } else if (currentRateType === 'job') {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Per Job Rate (£) *';
        } else {
            customUnitGroup.classList.add('hidden');
            rateLabel.textContent = 'Hourly Rate (£) *';
        }
        
        updatePriceFromTrade();
    });
});

function addItem() {
    var category = document.getElementById('tradeCategory').value || 'General';
    var description = document.getElementById('description').value;
    var quantity = parseFloat(document.getElementById('quantity').value);
    var unitPrice = parseFloat(document.getElementById('unitPrice').value);
    var customUnit = document.getElementById('customUnit').value;

    if (!description || !unitPrice) {
        alert('Please enter description and unit price');
        return;
    }

    var unit = '';
    if (currentRateType === 'hourly') {
        unit = 'hour';
    } else if (currentRateType === 'daily') {
        unit = 'day';
    } else if (currentRateType === 'job') {
        unit = 'job';
    } else {
        unit = customUnit || 'item';
    }

    var lineTotal = unitPrice * quantity;

    items.push({
        category: category,
        description: description,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    });

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
    // Cancel any existing edit
    if (editingIndex >= 0) {
        cancelEdit();
    }
    
    editingIndex = index;
    var item = items[index];
    
    // Build select options for category
    var categoryOptions = '';
    var categories = Object.keys(tradeRates);
    categories.unshift('General');
    for (var i = 0; i < categories.length; i++) {
        var selected = categories[i] === item.category ? 'selected' : '';
        categoryOptions += '<option value="' + categories[i] + '" ' + selected + '>' + categories[i] + '</option>';
    }
    
    var row = document.getElementById('quoteItems').rows[index];
    row.classList.add('editing-row');
    row.innerHTML = `
        <td>
            <select class="inline-edit-input" id="edit-category-${index}" style="width: 100%;">
                ${categoryOptions}
            </select>
        </td>
        <td>
            <input type="text" class="inline-edit-input" id="edit-description-${index}" value="${item.description}" style="width: 100%;">
        </td>
        <td class="text-center">
            <input type="number" class="inline-edit-input" id="edit-quantity-${index}" value="${item.quantity}" step="0.1" min="0.1" style="width: 80px;">
        </td>
        <td class="text-right">
            <input type="number" class="inline-edit-input" id="edit-price-${index}" value="${item.unitPrice}" step="0.01" min="0" style="width: 100px;">
        </td>
        <td class="text-right" style="font-weight: 600;">£${item.lineTotal.toFixed(2)}</td>
        <td class="text-center">
            <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-action btn-save" onclick="saveEdit(${index})" title="Save">Save</button>
                <button class="btn-action btn-cancel" onclick="cancelEdit()" title="Cancel">Cancel</button>
            </div>
        </td>
    `;
    
    // Auto-update total when quantity or price changes
    document.getElementById('edit-quantity-' + index).addEventListener('input', function() {
        updateEditTotal(index);
    });
    document.getElementById('edit-price-' + index).addEventListener('input', function() {
        updateEditTotal(index);
    });
}

function updateEditTotal(index) {
    var quantity = parseFloat(document.getElementById('edit-quantity-' + index).value) || 0;
    var price = parseFloat(document.getElementById('edit-price-' + index).value) || 0;
    var total = quantity * price;
    
    var row = document.getElementById('quoteItems').rows[index];
    row.cells[4].textContent = '£' + total.toFixed(2);
}

function saveEdit(index) {
    var category = document.getElementById('edit-category-' + index).value;
    var description = document.getElementById('edit-description-' + index).value;
    var quantity = parseFloat(document.getElementById('edit-quantity-' + index).value);
    var unitPrice = parseFloat(document.getElementById('edit-price-' + index).value);
    
    if (!description || !unitPrice || !quantity) {
        alert('Please fill in all fields');
        return;
    }
    
    var lineTotal = unitPrice * quantity;
    
    items[index] = {
        category: category,
        description: description,
        quantity: quantity,
        unit: items[index].unit,
        unitPrice: unitPrice,
        lineTotal: lineTotal
    };
    
    editingIndex = -1;
    updateQuoteTable();
}

function cancelEdit() {
    editingIndex = -1;
    updateQuoteTable();
}

function removeItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        items.splice(index, 1);
        editingIndex = -1;
        updateQuoteTable();
    }
}

function moveItem(index, direction) {
    if (editingIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    if (direction === 'up' && index > 0) {
        var temp = items[index];
        items[index] = items[index - 1];
        items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
        var temp = items[index];
        items[index] = items[index + 1];
        items[index + 1] = temp;
    }
    updateQuoteTable();
}

function repositionItem(index) {
    if (editingIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var newPosition = prompt('Enter new position (1 to ' + items.length + '):', (index + 1));
    if (newPosition === null) return;
    
    newPosition = parseInt(newPosition);
    if (isNaN(newPosition) || newPosition < 1 || newPosition > items.length) {
        alert('Invalid position. Please enter a number between 1 and ' + items.length);
        return;
    }
    
    var item = items.splice(index, 1)[0];
    items.splice(newPosition - 1, 0, item);
    updateQuoteTable();
}

function updateQuoteTable() {
    var tbody = document.getElementById('quoteItems');
    var quoteSection = document.getElementById('quoteSection');
    var generateSection = document.getElementById('generateSection');

    if (items.length === 0) {
        quoteSection.style.display = 'none';
        generateSection.style.display = 'none';
        return;
    }

    quoteSection.style.display = 'block';
    generateSection.style.display = 'block';

    var html = '';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        html += '<tr>';
        html += '<td>' + item.category + '</td>';
        html += '<td>' + item.description + '</td>';
        html += '<td class="text-center">' + item.quantity + '</td>';
        html += '<td class="text-right">£' + item.unitPrice.toFixed(2) + '</td>';
        html += '<td class="text-right" style="font-weight: 600;">£' + item.lineTotal.toFixed(2) + '</td>';
        html += '<td class="text-center">';
        html += '<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">';
        html += '<button class="btn-action btn-edit" onclick="editItem(' + i + ')" title="Edit">Edit</button>';
        html += '<button class="btn-action btn-move" onclick="moveItem(' + i + ', \'up\')" title="Move Up" ' + (i === 0 ? 'disabled' : '') + '>↑</button>';
        html += '<button class="btn-action btn-move" onclick="moveItem(' + i + ', \'down\')" title="Move Down" ' + (i === items.length - 1 ? 'disabled' : '') + '>↓</button>';
        html += '<button class="btn-action btn-reposition" onclick="repositionItem(' + i + ')" title="Move to Position">#</button>';
        html += '<button class="btn-action btn-delete" onclick="removeItem(' + i + ')" title="Delete">Del</button>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
    }

    var subtotal = 0;
    for (var j = 0; j < items.length; j++) {
        subtotal += items[j].lineTotal;
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

function previewQuote() {
    if (editingIndex >= 0) {
        alert('Please save or cancel your current edit first');
        return;
    }
    
    var clientName = document.getElementById('clientName').value || '[Client Name]';
    var clientPhone = document.getElementById('clientPhone').value;
    var projectAddress = document.getElementById('projectAddress').value || '[Project Address]';
    var customerId = document.getElementById('customerId').value || 'N/A';
    var depositPercent = document.getElementById('depositPercent').value || '30';
    
    var today = new Date();
    var quoteDate = today.toLocaleDateString('en-GB');
    var expiryDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    var estNumber = String(estimateNumber).padStart(4, '0');
    
    var subtotal = 0;
    for (var j = 0; j < items.length; j++) {
        subtotal += items[j].lineTotal;
    }
    var vat = subtotal * 0.20;
    var total = subtotal + vat;

    var previewHtml = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      .estimate-container-preview { font-family: Arial, sans-serif; background: white; padding: 30px; max-width: 100%; }
      .header-preview { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
      .company-info-preview { flex: 1; }
      .company-name-preview { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
      .company-name-preview .highlight-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .company-details-preview { font-size: 11px; line-height: 1.6; color: #666; }
      .logo-preview { width: 120px; height: auto; }
      .estimate-banner-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; margin-bottom: 25px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }
      .info-section-preview { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .client-info-preview { flex: 1; }
      .client-info-preview h3 { font-size: 12px; color: #666; margin-bottom: 8px; }
      .client-info-preview p { font-size: 13px; line-height: 1.5; color: #333; }
      .estimate-details-preview { flex: 0 0 250px; }
      .details-table-preview { width: 100%; border-collapse: collapse; }
      .details-table-preview td { padding: 8px 10px; font-size: 13px; }
      .detail-label-preview { color: #666; text-align: left; width: 120px; }
      .detail-value-preview { font-weight: bold; color: #333; text-align: left; }
      .expiry-date-preview { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: bold; }
      .items-table-preview { width: 100%; border-collapse: collapse; margin: 30px 0; }
      .items-table-preview thead { background: #f5f5f5; }
      .items-table-preview th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
      .items-table-preview th:nth-child(2), .items-table-preview th:nth-child(3), .items-table-preview th:nth-child(4) { text-align: right; width: 100px; }
      .items-table-preview td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }
      .items-table-preview td:nth-child(2), .items-table-preview td:nth-child(3), .items-table-preview td:nth-child(4) { text-align: right; }
      .notes-section-preview { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }
      .notes-section-preview h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
      .notes-section-preview ol { margin-left: 20px; font-size: 12px; line-height: 1.8; color: #666; }
      .totals-section-preview { margin-top: 30px; display: flex; justify-content: flex-end; }
      .totals-box-preview { width: 300px; }
      .total-row-preview { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }
      .total-row-preview.subtotal { border-top: 1px solid #ddd; }
      .total-row-preview.vat { color: #666; }
      .total-row-preview.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }
      .footer-note-preview { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }
      .thank-you-preview { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }
    </style>
    <div class="estimate-container-preview">
      <div class="header-preview">
        <div class="company-info-preview">
          <div class="company-name-preview">TR<span class="highlight-preview">A</span>DER BROTHERS LTD</div>
          <div class="company-details-preview">
            8 Craigour Terrace<br>
            Edinburgh, EH17 7PB<br>
            07979309957<br>
            traderbrotherslimited@gmail.com
          </div>
        </div>
        <div class="logo-container-preview">
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo-preview">
        </div>
      </div>

      <div class="estimate-banner-preview">Estimate for</div>

      <div class="info-section-preview">
        <div class="client-info-preview">
          <div class="info-row-preview">
            <span class="info-label-preview">Name:</span>
            <span class="info-value-preview">${clientName}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Address:</span>
            <span class="info-value-preview">${projectAddress}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Postcode:</span>
            <span class="info-value-preview">${document.getElementById('projectPostcode').value || 'N/A'}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Phone:</span>
            <span class="info-value-preview">${clientPhone || 'N/A'}</span>
          </div>
        </div>

        <div class="estimate-details-preview">
          <div class="info-row-preview">
            <span class="info-label-preview">Date:</span>
            <span class="info-value-preview">${quoteDate}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Estimate #:</span>
            <span class="info-value-preview">${estNumber}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Customer ID:</span>
            <span class="info-value-preview">${customerId}</span>
          </div>
          <div class="info-row-preview">
            <span class="info-label-preview">Expiry Date:</span>
            <span class="expiry-date-preview">${expiryDate}</span>
          </div>
        </div>
      </div>

      <table class="items-table-preview">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total price</th>
          </tr>
        </thead>
        <tbody>`;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        previewHtml += `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>£${item.unitPrice.toFixed(2)}</td>
            <td>£${item.lineTotal.toFixed(2)}</td>
          </tr>`;
    }

    previewHtml += `
        </tbody>
      </table>

      <div class="notes-section-preview">
        <h3>Notes:</h3>
        <ol>
          <li>Estimate valid for 31 days</li>
          <li>Payment of ${depositPercent}% is required to secure start date</li>
          <li>Pending to be supplied by customer</li>
          <li>Any extras to be charged accordingly</li>
        </ol>
      </div>

      <div class="totals-section-preview">
        <div class="totals-box-preview">
          <div class="total-row-preview subtotal">
            <span>Subtotal</span>
            <span>£${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row-preview vat">
            <span>VAT</span>
            <span>£${vat.toFixed(2)}</span>
          </div>
          <div class="total-row-preview final">
            <span>Total</span>
            <span>£${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer-note-preview">
        If you have any questions about this estimate, please contact<br>
        Trader Brothers on 07448835577
        <div class="thank-you-preview">Thank you for your business</div>
      </div>
    </div>`;

    document.getElementById('previewBody').innerHTML = previewHtml;
    document.getElementById('previewModal').style.display = 'block';
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
}

window.onclick = function(event) {
    var modal = document.getElementById('previewModal');
    if (event.target == modal) {
        closePreview();
    }
}
