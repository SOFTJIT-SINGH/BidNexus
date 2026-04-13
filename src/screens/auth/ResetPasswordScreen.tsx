import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const { resetPassword, isLoading } = useAuthStore();

  const handleReset = async () => {
    if (!email.trim()) return Alert.alert('Email Required', 'Please enter your email address.');
    
    try {
      await resetPassword(email);
      Alert.alert(
        'Reset Link Sent! ✉️', 
        'Check your email for a link to reset your password. It may take a minute to arrive.',
        [{ text: 'Back to Sign In', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Something went wrong', error.message);
    }
  };

  return (
    <View className="flex-1 bg-[#09090E]">
      <View style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, backgroundColor: 'rgba(99, 102, 241, 0.06)', borderRadius: 150 }} />

      <SafeAreaView className="flex-1 px-6 justify-center">
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center mb-8">
          <Ionicons name="chevron-back" size={20} color="#22d3ee" />
          <Text className="text-cyan-400 font-semibold text-sm ml-0.5">Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 items-center justify-center mb-4">
            <Ionicons name="key-outline" size={28} color="#a78bfa" />
          </View>
          <Text className="text-2xl font-black text-white mb-2">
            Forgot Password?
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            No worries! Enter your email and we'll send you a reset link.
          </Text>
        </View>

        <View className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#13131a] p-6">
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Email Address</Text>
            <View className="flex-row items-center bg-black/30 border border-white/[0.06] rounded-xl px-4">
              <Ionicons name="mail-outline" size={18} color="#4b5563" />
              <TextInput
                className="flex-1 py-4 px-3 text-white text-[15px]"
                placeholder="you@example.com"
                placeholderTextColor="#3f3f46"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <TouchableOpacity
            className="w-full overflow-hidden rounded-xl mb-3"
            onPress={handleReset}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#06b6d4', '#3b82f6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              className="py-4 items-center flex-row justify-center"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color="white" />
                  <Text className="text-white font-black text-sm ml-2">Send Reset Link</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full py-3 rounded-xl items-center"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text className="text-gray-500 text-sm">Remember your password? <Text className="text-cyan-400 font-semibold">Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}