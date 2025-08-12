import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import RNFS from 'react-native-fs';
import { BusinessProfile, Customer, Quote, Invoice } from '../types/domain';
import { MoneyUtils } from './money.service';

export interface PdfInput {
  business: BusinessProfile;
  customer: Customer;
  doc: Quote | Invoice;
}

export interface PdfOutput {
  path: string;
  uri: string;
}

export class PdfService {
  static async generatePdf(input: PdfInput): Promise<PdfOutput> {
    const { business, customer, doc } = input;
    
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let yPosition = height - 50;
    const margin = 50;
    const lineHeight = 20;
    
    // Header - Business Info
    page.drawText(business.name, {
      x: margin,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight * 1.5;
    
    if (business.phone) {
      page.drawText(`Phone: ${business.phone}`, {
        x: margin,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }
    
    if (business.email) {
      page.drawText(`Email: ${business.email}`, {
        x: margin,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }
    
    // Document title and number
    const docType = 'status' in doc ? 'Invoice' : 'Quote';
    const docTitle = `${docType} #${doc.number}`;
    
    page.drawText(docTitle, {
      x: width - 200,
      y: height - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Date
    page.drawText(`Date: ${new Date(doc.createdAt).toLocaleDateString()}`, {
      x: width - 200,
      y: height - 80,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    
    if ('dueDate' in doc && doc.dueDate) {
      page.drawText(`Due Date: ${new Date(doc.dueDate).toLocaleDateString()}`, {
        x: width - 200,
        y: height - 100,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }
    
    yPosition -= lineHeight * 2;
    
    // Customer Info
    page.drawText('Bill To:', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    page.drawText(customer.name, {
      x: margin,
      y: yPosition,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    if (customer.serviceAddress) {
      const address = customer.serviceAddress;
      page.drawText(address.line1, {
        x: margin,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      
      if (address.line2) {
        page.drawText(address.line2, {
          x: margin,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      const cityStateZip = `${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim();
      if (cityStateZip.length > 2) {
        page.drawText(cityStateZip, {
          x: margin,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
    }
    
    yPosition -= lineHeight;
    
    // Line items header
    const tableTop = yPosition;
    page.drawText('Description', {
      x: margin,
      y: tableTop,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Qty', {
      x: width - 300,
      y: tableTop,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Rate', {
      x: width - 200,
      y: tableTop,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Amount', {
      x: width - 100,
      y: tableTop,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw line under header
    page.drawLine({
      start: { x: margin, y: tableTop - 5 },
      end: { x: width - margin, y: tableTop - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    yPosition = tableTop - lineHeight;
    
    // Line items
    for (const item of doc.items) {
      const amount = item.qty * item.unitPrice;
      
      page.drawText(item.description, {
        x: margin,
        y: yPosition,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(item.qty.toString(), {
        x: width - 300,
        y: yPosition,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(MoneyUtils.formatCurrency(item.unitPrice), {
        x: width - 200,
        y: yPosition,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(MoneyUtils.formatCurrency(amount), {
        x: width - 100,
        y: yPosition,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= lineHeight;
    }
    
    yPosition -= lineHeight;
    
    // Summary
    const summaryX = width - 200;
    
    page.drawText(`Subtotal: ${MoneyUtils.formatCurrency(doc.summary.subTotal)}`, {
      x: summaryX,
      y: yPosition,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    if (doc.summary.discount) {
      const discountText = doc.summary.discount.type === 'percent'
        ? `Discount (${(doc.summary.discount.value * 100).toFixed(1)}%)`
        : 'Discount';
      const discountAmount = doc.summary.discount.type === 'percent'
        ? doc.summary.subTotal * doc.summary.discount.value
        : doc.summary.discount.value;
      
      page.drawText(`${discountText}: -${MoneyUtils.formatCurrency(discountAmount)}`, {
        x: summaryX,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }
    
    page.drawText(`Tax (${(doc.summary.taxRate * 100).toFixed(1)}%): ${MoneyUtils.formatCurrency(doc.summary.tax)}`, {
      x: summaryX,
      y: yPosition,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    page.drawText(`Total: ${MoneyUtils.formatCurrency(doc.summary.total)}`, {
      x: summaryX,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Notes
    if (doc.notes) {
      yPosition -= lineHeight * 2;
      page.drawText('Notes:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      
      page.drawText(doc.notes, {
        x: margin,
        y: yPosition,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Terms (for invoices)
    if ('terms' in doc && doc.terms) {
      yPosition -= lineHeight * 2;
      page.drawText('Terms:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      
      page.drawText(doc.terms, {
        x: margin,
        y: yPosition,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const fileName = `${docType}_${doc.number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    
    // Convert PDF bytes to base64 for react-native-fs
    const base64Data = btoa(String.fromCharCode(...pdfBytes));
    await RNFS.writeFile(filePath, base64Data, 'base64');
    
    return {
      path: filePath,
      uri: `file://${filePath}`,
    };
  }
}
