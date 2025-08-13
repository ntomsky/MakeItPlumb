import * as React from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DocumentEditorForm, DocumentFormData } from '../../components/DocumentEditor';
import { Address, Customer } from '../../types/domain';
import { RootState } from '../../store/store';
import { incrementQuoteCounter } from '../../store/settings.slice';
import { addQuote, updateQuote } from './quotes.slice';
import { QuoteFormData, QuoteEditorParams, QuoteTotals } from './types';
import { QuotesStackParamList } from '../../app/navigation';
import {
  getInitialQuoteFormData,
  calculateQuoteTotals,
  validateQuoteForm,
  createQuoteFromForm,
  createFormDataFromQuote,
} from './utils';

type QuoteEditorScreenRouteProp = RouteProp<QuotesStackParamList, 'QuoteEditor'>;
type QuoteEditorScreenNavigationProp = NativeStackNavigationProp<QuotesStackParamList, 'QuoteEditor'>;

export const QuoteEditorScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<QuoteEditorScreenNavigationProp>();
  const route = useRoute<QuoteEditorScreenRouteProp>();
  
  const businessProfile = useSelector((state: RootState) => state.settings.businessProfile);
  const quoteCounter = useSelector((state: RootState) => state.settings.quoteCounter);
  const customers = useSelector((state: RootState) => state.customers.customers);
  const quotes = useSelector((state: RootState) => state.quotes.quotes);
  
  const intentResult = route.params?.intentResult;
  const quoteId = route.params?.quoteId;
  const customerId = route.params?.customerId;
  const isFromVoice = !!intentResult;
  const isEditMode = !!quoteId;
  
  // Find existing quote if editing
  const existingQuote = isEditMode ? quotes.find((q: any) => q.id === quoteId) : undefined;
  const existingCustomer = existingQuote ? customers.find((c: Customer) => c.id === existingQuote.customerId) : 
                           customerId ? customers.find((c: Customer) => c.id === customerId) : undefined;
  
  const [formData, setFormData] = React.useState<QuoteFormData>(() => {
    if (isEditMode && existingQuote) {
      return createFormDataFromQuote(existingQuote, existingCustomer);
    }
    return getInitialQuoteFormData(intentResult);
  });
  
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(
    isEditMode ? existingCustomer || null : null
  );
  const [customerSearchValue, setCustomerSearchValue] = React.useState(
    isEditMode ? (existingCustomer?.name || '') : (formData.customerName || '')
  );

  // Use navigation focus event to reset form when adding a new quote
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!existingQuote && !intentResult && !customerId) {
        const initialFormData = getInitialQuoteFormData();
        setFormData(initialFormData);
        setSelectedCustomer(null);
        setCustomerSearchValue('');
      }
    });

    return unsubscribe;
  }, [navigation, existingQuote, intentResult, customerId]);

  // Update form fields
  const updateField = (field: keyof Omit<DocumentFormData, 'serviceAddress' | 'items'>, value: string) => {
    // Only update fields that exist in QuoteFormData, ignore payment fields
    if (field === 'dueDate' || field === 'terms') {
      return; // Ignore payment fields for quotes
    }
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
  const totals = React.useMemo(() => {
    return calculateQuoteTotals(formData.items, businessProfile.defaultTaxRate);
  }, [formData.items, businessProfile.defaultTaxRate]);

  const handleSave = () => {
    const validationError = validateQuoteForm(formData, selectedCustomer);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      const quoteNumber = isEditMode ? existingQuote!.number : `Q${quoteCounter.toString().padStart(4, '0')}`;
      
      const quote = createQuoteFromForm(
        formData,
        selectedCustomer,
        quoteNumber,
        businessProfile,
        existingQuote?.id
      );

      if (isEditMode) {
        dispatch(updateQuote({ ...quote, createdAt: existingQuote!.createdAt }));
      } else {
        dispatch(addQuote(quote));
        dispatch(incrementQuoteCounter());
        
        // Reset form for new quotes
        const initialFormData = getInitialQuoteFormData();
        setFormData(initialFormData);
        setSelectedCustomer(null);
        setCustomerSearchValue('');
      }

      // Navigate to quotes list
      navigation.navigate('QuotesList');
    } catch (error) {
      console.error('Error saving quote:', error);
      Alert.alert('Error', 'Failed to save quote. Please try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Quote' : 'New Quote',
    });
  }, [navigation, isEditMode]);

  // Convert QuoteFormData to DocumentFormData for the shared component
  const documentFormData: DocumentFormData = {
    ...formData,
    // Add optional payment fields as undefined for quotes
    dueDate: undefined,
    terms: undefined,
  };

  const quoteNumber = isEditMode && existingQuote ? existingQuote.number : `Q${quoteCounter.toString().padStart(4, '0')}`;

  return (
    <DocumentEditorForm
      formData={documentFormData}
      onUpdateField={updateField}
      onUpdateAddressField={updateAddressField}
      onUpdateLineItem={updateLineItem}
      onAddLineItem={addLineItem}
      onRemoveLineItem={removeLineItem}
      selectedCustomer={selectedCustomer}
      customerSearchValue={customerSearchValue}
      customers={customers}
      onCustomerSelect={handleCustomerSelect}
      onCustomerSearchChange={handleCustomerSearchChange}
      documentType="Quote"
      documentNumber={quoteNumber}
      businessProfile={businessProfile}
      totals={totals}
      showPaymentFields={false} // Hide payment fields for quotes
      isEditMode={isEditMode}
      isFromVoice={isFromVoice}
      voiceTranscript={intentResult?.result.rawTranscript}
      matchedCustomer={intentResult?.result?.matchedCustomer}
      onCancel={handleCancel}
      onSave={handleSave}
      saveButtonTitle={isEditMode ? "Update Quote" : "Save Quote"}
    />
  );
};
