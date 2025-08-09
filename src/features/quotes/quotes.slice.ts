import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Quote, UUID } from '../../types/domain';

interface QuotesState {
  quotes: Quote[];
  statusFilter: Quote['status'] | 'all';
}

const initialState: QuotesState = {
  quotes: [],
  statusFilter: 'all',
};

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    addQuote: (state, action: PayloadAction<Quote>) => {
      state.quotes.push(action.payload);
    },
    updateQuote: (state, action: PayloadAction<Quote>) => {
      const index = state.quotes.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.quotes[index] = action.payload;
      }
    },
    deleteQuote: (state, action: PayloadAction<UUID>) => {
      state.quotes = state.quotes.filter(q => q.id !== action.payload);
    },
    setStatusFilter: (state, action: PayloadAction<Quote['status'] | 'all'>) => {
      state.statusFilter = action.payload;
    },
    convertQuoteToInvoice: (state, action: PayloadAction<UUID>) => {
      const quote = state.quotes.find(q => q.id === action.payload);
      if (quote) {
        quote.status = 'converted';
        quote.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const { addQuote, updateQuote, deleteQuote, setStatusFilter, convertQuoteToInvoice } = quotesSlice.actions;
export default quotesSlice.reducer;

// Selectors
export const selectQuotes = (state: { quotes: QuotesState }) => state.quotes.quotes;
export const selectQuoteById = (quoteId: UUID) => 
  (state: { quotes: QuotesState }) => 
    state.quotes.quotes.find(q => q.id === quoteId);
export const selectFilteredQuotes = (state: { quotes: QuotesState }) => {
  const { quotes, statusFilter } = state.quotes;
  if (statusFilter === 'all') return quotes;
  
  return quotes.filter(quote => quote.status === statusFilter);
};
export const selectQuotesByCustomer = (customerId: UUID) =>
  (state: { quotes: QuotesState }) =>
    state.quotes.quotes.filter(q => q.customerId === customerId);
export const selectRecentQuotes = (limit = 5) =>
  (state: { quotes: QuotesState }) =>
    [...state.quotes.quotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
