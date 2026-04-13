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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 12,
          left: 16,
          right: 16,
          backgroundColor: '#0a0a12', 
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 72 : 68,
          borderRadius: 24,
          borderColor: 'rgba(255, 255, 255, 0.04)',
          borderWidth: 1,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#22d3ee',
        tabBarInactiveTintColor: '#4b5563',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          )
        }}
      />

      {/* Central Floating Action Button as a Tab */}
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
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 52, 
              height: 52, 
              borderRadius: 26, 
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              borderWidth: 1.5, 
              borderColor: 'rgba(34, 211, 238, 0.3)', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 18,
            }}>
              <Ionicons name="add" size={28} color="#22d3ee" />
            </View>
          ),
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
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