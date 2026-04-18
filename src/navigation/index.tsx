import React, { useEffect } from 'react';
import { ActivityIndicator, View, Platform, Alert, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/src/services/supabase/supabase';

// Screens
import LoginScreen from '@/src/screens/auth/LoginScreen';
import SignUpScreen from '@/src/screens/auth/SignUpScreen';
import OTPScreen from '@/src/screens/auth/OTPScreen';
import HomeScreen from '@/src/screens/main/HomeScreen';
import ProfileScreen from '@/src/screens/main/ProfileScreen';
import AuctionDetailScreen from '@/src/screens/main/AuctionDetailScreen';
import CreateAuctionScreen from '@/src/screens/main/CreateAuctionScreen';
import EditProfileScreen from '@/src/screens/main/EditProfileScreen';
import ResetPasswordScreen from '@/src/screens/auth/ResetPasswordScreen';
import NotificationsScreen from '@/src/screens/main/NotificationsScreen';

// Helper for Expo Go compatibility
const triggerNotification = async (title: string, body: string) => {
  // Since Expo Go blocks native push notifications, we fall back to a built-in alert!
  Alert.alert(`🔔 ${title}`, body);
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Dark Theme
const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#09090E', 
  },
};

// Dummy component for our central action button
const DummyScreen = () => null;

function MainTabs() {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0c0c14',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.04)',
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#22d3ee',
        tabBarInactiveTintColor: '#52525b',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
              <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '500', marginTop: 4 }}>
                Home
              </Text>
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#22d3ee', marginTop: 3 }} />
              )}
            </View>
          )
        }}
      />

      {/* Central Sell Button */}
      <Tab.Screen 
        name="CreateSpacer" 
        component={DummyScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreateAuction');
          },
        })}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={{
              width: 56, 
              height: 56, 
              borderRadius: 16, 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: Platform.OS === 'ios' ? 16 : 20,
              backgroundColor: '#06b6d4',
              shadowColor: '#06b6d4',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }}>
              <Ionicons name="add" size={30} color="white" />
            </View>
          ),
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
              <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '500', marginTop: 4 }}>
                Profile
              </Text>
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#22d3ee', marginTop: 3 }} />
              )}
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session, isInitialized, initialize, cleanup } = useAuthStore();

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (!session) return;
    
          // We don't request permissions because Expo Go 53+ blocks native notification permissions
          // and throws fatal network errors on Android

          const newItemsSub = supabase
            .channel('public:auctions_insert')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auctions' }, (payload) => {
               if (payload.new.created_by !== session?.user?.id) {
                 triggerNotification('New Item Listed! 🆕', `"${payload.new.title}" is now up for auction starting at ₹${payload.new.starting_price}!`);
               }
            })
            .subscribe();

          const bidsSub = supabase
            .channel('public:auctions_update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions' }, (payload) => {
               if (payload.new.current_price > (payload.old.current_price || 0)) {
                 triggerNotification('New Bid! 💰', `Someone bid ₹${payload.new.current_price} on "${payload.new.title || 'an item'}"!`);
               }
            })
            .subscribe();

    return () => {
      supabase.removeChannel(newItemsSub);
      supabase.removeChannel(bidsSub);
    };
  }, [session]);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-[#09090E]">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={AppDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // Authenticated App
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="CreateAuction" component={CreateAuctionScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
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