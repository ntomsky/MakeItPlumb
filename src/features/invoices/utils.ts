import { Invoice, UUID, LineItem } from '../../types/domain';
import { InvoiceFormData, InvoiceTotals } from './types';
import { VoiceParsingResult } from '../../types/voice-intent';

export const generateUUID = (): UUID => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getInitialFormData = (
  intentResult?: VoiceParsingResult,
  defaultTerms: string = 'Net 30'
): InvoiceFormData => {
  // If creating from voice input, pre-fill with parsed data
  if (intentResult?.result.entities) {
    const { customer, address, items } = intentResult.result.entities;
    
    return {
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email || '',
      serviceAddress: {
        line1: address?.line1 || '',
        line2: address?.line2 || '',
        city: address?.city || '',
        state: address?.state || '',
        zip: address?.zip || '',
      },
      dueDate: '',
      terms: defaultTerms,
      notes: intentResult.result.rawTranscript ? `Voice input: "${intentResult.result.rawTranscript}"` : '',
      items: items?.length ? items.map((item, index) => ({
        id: `temp-${index}`,
        description: item.description || '',
        qty: item.qty?.toString() || '1',
        unitPrice: item.unitPrice?.toString() || '',
        taxable: item.taxable ?? true,
        kind: item.kind || 'labor' as 'material' | 'labor'
      })) : [{
        id: 'temp-0',
        description: '',
        qty: '1',
        unitPrice: '',
        taxable: true,
        kind: 'labor' as 'material' | 'labor'
      }],
    };
  }
  
  // Default empty form
  return {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
    },
    dueDate: '',
    terms: defaultTerms,
    notes: '',
    items: [{
      id: 'temp-0',
      description: '',
      qty: '1',
      unitPrice: '',
      taxable: true,
      kind: 'labor' as 'material' | 'labor'
    }],
  };
};

export const calculateTotals = (
  items: InvoiceFormData['items'],
  taxRate: number
): InvoiceTotals => {
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);
  
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
};

export const validateInvoiceForm = (formData: InvoiceFormData): string | null => {
  if (!formData.customerName.trim()) {
    return 'Customer name is required';
  }
  
  if (!formData.items.some(item => item.description.trim())) {
    return 'At least one line item with description is required';
  }

  return null;
};

export const createInvoiceFromForm = (
  formData: InvoiceFormData,
  invoiceCounter: number,
  totals: InvoiceTotals
): Invoice => {
  return {
    id: generateUUID(),
    number: `INV-${invoiceCounter.toString().padStart(3, '0')}`,
    status: 'draft',
    customerId: generateUUID(), // In real app, this would be linked to existing customer
    items: formData.items
      .filter(item => item.description.trim())
      .map(item => ({
        id: generateUUID(),
        qty: parseFloat(item.qty) || 1,
        description: item.description.trim(),
        unitPrice: parseFloat(item.unitPrice) || 0,
        taxable: item.taxable,
        kind: item.kind,
      })),
    summary: {
      subTotal: totals.subtotal,
      taxRate: totals.tax / totals.subtotal || 0,
      tax: totals.tax,
      total: totals.total,
    },
    terms: formData.terms || undefined,
    dueDate: formData.dueDate || undefined,
    notes: formData.notes || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
