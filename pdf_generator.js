// PDFShift API Configuration
const PDFSHIFT_API_KEY = 'sk_baa46c861371ec5f60ab2e83221fdac1ccce517b';

// Get user data for personalised documents
function getUserCompanyData() {
    const userData = window.omegaUserData;
    
    if (userData) {
        return {
            companyName: userData.companyName || 'Your Company',
            address: userData.address || '',
            phone: userData.phone || '',
            email: userData.email || '',
            logo: userData.logo || null,
            bankDetails: userData.bankDetails || null
        };
    }
    
    // Fallback to default (shouldn't happen if auth is working)
    return {
        companyName: 'Your Company',
        address: '',
        phone: '',
        email: '',
        logo: null,
        bankDetails: null
    };
}

// Generate complete HTML for PDF conversion
function generateCompleteHTML() {
    // Get user's company data
    const company = getUserCompanyData();
    
    var clientName = document.getElementById('clientName').value || '[Client Name]';
    var clientPhone = document.getElementById('clientPhone').value;
    var clientEmail = document.getElementById('clientEmail').value;
    var projectAddress = document.getElementById('projectAddress').value || '[Project Address]';
    var projectPostcode = document.getElementById('projectPostcode').value;
    var customerId = document.getElementById('customerId').value || 'N/A';
    var depositPercent = document.getElementById('depositPercent').value || '30';
    var customNotes = document.getElementById('customNotes').value.trim();
    
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

    // Sort items by category
    var sortedItems = sortItemsByCategory(items);
    var groupedItems = groupItemsByCategory(sortedItems);

    // Format address for display
    var companyAddressLines = company.address.split('\n').join('<br>');
    if (!companyAddressLines) {
        companyAddressLines = company.address.split(',').join('<br>');
    }

    var styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        background: #f5f5f5;
        padding: 20px;
      }
      .estimate-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #333;
      }
      .company-info {
        flex: 1;
      }
      .company-name {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
      }
      .company-name .highlight {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .company-details {
        font-size: 11px;
        line-height: 1.6;
        color: #666;
      }
      .logo {
        width: 120px;
        height: auto;
        max-height: 80px;
        object-fit: contain;
      }
      .estimate-banner {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        padding: 15px 20px;
        margin-bottom: 25px;
        display: inline-block;
        font-weight: bold;
        font-size: 16px;
        color: white;
      }
      .info-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        align-items: flex-start;
        gap: 100px;
      }
      .client-info {
        flex: 0 0 auto;
      }
      .estimate-details {
        flex: 0 0 auto;
      }
      .info-row {
        font-size: 13px;
        line-height: 2;
        display: flex;
        align-items: center;
      }
      .info-label {
        color: #333;
        font-weight: bold;
        margin-right: 10px;
        min-width: 80px;
      }
      .info-value {
        color: #333;
        font-weight: normal;
      }
      .expiry-date {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        padding: 5px 10px;
        display: inline-block;
        color: white;
        font-weight: normal;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
      }
      .items-table thead {
        background: #f5f5f5;
      }
      .items-table th {
        padding: 12px;
        text-align: left;
        font-size: 12px;
        font-weight: bold;
        color: #333;
        border-bottom: 2px solid #ddd;
      }
      .items-table th:nth-child(2),
      .items-table th:nth-child(3),
      .items-table th:nth-child(4) {
        text-align: right;
        width: 100px;
      }
      .items-table td {
        padding: 12px;
        font-size: 13px;
        border-bottom: 1px solid #eee;
        color: #333;
      }
      .items-table td:nth-child(2),
      .items-table td:nth-child(3),
      .items-table td:nth-child(4) {
        text-align: right;
      }
      .category-row {
        background: #f9f9f9;
        font-weight: bold;
        color: #333;
      }
      .category-row td {
        padding: 10px 12px;
        border-bottom: 2px solid #ddd;
      }
      .notes-section {
        margin: 30px 0;
        padding: 20px;
        background: #f9f9f9;
        border-left: 3px solid #bc9c22;
      }
      .notes-section h3 {
        font-size: 13px;
        margin-bottom: 10px;
        color: #333;
      }
      .notes-section ol {
        margin-left: 20px;
        font-size: 12px;
        line-height: 1.8;
        color: #666;
      }
      .totals-section {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
      }
      .totals-box {
        width: 300px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 15px;
        font-size: 13px;
      }
      .total-row.subtotal {
        border-top: 1px solid #ddd;
      }
      .total-row.vat {
        color: #666;
      }
      .total-row.final {
        background: linear-gradient(135deg, #bc9c22, #d4af37);
        color: white;
        font-weight: bold;
        font-size: 16px;
        border-top: 2px solid #333;
        margin-top: 5px;
      }
      .footer-note {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 11px;
        color: #666;
        font-style: italic;
      }
      .thank-you {
        margin-top: 15px;
        font-weight: bold;
        color: #333;
        font-size: 12px;
      }
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .estimate-container {
          box-shadow: none;
          padding: 20px;
        }
      }
    </style>
  `;

    var bodyContent = `
    <div class="estimate-container">
      <div class="header">
        <div class="company-info">
          <div class="company-name">${company.companyName}</div>
          <div class="company-details">
            ${companyAddressLines}<br>
            ${company.phone}<br>
            ${company.email}
          </div>
        </div>
        <div class="logo-container">
          ${company.logo 
            ? `<img src="${company.logo}" alt="${company.companyName} Logo" class="logo">`
            : ''
          }
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
          ${clientEmail ? '<div class="info-row"><span class="info-label">Email:</span><span class="info-value">' + clientEmail + '</span></div>' : ''}
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

    // Render items grouped and sorted by category
    categoryOrder.forEach(function(category) {
        if (groupedItems[category]) {
            bodyContent += `
          <tr class="category-row">
            <td colspan="4"><strong>${category}</strong></td>
          </tr>`;
            
            groupedItems[category].forEach(function(item) {
                bodyContent += `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>Â£${item.unitPrice.toFixed(2)}</td>
            <td>Â£${item.lineTotal.toFixed(2)}</td>
          </tr>`;
            });
        }
    });

    bodyContent += `
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
      ${customNotes ? '<div style="margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666;"><strong>Additional Notes:</strong><br>' + customNotes.replace(/\n/g, '<br>') + '</div>' : ''}
    </div>
    
      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row subtotal">
            <span>Subtotal</span>
            <span>Â£${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row vat">
            <span>VAT</span>
            <span>Â£${vat.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Total</span>
            <span>Â£${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer-note">
        If you have any questions about this estimate, please contact<br>
        us at ${company.email}${company.phone ? ', or ' + company.phone : ''}
        <div class="thank-you">Thank you for your business</div>
      </div>
    </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate - ${company.companyName}</title>
  ${styles}
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

// Download PDF using PDFShift API
async function downloadQuote() {
    if (items.length === 0) {
        alert('Please add items to the quote first');
        return;
    }

    var downloadBtn = event.target;
    var originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Generating PDF...';
    downloadBtn.disabled = true;

    try {
        var htmlContent = generateCompleteHTML();
        var clientName = document.getElementById('clientName').value || 'Client';
        var estNumber = String(estimateNumber).padStart(4, '0');
        var sanitizedClientName = clientName.replace(/[^a-z0-9]/gi, '_');
        var filename = 'Estimate_' + estNumber + '_' + sanitizedClientName + '.pdf';

        console.log('Sending request to PDFShift...');

        var response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa('api:' + PDFSHIFT_API_KEY),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: htmlContent,
                landscape: false,
                use_print: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px'
                }
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            var errorData;
            try {
                errorData = await response.json();
                console.error('PDFShift error response:', errorData);
            } catch (e) {
                errorData = { error: await response.text() || 'Unknown error' };
            }

            if (response.status === 401) {
                throw new Error('Authentication failed. Please check your PDFShift API key.');
            } else if (response.status === 403) {
                throw new Error('Access forbidden. Your API key may not have permission.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. You may have used your free tier quota (250 PDFs/month).');
            } else if (response.status === 400) {
                throw new Error('Bad Request: ' + (errorData.error || errorData.message || 'Invalid request'));
            } else {
                throw new Error((errorData.error || errorData.message) || 'API Error (' + response.status + '): ' + response.statusText);
            }
        }

        console.log('Receiving PDF from PDFShift...');
        var blob = await response.blob();

        if (blob.size === 0) {
            throw new Error('Received empty PDF from server');
        }

        console.log('PDF blob size:', blob.size, 'bytes');

        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(function() {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

        console.log('PDF downloaded successfully!');
        
        localStorage.setItem('traderBrosEstimateCount', estimateNumber);
        estimateNumber++;
        updateEstimateCounter();

        setTimeout(function() {
            alert('PDF downloaded successfully!\n\nFile: ' + filename);
        }, 200);

    } catch (error) {
        console.error('Error generating PDF:', error);
        console.error('Error stack:', error.stack);

        var errorMessage = 'Error generating PDF\n\n';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Network Error - Cannot connect to PDFShift API.\n\n';
            errorMessage += 'Please check:\n';
            errorMessage += 'â€¢ Your internet connection\n';
            errorMessage += 'â€¢ Firewall or browser extensions blocking the request\n';
            errorMessage += 'â€¢ Try using a different browser\n\n';
            errorMessage += 'Technical details are in the console (press F12)';
        } else {
            errorMessage += error.message;
            errorMessage += '\n\nCheck console for more details (press F12)';
        }
        alert(errorMessage);

    } finally {
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}
