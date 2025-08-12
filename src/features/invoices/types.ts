import { VoiceParsingResult } from '../../types/voice-intent';

export interface InvoiceFormData {
  // Customer Info
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  // Service Address
  serviceAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Invoice Details  
  dueDate: string;
  terms: string;
  notes: string;
  
  // Line Items
  items: Array<{
    id: string;
    description: string;
    qty: string;
    unitPrice: string;
    taxable: boolean;
    kind: 'material' | 'labor';
  }>;
}

export interface InvoiceEditorParams {
  invoiceId?: string;
  customerId?: string;
  quoteId?: string;
  intentResult?: VoiceParsingResult;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}
