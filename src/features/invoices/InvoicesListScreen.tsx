import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../app/theme';
import { Button } from '../../components/Button';
import { StatusChip } from '../../components/StatusChip';
import { RootState } from '../../store/store';
import { Invoice } from '../../types/domain';
import { MoneyUtils } from '../../services/money.service';
import { setStatusFilter } from './invoices.slice';
import { InvoicesStackParamList } from '../../app/navigation';
import { VoiceParsingResult } from '../../types/voice-intent';

type NavigationProp = NativeStackNavigationProp<InvoicesStackParamList, 'InvoicesList'>;

export const InvoicesListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  
  const { invoices, statusFilter } = useSelector((state: RootState) => state.invoices);

  // Filter invoices based on status filter
  const filteredInvoices = React.useMemo(() => {
    if (statusFilter === 'all') {
      return invoices;
    }
    return invoices.filter(invoice => invoice.status === statusFilter);
  }, [invoices, statusFilter]);

  const handleCreateInvoice = () => {
    navigation.navigate('InvoiceEditor', {});
  };

  const handleInvoicePress = (invoice: Invoice) => {
    navigation.navigate('InvoiceDetail', { invoiceId: invoice.id });
  };

  const handleStatusFilterChange = (status: Invoice['status'] | 'all') => {
    dispatch(setStatusFilter(status));
  };

  const renderInvoiceCard = ({ item: invoice }: { item: Invoice }) => {
    const totalPaid = MoneyUtils.calculateTotalPaid(invoice.payments);
    const balance = MoneyUtils.calculateBalance(invoice.summary.total, invoice.payments);
    const isOverdue = MoneyUtils.isOverdue(invoice.dueDate) && invoice.status !== 'paid';

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        onPress={() => handleInvoicePress(invoice)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
            <StatusChip status={isOverdue ? 'overdue' : invoice.status} size="small" />
          </View>
          <Text style={styles.invoiceAmount}>
            {MoneyUtils.formatCurrency(invoice.summary.total)}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.customerInfo} numberOfLines={1}>
            Customer ID: {invoice.customerId.slice(0, 8)}...
          </Text>
          
          {invoice.dueDate && (
            <Text style={[
              styles.dueDate,
              isOverdue && styles.overdueDueDate
            ]}>
              Due: {new Date(invoice.dueDate).toLocaleDateString()}
            </Text>
          )}

          <Text style={styles.itemCount}>
            {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {totalPaid > 0 && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentText}>
              Paid: {MoneyUtils.formatCurrency(totalPaid)}
            </Text>
            {balance > 0 && (
              <Text style={styles.balanceText}>
                Balance: {MoneyUtils.formatCurrency(balance)}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.dateInfo}>
          Created: {new Date(invoice.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Invoices Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first invoice to get started
      </Text>
      <Button
        title="Create Invoice"
        onPress={handleCreateInvoice}
        style={styles.emptyButton}
      />
    </View>
  );

  const filterOptions: { label: string; value: Invoice['status'] | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Paid', value: 'paid' },
    { label: 'Overdue', value: 'overdue' },
  ];

  return (
    <View style={styles.container}>
      {/* Header with Create Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Invoices</Text>
          <Text style={styles.subtitle}>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Button
          title="+ New"
          onPress={handleCreateInvoice}
          style={styles.createButton}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.filterChip,
              statusFilter === option.value && styles.activeFilterChip
            ]}
            onPress={() => handleStatusFilterChange(option.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === option.value && styles.activeFilterChipText
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceCard}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  createButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.large,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  activeFilterChipText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cardBody: {
    marginBottom: theme.spacing.sm,
  },
  customerInfo: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dueDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  overdueDueDate: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  paymentText: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  dateInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.xxl,
  },
});
