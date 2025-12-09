// PDF Generator for Trader Brothers Quotation Tool
// Requires: jsPDF library, items array, and estimateNumber from script.js

function downloadQuote() {
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
    
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    
    // Colors
    var goldColor = [188, 156, 34];
    var darkGray = [51, 51, 51];
    var mediumGray = [102, 102, 102];
    var lightGray = [245, 245, 245];
    
    // Header - Company name
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('TRADER BROTHERS LTD', 15, 20);
    
    // Company details
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.text('8 Craigour Terrace', 15, 27);
    doc.text('Edinburgh, EH17 7PB', 15, 31);
    doc.text('07979309957', 15, 35);
    doc.text('traderbrotherslimited@gmail.com', 15, 39);
    
    // Logo placeholder on right (gold box)
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(170, 10, 25, 25, 'F');
    
    // Line under header
    doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45);
    
    // Estimate banner
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(15, 52, 50, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Estimate for', 18, 57.5);
    
    // Client info
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(clientName, 15, 68);
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(9);
    var yPos = 73;
    var addressLines = doc.splitTextToSize(projectAddress, 70);
    doc.text(addressLines, 15, yPos);
    yPos += (addressLines.length * 4);
    if (clientPhone) {
        doc.text(clientPhone, 15, yPos);
    }
    
    // Estimate details table on right
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    var rightY = 68;
    var labelX = 130;
    var valueX = 193;
    
    doc.text('Date:', labelX, rightY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(quoteDate, valueX, rightY, { align: 'right' });
    
    rightY += 5;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.text('Estimate #:', labelX, rightY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(estNumber, valueX, rightY, { align: 'right' });
    
    rightY += 5;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.text('Customer Ref:', labelX, rightY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(customerId, valueX, rightY, { align: 'right' });
    
    rightY += 5;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.text('Expiry Date:', labelX, rightY);
    // Gold box for expiry date
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    var expiryBoxWidth = doc.getTextWidth(expiryDate) + 6;
    doc.rect(valueX - expiryBoxWidth, rightY - 3.5, expiryBoxWidth, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(expiryDate, valueX - 3, rightY, { align: 'right' });
    
    // Items table
    yPos = Math.max(yPos, rightY) + 15;
    
    // Table header
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPos - 4, 180, 7, 'F');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Description', 17, yPos);
    doc.text('Qty', 140, yPos, { align: 'right' });
    doc.text('Unit price', 165, yPos, { align: 'right' });
    doc.text('Total price', 193, yPos, { align: 'right' });
    
    // Bottom border of header
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.line(15, yPos + 2, 195, yPos + 2);
    
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // Table items
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        
        if (yPos > 260) {
            doc.addPage();
            yPos = 20;
        }
        
        var descLines = doc.splitTextToSize(item.description, 115);
        doc.text(descLines, 17, yPos);
        doc.text(String(item.quantity), 140, yPos, { align: 'right' });
        doc.text('£' + item.unitPrice.toFixed(2), 165, yPos, { align: 'right' });
        doc.text('£' + item.lineTotal.toFixed(2), 193, yPos, { align: 'right' });
        yPos += (descLines.length * 4) + 2;
        
        // Line separator
        doc.setDrawColor(238, 238, 238);
        doc.setLineWidth(0.1);
        doc.line(15, yPos - 1, 195, yPos - 1);
    }
    
    yPos += 10;
    if (yPos > 230) {
        doc.addPage();
        yPos = 20;
    }
    
    // Notes section
    doc.setFillColor(249, 249, 249);
    doc.rect(15, yPos, 180, 35, 'F');
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(2);
    doc.line(15, yPos, 15, yPos + 35);
    
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Notes:', 20, yPos + 6);
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setFontSize(8);
    var notesY = yPos + 12;
    doc.text('1. Estimate valid for 31 days', 23, notesY);
    notesY += 4.5;
    doc.text('2. Payment of ' + depositPercent + '% is required to secure start date', 23, notesY);
    notesY += 4.5;
    doc.text('3. Pending to be supplied by customer', 23, notesY);
    notesY += 4.5;
    doc.text('4. Any extras to be charged accordingly', 23, notesY);
    
    var customNotes = document.getElementById('customNotes').value;
    if (customNotes) {
        notesY += 4.5;
        var noteLines = doc.splitTextToSize('5. ' + customNotes, 165);
        doc.text(noteLines, 23, notesY);
    }
    
    yPos += 45;
    
    // Totals section
    var totalsX = 130;
    var totalsValueX = 193;
    
    // Subtotal
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.3);
    doc.line(totalsX, yPos, 195, yPos);
    yPos += 5;
    
    doc.text('Subtotal', totalsX, yPos);
    doc.text('£' + subtotal.toFixed(2), totalsValueX, yPos, { align: 'right' });
    yPos += 5;
    
    // VAT
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.text('VAT', totalsX, yPos);
    doc.text('£' + vat.toFixed(2), totalsValueX, yPos, { align: 'right' });
    yPos += 7;
    
    // Final total with gold background
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(totalsX, yPos - 5, 65, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total', totalsX + 5, yPos);
    doc.text('£' + total.toFixed(2), totalsValueX - 5, yPos, { align: 'right' });
    
    // Footer
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setFont(undefined, 'italic');
    doc.setFontSize(8);
    doc.text('If you have any questions about this estimate, please contact', 105, 273, { align: 'center' });
    doc.text('Trader Brothers on 07448835577', 105, 278, { align: 'center' });
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(9);
    doc.text('Thank you for your business', 105, 285, { align: 'center' });
    
    // Save estimate number and increment
    localStorage.setItem('traderBrosEstimateCount', estimateNumber);
    estimateNumber++;
    updateEstimateCounter();
    
    // Generate filename and save
    var filename = 'Estimate_' + estNumber + '_' + clientName.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
    doc.save(filename);
    
    closePreview();
}
