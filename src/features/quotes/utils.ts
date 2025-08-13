import { Quote, UUID, LineItem, Customer } from '../../types/domain';
import { QuoteFormData, QuoteTotals } from './types';
import { VoiceParsingResult } from '../../types/voice-intent';

export const generateUUID = (): UUID => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const createFormDataFromQuote = (
  quote: Quote,
  customer: Customer | undefined
): QuoteFormData => {
  return {
    customerName: customer?.name || '',
    customerPhone: customer?.phone || '',
    customerEmail: customer?.email || '',
    serviceAddress: customer?.serviceAddress ? {
      line1: customer.serviceAddress.line1,
      line2: customer.serviceAddress.line2 || '',
      city: customer.serviceAddress.city,
      state: customer.serviceAddress.state,
      zip: customer.serviceAddress.zip,
    } : {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
    },
    notes: quote.notes || '',
    items: quote.items.map((item, index) => ({
      id: item.id || `temp-${index}`,
      description: item.description,
      qty: item.qty.toString(),
      unitPrice: item.unitPrice.toString(),
      taxable: item.taxable,
      kind: item.kind || 'labor' as 'material' | 'labor'
    })),
  };
};

export const getInitialQuoteFormData = (
  intentResult?: VoiceParsingResult
): QuoteFormData => {
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

export const calculateQuoteTotals = (items: QuoteFormData['items'], taxRate: number): QuoteTotals => {
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    return sum + (qty * unitPrice);
  }, 0);

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return { subtotal, tax, total };
};

export const validateQuoteForm = (
  formData: QuoteFormData,
  selectedCustomer: Customer | null
): string | null => {
  if (!selectedCustomer && !formData.customerName.trim()) {
    return 'Please select or enter a customer name';
  }

  if (!formData.serviceAddress.line1.trim()) {
    return 'Service address is required';
  }

  if (!formData.serviceAddress.city.trim()) {
    return 'Service address city is required';
  }

  if (!formData.serviceAddress.state.trim()) {
    return 'Service address state is required';
  }

  if (!formData.serviceAddress.zip.trim()) {
    return 'Service address zip code is required';
  }

  const hasValidItems = formData.items.some(item => 
    item.description.trim() && 
    parseFloat(item.qty) > 0 && 
    parseFloat(item.unitPrice) >= 0
  );

  if (!hasValidItems) {
    return 'At least one valid item is required';
  }

  return null;
};

export const createQuoteFromForm = (
  formData: QuoteFormData,
  selectedCustomer: Customer | null,
  quoteNumber: string,
  businessProfile: { defaultTaxRate: number },
  existingQuoteId?: string
): Quote => {
  const totals = calculateQuoteTotals(formData.items, businessProfile.defaultTaxRate);
  
  const lineItems: LineItem[] = formData.items
    .filter(item => item.description.trim() && parseFloat(item.qty) > 0)
    .map(item => ({
      id: item.id.startsWith('temp-') ? generateUUID() : item.id,
      description: item.description.trim(),
      qty: parseFloat(item.qty) || 1,
      unitPrice: parseFloat(item.unitPrice) || 0,
      taxable: item.taxable,
      kind: item.kind,
    }));

  return {
    id: existingQuoteId || generateUUID(),
    number: quoteNumber,
    status: 'draft',
    customerId: selectedCustomer?.id || generateUUID(),
    items: lineItems,
    summary: {
      subTotal: totals.subtotal,
      taxRate: businessProfile.defaultTaxRate,
      tax: totals.tax,
      total: totals.total,
    },
    notes: formData.notes.trim() || undefined,
    createdAt: existingQuoteId ? undefined : new Date().toISOString(), // Keep existing createdAt if editing
    updatedAt: new Date().toISOString(),
  } as Quote;
};
