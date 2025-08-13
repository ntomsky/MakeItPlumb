import { VoiceParsingResult } from '../../types/voice-intent';
import { InvoiceFormData } from '../invoices/types';

// Quote form data is identical to invoice but omits payment fields
export interface QuoteFormData extends Omit<InvoiceFormData, 'dueDate' | 'terms'> {
  // All other fields inherited from InvoiceFormData
}

export interface QuoteEditorParams {
  quoteId?: string;
  customerId?: string;
  intentResult?: VoiceParsingResult;
}

export interface QuoteTotals {
  subtotal: number;
  tax: number;
  total: number;
}
