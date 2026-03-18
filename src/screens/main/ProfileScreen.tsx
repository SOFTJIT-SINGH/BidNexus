import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState({ totalBids: 0 });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user?.id).single();
      if (profile) setUsername(profile.username);

      const { count } = await supabase.from('bids').select('*', { count: 'exact', head: true }).eq('user_id', user?.id);
      setStats({ totalBids: count || 0 });
    } finally { setLoading(false); }
  };

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1 px-6">
        <Text className="text-4xl font-black text-white mt-8 tracking-widest uppercase">User Profile</Text>
        <Text className="text-cyan-500 font-bold mb-10 text-[10px] tracking-[3px] uppercase">{user?.email}</Text>

        <View className="flex-row space-x-4 mb-8">
          <BlurView intensity={20} tint="dark" className="flex-1 p-6 rounded-3xl border border-white/10 items-center">
            <Text className="text-3xl font-black text-cyan-400">{stats.totalBids}</Text>
            <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Transmissions</Text>
          </BlurView>
          <BlurView intensity={20} tint="dark" className="flex-1 p-6 rounded-3xl border border-white/10 items-center">
            <Text className="text-3xl font-black text-purple-400">0</Text>
            <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Acquisitions</Text>
          </BlurView>
        </View>

        <TouchableOpacity onPress={signOut} className="w-full py-4 rounded-2xl border border-red-500/20 bg-red-500/5 items-center">
          <Text className="text-red-500 font-black tracking-widest uppercase text-xs">Terminate Session</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}