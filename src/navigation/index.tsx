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
import AdminDashboardScreen from '@/src/screens/main/AdminDashboardScreen';

// Helper for Expo Go compatibility
import { notificationService } from '@/src/services/notifications/notificationService';

const triggerNotification = async (userId: string, title: string, body: string, type: any = 'info') => {
  // 1. Alert for immediate feedback
  Alert.alert(`🔔 ${title}`, body);
  
  // 2. Store in database for persistence
  if (userId) {
    await notificationService.sendNotification({
      user_id: userId,
      title,
      message: body,
      type
    });
  }
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
                  triggerNotification(session?.user?.id!, 'New Item Listed! 🆕', `"${payload.new.title}" is now up for auction starting at ₹${payload.new.starting_price}!`, 'update');
                }
            })
            .subscribe();

          const bidsSub = supabase
            .channel('public:auctions_update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions' }, async (payload) => {
               if (payload.new.current_price > (payload.old.current_price || 0)) {
                 // Fetch more info to see if this affects the user
                 const { data: bidData } = await supabase
                  .from('bids')
                  .select('user_id')
                  .eq('auction_id', payload.new.id)
                  .order('created_at', { ascending: false })
                  .limit(2); // Get current and previous bidder
                 
                 const currentBidderId = bidData?.[0]?.user_id;
                 const previousBidderId = bidData?.[1]?.user_id;

                 if (previousBidderId === session?.user?.id && currentBidderId !== session?.user?.id) {
                   triggerNotification(session?.user?.id!, 'You\'ve been outbid! ⚠️', `Someone just placed a higher bid on "${payload.new.title || 'your item'}". Bid again to stay in the lead!`, 'outbid');
                 } else if (payload.new.created_by === session?.user?.id) {
                   triggerNotification(session?.user?.id!, 'New Bid on your item! 💰', `Someone bid ₹${payload.new.current_price} on your listing "${payload.new.title}".`, 'bid');
                 } else if (currentBidderId !== session?.user?.id) {
                   triggerNotification(session?.user?.id!, 'New Bid! 💰', `A new bid of ₹${payload.new.current_price} was placed on "${payload.new.title || 'an item'}".`, 'info');
                 }
               }

               // Check if a winner was declared
               if (payload.new.winner_id && !payload.old.winner_id) {
                 if (payload.new.winner_id === session?.user?.id) {
                   triggerNotification(session?.user?.id!, 'You Won! 🏆', `Congratulations! You won the auction for "${payload.new.title}". Check your activity log for details.`, 'win');
                 }
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
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
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