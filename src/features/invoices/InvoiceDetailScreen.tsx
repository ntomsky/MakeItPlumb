import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../../app/theme';
import { Button } from '../../components/Button';
import { StatusChip } from '../../components/StatusChip';
import { RootState } from '../../store/store';
import { InvoicesStackParamList } from '../../app/navigation';
import { PdfService } from '../../services/pdf.service';
import { MoneyUtils } from '../../services/money.service';
import { Customer, Invoice, LineItem } from '../../types/domain';
import {
  invoiceDetailStyles,
  headerStyles,
  sectionStyles,
  customerStyles,
  lineItemStyles,
  totalsStyles,
  paymentStyles,
  infoStyles,
  actionStyles,
} from './InvoiceDetailScreen.styles';

type InvoiceDetailRouteProp = RouteProp<InvoicesStackParamList, 'InvoiceDetail'>;

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
      <View style={invoiceDetailStyles.centerContainer}>
        <Icon name="error" size={64} color={theme.colors.textSecondary} />
        <Text style={invoiceDetailStyles.errorText}>Invoice not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={invoiceDetailStyles.errorButton}
        />
      </View>
    );
  }

  const totalPaid = MoneyUtils.calculateTotalPaid(invoice.payments);
  const balance = MoneyUtils.calculateBalance(invoice.summary.total, invoice.payments);
  const isOverdue = MoneyUtils.isOverdue(invoice.dueDate) && invoice.status !== 'paid';

  return (
    <ScrollView style={invoiceDetailStyles.container} contentContainerStyle={invoiceDetailStyles.scrollContent}>
      {/* Header */}
      <View style={headerStyles.header}>
        <View style={headerStyles.headerLeft}>
          <Text style={headerStyles.documentNumber}>{invoice.number}</Text>
          <View style={headerStyles.statusRow}>
            <StatusChip status={isOverdue ? 'overdue' : invoice.status} />
            <Text style={headerStyles.createdDate}>
              Created: {new Date(invoice.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={headerStyles.headerRight}>
          <Text style={headerStyles.totalAmount}>
            {MoneyUtils.formatCurrency(invoice.summary.total)}
          </Text>
          {balance > 0 && (
            <Text style={headerStyles.balanceText}>
              Balance: {MoneyUtils.formatCurrency(balance)}
            </Text>
          )}
        </View>
      </View>

      {/* Customer Info */}
      <View style={sectionStyles.section}>
        <Text style={sectionStyles.sectionTitle}>Customer</Text>
        <View style={customerStyles.customerInfo}>
          <Text style={customerStyles.customerName}>
            {customer?.name || `Customer ID: ${invoice.customerId.slice(0, 8)}...`}
          </Text>
          {customer?.phone && (
            <Text style={customerStyles.customerDetail}>{customer.phone}</Text>
          )}
          {customer?.email && (
            <Text style={customerStyles.customerDetail}>{customer.email}</Text>
          )}
        </View>
      </View>

      {/* Line Items */}
      <View style={sectionStyles.section}>
        <Text style={sectionStyles.sectionTitle}>Items</Text>
        {invoice.items.map((item: LineItem, index: number) => (
          <View key={item.id || index} style={lineItemStyles.lineItem}>
            <View style={lineItemStyles.itemHeader}>
              <Text style={lineItemStyles.itemDescription}>{item.description}</Text>
              <Text style={lineItemStyles.itemAmount}>
                {MoneyUtils.formatCurrency(item.qty * item.unitPrice)}
              </Text>
            </View>
            <View style={lineItemStyles.itemDetails}>
              <Text style={lineItemStyles.itemDetail}>
                Qty: {item.qty} × {MoneyUtils.formatCurrency(item.unitPrice)}
              </Text>
              <View style={lineItemStyles.itemTags}>
                <Text style={[lineItemStyles.itemTag, item.taxable && lineItemStyles.taxableTag]}>
                  {item.taxable ? 'Taxable' : 'Non-taxable'}
                </Text>
                <Text style={lineItemStyles.itemTag}>{item.kind}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={sectionStyles.section}>
        <Text style={sectionStyles.sectionTitle}>Summary</Text>
        <View style={totalsStyles.totalsContainer}>
          <View style={totalsStyles.totalRow}>
            <Text style={totalsStyles.totalLabel}>Subtotal</Text>
            <Text style={totalsStyles.totalValue}>
              {MoneyUtils.formatCurrency(invoice.summary.subTotal)}
            </Text>
          </View>
          
          {invoice.summary.tax > 0 && (
            <View style={totalsStyles.totalRow}>
              <Text style={totalsStyles.totalLabel}>
                Tax ({(invoice.summary.taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={totalsStyles.totalValue}>
                {MoneyUtils.formatCurrency(invoice.summary.tax)}
              </Text>
            </View>
          )}
          
          <View style={[totalsStyles.totalRow, totalsStyles.grandTotalRow]}>
            <Text style={totalsStyles.grandTotalLabel}>Total</Text>
            <Text style={totalsStyles.grandTotalValue}>
              {MoneyUtils.formatCurrency(invoice.summary.total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      {invoice.payments && invoice.payments.length > 0 && (
        <View style={sectionStyles.section}>
          <Text style={sectionStyles.sectionTitle}>Payments</Text>
          {invoice.payments.map((payment: { amount: number; date: string }, index: number) => (
            <View key={index} style={paymentStyles.paymentRow}>
              <Text style={paymentStyles.paymentDate}>
                {new Date(payment.date).toLocaleDateString()}
              </Text>
              <Text style={paymentStyles.paymentAmount}>
                {MoneyUtils.formatCurrency(payment.amount)}
              </Text>
            </View>
          ))}
          <View style={totalsStyles.totalRow}>
            <Text style={totalsStyles.totalLabel}>Total Paid</Text>
            <Text style={paymentStyles.paidAmount}>
              {MoneyUtils.formatCurrency(totalPaid)}
            </Text>
          </View>
        </View>
      )}

      {/* Additional Info */}
      {(invoice.terms || invoice.dueDate || invoice.notes) && (
        <View style={sectionStyles.section}>
          <Text style={sectionStyles.sectionTitle}>Additional Information</Text>
          
          {invoice.terms && (
            <View style={infoStyles.infoRow}>
              <Text style={infoStyles.infoLabel}>Terms:</Text>
              <Text style={infoStyles.infoValue}>{invoice.terms}</Text>
            </View>
          )}
          
          {invoice.dueDate && (
            <View style={infoStyles.infoRow}>
              <Text style={infoStyles.infoLabel}>Due Date:</Text>
              <Text style={[
                infoStyles.infoValue,
                isOverdue && infoStyles.overdueText
              ]}>
                {new Date(invoice.dueDate).toLocaleDateString()}
                {isOverdue && ' (OVERDUE)'}
              </Text>
            </View>
          )}
          
          {invoice.notes && (
            <View style={infoStyles.infoRow}>
              <Text style={infoStyles.infoLabel}>Notes:</Text>
              <Text style={infoStyles.infoValue}>{invoice.notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={actionStyles.actions}>
        <Button
          title={isGeneratingPdf ? "Generating..." : "Open PDF"}
          onPress={togglePdfPreview}
          style={actionStyles.actionButton}
          disabled={isGeneratingPdf || !pdfUri}
        />
        
        <Button
          title="Share PDF"
          onPress={handleShare}
          style={actionStyles.actionButton}
          variant="outline"
          disabled={isGeneratingPdf || !pdfUri}
        />
        
        <Button
          title="Edit Invoice"
          onPress={handleEdit}
          style={actionStyles.actionButton}
          variant="outline"
        />
      </View>

      {isGeneratingPdf && (
        <View style={invoiceDetailStyles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={invoiceDetailStyles.loadingText}>Generating PDF...</Text>
        </View>
      )}
    </ScrollView>
  );
};
