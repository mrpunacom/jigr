import JsBarcode from 'jsbarcode';

export interface LabelData {
  barcode: string;
  containerType?: string;
  tareWeight?: number;
  itemName?: string;
  useByDate?: string;
  qrData?: string;
  customText?: string;
}

// Generate barcode as Base64 data URL
export function generateBarcodeImage(
  code: string, 
  width: number = 200, 
  height: number = 80,
  format: string = 'CODE128'
): string {
  try {
    // Create canvas element
    const canvas = document.createElement('canvas');
    
    // Generate barcode using JsBarcode
    JsBarcode(canvas, code, {
      format: format,
      width: 2,
      height: height,
      displayValue: true,
      fontSize: 14,
      textAlign: 'center',
      textPosition: 'bottom',
      margin: 10
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Barcode generation failed:', error);
    
    // Fallback: create simple text-based barcode
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      // Black text
      ctx.fillStyle = 'black';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(code, width / 2, height / 2);
    }
    
    return canvas.toDataURL('image/png');
  }
}

// Generate QR code (using simple text placeholder for now)
export function generateQRCodeImage(data: string, size: number = 100): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // Simple QR-like pattern (placeholder)
    ctx.fillStyle = 'black';
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * (size / 10), j * (size / 10), size / 10, size / 10);
        }
      }
    }
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR', size / 2, size / 2);
  }
  
  return canvas.toDataURL('image/png');
}

// Generate container label as HTML for printing
export function generateContainerLabel(data: LabelData): string {
  const barcodeImage = generateBarcodeImage(data.barcode);
  const qrImage = data.qrData ? generateQRCodeImage(data.qrData, 60) : null;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Container Label - ${data.barcode}</title>
      <style>
        @page {
          size: 62mm 29mm; /* Dymo label size */
          margin: 0;
        }
        body {
          margin: 0;
          padding: 2mm;
          font-family: Arial, sans-serif;
          font-size: 8pt;
          line-height: 1.1;
        }
        .label {
          width: 58mm;
          height: 25mm;
          border: 1px solid #000;
          padding: 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1mm;
        }
        .barcode-section {
          text-align: center;
          flex: 1;
        }
        .barcode-section img {
          max-width: 45mm;
          max-height: 12mm;
        }
        .qr-section {
          width: 15mm;
          text-align: center;
        }
        .qr-section img {
          width: 12mm;
          height: 12mm;
        }
        .info {
          font-size: 7pt;
          margin-top: 1mm;
        }
        .tare-weight {
          font-size: 9pt;
          font-weight: bold;
          margin-top: 1mm;
          text-align: center;
        }
        .use-by {
          background: #ff0000;
          color: white;
          padding: 0.5mm;
          margin-top: 1mm;
          font-weight: bold;
          text-align: center;
          font-size: 7pt;
        }
        .item-name {
          font-weight: bold;
          margin-bottom: 0.5mm;
        }
        .container-type {
          color: #666;
          font-size: 6pt;
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="header">
          <div class="barcode-section">
            <img src="${barcodeImage}" alt="${data.barcode}">
          </div>
          ${qrImage ? `
            <div class="qr-section">
              <img src="${qrImage}" alt="QR Code">
            </div>
          ` : ''}
        </div>
        
        <div class="info">
          ${data.itemName ? `<div class="item-name">${data.itemName}</div>` : ''}
          ${data.containerType ? `<div class="container-type">${data.containerType}</div>` : ''}
          ${data.customText ? `<div>${data.customText}</div>` : ''}
        </div>
        
        ${data.tareWeight ? `
          <div class="tare-weight">
            Tare: ${data.tareWeight.toFixed(0)}g
          </div>
        ` : ''}
        
        ${data.useByDate ? `
          <div class="use-by">
            USE BY: ${data.useByDate}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

// Generate item label (larger format)
export function generateItemLabel(data: LabelData): string {
  const barcodeImage = generateBarcodeImage(data.barcode, 300, 100);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Item Label - ${data.barcode}</title>
      <style>
        @page {
          size: 89mm 36mm; /* Brother QL-700 label size */
          margin: 0;
        }
        body {
          margin: 0;
          padding: 3mm;
          font-family: Arial, sans-serif;
          font-size: 12pt;
        }
        .label {
          width: 83mm;
          height: 30mm;
          border: 1px solid #000;
          padding: 2mm;
          box-sizing: border-box;
        }
        .barcode {
          text-align: center;
          margin-bottom: 2mm;
        }
        .barcode img {
          max-width: 75mm;
          max-height: 15mm;
        }
        .item-info {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
        }
        .container-info {
          font-size: 9pt;
          color: #666;
          text-align: center;
          margin-top: 1mm;
        }
        .dates {
          display: flex;
          justify-content: space-between;
          margin-top: 2mm;
          font-size: 8pt;
        }
        .use-by {
          background: #ff0000;
          color: white;
          padding: 1mm;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="barcode">
          <img src="${barcodeImage}" alt="${data.barcode}">
        </div>
        
        ${data.itemName ? `
          <div class="item-info">${data.itemName}</div>
        ` : ''}
        
        ${data.containerType ? `
          <div class="container-info">Container: ${data.containerType}</div>
        ` : ''}
        
        <div class="dates">
          <span>Printed: ${new Date().toLocaleDateString()}</span>
          ${data.useByDate ? `
            <span class="use-by">USE BY: ${data.useByDate}</span>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Print label using browser print dialog
export function printLabel(html: string, windowName: string = 'label-print'): void {
  const printWindow = window.open('', windowName, 'width=400,height=300');
  
  if (!printWindow) {
    alert('Please allow popups to print labels. Check your browser settings.');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    
    // Close window after printing (or user cancels)
    setTimeout(() => {
      printWindow.close();
    }, 100);
  };
}

// Generate PDF blob for download
export function generateLabelPDF(html: string): Blob {
  // For basic implementation, convert HTML to PDF-like format
  // In production, you might use jsPDF or similar library
  const pdfContent = `
PDF Label Export
Generated: ${new Date().toISOString()}

${html.replace(/<[^>]*>/g, '')} // Strip HTML tags for basic text

Note: For full PDF support, integrate a PDF generation library like jsPDF.
  `;
  
  return new Blob([pdfContent], { type: 'text/plain' });
}

// Download label as file
export function downloadLabel(
  data: LabelData, 
  format: 'html' | 'pdf' = 'html',
  labelType: 'container' | 'item' = 'container'
): void {
  const html = labelType === 'container' 
    ? generateContainerLabel(data) 
    : generateItemLabel(data);
    
  let blob: Blob;
  let filename: string;
  
  if (format === 'pdf') {
    blob = generateLabelPDF(html);
    filename = `label-${data.barcode}.pdf`;
  } else {
    blob = new Blob([html], { type: 'text/html' });
    filename = `label-${data.barcode}.html`;
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Validate barcode format
export function validateBarcode(code: string, format?: string): boolean {
  if (!code || code.trim().length === 0) return false;
  
  // Basic validation based on format
  switch (format) {
    case 'EAN13':
      return /^\d{13}$/.test(code);
    case 'EAN8':
      return /^\d{8}$/.test(code);
    case 'UPC':
      return /^\d{12}$/.test(code);
    case 'CODE128':
      return code.length >= 1 && code.length <= 80;
    default:
      return code.length >= 3 && code.length <= 50;
  }
}