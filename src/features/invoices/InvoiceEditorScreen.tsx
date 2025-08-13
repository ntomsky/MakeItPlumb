import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { CustomerDropdown } from '../../components/CustomerDropdown';
import { Address, Customer } from '../../types/domain';
import { RootState } from '../../store/store';
import { incrementInvoiceCounter } from '../../store/settings.slice';
import { addInvoice, updateInvoice } from './invoices.slice';
import { InvoiceFormData, InvoiceEditorParams } from './types';
import { invoiceEditorStyles as styles } from './InvoiceEditorScreen.styles';
import {
  getInitialFormData,
  calculateTotals,
  validateInvoiceForm,
  createInvoiceFromForm,
  createFormDataFromInvoice,
  generateUUID,
} from './utils';

type RootStackParamList = {
  InvoiceEditor: InvoiceEditorParams | undefined;
};

type InvoiceEditorScreenRouteProp = RouteProp<RootStackParamList, 'InvoiceEditor'>;
type InvoiceEditorScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'InvoiceEditor'>;

export const InvoiceEditorScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<InvoiceEditorScreenNavigationProp>();
  const route = useRoute<InvoiceEditorScreenRouteProp>();
  
  const businessProfile = useSelector((state: RootState) => state.settings.businessProfile);
  const invoiceCounter = useSelector((state: RootState) => state.settings.invoiceCounter);
  const customers = useSelector((state: RootState) => state.customers.customers);
  const invoices = useSelector((state: RootState) => state.invoices.invoices);
  
  const intentResult = route.params?.intentResult;
  const invoiceId = route.params?.invoiceId;
  const isFromVoice = !!intentResult;
  const isEditMode = !!invoiceId;
  
  // Find existing invoice if editing
  const existingInvoice = isEditMode ? invoices.find((inv: { id: string; }) => inv.id === invoiceId) : undefined;
  const existingCustomer = existingInvoice ? customers.find((c: { id: any; }) => c.id === existingInvoice.customerId) : undefined;
  
  const [formData, setFormData] = React.useState<InvoiceFormData>(() => {
    if (isEditMode && existingInvoice) {
      return createFormDataFromInvoice(existingInvoice, existingCustomer, businessProfile.defaultTerms);
    }
    return getInitialFormData(intentResult, businessProfile.defaultTerms);
  });
  
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(
    isEditMode ? existingCustomer || null : null
  );
  const [customerSearchValue, setCustomerSearchValue] = React.useState(
    isEditMode ? (existingCustomer?.name || '') : (formData.customerName || '')
  );

  // Reset form data when route params change
  React.useEffect(() => {
    if (isEditMode && existingInvoice) {
      // Editing existing invoice
      const formDataFromInvoice = createFormDataFromInvoice(existingInvoice, existingCustomer, businessProfile.defaultTerms);
      setFormData(formDataFromInvoice);
      setSelectedCustomer(existingCustomer || null);
      setCustomerSearchValue(existingCustomer?.name || '');
    } else {
      // Creating new invoice
      setFormData(getInitialFormData(intentResult, businessProfile.defaultTerms));
      
      // If there's a matched customer from voice input, set it
      if (intentResult?.result?.matchedCustomer) {
        const matchedCustomer = intentResult.result.matchedCustomer;
        setSelectedCustomer(matchedCustomer);
        setCustomerSearchValue(matchedCustomer.name);
        
        // Pre-fill form with matched customer data
        setFormData(prev => ({
          ...prev,
          customerName: matchedCustomer.name,
          customerPhone: matchedCustomer.phone || '',
          customerEmail: matchedCustomer.email || '',
          serviceAddress: matchedCustomer.serviceAddress ? {
            line1: matchedCustomer.serviceAddress.line1,
            line2: matchedCustomer.serviceAddress.line2 || '',
            city: matchedCustomer.serviceAddress.city,
            state: matchedCustomer.serviceAddress.state,
            zip: matchedCustomer.serviceAddress.zip,
          } : prev.serviceAddress,
        }));
      } else if (intentResult?.result?.entities?.customer?.name) {
        // Set the customer name from voice but don't select a customer
        setCustomerSearchValue(intentResult.result.entities.customer.name);
      }
    }
  }, [intentResult, businessProfile.defaultTerms, isEditMode, existingInvoice, existingCustomer]);

  // Update form fields
  const updateField = (field: keyof Omit<InvoiceFormData, 'serviceAddress' | 'items'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddressField = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAddress: {
        ...prev.serviceAddress,
        [field]: value,
      },
    }));
  };

  // Customer selection handlers
  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    
    if (customer) {
      // Pre-fill form with customer data
      setFormData(prev => ({
        ...prev,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        serviceAddress: customer.serviceAddress ? {
          line1: customer.serviceAddress.line1,
          line2: customer.serviceAddress.line2 || '',
          city: customer.serviceAddress.city,
          state: customer.serviceAddress.state,
          zip: customer.serviceAddress.zip,
        } : prev.serviceAddress,
      }));
      setCustomerSearchValue(customer.name);
    } else {
      // Clear customer-related fields but keep manually entered data
      setFormData(prev => ({
        ...prev,
        customerName: customerSearchValue,
        // Don't clear phone/email if user typed them manually
      }));
    }
  };

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchValue(value);
    
    // Update form data with search value
    setFormData(prev => ({
      ...prev,
      customerName: value,
    }));

    // Clear selected customer if search changed
    if (selectedCustomer && value !== selectedCustomer.name) {
      setSelectedCustomer(null);
    }
  };

  const updateLineItem = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: `temp-${Date.now()}`,
        description: '',
        qty: '1',
        unitPrice: '',
        taxable: true,
        kind: 'labor' as 'material' | 'labor'
      }],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  // Calculate totals
  const totals = calculateTotals(formData.items, businessProfile.defaultTaxRate);

  // Save invoice
  const handleSave = () => {
    // Enhanced validation to ensure customer is properly selected
    if (!selectedCustomer && !customerSearchValue.trim()) {
      Alert.alert('Customer Required', 'Please select a customer or enter a customer name before saving the invoice.');
      return;
    }

    const validationError = validateInvoiceForm(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      if (isEditMode && existingInvoice) {
        // Update existing invoice
        const updatedInvoice = {
          ...existingInvoice,
          customerId: selectedCustomer?.id || existingInvoice.customerId,
          items: formData.items.map(item => ({
            id: item.id.startsWith('temp-') ? generateUUID() : item.id,
            description: item.description,
            qty: parseFloat(item.qty) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            taxable: item.taxable,
            kind: item.kind,
          })),
          summary: {
            subTotal: totals.subtotal,
            discount: existingInvoice.summary.discount,
            taxRate: businessProfile.defaultTaxRate,
            tax: totals.tax,
            total: totals.total,
          },
          terms: formData.terms,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          notes: formData.notes,
          updatedAt: new Date().toISOString(),
        };

        dispatch(updateInvoice(updatedInvoice));
        Alert.alert('Success', 'Invoice updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new invoice
        const invoice = createInvoiceFromForm(formData, invoiceCounter, totals);
        
        // Use selected customer ID if available
        if (selectedCustomer) {
          invoice.customerId = selectedCustomer.id;
        }

        dispatch(addInvoice(invoice));
        dispatch(incrementInvoiceCounter());
        
        Alert.alert('Success', 'Invoice created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} invoice. Please try again.`);
    }
  };

  React.useLayoutEffect(() => {
    const getTitle = () => {
      if (isEditMode) return 'Edit Invoice';
      if (isFromVoice) return 'Create Invoice (Voice)';
      return 'Create Invoice';
    };
    
    navigation.setOptions({
      title: getTitle(),
      headerRight: () => (
        <Button
          title={isEditMode ? "Update" : "Save"}
          onPress={handleSave}
          variant="primary"
          size="small"
        />
      ),
    });
  }, [navigation, isFromVoice, isEditMode, handleSave]);

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
            {intentResult?.result.rawTranscript && (
              <Text style={styles.voiceTranscript}>
                "{intentResult.result.rawTranscript}"
              </Text>
            )}
            {intentResult?.result?.matchedCustomer && (
              <Text style={styles.voiceMatchText}>
                ✅ Customer matched: {intentResult.result.matchedCustomer.name} 
                ({Math.round((intentResult.result.customerMatchConfidence || 0) * 100)}% confidence)
              </Text>
            )}
          </View>
        )}

        {/* Edit Mode Indicator */}
        {isEditMode && existingInvoice && (
          <View style={styles.editIndicator}>
            <Text style={styles.editIndicatorText}>
              ✏️ Editing Invoice {existingInvoice.number}
            </Text>
            <Text style={styles.editSubtext}>
              Created: {new Date(existingInvoice.createdAt).toLocaleDateString()}
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
          <Text style={styles.invoiceTitle}>
            INVOICE {isEditMode && existingInvoice ? existingInvoice.number : `#${invoiceCounter.toString().padStart(3, '0')}`}
          </Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          
          <CustomerDropdown
            label="Customer *"
            selectedCustomer={selectedCustomer}
            customers={customers}
            onSelectCustomer={handleCustomerSelect}
            searchValue={customerSearchValue}
            onSearchChange={handleCustomerSearchChange}
            placeholder="Search or enter customer name"
          />
          
          <TextField
            label="Phone"
            value={formData.customerPhone}
            onChangeText={(value: string) => updateField('customerPhone', value)}
            placeholder="Customer phone"
            keyboardType="phone-pad"
          />
          
          <TextField
            label="Email"
            value={formData.customerEmail}
            onChangeText={(value: string) => updateField('customerEmail', value)}
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
            onChangeText={(value: string) => updateAddressField('line1', value)}
            placeholder="Street address"
          />
          
          <View style={styles.row}>
            <TextField
              label="City"
              value={formData.serviceAddress.city}
              onChangeText={(value: string) => updateAddressField('city', value)}
              placeholder="City"
              containerStyle={styles.flexInput}
            />
            
            <TextField
              label="State"
              value={formData.serviceAddress.state}
              onChangeText={(value: string) => updateAddressField('state', value)}
              placeholder="State"
              containerStyle={styles.stateInput}
            />
            
            <TextField
              label="ZIP"
              value={formData.serviceAddress.zip}
              onChangeText={(value: string) => updateAddressField('zip', value)}
              placeholder="ZIP"
              containerStyle={styles.zipInput}
            />
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          
          {formData.items.map((item, index) => (
            <View key={item.id} style={styles.lineItem}>
              <TextField
                label="Description"
                value={item.description}
                onChangeText={(value: string) => updateLineItem(index, 'description', value)}
                placeholder="Description of work/material"
              />
              
              <View style={styles.row}>
                <TextField
                  label="Qty"
                  value={item.qty}
                  onChangeText={(value: string) => updateLineItem(index, 'qty', value)}
                  placeholder="1"
                  keyboardType="numeric"
                  containerStyle={styles.qtyInput}
                />
                
                <TextField
                  label="Unit Price"
                  value={item.unitPrice}
                  onChangeText={(value: string) => updateLineItem(index, 'unitPrice', value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  containerStyle={styles.flexInput}
                />
              </View>
              
              {formData.items.length > 1 && (
                <Button
                  title="Remove Item"
                  onPress={() => removeLineItem(index)}
                  variant="outline"
                  size="small"
                />
              )}
            </View>
          ))}
          
          <Button
            title="+ Add Line Item"
            onPress={addLineItem}
            variant="outline"
          />
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          
          <TextField
            label="Due Date"
            value={formData.dueDate}
            onChangeText={(value: string) => updateField('dueDate', value)}
            placeholder="YYYY-MM-DD"
          />
          
          <TextField
            label="Terms"
            value={formData.terms}
            onChangeText={(value: string) => updateField('terms', value)}
            placeholder="Payment terms"
          />
          
          <TextField
            label="Notes"
            value={formData.notes}
            onChangeText={(value: string) => updateField('notes', value)}
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
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          
          <Button
            title={isEditMode ? "Update Invoice" : "Save Invoice"}
            onPress={handleSave}
            variant="primary"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
