import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import Pdf from 'react-native-pdf'; // Commented out temporarily to avoid native module issues

import { theme } from '../../app/theme';
import { Button } from '../../components/Button';
import { StatusChip } from '../../components/StatusChip';
import { RootState } from '../../store/store';
import { InvoicesStackParamList } from '../../app/navigation';
import { PdfService } from '../../services/pdf.service';
import { MoneyUtils } from '../../services/money.service';
import { Customer, Invoice, LineItem } from '../../types/domain';

type InvoiceDetailRouteProp = RouteProp<InvoicesStackParamList, 'InvoiceDetail'>;

const { width, height } = Dimensions.get('window');

export const InvoiceDetailScreen: React.FC = () => {
  const route = useRoute<InvoiceDetailRouteProp>();
  const navigation = useNavigation();
  const { invoiceId } = route.params;

  const [pdfUri, setPdfUri] = React.useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [showPdfPreview, setShowPdfPreview] = React.useState(false);

  const invoice = useSelector((state: RootState) =>
    state.invoices.invoices.find((i: Invoice) => i.id === invoiceId)
  );
  
  const businessProfile = useSelector((state: RootState) => state.settings.businessProfile);
  
  const customer = useSelector((state: RootState) =>
    state.customers.customers.find((c: Customer) => c.id === invoice?.customerId)
  );

  React.useEffect(() => {
    if (invoice && businessProfile && customer) {
      generatePdf();
    }
  }, [invoice, businessProfile, customer]);

  const generatePdf = async () => {
    if (!invoice || !businessProfile || !customer) return;

    setIsGeneratingPdf(true);
    try {
      const result = await PdfService.generatePdf({
        business: businessProfile,
        customer: customer as Customer,
        doc: invoice,
      });
      setPdfUri(result.uri);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate invoice PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    if (pdfUri && invoice) {
      try {
        const fileName = `Invoice_${invoice.number}.pdf`;
        
        if (Platform.OS === 'ios') {
          // On iOS, use Share API with file URL
          await Share.share({
            url: pdfUri,
            title: fileName,
            message: `Invoice ${invoice.number} from ${businessProfile.name}`,
          });
        } else {
          // On Android, Share API works differently
          await Share.share({
            title: fileName,
            message: `Invoice ${invoice.number} from ${businessProfile.name}. PDF path: ${pdfUri}`,
          });
        }
      } catch (error) {
        console.error('Failed to share PDF:', error);
        Alert.alert('Error', 'Unable to share PDF. Please try again.');
      }
    } else {
      Alert.alert('PDF Not Ready', 'Please wait for PDF generation to complete.');
    }
  };

  const handleViewPdf = async () => {
    if (pdfUri && invoice) {
      try {
        const fileName = `Invoice_${invoice.number}.pdf`;
        
        // Use Share API to open PDF - this will show options to open in PDF viewers
        await Share.share({
          url: pdfUri,
          title: fileName,
          message: `View Invoice ${invoice.number}`,
        });
      } catch (error) {
        console.error('Failed to open PDF:', error);
        Alert.alert('Error', 'Unable to open PDF. Please try again.');
      }
    } else {
      Alert.alert('PDF Not Ready', 'Please wait for PDF generation to complete.');
    }
  };

  const handleEdit = () => {
    (navigation as any).navigate('InvoiceEditor', { invoiceId: invoice?.id });
  };

  const togglePdfPreview = () => {
    // For now, just open PDF in external viewer
    handleViewPdf();
  };

  if (!invoice) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Invoice not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const totalPaid = MoneyUtils.calculateTotalPaid(invoice.payments);
  const balance = MoneyUtils.calculateBalance(invoice.summary.total, invoice.payments);
  const isOverdue = MoneyUtils.isOverdue(invoice.dueDate) && invoice.status !== 'paid';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.invoiceNumber}>{invoice.number}</Text>
          <View style={styles.statusRow}>
            <StatusChip status={isOverdue ? 'overdue' : invoice.status} />
            <Text style={styles.createdDate}>
              Created: {new Date(invoice.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalAmount}>
            {MoneyUtils.formatCurrency(invoice.summary.total)}
          </Text>
          {balance > 0 && (
            <Text style={styles.balanceText}>
              Balance: {MoneyUtils.formatCurrency(balance)}
            </Text>
          )}
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {customer?.name || `Customer ID: ${invoice.customerId.slice(0, 8)}...`}
          </Text>
          {customer?.phone && (
            <Text style={styles.customerDetail}>{customer.phone}</Text>
          )}
          {customer?.email && (
            <Text style={styles.customerDetail}>{customer.email}</Text>
          )}
        </View>
      </View>

      {/* Line Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {invoice.items.map((item: LineItem, index: number) => (
          <View key={item.id || index} style={styles.lineItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemAmount}>
                {MoneyUtils.formatCurrency(item.qty * item.unitPrice)}
              </Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetail}>
                Qty: {item.qty} × {MoneyUtils.formatCurrency(item.unitPrice)}
              </Text>
              <View style={styles.itemTags}>
                <Text style={[styles.itemTag, item.taxable && styles.taxableTag]}>
                  {item.taxable ? 'Taxable' : 'Non-taxable'}
                </Text>
                <Text style={styles.itemTag}>{item.kind}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {MoneyUtils.formatCurrency(invoice.summary.subTotal)}
            </Text>
          </View>
          
          {invoice.summary.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({(invoice.summary.taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.totalValue}>
                {MoneyUtils.formatCurrency(invoice.summary.tax)}
              </Text>
            </View>
          )}
          
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {MoneyUtils.formatCurrency(invoice.summary.total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      {invoice.payments && invoice.payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments</Text>
          {invoice.payments.map((payment: { amount: number; date: string }, index: number) => (
            <View key={index} style={styles.paymentRow}>
              <Text style={styles.paymentDate}>
                {new Date(payment.date).toLocaleDateString()}
              </Text>
              <Text style={styles.paymentAmount}>
                {MoneyUtils.formatCurrency(payment.amount)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.paidAmount}>
              {MoneyUtils.formatCurrency(totalPaid)}
            </Text>
          </View>
        </View>
      )}

      {/* Additional Info */}
      {(invoice.terms || invoice.dueDate || invoice.notes) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          {invoice.terms && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Terms:</Text>
              <Text style={styles.infoValue}>{invoice.terms}</Text>
            </View>
          )}
          
          {invoice.dueDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={[
                styles.infoValue,
                isOverdue && styles.overdueText
              ]}>
                {new Date(invoice.dueDate).toLocaleDateString()}
                {isOverdue && ' (OVERDUE)'}
              </Text>
            </View>
          )}
          
          {invoice.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes:</Text>
              <Text style={styles.infoValue}>{invoice.notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={isGeneratingPdf ? "Generating..." : "Open PDF"}
          onPress={togglePdfPreview}
          style={styles.actionButton}
          disabled={isGeneratingPdf || !pdfUri}
        />
        
        <Button
          title="Share PDF"
          onPress={handleShare}
          style={styles.actionButton}
          variant="outline"
          disabled={isGeneratingPdf || !pdfUri}
        />
        
        <Button
          title="Edit Invoice"
          onPress={handleEdit}
          style={styles.actionButton}
          variant="outline"
        />
      </View>

      {isGeneratingPdf && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Generating PDF...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  
  // PDF Preview Styles
  pdfContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pdfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  shareButton: {
    padding: theme.spacing.sm,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height - 100, // Account for header
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  createdDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'right',
  },
  balanceText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },

  // Section Styles
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // Customer Info
  customerInfo: {
    marginLeft: theme.spacing.sm,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  customerDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },

  // Line Items
  lineItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  itemTags: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  itemTag: {
    fontSize: 12,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.border,
    color: theme.colors.textSecondary,
  },
  taxableTag: {
    backgroundColor: theme.colors.success + '20',
    color: theme.colors.success,
  },

  // Totals
  totalsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
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
    fontWeight: '500',
    color: theme.colors.text,
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.md,
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

  // Payments
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  paymentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  paidAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },

  // Additional Info
  infoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    width: 80,
    marginRight: theme.spacing.md,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  overdueText: {
    color: theme.colors.error,
    fontWeight: '600',
  },

  // Actions
  actions: {
    flexDirection: 'column',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  actionButton: {
    // Buttons will now stack vertically
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
});
