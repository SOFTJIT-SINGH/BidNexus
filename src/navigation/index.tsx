import React, { useEffect } from 'react';
import { ActivityIndicator, View, Platform, Alert } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
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

// Helper for Expo Go compatibility
const triggerNotification = async (title: string, body: string) => {
  try {
    if (Platform.OS !== 'web') {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    }
  } catch (err) {
    // Fallback for Expo Go which restricts push notification libs
    Alert.alert(`🔔 ${title}`, body);
  }
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// FIX 1: Custom Dark Theme to prevent white flashes during screen transitions
const NexusDarkTheme = {
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
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true, // Keeps it out of the way when typing
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,
          backgroundColor: '#050508', 
          borderTopWidth: 0,
          height: 65,
          borderRadius: 35,
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          elevation: 10,
          shadowColor: '#06b6d4',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: '#06b6d4',
        tabBarInactiveTintColor: '#4b5563',
      })}
    >
      <Tab.Screen 
        name="Marketplace" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flash' : 'flash-outline'} size={24} color={color} />
          )
        }}
      />

      {/* FIX 2: Central Floating Action Button disguised as a Tab */}
      <Tab.Screen 
        name="CreateSpacer" 
        component={DummyScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // Stop normal tab routing
            navigation.navigate('CreateAuction'); // Trigger the Modal instead!
          },
        })}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              borderWidth: 1, 
              borderColor: '#06b6d4', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 20, // Pushes it up out of the pill
            }}>
              <Ionicons name="add" size={32} color="#06b6d4" />
            </View>
          ),
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
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
                 triggerNotification('New Auction Listing', `${payload.new.title} was just listed for ₹${payload.new.starting_price}!`);
               }
            })
            .subscribe();

          const bidsSub = supabase
            .channel('public:auctions_update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions' }, (payload) => {
               if (payload.new.current_price > (payload.old.current_price || 0)) {
                 triggerNotification('New Bid Placed!', `A new bid of ₹${payload.new.current_price} was placed on ${payload.new.title || 'an item'}!`);
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
      // FIX 3: Dark Mode Loading Screen
      <View className="flex-1 items-center justify-center bg-[#09090E]">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NexusDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // Authenticated App
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="CreateAuction" component={CreateAuctionScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
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