import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import { Button } from '../Button';
import { TextField } from '../TextField';
import { CustomerDropdown } from '../CustomerDropdown';
import { Address, Customer } from '../../types/domain';
import { theme } from '../../app/theme';

export interface DocumentFormData {
  // Customer Info
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  // Service Address
  serviceAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Document Details (conditional fields)
  dueDate?: string;
  terms?: string;
  notes: string;
  
  // Line Items
  items: Array<{
    id: string;
    description: string;
    qty: string;
    unitPrice: string;
    taxable: boolean;
    kind: 'material' | 'labor';
  }>;
}

export interface DocumentTotals {
  subtotal: number;
  tax: number;
  total: number;
}

interface DocumentEditorFormProps {
  // Form data and handlers
  formData: DocumentFormData;
  onUpdateField: (field: keyof Omit<DocumentFormData, 'serviceAddress' | 'items'>, value: string) => void;
  onUpdateAddressField: (field: keyof Address, value: string) => void;
  onUpdateLineItem: (index: number, field: string, value: string | boolean) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
  
  // Customer selection
  selectedCustomer: Customer | null;
  customerSearchValue: string;
  customers: Customer[];
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerSearchChange: (value: string) => void;
  
  // Document info
  documentType: 'Invoice' | 'Quote';
  documentNumber: string;
  businessProfile: {
    name: string;
    phone?: string;
    email?: string;
    defaultTaxRate: number;
  };
  totals: DocumentTotals;
  
  // Configuration
  showPaymentFields?: boolean; // false for quotes
  
  // Status indicators
  isEditMode?: boolean;
  isFromVoice?: boolean;
  voiceTranscript?: string;
  matchedCustomer?: Customer;
  
  // Actions
  onCancel: () => void;
  onSave: () => void;
  
  // Validation
  saveButtonTitle?: string;
}

