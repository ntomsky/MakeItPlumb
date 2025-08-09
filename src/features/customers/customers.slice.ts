import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer, UUID } from '../../types/domain';

interface CustomersState {
  customers: Customer[];
  searchQuery: string;
}

const initialState: CustomersState = {
  customers: [],
  searchQuery: '',
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.push(action.payload);
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },
    deleteCustomer: (state, action: PayloadAction<UUID>) => {
      state.customers = state.customers.filter(c => c.id !== action.payload);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { addCustomer, updateCustomer, deleteCustomer, setSearchQuery } = customersSlice.actions;
export default customersSlice.reducer;

// Selectors
export const selectCustomers = (state: { customers: CustomersState }) => state.customers.customers;
export const selectCustomerById = (customerId: UUID) => 
  (state: { customers: CustomersState }) => 
    state.customers.customers.find(c => c.id === customerId);
export const selectFilteredCustomers = (state: { customers: CustomersState }) => {
  const { customers, searchQuery } = state.customers;
  if (!searchQuery) return customers;
  
  return customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
