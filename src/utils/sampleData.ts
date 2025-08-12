import { useDispatch } from 'react-redux';
import { addCustomer } from '../features/customers/customers.slice';
import { addInvoice } from '../features/invoices/invoices.slice';
import { Customer, Invoice } from '../types/domain';

export const createSampleData = () => {
  const dispatch = useDispatch();

  // Sample customer
  const sampleCustomer: Customer = {
    id: 'customer-001',
    name: 'John Smith',
    phone: '(555) 123-4567',
    email: 'john.smith@email.com',
    serviceAddress: {
      line1: '123 Main Street',
      line2: '',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
    },
    createdAt: new Date().toISOString(),
  };

  // Sample invoice
  const sampleInvoice: Invoice = {
    id: 'invoice-001',
    number: 'INV-001',
    status: 'sent',
    customerId: 'customer-001',
    items: [
      {
        id: 'item-001',
        description: 'Water heater replacement',
        qty: 1,
        unitPrice: 800,
        taxable: true,
        kind: 'material',
      },
      {
        id: 'item-002',
        description: 'Installation labor',
        qty: 4,
        unitPrice: 125,
        taxable: true,
        kind: 'labor',
      },
    ],
    summary: {
      subTotal: 1300,
      taxRate: 0.07,
      tax: 91,
      total: 1391,
    },
    terms: 'Net 30',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Thank you for your business!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add sample data
  dispatch(addCustomer(sampleCustomer));
  dispatch(addInvoice(sampleInvoice));
};
