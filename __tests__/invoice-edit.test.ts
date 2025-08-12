import { createFormDataFromInvoice } from '../src/features/invoices/utils';
import { Invoice, Customer } from '../src/types/domain';

describe('Invoice Editing Utils', () => {
  const mockCustomer: Customer = {
    id: 'customer-1',
    name: 'John Smith',
    phone: '(555) 123-4567',
    email: 'john@example.com',
    serviceAddress: {
      line1: '123 Main St',
      line2: 'Apt 1',
      city: 'Springfield',
      state: 'IL',
      zip: '62701'
    },
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockInvoice: Invoice = {
    id: 'invoice-1',
    number: 'INV-001',
    status: 'draft',
    customerId: 'customer-1',
    items: [
      {
        id: 'item-1',
        description: 'Faucet installation',
        qty: 1,
        unitPrice: 150,
        taxable: true,
        kind: 'labor'
      },
      {
        id: 'item-2',
        description: 'Kitchen faucet',
        qty: 1,
        unitPrice: 200,
        taxable: true,
        kind: 'material'
      }
    ],
    summary: {
      subTotal: 350,
      taxRate: 0.08,
      tax: 28,
      total: 378
    },
    terms: 'Net 30',
    dueDate: '2024-02-01T00:00:00Z',
    notes: 'Installation includes removing old faucet',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('createFormDataFromInvoice', () => {
    it('should convert invoice to form data correctly', () => {
      const formData = createFormDataFromInvoice(mockInvoice, mockCustomer, 'Net 15');

      expect(formData.customerName).toBe('John Smith');
      expect(formData.customerPhone).toBe('(555) 123-4567');
      expect(formData.customerEmail).toBe('john@example.com');
      
      expect(formData.serviceAddress.line1).toBe('123 Main St');
      expect(formData.serviceAddress.line2).toBe('Apt 1');
      expect(formData.serviceAddress.city).toBe('Springfield');
      expect(formData.serviceAddress.state).toBe('IL');
      expect(formData.serviceAddress.zip).toBe('62701');
      
      expect(formData.dueDate).toBe('2024-02-01');
      expect(formData.terms).toBe('Net 30');
      expect(formData.notes).toBe('Installation includes removing old faucet');
      
      expect(formData.items).toHaveLength(2);
      expect(formData.items[0].description).toBe('Faucet installation');
      expect(formData.items[0].qty).toBe('1');
      expect(formData.items[0].unitPrice).toBe('150');
      expect(formData.items[0].taxable).toBe(true);
      expect(formData.items[0].kind).toBe('labor');
      
      expect(formData.items[1].description).toBe('Kitchen faucet');
      expect(formData.items[1].qty).toBe('1');
      expect(formData.items[1].unitPrice).toBe('200');
      expect(formData.items[1].taxable).toBe(true);
      expect(formData.items[1].kind).toBe('material');
    });

    it('should handle missing customer', () => {
      const formData = createFormDataFromInvoice(mockInvoice, undefined, 'Net 15');

      expect(formData.customerName).toBe('');
      expect(formData.customerPhone).toBe('');
      expect(formData.customerEmail).toBe('');
      
      expect(formData.serviceAddress.line1).toBe('');
      expect(formData.serviceAddress.line2).toBe('');
      expect(formData.serviceAddress.city).toBe('');
      expect(formData.serviceAddress.state).toBe('');
      expect(formData.serviceAddress.zip).toBe('');
    });

    it('should handle missing optional fields', () => {
      const minimalInvoice: Invoice = {
        ...mockInvoice,
        terms: undefined,
        dueDate: undefined,
        notes: undefined
      };

      const formData = createFormDataFromInvoice(minimalInvoice, mockCustomer, 'Net 15');

      expect(formData.dueDate).toBe('');
      expect(formData.terms).toBe('Net 15'); // Should use default
      expect(formData.notes).toBe('');
    });
  });
});