export const DocumentEditorForm: React.FC<DocumentEditorFormProps> = ({
  formData,
  onUpdateField,
  onUpdateAddressField,
  onUpdateLineItem,
  onAddLineItem,
  onRemoveLineItem,
  selectedCustomer,
  customerSearchValue,
  customers,
  onCustomerSelect,
  onCustomerSearchChange,
  documentType,
  documentNumber,
  businessProfile,
  totals,
  showPaymentFields = true,
  isEditMode = false,
  isFromVoice = false,
  voiceTranscript,
  matchedCustomer,
  onCancel,
  onSave,
  saveButtonTitle,
}) => {
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Voice Input Indicator */}
        {isFromVoice && (
          <View style={styles.voiceIndicator}>
            <Text style={styles.voiceIndicatorText}>
              🎤 Pre-filled from voice input
            </Text>
            {voiceTranscript && (
              <Text style={styles.voiceTranscript}>
                "{voiceTranscript}"
              </Text>
            )}
            {matchedCustomer && (
              <Text style={styles.voiceMatchText}>
                ✅ Customer matched: {matchedCustomer.name}
              </Text>
            )}
          </View>
        )}

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <View style={styles.editIndicator}>
            <Text style={styles.editIndicatorText}>
              ✏️ Editing {documentType} {documentNumber}
            </Text>
          </View>
        )}
        
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>{businessProfile.name}</Text>
          {businessProfile.phone && (
            <Text style={styles.companyInfo}>📞 {businessProfile.phone}</Text>
          )}
          {businessProfile.email && (
            <Text style={styles.companyInfo}>✉️ {businessProfile.email}</Text>
          )}
          <Text style={styles.documentTitle}>
            {documentType.toUpperCase()} {documentNumber}
          </Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          
          <CustomerDropdown
            label="Customer *"
            selectedCustomer={selectedCustomer}
            customers={customers}
            onSelectCustomer={onCustomerSelect}
            searchValue={customerSearchValue}
            onSearchChange={onCustomerSearchChange}
            placeholder="Search or enter customer name"
          />
          
          <TextField
            label="Phone"
            value={formData.customerPhone}
            onChangeText={(value: string) => onUpdateField('customerPhone', value)}
            placeholder="Customer phone"
            keyboardType="phone-pad"
          />
          
          <TextField
            label="Email"
            value={formData.customerEmail}
            onChangeText={(value: string) => onUpdateField('customerEmail', value)}
            placeholder="Customer email"
            keyboardType="email-address"
          />
        </View>

        {/* Service Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address</Text>
          
          <TextField
            label="Address Line 1"
            value={formData.serviceAddress.line1}
            onChangeText={(value: string) => onUpdateAddressField('line1', value)}
            placeholder="Street address"
          />
          
          <TextField
            label="Address Line 2"
            value={formData.serviceAddress.line2}
            onChangeText={(value: string) => onUpdateAddressField('line2', value)}
            placeholder="Unit, suite, etc. (optional)"
          />
          
          <View style={styles.row}>
            <TextField
              label="City"
              value={formData.serviceAddress.city}
              onChangeText={(value: string) => onUpdateAddressField('city', value)}
              placeholder="City"
              containerStyle={styles.flexInput}
            />
            
            <TextField
              label="State"
              value={formData.serviceAddress.state}
              onChangeText={(value: string) => onUpdateAddressField('state', value)}
              placeholder="State"
              containerStyle={styles.stateInput}
            />
            
            <TextField
              label="ZIP"
              value={formData.serviceAddress.zip}
              onChangeText={(value: string) => onUpdateAddressField('zip', value)}
              placeholder="ZIP"
              containerStyle={styles.zipInput}
            />
          </View>
        </View>

        {/* Payment Fields (only for invoices) */}
        {showPaymentFields && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            
            <TextField
              label="Due Date"
              value={formData.dueDate || ''}
              onChangeText={(value: string) => onUpdateField('dueDate', value)}
              placeholder="YYYY-MM-DD"
            />
            
            <TextField
              label="Terms"
              value={formData.terms || ''}
              onChangeText={(value: string) => onUpdateField('terms', value)}
              placeholder="Net 30"
            />
          </View>
        )}

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          
          {formData.items.map((item, index) => (
            <View key={item.id} style={styles.lineItem}>
              <TextField
                label="Description"
                value={item.description}
                onChangeText={(value: string) => onUpdateLineItem(index, 'description', value)}
                placeholder="Description of work/material"
              />
              
              <View style={styles.row}>
                <TextField
                  label="Qty"
                  value={item.qty}
                  onChangeText={(value: string) => onUpdateLineItem(index, 'qty', value)}
                  placeholder="1"
                  keyboardType="numeric"
                  containerStyle={styles.qtyInput}
                />
                
                <TextField
                  label="Unit Price"
                  value={item.unitPrice}
                  onChangeText={(value: string) => onUpdateLineItem(index, 'unitPrice', value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  containerStyle={styles.flexInput}
                />
              </View>
              
              {formData.items.length > 1 && (
                <Button
                  title="Remove Item"
                  onPress={() => onRemoveLineItem(index)}
                  variant="outline"
                  size="small"
                />
              )}
            </View>
          ))}
          
          <Button
            title="+ Add Line Item"
            onPress={onAddLineItem}
            variant="outline"
          />
        </View>

        {/* Document Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{documentType} Details</Text>
          
          <TextField
            label="Notes"
            value={formData.notes}
            onChangeText={(value: string) => onUpdateField('notes', value)}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${totals.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({(businessProfile.defaultTaxRate * 100).toFixed(1)}%):</Text>
            <Text style={styles.totalValue}>${totals.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>${totals.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.actionButton}
          />
          
          <Button
            title={saveButtonTitle || `Save ${documentType}`}
            onPress={onSave}
            variant="primary"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  voiceIndicator: {
    backgroundColor: theme.colors.primary + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    marginBottom: 0,
    borderRadius: theme.borderRadius.medium,
  },
  voiceIndicatorText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  voiceTranscript: {
    color: theme.colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  voiceMatchText: {
    color: theme.colors.success,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  editIndicator: {
    backgroundColor: theme.colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    marginBottom: 0,
    borderRadius: theme.borderRadius.medium,
  },
  editIndicatorText: {
    color: theme.colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  companyHeader: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.large,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  companyInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  section: {
    margin: theme.spacing.lg,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexInput: {
    flex: 1,
  },
  stateInput: {
    width: 80,
  },
  zipInput: {
    width: 100,
  },
  qtyInput: {
    width: 80,
  },
  lineItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
  },
  totalsSection: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.large,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
