import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice, UUID } from '../../types/domain';

interface InvoicesState {
  invoices: Invoice[];
  statusFilter: Invoice['status'] | 'all';
}

const initialState: InvoicesState = {
  invoices: [],
  statusFilter: 'all',
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.invoices.push(action.payload);
    },
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.invoices.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      }
    },
    deleteInvoice: (state, action: PayloadAction<UUID>) => {
      state.invoices = state.invoices.filter(i => i.id !== action.payload);
    },
    setStatusFilter: (state, action: PayloadAction<Invoice['status'] | 'all'>) => {
      state.statusFilter = action.payload;
    },
    addPayment: (state, action: PayloadAction<{ invoiceId: UUID; payment: { amount: number; date: string } }>) => {
      const invoice = state.invoices.find(i => i.id === action.payload.invoiceId);
      if (invoice) {
        if (!invoice.payments) {
          invoice.payments = [];
        }
        invoice.payments.push(action.payload.payment);
        
        // Check if fully paid
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= invoice.summary.total) {
          invoice.status = 'paid';
        }
        
        invoice.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const { addInvoice, updateInvoice, deleteInvoice, setStatusFilter, addPayment } = invoicesSlice.actions;
export default invoicesSlice.reducer;

// Selectors
export const selectInvoices = (state: { invoices: InvoicesState }) => state.invoices.invoices;
export const selectInvoiceById = (invoiceId: UUID) => 
  (state: { invoices: InvoicesState }) => 
    state.invoices.invoices.find(i => i.id === invoiceId);
export const selectFilteredInvoices = (state: { invoices: InvoicesState }) => {
  const { invoices, statusFilter } = state.invoices;
  if (statusFilter === 'all') return invoices;
  
  return invoices.filter(invoice => invoice.status === statusFilter);
};
export const selectInvoicesByCustomer = (customerId: UUID) =>
  (state: { invoices: InvoicesState }) =>
    state.invoices.invoices.filter(i => i.customerId === customerId);
export const selectRecentInvoices = (limit = 5) =>
  (state: { invoices: InvoicesState }) =>
    [...state.invoices.invoices]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
