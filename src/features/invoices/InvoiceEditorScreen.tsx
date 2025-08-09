import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../app/theme';

export const InvoiceEditorScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoice Editor Screen</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
