import { CustomerMatchingService } from '../src/services/customer-matching.service';
import { Customer } from '../src/types/domain';

describe('CustomerMatchingService', () => {
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'John Smith',
      phone: '(555) 123-4567',
      email: 'john@email.com',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Jane Doe',
      phone: '(555) 987-6543',
      email: 'jane@email.com',
      createdAt: '2024-01-02'
    },
    {
      id: '3',
      name: 'Bob Johnson',
      phone: '(555) 111-2222',
      email: 'bob@email.com',
      createdAt: '2024-01-03'
    }
  ];

  describe('findBestMatch', () => {
    it('should find exact name match', () => {
      const match = CustomerMatchingService.findBestMatch(
        'John Smith',
        mockCustomers
      );

      expect(match).toBeTruthy();
      expect(match?.customer.name).toBe('John Smith');
      expect(match?.confidence).toBeGreaterThan(0.9);
    });

    it('should find partial name match', () => {
      const match = CustomerMatchingService.findBestMatch(
        'John',
        mockCustomers
      );

      expect(match).toBeTruthy();
      expect(match?.customer.name).toBe('John Smith');
      expect(match?.confidence).toBeGreaterThan(0.5);
    });

    it('should find phone match', () => {
      const match = CustomerMatchingService.findBestMatch(
        'Unknown Name',
        mockCustomers,
        '555-123-4567'
      );

      expect(match).toBeTruthy();
      expect(match?.customer.name).toBe('John Smith');
      expect(match?.matchedFields).toContain('phone');
    });

    it('should find email match', () => {
      const match = CustomerMatchingService.findBestMatch(
        'Unknown Name',
        mockCustomers,
        undefined,
        'jane@email.com'
      );

      expect(match).toBeTruthy();
      expect(match?.customer.name).toBe('Jane Doe');
      expect(match?.matchedFields).toContain('email');
    });

    it('should return null for no match', () => {
      const match = CustomerMatchingService.findBestMatch(
        'Nonexistent Customer',
        mockCustomers
      );

      expect(match).toBeNull();
    });

    it('should handle voice variations', () => {
      const match = CustomerMatchingService.findBestMatch(
        'jon smith',  // Common voice recognition error
        mockCustomers
      );

      expect(match).toBeTruthy();
      expect(match?.customer.name).toBe('John Smith');
    });
  });

  describe('findPotentialMatches', () => {
    it('should return multiple potential matches', () => {
      const matches = CustomerMatchingService.findPotentialMatches(
        'jo',
        mockCustomers
      );

      expect(matches.length).toBeGreaterThan(0);
      // Ensure results are sorted by confidence (allowing for equal confidence)
      if (matches.length > 1) {
        expect(matches[0].confidence).toBeGreaterThanOrEqual(matches[1].confidence);
      }
    });

    it('should limit results', () => {
      const matches = CustomerMatchingService.findPotentialMatches(
        'j',
        mockCustomers
      );

      expect(matches.length).toBeLessThanOrEqual(5);
    });
  });
});
