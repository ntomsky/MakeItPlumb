import * as React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { theme } from '../../app/theme';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { BusinessProfileSchema, BusinessProfileSchemaType } from '../../types/schemas';
import { updateBusinessProfile } from '../../store/settings.slice';
import { RootState } from '../../store/store';

export const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const businessProfile = useSelector((state: RootState) => state.settings.businessProfile);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(BusinessProfileSchema),
    defaultValues: businessProfile,
  });

  const onSubmit = (data: any) => {
    dispatch(updateBusinessProfile(data));
    Alert.alert('Success', 'Business profile updated successfully!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Business Name"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              required
              placeholder="Your Plumbing Business"
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Phone Number"
              value={value}
              onChangeText={onChange}
              error={errors.phone?.message}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Email Address"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              placeholder="business@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="defaultTaxRate"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Default Tax Rate (%)"
              value={String((value || 0) * 100)}
              onChangeText={(text) => {
                const rate = parseFloat(text) / 100;
                onChange(isNaN(rate) ? 0 : rate);
              }}
              error={errors.defaultTaxRate?.message}
              placeholder="7.0"
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="defaultLaborRate"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Default Labor Rate ($)"
              value={String(value || 0)}
              onChangeText={(text) => {
                const rate = parseFloat(text);
                onChange(isNaN(rate) ? 0 : rate);
              }}
              error={errors.defaultLaborRate?.message}
              placeholder="125"
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="defaultTerms"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Default Payment Terms"
              value={value}
              onChangeText={onChange}
              error={errors.defaultTerms?.message}
              placeholder="Net 30"
            />
          )}
        />

        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  form: {
    padding: theme.spacing.lg,
  },
  actions: {
    marginTop: theme.spacing.xl,
  },
});
