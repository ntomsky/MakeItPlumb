import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BusinessProfile } from '../types/domain';

interface SettingsState {
  businessProfile: BusinessProfile;
  quoteCounter: number;
  invoiceCounter: number;
}

const initialState: SettingsState = {
  businessProfile: {
    name: 'Your Plumbing Business',
    phone: '',
    email: '',
    logo: '',
    defaultTaxRate: 0.07,
    defaultLaborRate: 125,
    defaultTerms: 'Net 30',
  },
  quoteCounter: 1,
  invoiceCounter: 1,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateBusinessProfile: (state, action: PayloadAction<Partial<BusinessProfile>>) => {
      state.businessProfile = { ...state.businessProfile, ...action.payload };
    },
    incrementQuoteCounter: (state) => {
      state.quoteCounter += 1;
    },
    incrementInvoiceCounter: (state) => {
      state.invoiceCounter += 1;
    },
  },
});

export const { updateBusinessProfile, incrementQuoteCounter, incrementInvoiceCounter } = settingsSlice.actions;
export default settingsSlice.reducer;
