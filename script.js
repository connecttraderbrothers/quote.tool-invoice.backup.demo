var items = [];
var currentRateType = 'job';
var estimateNumber = 1;

// Edinburgh 2025 standard trade rates
var tradeRates = {
    'Downtakings': { hourly: 25, daily: 300, job: 500 },
    'General Building': { hourly: 30, daily: 230, job: 0 },
    'Building work': { hourly: 30, daily: 230, job: 0 },
    'Carpentry': { hourly: 30, daily: 250, job: 800 },
    'Joinery': { hourly: 35, daily: 350, job: 700 },
    'Electricals': { hourly: 60, daily: 500, job: 700 },
    'Plumbing': { hourly: 55, daily: 450, job: 600 },
    'Gas work/Plumbing': { hourly: 60, daily: 500, job: 900 },
    'Plastering': { hourly: 35, daily: 300, job: 0 },
    'Skimming /Painting': { hourly: 30, daily: 250, job: 1000 },
    'Painting & Decorating': { hourly: 28, daily: 220, job: 750 },
    'Tiling': { hourly: 32, daily: 300, job: 1000 },
    'Roofing': { hourly: 35, daily: 350, job: 0 },
    'Kitchen Fitting': { hourly: 32, daily: 300, job: 3500 },
    'Bathroom Fitting': { hourly: 32, daily: 300, job: 5000 },
    'Flooring': { hourly: 28, daily: 300, job: 650 },
    'Bricklaying': { hourly: 35, daily: 400, job: 0 },
    'HVAC': { hourly: 40, daily: 300, job: 1500 },
    'Groundworks': { hourly: 30, daily: 230, job: 0 },
    'Scaffolding': { hourly: 0, daily: 250, job: 1000 },
    'Glazing': { hourly: 40, daily: 500, job: 1200 },
    'Insulation': { hourly: 40, daily: 375, job: 750 },
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
            customerId = firstName + '-' + lastName + '-' + randomNum;
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
    var projectPostcode = document.getElementById('projectPostcode').value;
    var customerId = document.getElementById('customerId').value || 'N/A';
    var depositPercent = document.getElementById('depositPercent').value || '30';
    
    var today = new Date();
    var quoteDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    var expiryDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
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
      body { font-family: Arial, sans-serif; background: #f5f5f5; }
      .estimate-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
      .company-info { flex: 1; }
      .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
      .company-name .highlight { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .company-details { font-size: 11px; line-height: 1.6; color: #666; }
      .logo { width: 120px; height: auto; }
      .estimate-banner { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; margin-bottom: 25px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }
      .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; gap: 100px; }
      .client-info { flex: 0 0 auto; }
      .estimate-details { flex: 0 0 auto; }
      .info-row { font-size: 13px; line-height: 2; display: flex; align-items: center; }
      .info-label { color: #333; font-weight: bold; margin-right: 10px; min-width: 80px; }
      .info-value { color: #333; font-weight: normal; }
      .expiry-date { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: normal; }
      .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
      .items-table thead { background: #f0f0f0; }
      .items-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
      .items-table th:nth-child(2), .items-table th:nth-child(3), .items-table th:nth-child(4) { text-align: right; width: 100px; }
      .items-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }
      .items-table td:nth-child(2), .items-table td:nth-child(3), .items-table td:nth-child(4) { text-align: right; }
      .notes-section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }
      .notes-section h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
      .notes-section ol { margin-left: 20px; font-size: 12px; line-height: 1.8; color: #666; }
      .totals-section { margin-top: 30px; display: flex; justify-content: flex-end; }
      .totals-box { width: 300px; }
      .total-row { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }
      .total-row.subtotal { border-top: 1px solid #ddd; }
      .total-row.vat { color: #666; }
      .total-row.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }
      .footer-note { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }
      .thank-you { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }
    </style>
    <div class="estimate-container">
      <div class="header">
        <div class="company-info">
          <div class="company-name">TR<span class="highlight">A</span>DER BROTHERS LTD</div>
          <div class="company-details">
            8 Craigour Terrace<br>
            Edinburgh, EH17 7PB<br>
            07931 810557<br>
            traderbrotherslimited@gmail.com
          </div>
        </div>
        <div class="logo-container">
          <img src="https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true" alt="Trader Brothers Logo" class="logo">
        </div>
      </div>

      <div class="estimate-banner">Estimate for</div>

      <div class="info-section">
        <div class="client-info">
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${clientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${projectAddress}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Postcode:</span>
            <span class="info-value">${projectPostcode || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${clientPhone || 'N/A'}</span>
          </div>
        </div>

        <div class="estimate-details">
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${quoteDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estimate #:</span>
            <span class="info-value">${estNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer ID:</span>
            <span class="info-value">${customerId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Expiry Date:</span>
            <span class="expiry-date">${expiryDate}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
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

      <div class="notes-section">
        <h3>Notes:</h3>
        <ol>
          <li>Estimate valid for 30 days</li>
          <li>Payment of ${depositPercent}% is required to secure start date</li>
          <li>Parking to be supplied by customer</li>
          <li>Any additional work to be charged accordingly</li>
        </ol>
      </div>

      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row subtotal">
            <span>Subtotal</span>
            <span>£${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row vat">
            <span>VAT</span>
            <span>£${vat.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Total</span>
            <span>£${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer-note">
        If you have any questions about this estimate, please contact<br>
        us at traderbrotherslimited@gmail.com, or 07931 810557
        <div class="thank-you">Thank you for your business</div>
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
