import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import { StatusChip } from '../../components/StatusChip';
import { Quote } from '../../types/domain';
import { RootState } from '../../store/store';
import { QuotesStackParamList } from '../../app/navigation';
import { theme } from '../../app/theme';

type QuotesListScreenNavigationProp = NativeStackNavigationProp<QuotesStackParamList, 'QuotesList'>;

interface QuoteCardProps {
  quote: Quote;
  onPress: () => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.quoteNumber}>{quote.number}</Text>
        <StatusChip status={quote.status} />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.customerInfo}>
          Customer ID: {quote.customerId}
        </Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.totalAmount}>
            ${quote.summary.total.toFixed(2)}
          </Text>
          <Text style={styles.dateText}>
            {new Date(quote.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const QuotesListScreen: React.FC = () => {
  const navigation = useNavigation<QuotesListScreenNavigationProp>();
  const quotes = useSelector((state: RootState) => state.quotes.quotes);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  // Reset navigation stack to QuotesList when screen is focused
  // This ensures we always show the list when coming back to the Quotes tab
  useFocusEffect(
    React.useCallback(() => {
      // Check if we're not already on the QuotesList screen
      const state = navigation.getState();
      if (state.routes[state.index].name !== 'QuotesList') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'QuotesList' }],
        });
      }
    }, [navigation])
  );

  const filteredQuotes = React.useMemo(() => {
    if (filterStatus === 'all') {
      return quotes;
    }
    return quotes.filter((quote: Quote) => quote.status === filterStatus);
  }, [quotes, filterStatus]);

  const handleQuotePress = (quote: Quote) => {
    navigation.navigate('QuoteDetail', { quoteId: quote.id });
  };

  const handleNewQuote = () => {
    navigation.navigate('QuoteEditor', {});
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          title="+ New"
          onPress={handleNewQuote}
          variant="primary"
          size="small"
        />
      ),
    });
  }, [navigation, handleNewQuote]);

  const renderQuote = ({ item }: { item: Quote }) => (
    <QuoteCard
      quote={item}
      onPress={() => handleQuotePress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Quotes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first quote to get started
      </Text>
      <Button
        title="Create Quote"
        onPress={handleNewQuote}
        variant="primary"
        style={styles.emptyButton}
      />
    </View>
  );

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'converted', label: 'Converted' },
    { key: 'expired', label: 'Expired' },
  ];

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              filterStatus === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(filter.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quotes List */}
      <FlatList
        data={filteredQuotes}
        renderItem={renderQuote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  filterButtonTextActive: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quoteNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardContent: {
    marginTop: theme.spacing.sm,
  },
  customerInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});
