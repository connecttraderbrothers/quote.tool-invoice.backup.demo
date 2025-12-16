// PDFShift API Configuration
const PDFSHIFT_API_KEY = 'sk_baa46c861371ec5f60ab2e83221fdac1ccce517b';

// Generate complete HTML for PDF conversion
function generateCompleteHTML() {
    var clientName = document.getElementById('clientName').value || '[Client Name]';
    var clientPhone = document.getElementById('clientPhone').value;
    var projectName = document.getElementById('projectName').value || '[Project Name]';
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

    var categories = {};
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
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
        background: white;
        padding: 20px;
        color: #333;
      }
      .header {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #333;
        gap: 15px;
      }
      .logo {
        width: 50px;
        height: 50px;
        background: #fbbf24;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 20px;
        color: #1a1a1a;
        flex-shrink: 0;
      }
      .company-info {
        flex: 1;
      }
      .company-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
        color: #333;
      }
      .company-details {
        font-size: 10px;
        line-height: 1.6;
        color: #666;
      }
      .info-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
      }
      .client-info {
        flex: 1;
      }
      .client-info h3 {
        font-size: 11px;
        color: #666;
        margin-bottom: 8px;
        font-weight: bold;
      }
      .client-info p {
        font-size: 10px;
        line-height: 1.6;
        color: #333;
      }
      .estimate-details {
        flex: 0 0 200px;
        text-align: right;
      }
      .estimate-details div {
        font-size: 10px;
        margin-bottom: 4px;
      }
      .estimate-details strong {
        color: #666;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .items-table thead {
        background: #f5f5f5;
      }
      .items-table th {
        padding: 8px;
        text-align: left;
        font-size: 10px;
        font-weight: bold;
        color: #333;
        border: 1px solid #ddd;
      }
      .items-table td {
        padding: 6px 8px;
        font-size: 9px;
        border: 1px solid #ddd;
        color: #555;
      }
      .category-row {
        background: #fafafa;
        font-weight: bold;
      }
      .category-row td {
        font-size: 10px;
        font-weight: 600;
        color: #333;
      }
      .notes-section {
        margin: 20px 0;
        padding: 15px;
        background: #f9f9f9;
        border-left: 3px solid #fbbf24;
      }
      .notes-section h3 {
        font-size: 10px;
        margin-bottom: 8px;
        color: #333;
      }
      .notes-section div {
        font-size: 9px;
        line-height: 1.6;
        color: #666;
        margin-bottom: 3px;
      }
      .totals-section {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
      .totals-box {
        width: 250px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 10px;
        font-size: 10px;
      }
      .total-row.subtotal {
        border-top: 1px solid #ddd;
      }
      .total-row.final {
        background: #fbbf24;
        color: #1a1a1a;
        font-weight: bold;
        font-size: 12px;
        border-top: 2px solid #333;
        margin-top: 5px;
      }
      .footer-note {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 8px;
        color: #666;
      }
      .thank-you {
        margin-top: 10px;
        font-weight: bold;
        color: #333;
        font-size: 9px;
      }
    </style>
  `;

    var bodyContent = '<div class="header">';
    bodyContent += '<div class="logo">TB</div>';
    bodyContent += '<div class="company-info">';
    bodyContent += '<div class="company-name">TRADER BROTHERS LTD</div>';
    bodyContent += '<div class="company-details">';
    bodyContent += '8 Craigour Terrace<br>';
    bodyContent += 'Edinburgh, EH17 7PB<br>';
    bodyContent += '📞: 07979309957<br>';
    bodyContent += '✉: traderbrotherslimited@gmail.com';
    bodyContent += '</div></div></div>';

    bodyContent += '<div class="info-section">';
    bodyContent += '<div class="client-info">';
    bodyContent += '<h3>Estimate for</h3>';
    bodyContent += '<p>' + clientName + '<br>';
    bodyContent += projectName + '<br>';
    bodyContent += projectAddress;
    if (clientPhone) bodyContent += '<br>' + clientPhone;
    bodyContent += '</p></div>';
    bodyContent += '<div class="estimate-details">';
    bodyContent += '<div><strong>Date:</strong> ' + quoteDate + '</div>';
    bodyContent += '<div><strong>Estimate #:</strong> ' + estNumber + '</div>';
    bodyContent += '<div><strong>Customer ID:</strong> ' + customerId + '</div>';
    bodyContent += '<div><strong>Expiry date:</strong> ' + expiryDate + '</div>';
    bodyContent += '</div></div>';

    bodyContent += '<table class="items-table">';
    bodyContent += '<thead><tr>';
    bodyContent += '<th style="width: 55%;">Description</th>';
    bodyContent += '<th style="text-align: center; width: 10%;">Qty</th>';
    bodyContent += '<th style="text-align: right; width: 17%;">Unit price</th>';
    bodyContent += '<th style="text-align: right; width: 18%;">Total price</th>';
    bodyContent += '</tr></thead><tbody>';

    for (var category in categories) {
        bodyContent += '<tr class="category-row">';
        bodyContent += '<td colspan="4">' + category + '</td></tr>';
        var categoryItems = categories[category];
        for (var k = 0; k < categoryItems.length; k++) {
            var item = categoryItems[k];
            bodyContent += '<tr>';
            bodyContent += '<td>' + item.description + '</td>';
            bodyContent += '<td style="text-align: center;">' + item.quantity + '</td>';
            bodyContent += '<td style="text-align: right;">£' + item.unitPrice.toFixed(2) + '</td>';
            bodyContent += '<td style="text-align: right;">£' + item.lineTotal.toFixed(2) + '</td>';
            bodyContent += '</tr>';
        }
    }

    bodyContent += '</tbody></table>';

    bodyContent += '<div class="notes-section">';
    bodyContent += '<h3>Notes:</h3>';
    bodyContent += '<div>1. Estimate valid for 31 days</div>';
    bodyContent += '<div>2. Deposit of ' + depositPercent + '% is required to secure start date</div>';
    bodyContent += '<div>3. Extra works to be charged accordingly</div>';
    var customNotes = document.getElementById('customNotes').value;
    if (customNotes) {
        bodyContent += '<div>4. ' + customNotes + '</div>';
    }
    bodyContent += '</div>';

    bodyContent += '<div class="totals-section">';
    bodyContent += '<div class="totals-box">';
    bodyContent += '<div class="total-row subtotal"><span><strong>Subtotal</strong></span><span>£' + subtotal.toFixed(2) + '</span></div>';
    bodyContent += '<div class="total-row"><span><strong>VAT (20%)</strong></span><span>£' + vat.toFixed(2) + '</span></div>';
    bodyContent += '<div class="total-row final"><span><strong>TOTAL</strong></span><span>£' + total.toFixed(2) + '</span></div>';
    bodyContent += '</div></div>';

    bodyContent += '<div class="footer-note">';
    bodyContent += 'If you have any questions about this estimate, please contact traderbrotherslimited@gmail.com, or 07979309957.';
    bodyContent += '<div class="thank-you">Thank you for your business</div>';
    bodyContent += '</div>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate</title>
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
            alert('✓ PDF downloaded successfully!\n\nFile: ' + filename);
        }, 200);

    } catch (error) {
        console.error('Error generating PDF:', error);
        console.error('Error stack:', error.stack);
        var errorMessage = 'Error generating PDF\n\n';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Network Error - Cannot connect to PDFShift API.\n\n';
            errorMessage += 'Please check:\n';
            errorMessage += '• Your internet connection\n';
            errorMessage += '• Firewall or browser extensions blocking the request\n';
            errorMessage += '• Try using a different browser\n\n';
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
