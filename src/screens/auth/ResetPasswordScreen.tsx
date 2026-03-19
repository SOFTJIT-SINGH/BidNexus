import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const { resetPassword, isLoading } = useAuthStore();

  const handleReset = async () => {
    if (!email) return Alert.alert('Required', 'Please enter your email address.');
    
    try {
      await resetPassword(email);
      Alert.alert(
        'Email Sent', 
        'If an account exists for this email, you will receive password reset instructions shortly.',
        [{ text: 'Back to Login', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View className="flex-1 bg-[#09090E]">
      <View className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />

      <SafeAreaView className="flex-1 px-6 justify-center">
        <View className="mb-12">
          <Text className="text-4xl font-black text-white tracking-widest mb-2 shadow-cyan-500/50 shadow-lg">
            Recover
          </Text>
          <Text className="text-gray-400 font-medium tracking-wide text-sm">
            Enter your email to reset your password.
          </Text>
        </View>

        <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <View className="mb-8">
            <Text className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Email Address</Text>
            <TextInput
              className="w-full bg-black/40 border border-white/10 px-4 py-4 rounded-xl text-white text-base"
              placeholder="Enter your email"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            className="w-full overflow-hidden rounded-xl mb-4"
            onPress={handleReset}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#06b6d4', '#3b82f6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              className="py-4 items-center"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-black tracking-widest uppercase">Send Reset Link</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full py-4 rounded-xl items-center bg-transparent"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text className="text-gray-400 font-bold tracking-wider uppercase text-xs">Return to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}