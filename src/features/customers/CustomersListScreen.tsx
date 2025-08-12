import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../../app/theme';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { SwipeableRow } from '../../components/SwipeableRow';
import { selectFilteredCustomers, setSearchQuery, deleteCustomer } from './customers.slice';
import { RootState } from '../../store/store';
import { Customer } from '../../types/domain';

export const CustomersListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  
  const customers = useSelector(selectFilteredCustomers);
  const searchQuery = useSelector((state: RootState) => state.customers.searchQuery);

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const handleCustomerPress = (customer: Customer) => {
    navigation.navigate('CustomerDetail', { customerId: customer.id });
  };

  const handleAddCustomer = () => {
    navigation.navigate('EditCustomer');
  };

  const handleDeleteCustomer = (customer: Customer) => {
    dispatch(deleteCustomer(customer.id));
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <SwipeableRow
      onDelete={() => handleDeleteCustomer(item)}
      confirmTitle="Delete Customer"
      confirmMessage={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
    >
      <TouchableOpacity
        style={styles.customerItem}
        onPress={() => handleCustomerPress(item)}
      >
        <View style={styles.customerIcon}>
          <Icon name="person" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerDetails}>
            {item.phone && `${item.phone} • `}
            {item.email}
          </Text>
          {item.serviceAddress && (
            <Text style={styles.customerAddress}>
              {item.serviceAddress.line1}
              {item.serviceAddress.city && `, ${item.serviceAddress.city}`}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </SwipeableRow>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No customers yet</Text>
      <Text style={styles.emptySubtitle}>Add your first customer to get started</Text>
      <Button
        title="Add Customer"
        onPress={handleAddCustomer}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextField
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={handleSearch}
          containerStyle={styles.searchContainer}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
          <Icon name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={customers.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flex: 1,
    marginBottom: 0,
    marginRight: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: theme.touchTarget.minHeight,
    height: theme.touchTarget.minHeight,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  customerDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  customerAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    minWidth: 150,
  },
});
