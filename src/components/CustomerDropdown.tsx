import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../app/theme';
import { Customer } from '../types/domain';
import { CustomerMatchingService, CustomerMatch } from '../services/customer-matching.service';

interface CustomerDropdownProps {
  label: string;
  selectedCustomer?: Customer | null;
  customers: Customer[];
  onSelectCustomer: (customer: Customer | null) => void;
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  style?: any;
}

export const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  label,
  selectedCustomer,
  customers,
  onSelectCustomer,
  placeholder = 'Search or select customer',
  searchValue = '',
  onSearchChange,
  style,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalSearchValue, setInternalSearchValue] = React.useState(searchValue);
  const [filteredCustomers, setFilteredCustomers] = React.useState<Customer[]>(customers);
  const [potentialMatches, setPotentialMatches] = React.useState<CustomerMatch[]>([]);

  const currentSearchValue = onSearchChange ? searchValue : internalSearchValue;
  const handleSearchChange = onSearchChange || setInternalSearchValue;

  // Filter and match customers based on search
  React.useEffect(() => {
    if (!currentSearchValue.trim()) {
      setFilteredCustomers(customers);
      setPotentialMatches([]);
      return;
    }

    // Get potential matches using customer matching service
    const matches = CustomerMatchingService.findPotentialMatches(
      currentSearchValue,
      customers
    );

    setPotentialMatches(matches);

    // Also do simple filtering for customers that might not match fuzzy logic
    const simpleFiltered = customers.filter(customer =>
      customer.name.toLowerCase().includes(currentSearchValue.toLowerCase()) ||
      customer.phone?.includes(currentSearchValue) ||
      customer.email?.toLowerCase().includes(currentSearchValue.toLowerCase())
    );

    // Combine matches and simple filtered, removing duplicates
    const allMatches = [...matches.map(m => m.customer), ...simpleFiltered];
    const uniqueCustomers = Array.from(new Set(allMatches.map(c => c.id)))
      .map(id => allMatches.find(c => c.id === id)!)
      .slice(0, 10); // Limit to 10 results

    setFilteredCustomers(uniqueCustomers);
  }, [currentSearchValue, customers]);

  const handleSelectCustomer = (customer: Customer | null) => {
    onSelectCustomer(customer);
    setIsOpen(false);
    if (customer && !onSearchChange) {
      setInternalSearchValue(customer.name);
    }
  };

  const handleClearSelection = () => {
    handleSelectCustomer(null);
    if (!onSearchChange) {
      setInternalSearchValue('');
    }
  };

  const displayValue = selectedCustomer 
    ? selectedCustomer.name 
    : currentSearchValue || placeholder;

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    // Find if this customer has a match score
    const match = potentialMatches.find(m => m.customer.id === item.id);
    const confidenceText = match ? ` (${Math.round(match.confidence * 100)}% match)` : '';
    
    return (
      <TouchableOpacity
        style={styles.customerItem}
        onPress={() => handleSelectCustomer(item)}
      >
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {item.name}
            {match && (
              <Text style={styles.matchScore}>{confidenceText}</Text>
            )}
          </Text>
          {item.phone && (
            <Text style={styles.customerDetail}>{item.phone}</Text>
          )}
          {item.email && (
            <Text style={styles.customerDetail}>{item.email}</Text>
          )}
          {match && match.matchedFields.length > 0 && (
            <Text style={styles.matchedFields}>
              Matched: {match.matchedFields.join(', ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={[styles.dropdown, isOpen && styles.dropdownOpen]}
        onPress={() => setIsOpen(true)}
      >
        <Text 
          style={[
            styles.dropdownText, 
            !selectedCustomer && !currentSearchValue && styles.placeholder
          ]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        <View style={styles.dropdownActions}>
          {(selectedCustomer || currentSearchValue) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSelection}
            >
              <Icon name="clear" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <Icon 
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color={theme.colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers..."
                value={currentSearchValue}
                onChangeText={handleSearchChange}
                autoFocus
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsOpen(false)}
              >
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {currentSearchValue && !filteredCustomers.length && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No customers found</Text>
                <Text style={styles.emptySubtext}>
                  Keep typing to create with name "{currentSearchValue}"
                </Text>
              </View>
            )}

            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              renderItem={renderCustomerItem}
              style={styles.customersList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    minHeight: 50,
  },
  dropdownOpen: {
    borderColor: theme.colors.primary,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  placeholder: {
    color: theme.colors.textSecondary,
  },
  dropdownActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  customersList: {
    maxHeight: 400,
  },

  // Customer item styles
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 1,
  },
  matchScore: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'normal',
  },
  matchedFields: {
    fontSize: 12,
    color: theme.colors.success,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Empty state
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
