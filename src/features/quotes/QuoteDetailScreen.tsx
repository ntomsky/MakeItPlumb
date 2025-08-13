import * as React from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { DocumentDetailScreen } from '../../components/DocumentDetailScreen';
import { RootState } from '../../store/store';
import { QuotesStackParamList } from '../../app/navigation';
import { Quote } from '../../types/domain';

type QuoteDetailRouteProp = RouteProp<QuotesStackParamList, 'QuoteDetail'>;

export const QuoteDetailScreen: React.FC = () => {
  const route = useRoute<QuoteDetailRouteProp>();
  const navigation = useNavigation();
  const { quoteId } = route.params;

  const quote = useSelector((state: RootState) =>
    state.quotes.quotes.find((q: Quote) => q.id === quoteId)
  );

  const handleEdit = (documentId: string) => {
    (navigation as any).navigate('QuoteEditor', { quoteId: documentId });
  };

  if (!quote) {
    return null; // DocumentDetailScreen will handle the error state
  }

  return (
    <DocumentDetailScreen
      document={quote}
      documentType="Quote"
      onEdit={handleEdit}
    />
  );
};
