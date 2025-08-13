import * as React from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { DocumentDetailScreen } from '../../components/DocumentDetailScreen';
import { RootState } from '../../store/store';
import { InvoicesStackParamList } from '../../app/navigation';
import { Invoice } from '../../types/domain';

type InvoiceDetailRouteProp = RouteProp<InvoicesStackParamList, 'InvoiceDetail'>;

export const InvoiceDetailScreen: React.FC = () => {
  const route = useRoute<InvoiceDetailRouteProp>();
  const navigation = useNavigation();
  const { invoiceId } = route.params;

  const invoice = useSelector((state: RootState) =>
    state.invoices.invoices.find((i: Invoice) => i.id === invoiceId)
  );

  const handleEdit = (documentId: string) => {
    (navigation as any).navigate('InvoiceEditor', { invoiceId: documentId });
  };

  if (!invoice) {
    return null; // DocumentDetailScreen will handle the error state
  }

  return (
    <DocumentDetailScreen
      document={invoice}
      documentType="Invoice"
      onEdit={handleEdit}
    />
  );
};
