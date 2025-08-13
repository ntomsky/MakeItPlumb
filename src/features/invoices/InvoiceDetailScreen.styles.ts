import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../app/theme';

const { width, height } = Dimensions.get('window');

export const invoiceDetailStyles = StyleSheet.create({
  // Layout Styles
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

  // Error State Styles
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

  // PDF Styles
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

  // Loading Styles
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

export const headerStyles = StyleSheet.create({
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
  documentNumber: {
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
});

export const sectionStyles = StyleSheet.create({
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
});

export const customerStyles = StyleSheet.create({
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
});

export const lineItemStyles = StyleSheet.create({
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
});

export const totalsStyles = StyleSheet.create({
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
});

export const paymentStyles = StyleSheet.create({
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
});

export const infoStyles = StyleSheet.create({
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
});

export const actionStyles = StyleSheet.create({
  actions: {
    flexDirection: 'column',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  actionButton: {
    // Buttons stack vertically with gap from parent
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButtonInRow: {
    flex: 1,
  },
});
