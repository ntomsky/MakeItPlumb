import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import { HomeScreen } from '../features/home/HomeScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { CustomersListScreen } from '../features/customers/CustomersListScreen';
import { CustomerDetailScreen } from '../features/customers/CustomerDetailScreen';
import { EditCustomerScreen } from '../features/customers/EditCustomerScreen';
import { QuotesListScreen } from '../features/quotes/QuotesListScreen';
import { QuoteEditorScreen } from '../features/quotes/QuoteEditorScreen';
import { QuoteDetailScreen } from '../features/quotes/QuoteDetailScreen';
import { InvoicesListScreen } from '../features/invoices/InvoicesListScreen';
import { InvoiceEditorScreen } from '../features/invoices/InvoiceEditorScreen';
import { InvoiceDetailScreen } from '../features/invoices/InvoiceDetailScreen';

import { theme } from './theme';

// Navigation types
export type RootTabParamList = {
  HomeTab: undefined;
  CustomersTab: undefined;
  QuotesTab: undefined;
  InvoicesTab: undefined;
};

import { VoiceParsingResult } from '../types/voice-intent';

export type HomeStackParamList = {
  Home: undefined;
  Settings: undefined;
  VoiceTest: undefined;
};

export type CustomersStackParamList = {
  CustomersList: undefined;
  CustomerDetail: { customerId: string };
  EditCustomer: { customerId?: string; intentResult?: VoiceParsingResult };
};

export type QuotesStackParamList = {
  QuotesList: undefined;
  QuoteEditor: { quoteId?: string; customerId?: string; intentResult?: VoiceParsingResult };
  QuoteDetail: { quoteId: string };
};

export type InvoicesStackParamList = {
  InvoicesList: undefined;
  InvoiceEditor: { invoiceId?: string; customerId?: string; quoteId?: string; intentResult?: VoiceParsingResult };
  InvoiceDetail: { invoiceId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CustomersStack = createNativeStackNavigator<CustomersStackParamList>();
const QuotesStack = createNativeStackNavigator<QuotesStackParamList>();
const InvoicesStack = createNativeStackNavigator<InvoicesStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'MakeItPlumb' }}
      />
      <HomeStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </HomeStack.Navigator>
  );
}

function CustomersStackNavigator() {
  return (
    <CustomersStack.Navigator>
      <CustomersStack.Screen 
        name="CustomersList" 
        component={CustomersListScreen}
        options={{ title: 'Customers' }}
      />
      <CustomersStack.Screen 
        name="CustomerDetail" 
        component={CustomerDetailScreen}
        options={{ title: 'Customer Details' }}
      />
      <CustomersStack.Screen 
        name="EditCustomer" 
        component={EditCustomerScreen}
        options={({ route }) => ({
          title: route.params?.customerId ? 'Edit Customer' : 'New Customer'
        })}
      />
    </CustomersStack.Navigator>
  );
}

function QuotesStackNavigator() {
  return (
    <QuotesStack.Navigator initialRouteName="QuotesList">
      <QuotesStack.Screen 
        name="QuotesList" 
        component={QuotesListScreen}
        options={{ title: 'Quotes' }}
      />
      <QuotesStack.Screen 
        name="QuoteEditor" 
        component={QuoteEditorScreen}
        options={({ route }) => ({
          title: route.params?.quoteId ? 'Edit Quote' : 'New Quote'
        })}
      />
      <QuotesStack.Screen 
        name="QuoteDetail" 
        component={QuoteDetailScreen}
        options={{ title: 'Quote Details' }}
      />
    </QuotesStack.Navigator>
  );
}

function InvoicesStackNavigator() {
  return (
    <InvoicesStack.Navigator initialRouteName="InvoicesList">
      <InvoicesStack.Screen 
        name="InvoicesList" 
        component={InvoicesListScreen}
        options={{ title: 'Invoices' }}
      />
      <InvoicesStack.Screen 
        name="InvoiceEditor" 
        component={InvoiceEditorScreen}
        options={({ route }) => ({
          title: route.params?.invoiceId ? 'Edit Invoice' : 'New Invoice'
        })}
      />
      <InvoicesStack.Screen 
        name="InvoiceDetail" 
        component={InvoiceDetailScreen}
        options={{ title: 'Invoice Details' }}
      />
    </InvoicesStack.Navigator>
  );
}

export function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            switch (route.name) {
              case 'HomeTab':
                iconName = 'home';
                break;
              case 'CustomersTab':
                iconName = 'people';
                break;
              case 'QuotesTab':
                iconName = 'description';
                break;
              case 'InvoicesTab':
                iconName = 'receipt';
                break;
              default:
                iconName = 'help';
                break;
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="HomeTab" 
          component={HomeStackNavigator}
          options={{ title: 'Home' }}
        />
        <Tab.Screen 
          name="CustomersTab" 
          component={CustomersStackNavigator}
          options={{ title: 'Customers' }}
        />
        <Tab.Screen 
          name="QuotesTab" 
          component={QuotesStackNavigator}
          options={{ title: 'Quotes' }}
        />
        <Tab.Screen 
          name="InvoicesTab" 
          component={InvoicesStackNavigator}
          options={{ title: 'Invoices' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
