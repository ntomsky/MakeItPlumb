import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../app/theme';
import { Quote, Invoice } from '../types/domain';

interface StatusChipProps {
  status: Quote['status'] | Invoice['status'];
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'medium',
}) => {
  const chipStyle = [
    styles.base,
    styles[size],
    styles[status],
  ];

  const textStyle = [
    styles.text,
    styles[`${size}Text`],
    styles[`${status}Text`],
  ];

  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <View style={chipStyle}>
      <Text style={textStyle}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.large,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  
  // Sizes
  small: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  
  // Status colors
  draft: {
    backgroundColor: theme.colors.draft + '20',
    borderWidth: 1,
    borderColor: theme.colors.draft,
  },
  sent: {
    backgroundColor: theme.colors.sent + '20',
    borderWidth: 1,
    borderColor: theme.colors.sent,
  },
  accepted: {
    backgroundColor: theme.colors.accepted + '20',
    borderWidth: 1,
    borderColor: theme.colors.accepted,
  },
  converted: {
    backgroundColor: theme.colors.converted + '20',
    borderWidth: 1,
    borderColor: theme.colors.converted,
  },
  expired: {
    backgroundColor: theme.colors.expired + '20',
    borderWidth: 1,
    borderColor: theme.colors.expired,
  },
  paid: {
    backgroundColor: theme.colors.paid + '20',
    borderWidth: 1,
    borderColor: theme.colors.paid,
  },
  overdue: {
    backgroundColor: theme.colors.overdue + '20',
    borderWidth: 1,
    borderColor: theme.colors.overdue,
  },
  
  // Text styles
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 13,
  },
  
  // Status text colors
  draftText: {
    color: theme.colors.draft,
  },
  sentText: {
    color: theme.colors.sent,
  },
  acceptedText: {
    color: theme.colors.accepted,
  },
  convertedText: {
    color: theme.colors.converted,
  },
  expiredText: {
    color: theme.colors.expired,
  },
  paidText: {
    color: theme.colors.paid,
  },
  overdueText: {
    color: theme.colors.overdue,
  },
});
