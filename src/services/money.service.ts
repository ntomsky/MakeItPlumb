import { LineItem, MoneySummary } from '../types/domain';

export class MoneyUtils {
  /**
   * Calculate money summary from line items
   */
  static calculateSummary(
    items: LineItem[],
    taxRate: number = 0.07,
    discount?: MoneySummary['discount']
  ): MoneySummary {
    // Calculate subtotal
    const subTotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    
    // Apply discount
    let discountedSubTotal = subTotal;
    if (discount) {
      if (discount.type === 'percent') {
        discountedSubTotal = subTotal * (1 - discount.value);
      } else {
        discountedSubTotal = Math.max(0, subTotal - discount.value);
      }
    }
    
    // Calculate tax on taxable items only
    const taxableAmount = items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    
    // Apply discount to taxable amount proportionally
    let discountedTaxableAmount = taxableAmount;
    if (discount && taxableAmount > 0) {
      const discountRatio = discountedSubTotal / subTotal;
      discountedTaxableAmount = taxableAmount * discountRatio;
    }
    
    const tax = discountedTaxableAmount * taxRate;
    const total = discountedSubTotal + tax;
    
    return {
      subTotal: this.round(subTotal),
      discount,
      taxRate,
      tax: this.round(tax),
      total: this.round(total),
    };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Round to 2 decimal places
   */
  static round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Parse currency string to number
   */
  static parseCurrency(value: string): number {
    const cleaned = value.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Calculate total payments made on an invoice
   */
  static calculateTotalPaid(payments: { amount: number; date: string }[] = []): number {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * Calculate remaining balance
   */
  static calculateBalance(total: number, payments: { amount: number; date: string }[] = []): number {
    const paid = this.calculateTotalPaid(payments);
    return this.round(total - paid);
  }

  /**
   * Check if invoice is overdue
   */
  static isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }
}
