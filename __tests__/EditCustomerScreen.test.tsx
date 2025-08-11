import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';

import { EditCustomerScreen } from '../src/features/customers/EditCustomerScreen';
import customersReducer from '../src/features/customers/customers.slice';

// Mock dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

// Create a test store
const testStore = configureStore({
  reducer: {
    customers: customersReducer,
  },
});

const Stack = createNativeStackNavigator();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={testStore}>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="EditCustomer" component={EditCustomerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </Provider>
);

describe('EditCustomerScreen', () => {
  it('should render customer form fields', () => {
    const { getByText, getByDisplayValue } = render(
      <TestWrapper>
        <EditCustomerScreen />
      </TestWrapper>
    );

    // Check if main sections are rendered
    expect(getByText('Customer Information')).toBeTruthy();
    expect(getByText('Service Address *')).toBeTruthy();
    expect(getByText('Add Customer')).toBeTruthy();
  });

  it('should show validation errors for required fields', () => {
    const { getByText } = render(
      <TestWrapper>
        <EditCustomerScreen />
      </TestWrapper>
    );

    // Try to save without filling required fields
    const saveButton = getByText('Add Customer');
    fireEvent.press(saveButton);

    // Should show validation errors
    expect(getByText('Customer name is required')).toBeTruthy();
    expect(getByText('Service address is required')).toBeTruthy();
  });

  it('should toggle billing address section', () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <EditCustomerScreen />
      </TestWrapper>
    );

    // Initially billing address should be hidden (same as service)
    expect(queryByText('Billing Address')).toBeFalsy();

    // Click the toggle button
    const toggleButton = getByText('◯ Use different billing address');
    fireEvent.press(toggleButton);

    // Now billing address section should be visible
    expect(getByText('Billing Address')).toBeTruthy();
    expect(getByText('✓ Billing address same as service address')).toBeTruthy();
  });
});
