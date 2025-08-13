import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../app/theme';
import { Button } from './Button';
import { StatusChip } from './StatusChip';
import { RootState } from '../store/store';
import { PdfService } from '../services/pdf.service';
import { MoneyUtils } from '../services/money.service';
import { Customer, Invoice, Quote, LineItem } from '../types/domain';
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
} from '../features/invoices/InvoiceDetailScreen.styles';

// Union type for document
type Document = Invoice | Quote;

// Type guards to distinguish between invoice and quote
const isInvoice = (doc: Document): doc is Invoice => {
  return 'dueDate' in doc;
};

const isQuote = (doc: Document): doc is Quote => {
  return !('dueDate' in doc);
};

interface DocumentDetailScreenProps {
  document: Document;
  documentType: 'Invoice' | 'Quote';
  onEdit: (documentId: string) => void;
  onConvertToInvoice?: (quoteId: string) => void; // Only for quotes
}

export const DocumentDetailScreen: React.FC<DocumentDetailScreenProps> = ({
  document,
  documentType,
  onEdit,
  onConvertToInvoice,
}) => {
  const navigation = useNavigation();
  const businessProfile = useSelector((state: RootState) => state.settings.businessProfile);
  const customer = useSelector((state: RootState) =>
    state.customers.customers.find((c: Customer) => c.id === document.customerId)
  );

  const [pdfUri, setPdfUri] = React.useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  React.useEffect(() => {
    if (document && businessProfile && customer) {
      generatePdf();
    }
  }, [document, businessProfile, customer]);

  const generatePdf = async () => {
    if (!document || !businessProfile || !customer) return;

    setIsGeneratingPdf(true);
    try {
      const result = await PdfService.generatePdf({
        business: businessProfile,
        customer: customer as Customer,
        doc: document,
      });
      setPdfUri(result.uri);
    } catch (error) {
      console.error(`Error generating ${documentType} PDF:`, error);
      Alert.alert('Error', `Failed to generate ${documentType.toLowerCase()} PDF`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    if (pdfUri && document) {
      try {
        const fileName = `${documentType}_${document.number}.pdf`;
        
        if (Platform.OS === 'ios') {
          await Share.share({
            url: pdfUri,
            title: fileName,
            message: `${documentType} ${document.number} from ${businessProfile.name}`,
          });
        } else {
          await Share.share({
            title: fileName,
            message: `${documentType} ${document.number} from ${businessProfile.name}. PDF path: ${pdfUri}`,
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
    if (pdfUri && document) {
      try {
        const fileName = `${documentType}_${document.number}.pdf`;
        
        await Share.share({
          url: pdfUri,
          title: fileName,
          message: `View ${documentType} ${document.number}`,
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
    onEdit(document.id);
  };

  const handleConvertToInvoice = () => {
    if (isQuote(document) && onConvertToInvoice) {
      Alert.alert(
        'Convert to Invoice',
        `Are you sure you want to convert quote ${document.number} to an invoice?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Convert', onPress: () => onConvertToInvoice(document.id) }
        ]
      );
    }
  };

  const togglePdfPreview = () => {
    handleViewPdf();
  };

  if (!document) {
    return (
      <View style={invoiceDetailStyles.centerContainer}>
        <Icon name="error" size={64} color={theme.colors.textSecondary} />
        <Text style={invoiceDetailStyles.errorText}>{documentType} not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={invoiceDetailStyles.errorButton}
        />
      </View>
    );
  }

  // Calculate payment info for invoices only
  const totalPaid = isInvoice(document) ? MoneyUtils.calculateTotalPaid(document.payments) : 0;
  const balance = isInvoice(document) ? MoneyUtils.calculateBalance(document.summary.total, document.payments) : 0;
  const isOverdue = isInvoice(document) ? (MoneyUtils.isOverdue(document.dueDate) && document.status !== 'paid') : false;

  return (
    <ScrollView style={invoiceDetailStyles.container} contentContainerStyle={invoiceDetailStyles.scrollContent}>
      {/* Header */}
      <View style={headerStyles.header}>
        <View style={headerStyles.headerLeft}>
          <Text style={headerStyles.documentNumber}>{document.number}</Text>
          <View style={headerStyles.statusRow}>
            <StatusChip status={isOverdue ? 'overdue' : document.status} />
            <Text style={headerStyles.createdDate}>
              Created: {new Date(document.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={headerStyles.headerRight}>
          <Text style={headerStyles.totalAmount}>
            {MoneyUtils.formatCurrency(document.summary.total)}
          </Text>
          {isInvoice(document) && balance > 0 && (
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
            {customer?.name || `Customer ID: ${document.customerId.slice(0, 8)}...`}
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
        {document.items.map((item: LineItem, index: number) => (
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
              {MoneyUtils.formatCurrency(document.summary.subTotal)}
            </Text>
          </View>
          
          {document.summary.tax > 0 && (
            <View style={totalsStyles.totalRow}>
              <Text style={totalsStyles.totalLabel}>
                Tax ({(document.summary.taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={totalsStyles.totalValue}>
                {MoneyUtils.formatCurrency(document.summary.tax)}
              </Text>
            </View>
          )}
          
          <View style={[totalsStyles.totalRow, totalsStyles.grandTotalRow]}>
            <Text style={totalsStyles.grandTotalLabel}>Total</Text>
            <Text style={totalsStyles.grandTotalValue}>
              {MoneyUtils.formatCurrency(document.summary.total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Info (Invoice Only) */}
      {isInvoice(document) && document.payments && document.payments.length > 0 && (
        <View style={sectionStyles.section}>
          <Text style={sectionStyles.sectionTitle}>Payments</Text>
          {document.payments.map((payment: { amount: number; date: string }, index: number) => (
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
      {((isInvoice(document) && (document.terms || document.dueDate)) || document.notes) && (
        <View style={sectionStyles.section}>
          <Text style={sectionStyles.sectionTitle}>Additional Information</Text>
          
          {isInvoice(document) && document.terms && (
            <View style={infoStyles.infoRow}>
              <Text style={infoStyles.infoLabel}>Terms:</Text>
              <Text style={infoStyles.infoValue}>{document.terms}</Text>
            </View>
          )}
          
          {isInvoice(document) && document.dueDate && (
            <View style={infoStyles.infoRow}>
              <Text style={infoStyles.infoLabel}>Due Date:</Text>
              <Text style={[
                infoStyles.infoValue,
                isOverdue && infoStyles.overdueText
              ]}>
                {new Date(document.dueDate).toLocaleDateString()}
                {isOverdue && ' (OVERDUE)'}
              </Text>
            </View>
          )}
          
          {document.notes && (
            <View style={infoStyles.infoRow}>
              <Text style={infoStyles.infoLabel}>Notes:</Text>
              <Text style={infoStyles.infoValue}>{document.notes}</Text>
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
          title={`Edit ${documentType}`}
          onPress={handleEdit}
          style={actionStyles.actionButton}
          variant="outline"
        />

        {/* Convert to Invoice button (Quote only) */}
        {isQuote(document) && onConvertToInvoice && (
          <Button
            title="Convert to Invoice"
            onPress={handleConvertToInvoice}
            style={actionStyles.actionButton}
            variant="primary"
          />
        )}
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
