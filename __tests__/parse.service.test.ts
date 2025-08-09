import { ParseService } from '../src/features/voice/parse.service';

describe('ParseService', () => {
  describe('toDraft', () => {
    it('should parse sample utterance 1 correctly', async () => {
      const utterance = "Create a quote for John Miller at 123 Oak Street. Replace 50 gallon water heater one unit $1,150, labor two hours at $125 per hour, 10 percent discount, note haul away old unit.";
      
      const result = await ParseService.toDraft(utterance);
      
      expect(result.docType).toBe('quote');
      expect(result.customer?.name).toBe('John Miller');
      expect(result.address?.line1).toBe('123 Oak Street');
      expect(result.items).toHaveLength(2);
      expect(result.items?.[0]).toMatchObject({
        description: 'Replace 50 Gallon Water Heater One Unit',
        unitPrice: 1150,
        qty: 1,
        kind: 'material',
      });
      expect(result.items?.[1]).toMatchObject({
        description: 'Labor',
        unitPrice: 125,
        qty: 2,
        kind: 'labor',
      });
      expect(result.discount).toMatchObject({
        type: 'percent',
        value: 0.10,
      });
      expect(result.notes).toContain('haul away old unit');
    });

    it('should parse sample utterance 2 correctly', async () => {
      const utterance = "New invoice for Smith Rentals: toilet install $350, flange $15, labor 1.5 hours at 120, due in 10 days.";
      
      const result = await ParseService.toDraft(utterance);
      
      expect(result.docType).toBe('invoice');
      expect(result.customer?.name).toBe('Smith Rentals');
      expect(result.items).toHaveLength(3);
      expect(result.items?.[0]).toMatchObject({
        description: 'Toilet Install',
        unitPrice: 350,
      });
      expect(result.items?.[1]).toMatchObject({
        description: 'Flange',
        unitPrice: 15,
      });
      expect(result.items?.[2]).toMatchObject({
        description: 'Labor',
        unitPrice: 120,
        qty: 1.5,
        kind: 'labor',
      });
      expect(result.notes).toContain('Net 10');
    });

    it('should parse sample utterance 3 correctly', async () => {
      const utterance = "Quote condenser replacement 1850 taxable address 90 Elm Ave.";
      
      const result = await ParseService.toDraft(utterance);
      
      expect(result.docType).toBe('quote');
      expect(result.address?.line1).toBe('90 Elm Ave');
      expect(result.items).toHaveLength(1);
      expect(result.items?.[0]).toMatchObject({
        description: 'Condenser Replacement',
        unitPrice: 1850,
        taxable: true,
      });
    });

    it('should handle empty input gracefully', async () => {
      const result = await ParseService.toDraft('');
      
      expect(result.docType).toBe('quote');
      expect(result.items).toHaveLength(0);
    });

    it('should default to quote when document type is unclear', async () => {
      const utterance = "For Jane Doe, water heater repair $500";
      
      const result = await ParseService.toDraft(utterance);
      
      expect(result.docType).toBe('quote');
      expect(result.customer?.name).toBe('Jane Doe');
      expect(result.items).toHaveLength(1);
    });
  });
});
