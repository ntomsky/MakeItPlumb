import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import { theme } from '../../app/theme';
import { Button } from '../../components/Button';
import { StatusChip } from '../../components/StatusChip';
import { VoiceCaptureSheet } from '../voice/VoiceCaptureSheet';
import { VoiceParsingResult } from '../../types/voice-intent';
import { selectRecentQuotes } from '../quotes/quotes.slice';
import { selectRecentInvoices } from '../invoices/invoices.slice';
import { selectCustomers } from '../customers/customers.slice';
import { RootState } from '../../store/store';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [showVoiceCapture, setShowVoiceCapture] = React.useState(false);
  
  const recentQuotes = useSelector(selectRecentQuotes(3));
  const recentInvoices = useSelector(selectRecentInvoices(3));
  const customers = useSelector(selectCustomers);

  const handleVoiceCapture = () => {
    setShowVoiceCapture(true);
  };

  const handleVoiceCaptureClose = () => {
    setShowVoiceCapture(false);
  };

  const handleIntentReady = (result: VoiceParsingResult) => {
    setShowVoiceCapture(false);
    
    // Handle different confidence levels
    switch (result.actionRequired) {
      case 'confirm':
        // High confidence - show confirmation dialog
        Alert.alert(
          'Confirm Action',
          `I understood: ${result.result.intent.replace('_', ' ')} for ${result.result.entities.customer?.name || 'customer'}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: () => navigateToEditor(result) }
          ]
        );
        break;
        
      case 'fix_missing':
        // Medium confidence - show what's missing
        Alert.alert(
          'Missing Information',
          `I need help with: ${result.result.missing.join(', ')}.\n\nSuggestions: ${result.suggestions?.join(', ')}`,
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Continue Anyway', onPress: () => navigateToEditor(result) }
          ]
        );
        break;
        
      case 'try_again':
        // Low confidence - ask to try again
        Alert.alert(
          'Please Try Again',
          result.suggestions?.join('\n') || 'I didn\'t understand. Please try speaking again.',
          [{ text: 'OK' }]
        );
        break;
    }
  };

  const navigateToEditor = (result: VoiceParsingResult) => {
    const intent = result.result.intent;
    
    if (intent === 'create_quote') {
      navigation.navigate('QuotesTab', { 
        screen: 'QuoteEditor',
        params: { intentResult: result }
      });
    } else if (intent === 'create_invoice') {
      navigation.navigate('InvoicesTab', { 
        screen: 'InvoiceEditor',
        params: { intentResult: result }
      });
    } else if (intent === 'add_customer') {
      navigation.navigate('CustomersTab', {
        screen: 'EditCustomer',
        params: { intentResult: result }
      });
    }
  };

  const handleNewQuote = () => {
    navigation.navigate('QuotesTab', { 
      screen: 'QuoteEditor' 
    });
  };

  const handleNewInvoice = () => {
    navigation.navigate('InvoicesTab', { 
      screen: 'InvoiceEditor' 
    });
  };

  const handleAddCustomer = () => {
    navigation.navigate('CustomersTab', { 
      screen: 'EditCustomer' 
    });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleVoiceTest = () => {
    navigation.navigate('VoiceTest');
  };

  return (
    <>
      <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Welcome back!</Text>
          <TouchableOpacity onPress={handleSettings}>
            <Icon name="settings" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{customers.length}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{recentQuotes.length}</Text>
            <Text style={styles.statLabel}>Recent Quotes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{recentInvoices.length}</Text>
            <Text style={styles.statLabel}>Recent Invoices</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleVoiceCapture}>
            <Icon name="mic" size={32} color={theme.colors.primary} />
            <Text style={styles.actionTitle}>Voice Capture</Text>
            <Text style={styles.actionSubtitle}>Create with voice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleNewQuote}>
            <Icon name="description" size={32} color={theme.colors.secondary} />
            <Text style={styles.actionTitle}>New Quote</Text>
            <Text style={styles.actionSubtitle}>Create quote</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleNewInvoice}>
            <Icon name="receipt" size={32} color={theme.colors.success} />
            <Text style={styles.actionTitle}>New Invoice</Text>
            <Text style={styles.actionSubtitle}>Create invoice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleAddCustomer}>
            <Icon name="person-add" size={32} color={theme.colors.warning} />
            <Text style={styles.actionTitle}>Add Customer</Text>
            <Text style={styles.actionSubtitle}>New customer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleVoiceTest}>
            <Icon name="smart-toy" size={32} color="#9C27B0" />
            <Text style={styles.actionTitle}>Voice AI Test</Text>
            <Text style={styles.actionSubtitle}>Test Claude 3.5</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {recentQuotes.length === 0 && recentInvoices.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No recent activity</Text>
            <Text style={styles.emptySubtext}>Create your first quote or invoice</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {recentQuotes.slice(0, 3).map((quote) => (
              <TouchableOpacity
                key={quote.id}
                style={styles.activityItem}
                onPress={() => navigation.navigate('QuotesTab', { 
                  screen: 'QuoteDetail', 
                  params: { quoteId: quote.id } 
                })}
              >
                <View style={styles.activityIcon}>
                  <Icon name="description" size={20} color={theme.colors.secondary} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Quote {quote.number}</Text>
                  <Text style={styles.activitySubtitle}>
                    {new Date(quote.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusChip status={quote.status} size="small" />
              </TouchableOpacity>
            ))}
            
            {recentInvoices.slice(0, 3).map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.activityItem}
                onPress={() => navigation.navigate('InvoicesTab', { 
                  screen: 'InvoiceDetail', 
                  params: { invoiceId: invoice.id } 
                })}
              >
                <View style={styles.activityIcon}>
                  <Icon name="receipt" size={20} color={theme.colors.success} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Invoice {invoice.number}</Text>
                  <Text style={styles.activitySubtitle}>
                    {new Date(invoice.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusChip status={invoice.status} size="small" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    
    <VoiceCaptureSheet
      visible={showVoiceCapture}
      onClose={handleVoiceCaptureClose}
      onIntentReady={handleIntentReady}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  activityList: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  activitySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
