import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useRoute } from '@react-navigation/native';

export default function OTPScreen() {
  const [token, setToken] = useState('');
  const { verifyOtp, isLoading } = useAuthStore();
  const route = useRoute<any>();
  const { email } = route.params;

  const handleVerify = async () => {
    try {
      await verifyOtp(email, token);
      // RootNavigator will automatically switch to Home now
    } catch (error: any) {
      Alert.alert('Invalid Code', error.message);
    }
  };

  return (
    <View className="flex-1 p-6 justify-center bg-white">
      <Text className="text-2xl font-bold mb-2">Verify Email</Text>
      <Text className="text-gray-500 mb-8">Enter the code sent to {email}</Text>
      <TextInput 
        className="bg-gray-100 p-4 rounded-xl mb-6 text-center text-2xl tracking-widest" 
        placeholder="000000" 
        keyboardType="number-pad"
        maxLength={6}
        value={token} 
        onChangeText={setToken} 
      />
      <TouchableOpacity className="bg-green-600 p-4 rounded-xl" onPress={handleVerify}>
        <Text className="text-white text-center font-bold">Verify & Login</Text>
      </TouchableOpacity>
    </View>
  );
}