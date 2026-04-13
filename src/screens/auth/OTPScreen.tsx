import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useRoute } from '@react-navigation/native';

export default function OTPScreen() {
  const [token, setToken] = useState('');
  const { verifyOtp, isLoading } = useAuthStore();
  const route = useRoute<any>();
  const { email } = route.params;

  const handleVerify = async () => {
    if (token.length !== 6) return Alert.alert('Invalid Code', 'Please enter the 6-digit code from your email.');
    
    try {
      await verifyOtp(email, token);
      // Once verified, the AuthStore listener will automatically log the user in and route to Home!
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <View style={{ position: 'absolute', bottom: -100, left: -100, width: 350, height: 350, backgroundColor: 'rgba(34, 211, 238, 0.06)', borderRadius: 175 }} />

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        
        {/* Icon */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center mb-5">
            <Ionicons name="shield-checkmark-outline" size={36} color="#34d399" />
          </View>
          <Text className="text-3xl font-black text-white mb-2">
            Check Your Email
          </Text>
          <Text className="text-gray-400 text-sm text-center leading-5">
            We sent a 6-digit code to{'\n'}
            <Text className="text-cyan-400 font-semibold">{email}</Text>
          </Text>
        </View>

        <View className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#13131a] p-6">
          <View className="mb-6 items-center">
            <Text className="text-gray-400 text-xs font-semibold mb-3 self-start ml-1">Verification Code</Text>
            <TextInput
              className="w-full bg-black/30 border border-white/[0.06] px-4 py-4 rounded-xl text-cyan-400 text-3xl font-black text-center tracking-[10px]"
              placeholder="000000"
              placeholderTextColor="#27272a"
              keyboardType="number-pad"
              maxLength={6}
              value={token}
              onChangeText={setToken}
            />
          </View>

          <TouchableOpacity className="w-full overflow-hidden rounded-xl" onPress={handleVerify} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center flex-row justify-center">
              {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                  <Text className="text-white font-black text-sm ml-2">Verify & Continue</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <Text className="text-gray-600 text-xs text-center mt-4">
            Didn't receive a code? Check your spam folder.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}