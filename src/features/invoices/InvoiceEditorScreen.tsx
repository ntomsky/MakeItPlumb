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
import { Address } from '../../types/domain';
import { RootState } from '../../store/store';
import { incrementInvoiceCounter } from '../../store/settings.slice';
import { addInvoice } from './invoices.slice';
import { InvoiceFormData, InvoiceEditorParams } from './types';
import { invoiceEditorStyles as styles } from './InvoiceEditorScreen.styles';
import {
  getInitialFormData,
  calculateTotals,
  validateInvoiceForm,
  createInvoiceFromForm,
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
  
  const intentResult = route.params?.intentResult;
  const isFromVoice = !!intentResult;
  
  const [formData, setFormData] = React.useState<InvoiceFormData>(() => 
    getInitialFormData(intentResult, businessProfile.defaultTerms)
  );

  // Reset form data when route params change
  React.useEffect(() => {
    setFormData(getInitialFormData(intentResult, businessProfile.defaultTerms));
  }, [intentResult, businessProfile.defaultTerms]);

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
    const validationError = validateInvoiceForm(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      // Create invoice object
      const invoice = createInvoiceFromForm(formData, invoiceCounter, totals);

      // Save to invoices slice
      dispatch(addInvoice(invoice));
      
      // Increment counter
      dispatch(incrementInvoiceCounter());
      
      Alert.alert('Success', 'Invoice saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save invoice. Please try again.');
    }
  };

  React.useLayoutEffect(() => {
    const getTitle = () => {
      if (isFromVoice) return 'Create Invoice (Voice)';
      return 'Create Invoice';
    };
    
    navigation.setOptions({
      title: getTitle(),
      headerRight: () => (
        <Button
          title="Save"
          onPress={handleSave}
          variant="primary"
          size="small"
        />
      ),
    });
  }, [navigation, isFromVoice, handleSave]);

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
          <Text style={styles.invoiceTitle}>INVOICE #{invoiceCounter.toString().padStart(3, '0')}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          
          <TextField
            label="Customer Name *"
            value={formData.customerName}
            onChangeText={(value: string) => updateField('customerName', value)}
            placeholder="Enter customer name"
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
            title="Save Invoice"
            onPress={handleSave}
            variant="primary"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
