import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from '@/src/screens/auth/LoginScreen';
import SignUpScreen from '@/src/screens/auth/SignUpScreen';
import OTPScreen from '@/src/screens/auth/OTPScreen';
import HomeScreen from '@/src/screens/main/HomeScreen';
import ProfileScreen from '@/src/screens/main/ProfileScreen';
import AuctionDetailScreen from '@/src/screens/main/AuctionDetailScreen';
import CreateAuctionScreen from '@/src/screens/main/CreateAuctionScreen';
import ResetPasswordScreen from '@/src/screens/auth/ResetPasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#050508', // Deep tech black
          borderTopWidth: 1,
          borderTopColor: 'rgba(6, 182, 212, 0.2)', // Cyan border
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#06b6d4', // Cyan active
        tabBarInactiveTintColor: '#4b5563', // Gray inactive
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'Auctions') {
            iconName = 'flash'; // Lightning bolt for live market
          } else if (route.name === 'Profile') {
            iconName = 'person'; // User icon for profile
          }
          return <Ionicons name={iconName} size={size + 4} color={color} />;
        },
      })}
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
            <Stack.Screen name="CreateAuction" component={CreateAuctionScreen} options={{ presentation: 'modal' }} />
          </Stack.Group>
        ) : (
          // Unauthenticated Flow
          <Stack.Group>
            <Stack.Screen name="Auth" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}