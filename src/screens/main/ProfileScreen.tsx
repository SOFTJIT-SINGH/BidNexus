import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState({ totalBids: 0, activeAuctions: 0 });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setUsername(profile.username);

      // Fetch basic stats (Total bids placed by user)
      const { count: bidCount, error: bidError } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (bidError) throw bidError;
      setStats(prev => ({ ...prev, totalBids: bidCount || 0 }));

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) return Alert.alert('Error', 'Username cannot be empty.');
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user?.id);

      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        <Text className="text-3xl font-black text-gray-900 mt-8 mb-2">My Profile</Text>
        <Text className="text-gray-500 mb-8">{user?.email}</Text>

        {/* Stats Row */}
        <View className="flex-row space-x-4 mb-8">
          <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center">
            <Text className="text-2xl font-black text-blue-600">{stats.totalBids}</Text>
            <Text className="text-gray-500 text-xs uppercase font-bold">Bids Placed</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center">
            <Text className="text-2xl font-black text-green-600">0</Text>
            <Text className="text-gray-500 text-xs uppercase font-bold">Wins</Text>
          </View>
        </View>

        {/* Username Setting */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-2 uppercase">Display Username</Text>
          <TextInput
            className="w-full bg-gray-50 px-4 py-4 rounded-xl text-lg font-medium text-gray-900 border border-gray-100 mb-4"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center ${updating ? 'bg-blue-400' : 'bg-blue-600'}`}
            onPress={handleUpdateUsername}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity
          className="w-full py-4 rounded-xl items-center border border-red-200 bg-red-50 mt-4"
          onPress={signOut}
        >
          <Text className="text-red-600 font-bold">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}