export type UUID = string;

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
};

export type Customer = {
  id: UUID;
  name: string;
  phone?: string;
  email?: string;
  serviceAddress?: Address;
  billingAddress?: Address;
  notes?: string;
  createdAt: string;
};

export type LineItem = {
  id: UUID;
  qty: number;
  description: string;
  unitPrice: number;
  taxable: boolean;
  kind?: 'material' | 'labor';
};

export type MoneySummary = {
  subTotal: number;
  discount?: { type: 'percent' | 'flat'; value: number };
  taxRate: number;
  tax: number;
  total: number;
};

export type Quote = {
  id: UUID;
  number: string;
  status: 'draft' | 'sent' | 'accepted' | 'converted' | 'expired';
  customerId: UUID;
  items: LineItem[];
  summary: MoneySummary;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: UUID;
  number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  customerId: UUID;
  items: LineItem[];
  summary: MoneySummary;
  terms?: string;
  dueDate?: string;
  payments?: { amount: number; date: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DraftIntake = {
  customer?: Partial<Customer>;
  address?: Partial<Address>;
  items?: Partial<LineItem>[];
  discount?: MoneySummary['discount'];
  taxRate?: number;
  notes?: string;
  docType: 'quote' | 'invoice';
};

export type BusinessProfile = {
  name: string;
  phone?: string;
  email?: string;
  logo?: string;
  defaultTaxRate: number;
  defaultLaborRate: number;
  defaultTerms: string;
};
