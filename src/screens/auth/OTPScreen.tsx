import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useRoute } from '@react-navigation/native';

export default function OTPScreen() {
  const [token, setToken] = useState('');
  const { verifyOtp, isLoading } = useAuthStore();
  const route = useRoute<any>();
  const { email } = route.params;

  const handleVerify = async () => {
    if (token.length !== 6) return Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
    
    try {
      await verifyOtp(email, token);
      // Once verified, the AuthStore listener will automatically log the user in and route to Home!
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <View style={{ position: 'absolute', bottom: -128, left: -128, width: 384, height: 384, backgroundColor: 'rgba(34, 211, 238, 0.1)', borderRadius: 192 }} />

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        <View className="mb-12">
          <Text className="text-4xl font-black text-white tracking-widest mb-2 shadow-cyan-500/50 shadow-lg">
            Verify Identity
          </Text>
          <Text className="text-cyan-400 font-medium tracking-wide text-xs">
            Enter the 6-digit code sent to {email}
          </Text>
        </View>

        <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <View className="mb-8 items-center">
            <Text className="text-gray-400 text-xs uppercase tracking-wider mb-4 font-bold self-start">Verification Code</Text>
            <TextInput
              className="w-full bg-black/40 border border-white/10 px-4 py-4 rounded-xl text-cyan-400 text-3xl font-black text-center tracking-[10px]"
              placeholder="000000"
              placeholderTextColor="#374151"
              keyboardType="number-pad"
              maxLength={6}
              value={token}
              onChangeText={setToken}
            />
          </View>

          <TouchableOpacity className="w-full overflow-hidden rounded-xl" onPress={handleVerify} disabled={isLoading}>
            <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
              {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-black tracking-widest uppercase">Authenticate</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}