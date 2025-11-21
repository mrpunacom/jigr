'use client';

import { useState } from 'react';
import { Printer, Download, Eye } from 'lucide-react';
import { 
  generateContainerLabel, 
  generateItemLabel,
  printLabel, 
  downloadLabel,
  LabelData 
} from '@/lib/label-generator';

interface LabelPrinterProps {
  barcode: string;
  containerType?: string;
  tareWeight?: number;
  itemName?: string;
  useByDate?: string;
  qrData?: string;
  customText?: string;
  onPrinted?: () => void;
  labelType?: 'container' | 'item';
  autoHideAfterPrint?: boolean;
}

export default function LabelPrinter({
  barcode,
  containerType,
  tareWeight,
  itemName,
  useByDate,
  qrData,
  customText,
  onPrinted,
  labelType = 'container',
  autoHideAfterPrint = false
}: LabelPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const labelData: LabelData = {
    barcode,
    containerType,
    tareWeight,
    itemName,
    useByDate,
    qrData,
    customText
  };

  const handlePrint = () => {
    setIsPrinting(true);

    const labelHtml = labelType === 'container' 
      ? generateContainerLabel(labelData)
      : generateItemLabel(labelData);

    printLabel(labelHtml, `${labelType}-label-${barcode}`);

    // Mark as printed after short delay
    setTimeout(() => {
      setIsPrinting(false);
      if (onPrinted) {
        onPrinted();
      }
    }, 1000);
  };

  const handleDownload = (format: 'html' | 'pdf' = 'html') => {
    downloadLabel(labelData, format, labelType);
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return (
    <>
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Print {labelType === 'container' ? 'Container' : 'Item'} Label
        </h3>
        
        {/* Label Preview */}
        <div className="bg-gray-50 border rounded p-3 mb-4 text-sm">
          <div className="font-mono text-center mb-2 text-lg font-bold">
            {barcode}
          </div>
          
          {itemName && <div className="font-bold text-gray-800">{itemName}</div>}
          {containerType && <div className="text-gray-600">{containerType}</div>}
          {customText && <div className="text-gray-600 italic">{customText}</div>}
          
          {tareWeight && (
            <div className="font-bold mt-2 text-center bg-blue-100 p-1 rounded">
              Tare Weight: {tareWeight.toFixed(0)}g
            </div>
          )}
          
          {useByDate && (
            <div className="bg-red-500 text-white px-2 py-1 rounded mt-2 text-center font-bold">
              USE BY: {useByDate}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2 text-center">
            Label Type: {labelType === 'container' ? '62mm x 29mm (Dymo)' : '89mm x 36mm (Brother QL)'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px' }} // iPad Air 2013 touch target
          >
            <Printer className="w-5 h-5" />
            {isPrinting ? 'Printing...' : 'Print Label'}
          </button>

          {/* Preview Button */}
          <button
            onClick={handlePreview}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            style={{ minHeight: '48px' }} // iPad Air 2013 touch target
          >
            <Eye className="w-5 h-5" />
            Preview
          </button>

          {/* Download Button */}
          <button
            onClick={() => handleDownload('html')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            style={{ minHeight: '48px' }} // iPad Air 2013 touch target
          >
            <Download className="w-5 h-5" />
            Download
          </button>
        </div>

        {/* Printer Information */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Supported Printers:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-blue-700">
            <div>
              <strong>Brother QL Series:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>QL-700</li>
                <li>QL-800</li>
                <li>QL-810W</li>
              </ul>
            </div>
            <div>
              <strong>Dymo LabelWriter:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>450 Series</li>
                <li>4XL</li>
                <li>550 Series</li>
              </ul>
            </div>
            <div>
              <strong>Zebra Desktop:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>GK420d</li>
                <li>GX420d</li>
                <li>ZD410</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Printing Tips */}
        <div className="mt-3 text-xs text-gray-500">
          <p><strong>Printing Tips:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Ensure your printer is connected and turned on</li>
            <li>Load appropriate label size in your printer</li>
            <li>Use browser print dialog to select correct printer</li>
            <li>Download as backup if printing fails</li>
          </ul>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Label Preview</h3>
              <button
                onClick={closePreview}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                style={{ minHeight: '48px' }} // iPad Air 2013 touch target
              >
                Close
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-auto">
              <div 
                className="border rounded p-4 bg-white mx-auto"
                style={{ 
                  width: labelType === 'container' ? '62mm' : '89mm',
                  minHeight: labelType === 'container' ? '29mm' : '36mm',
                  transform: 'scale(2)',
                  transformOrigin: 'top center',
                  margin: '50px auto'
                }}
                dangerouslySetInnerHTML={{
                  __html: (labelType === 'container' 
                    ? generateContainerLabel(labelData)
                    : generateItemLabel(labelData)
                  ).replace(/<!DOCTYPE.*?<body[^>]*>/s, '').replace(/<\/body>.*?<\/html>/s, '')
                }}
              />
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                style={{ minHeight: '48px' }} // iPad Air 2013 touch target
              >
                <Printer className="w-5 h-5" />
                Print This Label
              </button>
              <button
                onClick={() => handleDownload('html')}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                style={{ minHeight: '48px' }} // iPad Air 2013 touch target
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}