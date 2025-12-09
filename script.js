var items = [];
var currentRateType = 'job';
var estimateNumber = 1;

var tradeRates = {
    'Downtakings': { hourly: 30, daily: 220, job: 0 },
    'General Building': { hourly: 30, daily: 230, job: 0 },
    'Building work': { hourly: 30, daily: 230, job: 0 },
    'Carpentry': { hourly: 32, daily: 240, job: 0 },
    'Joinery': { hourly: 32, daily: 240, job: 0 },
    'Electrical': { hourly: 45, daily: 320, job: 200 },
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

if (localStorage.getItem('traderBrosEstimateCount')) {
    estimateNumber = parseInt(localStorage.getItem('traderBrosEstimateCount')) + 1;
}
updateEstimateCounter();

function updateEstimateCounter() {
    document.getElementById('estimateCounter').textContent = '#' + String(estimateNumber).padStart(4, '0');
}

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
    
    document.getElementById('description').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('unitPrice').value = '';
    document.getElementById('customUnit').value = '';
    document.getElementById('tradeCategory').selectedIndex = 0;
    document.getElementById('tradeRateInfo').textContent = '';
}

function removeItem(index) {
    items.splice(index, 1);
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
        html += '<td class="text-center"><button class="btn-delete" onclick="removeItem(' + i + ')">Delete</button></td>';
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

    var previewHtml = '<div class="estimate-container">';
    
    // Header matching template
    previewHtml += '<div class="preview-header">';
    previewHtml += '<div class="company-info">';
    previewHtml += '<div class="company-name">TR<span class="highlight">A</span>DER BROTHERS LTD</div>';
    previewHtml += '<div class="company-details">';
    previewHtml += '8 Craigour Terrace<br>';
    previewHtml += 'Edinburgh, EH17 7PB<br>';
    previewHtml += '07979309957<br>';
    previewHtml += 'traderbrotherslimited@gmail.com';
    previewHtml += '</div></div>';
    previewHtml += '<div class="logo-container">';
    previewHtml += '<img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo">';
    previewHtml += '</div></div>';

    // Estimate banner
    previewHtml += '<div class="estimate-banner">Estimate for</div>';

    // Info section
    previewHtml += '<div class="info-section">';
    previewHtml += '<div class="client-info">';
    previewHtml += '<h3>' + clientName + '</h3>';
    previewHtml += '<p>';
    previewHtml += projectAddress;
    if (clientPhone) previewHtml += '<br>' + clientPhone;
    previewHtml += '</p></div>';
    
    previewHtml += '<div class="estimate-details">';
    previewHtml += '<table class="details-table">';
    previewHtml += '<tr><td class="detail-label">Date:</td><td class="detail-value">' + quoteDate + '</td></tr>';
    previewHtml += '<tr><td class="detail-label">Estimate #:</td><td class="detail-value">' + estNumber + '</td></tr>';
    previewHtml += '<tr><td class="detail-label">Customer Ref:</td><td class="detail-value">' + customerId + '</td></tr>';
    previewHtml += '<tr><td class="detail-label">Expiry Date:</td><td class="expiry-date">' + expiryDate + '</td></tr>';
    previewHtml += '</table></div></div>';

    // Items table
    previewHtml += '<table class="items-table">';
    previewHtml += '<thead><tr>';
    previewHtml += '<th>Description</th>';
    previewHtml += '<th>Qty</th>';
    previewHtml += '<th>Unit price</th>';
    previewHtml += '<th>Total price</th>';
    previewHtml += '</tr></thead><tbody>';

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        previewHtml += '<tr>';
        previewHtml += '<td>' + item.description + '</td>';
        previewHtml += '<td>' + item.quantity + '</td>';
        previewHtml += '<td>£' + item.unitPrice.toFixed(2) + '</td>';
        previewHtml += '<td>£' + item.lineTotal.toFixed(2) + '</td>';
        previewHtml += '</tr>';
    }

    previewHtml += '</tbody></table>';

    // Notes section
    previewHtml += '<div class="notes-section">';
    previewHtml += '<h3>Notes:</h3>';
    previewHtml += '<ol>';
    previewHtml += '<li>Estimate valid for 31 days</li>';
    previewHtml += '<li>Payment of ' + depositPercent + '% is required to secure start date</li>';
    previewHtml += '<li>Pending to be supplied by customer</li>';
    previewHtml += '<li>Any extras to be charged accordingly</li>';
    var customNotes = document.getElementById('customNotes').value;
    if (customNotes) {
        previewHtml += '<li>' + customNotes + '</li>';
    }
    previewHtml += '</ol></div>';

    // Totals section
    previewHtml += '<div class="totals-section">';
    previewHtml += '<div class="totals-box">';
    previewHtml += '<div class="total-row-preview subtotal"><span>Subtotal</span><span>£' + subtotal.toFixed(2) + '</span></div>';
    previewHtml += '<div class="total-row-preview vat"><span>VAT</span><span>£' + vat.toFixed(2) + '</span></div>';
    previewHtml += '<div class="total-row-preview final"><span>Total</span><span>£' + total.toFixed(2) + '</span></div>';
    previewHtml += '</div></div>';

    // Footer note
    previewHtml += '<div class="footer-note">';
    previewHtml += 'If you have any questions about this estimate, please contact<br>';
    previewHtml += 'Trader Brothers on 07448835577';
    previewHtml += '<div class="thank-you">Thank you for your business</div>';
    previewHtml += '</div>';

    previewHtml += '</div>';

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
