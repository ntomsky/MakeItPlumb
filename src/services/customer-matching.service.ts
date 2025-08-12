import { Customer } from '../types/domain';

export interface CustomerMatch {
  customer: Customer;
  confidence: number; // 0-1 score
  matchedFields: string[];
}

export class CustomerMatchingService {
  /**
   * Find the best customer match for a given name/info
   */
  static findBestMatch(
    searchName: string,
    customers: Customer[],
    searchPhone?: string | null,
    searchEmail?: string | null
  ): CustomerMatch | null {
    if (!searchName || customers.length === 0) {
      return null;
    }

    const matches: CustomerMatch[] = [];

    for (const customer of customers) {
      const match = this.calculateMatch(
        searchName,
        customer,
        searchPhone,
        searchEmail
      );

      if (match.confidence > 0.3) { // Minimum confidence threshold
        matches.push(match);
      }
    }

    // Sort by confidence and return the best match
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Get multiple potential matches for customer selection
   */
  static findPotentialMatches(
    searchName: string,
    customers: Customer[],
    searchPhone?: string | null,
    searchEmail?: string | null
  ): CustomerMatch[] {
    if (!searchName || customers.length === 0) {
      return [];
    }

    const matches: CustomerMatch[] = [];

    for (const customer of customers) {
      const match = this.calculateMatch(
        searchName,
        customer,
        searchPhone,
        searchEmail
      );

      if (match.confidence > 0.2) { // Lower threshold for potential matches
        matches.push(match);
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches.slice(0, 5); // Return top 5 matches
  }

  /**
   * Calculate match confidence between search criteria and customer
   */
  private static calculateMatch(
    searchName: string,
    customer: Customer,
    searchPhone?: string | null,
    searchEmail?: string | null
  ): CustomerMatch {
    let totalScore = 0;
    let maxScore = 0;
    const matchedFields: string[] = [];

    // Name matching (most important)
    const nameScore = this.calculateNameScore(searchName, customer.name);
    totalScore += nameScore * 3; // Weight name matching heavily
    maxScore += 3;
    if (nameScore > 0.3) {
      matchedFields.push('name');
    }

    // Phone matching
    if (searchPhone && customer.phone) {
      const phoneScore = this.calculatePhoneScore(searchPhone, customer.phone);
      totalScore += phoneScore * 2;
      maxScore += 2;
      if (phoneScore > 0.7) {
        matchedFields.push('phone');
      }
    }

    // Email matching
    if (searchEmail && customer.email) {
      const emailScore = this.calculateEmailScore(searchEmail, customer.email);
      totalScore += emailScore * 2;
      maxScore += 2;
      if (emailScore > 0.8) {
        matchedFields.push('email');
      }
    }

    const confidence = maxScore > 0 ? totalScore / maxScore : 0;

    return {
      customer,
      confidence,
      matchedFields
    };
  }

  /**
   * Calculate name similarity score
   */
  private static calculateNameScore(search: string, target: string): number {
    const searchLower = search.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();

    // Exact match
    if (searchLower === targetLower) {
      return 1.0;
    }

    // Contains check
    if (targetLower.includes(searchLower) || searchLower.includes(targetLower)) {
      return 0.8;
    }

    // Word-based matching
    const searchWords = searchLower.split(/\s+/);
    const targetWords = targetLower.split(/\s+/);
    
    let matchingWords = 0;
    for (const searchWord of searchWords) {
      for (const targetWord of targetWords) {
        if (searchWord === targetWord || 
            searchWord.includes(targetWord) || 
            targetWord.includes(searchWord)) {
          matchingWords++;
          break;
        }
      }
    }

    const wordScore = matchingWords / Math.max(searchWords.length, targetWords.length);
    
    // Levenshtein-inspired similarity for short names
    if (Math.min(searchLower.length, targetLower.length) < 10) {
      const editDistance = this.calculateEditDistance(searchLower, targetLower);
      const maxLength = Math.max(searchLower.length, targetLower.length);
      const editScore = 1 - (editDistance / maxLength);
      return Math.max(wordScore, editScore);
    }

    return wordScore;
  }

  /**
   * Calculate phone similarity score
   */
  private static calculatePhoneScore(search: string, target: string): number {
    // Extract digits only
    const searchDigits = search.replace(/\D/g, '');
    const targetDigits = target.replace(/\D/g, '');

    if (searchDigits === targetDigits) {
      return 1.0;
    }

    // Check if one contains the other (for partial matches)
    if (searchDigits.length >= 7 && targetDigits.length >= 7) {
      const searchLast7 = searchDigits.slice(-7);
      const targetLast7 = targetDigits.slice(-7);
      if (searchLast7 === targetLast7) {
        return 0.9;
      }
    }

    return 0;
  }

  /**
   * Calculate email similarity score
   */
  private static calculateEmailScore(search: string, target: string): number {
    const searchLower = search.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();

    if (searchLower === targetLower) {
      return 1.0;
    }

    // Check username part (before @)
    const searchUsername = searchLower.split('@')[0];
    const targetUsername = targetLower.split('@')[0];
    
    if (searchUsername === targetUsername) {
      return 0.8;
    }

    return 0;
  }

  /**
   * Simple edit distance calculation
   */
  private static calculateEditDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
