import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../app/theme';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Customer, Address, UUID } from '../../types/domain';
import { addCustomer, updateCustomer } from './customers.slice';

type RootStackParamList = {
  EditCustomer: { customer?: Customer } | undefined;
};

type EditCustomerScreenRouteProp = RouteProp<RootStackParamList, 'EditCustomer'>;
type EditCustomerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditCustomer'>;

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  notes: string;
  serviceAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
}

export const EditCustomerScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<EditCustomerScreenNavigationProp>();
  const route = useRoute<EditCustomerScreenRouteProp>();
  
  const existingCustomer = route.params?.customer;
  const isEditing = !!existingCustomer;
  
  // Form state
  const [formData, setFormData] = React.useState<CustomerFormData>({
    name: existingCustomer?.name || '',
    phone: existingCustomer?.phone || '',
    email: existingCustomer?.email || '',
    notes: existingCustomer?.notes || '',
    serviceAddress: {
      line1: existingCustomer?.serviceAddress?.line1 || '',
      line2: existingCustomer?.serviceAddress?.line2 || '',
      city: existingCustomer?.serviceAddress?.city || '',
      state: existingCustomer?.serviceAddress?.state || '',
      zip: existingCustomer?.serviceAddress?.zip || '',
    },
    billingAddress: {
      line1: existingCustomer?.billingAddress?.line1 || '',
      line2: existingCustomer?.billingAddress?.line2 || '',
      city: existingCustomer?.billingAddress?.city || '',
      state: existingCustomer?.billingAddress?.state || '',
      zip: existingCustomer?.billingAddress?.zip || '',
    },
  });

  const [useSameAddress, setUseSameAddress] = React.useState(
    !existingCustomer || 
    JSON.stringify(existingCustomer.serviceAddress) === JSON.stringify(existingCustomer.billingAddress)
  );

  // Update form data
  const updateField = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddressField = (
    addressType: 'serviceAddress' | 'billingAddress',
    field: keyof Address,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }));
  };

  // Copy service address to billing address when checkbox is checked
  React.useEffect(() => {
    if (useSameAddress) {
      setFormData(prev => ({
        ...prev,
        billingAddress: { ...prev.serviceAddress },
      }));
    }
  }, [useSameAddress, formData.serviceAddress]);

  // Validation
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Customer name is required';
    }
    
    if (!formData.serviceAddress.line1.trim()) {
      return 'Service address is required';
    }
    
    if (!formData.serviceAddress.city.trim()) {
      return 'Service address city is required';
    }
    
    if (!formData.serviceAddress.state.trim()) {
      return 'Service address state is required';
    }
    
    if (!formData.serviceAddress.zip.trim()) {
      return 'Service address zip code is required';
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    // Validate phone format if provided
    if (formData.phone && !/^[\+]?[(]?[\d\s\-\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number';
    }

    return null;
  };

  // Save customer
  const handleSave = () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      // Create address objects only if they have required fields
      const serviceAddress: Address | undefined = formData.serviceAddress.line1.trim() ? {
        line1: formData.serviceAddress.line1.trim(),
        line2: formData.serviceAddress.line2.trim() || undefined,
        city: formData.serviceAddress.city.trim(),
        state: formData.serviceAddress.state.trim(),
        zip: formData.serviceAddress.zip.trim(),
      } : undefined;

      const billingAddress: Address | undefined = !useSameAddress && formData.billingAddress.line1.trim() ? {
        line1: formData.billingAddress.line1.trim(),
        line2: formData.billingAddress.line2.trim() || undefined,
        city: formData.billingAddress.city.trim(),
        state: formData.billingAddress.state.trim(),
        zip: formData.billingAddress.zip.trim(),
      } : serviceAddress;

      const customer: Customer = {
        id: existingCustomer?.id || generateUUID(),
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        serviceAddress,
        billingAddress,
        notes: formData.notes.trim() || undefined,
        createdAt: existingCustomer?.createdAt || new Date().toISOString(),
      };

      if (isEditing) {
        dispatch(updateCustomer(customer));
      } else {
        dispatch(addCustomer(customer));
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save customer. Please try again.');
    }
  };

  // Generate UUID helper
  const generateUUID = (): UUID => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Customer' : 'Add Customer',
      headerRight: () => (
        <Button
          title="Save"
          onPress={handleSave}
          variant="primary"
          size="small"
        />
      ),
    });
  }, [navigation, isEditing, handleSave]);

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
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <TextField
            label="Name *"
            value={formData.name}
            onChangeText={(value: string) => updateField('name', value)}
            placeholder="Enter customer name"
            autoCapitalize="words"
          />
          
          <TextField
            label="Phone"
            value={formData.phone}
            onChangeText={(value: string) => updateField('phone', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
          
          <TextField
            label="Email"
            value={formData.email}
            onChangeText={(value: string) => updateField('email', value)}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextField
            label="Notes"
            value={formData.notes}
            onChangeText={(value: string) => updateField('notes', value)}
            placeholder="Add any notes about this customer..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Service Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address *</Text>
          
          <TextField
            label="Address Line 1 *"
            value={formData.serviceAddress.line1}
            onChangeText={(value: string) => updateAddressField('serviceAddress', 'line1', value)}
            placeholder="Enter street address"
          />
          
          <TextField
            label="Address Line 2"
            value={formData.serviceAddress.line2}
            onChangeText={(value: string) => updateAddressField('serviceAddress', 'line2', value)}
            placeholder="Apartment, suite, unit, etc."
          />
          
          <View style={styles.row}>
            <TextField
              label="City *"
              value={formData.serviceAddress.city}
              onChangeText={(value: string) => updateAddressField('serviceAddress', 'city', value)}
              placeholder="City"
              containerStyle={styles.flexInput}
            />
            
            <TextField
              label="State *"
              value={formData.serviceAddress.state}
              onChangeText={(value: string) => updateAddressField('serviceAddress', 'state', value)}
              placeholder="State"
              containerStyle={styles.stateInput}
            />
          </View>
          
          <TextField
            label="ZIP Code *"
            value={formData.serviceAddress.zip}
            onChangeText={(value: string) => updateAddressField('serviceAddress', 'zip', value)}
            placeholder="ZIP Code"
            keyboardType="numeric"
            containerStyle={styles.zipInput}
          />
        </View>

        {/* Billing Address Toggle */}
        <View style={styles.section}>
          <Button
            title={useSameAddress ? "✓ Billing address same as service address" : "◯ Use different billing address"}
            onPress={() => setUseSameAddress(!useSameAddress)}
            variant="outline"
          />
        </View>

        {/* Billing Address (if different) */}
        {!useSameAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Address</Text>
            
            <TextField
              label="Address Line 1"
              value={formData.billingAddress.line1}
              onChangeText={(value: string) => updateAddressField('billingAddress', 'line1', value)}
              placeholder="Enter street address"
            />
            
            <TextField
              label="Address Line 2"
              value={formData.billingAddress.line2}
              onChangeText={(value: string) => updateAddressField('billingAddress', 'line2', value)}
              placeholder="Apartment, suite, unit, etc."
            />
            
            <View style={styles.row}>
              <TextField
                label="City"
                value={formData.billingAddress.city}
                onChangeText={(value: string) => updateAddressField('billingAddress', 'city', value)}
                placeholder="City"
                containerStyle={styles.flexInput}
              />
              
              <TextField
                label="State"
                value={formData.billingAddress.state}
                onChangeText={(value: string) => updateAddressField('billingAddress', 'state', value)}
                placeholder="State"
                containerStyle={styles.stateInput}
              />
            </View>
            
            <TextField
              label="ZIP Code"
              value={formData.billingAddress.zip}
              onChangeText={(value: string) => updateAddressField('billingAddress', 'zip', value)}
              placeholder="ZIP Code"
              keyboardType="numeric"
              containerStyle={styles.zipInput}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          
          <Button
            title={isEditing ? "Update Customer" : "Add Customer"}
            onPress={handleSave}
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
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
    width: 120,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
