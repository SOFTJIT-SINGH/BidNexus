import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';

// Screens
import LoginScreen from '@/src/screens/auth/LoginScreen';
import SignUpScreen from '@/src/screens/auth/SignUpScreen';
import OTPScreen from '@/src/screens/auth/OTPScreen';
import HomeScreen from '@/src/screens/main/HomeScreen';
import ProfileScreen from '@/src/screens/main/ProfileScreen';
import AuctionDetailScreen from '@/src/screens/main/AuctionDetailScreen';
import CreateAuctionScreen from '@/src/screens/main/CreateAuctionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090E', // Dark background
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
          position: 'absolute', // Allows content to flow behind it
          elevation: 0,
        },
        tabBarActiveTintColor: '#06b6d4', // Cyan active
        tabBarInactiveTintColor: '#6b7280', // Gray inactive
        tabBarShowLabel: false, // Cleaner tech look without labels
      }}
    >
      <Tab.Screen name="Auctions" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session, isInitialized, initialize, cleanup } = useAuthStore();

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, []);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // Authenticated App
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="CreateAuction" component={CreateAuctionScreen} options={{ presentation: 'formSheet' }} />
          </Stack.Group>
        ) : (
          // Unauthenticated Flow
          <Stack.Group>
            <Stack.Screen name="Auth" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}