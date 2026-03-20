import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpWithEmail, isLoading } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password.');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters.');

    try {
      await signUpWithEmail(email, password);
      // Send user to OTP screen to enter the 6-digit code
      navigation.navigate('OTP', { email });
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <View style={{ position: 'absolute', top: -128, right: -128, width: 384, height: 384, backgroundColor: 'rgba(37, 99, 235, 0.15)', borderRadius: 192 }} />

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        <View className="mb-12">
          <Text className="text-4xl font-black text-white tracking-widest mb-2 shadow-cyan-500/50 shadow-lg">
            Initialize
          </Text>
          <Text className="text-cyan-400 font-medium tracking-widest uppercase text-xs">
            Create Operator Account
          </Text>
        </View>

        <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <View className="space-y-5 mb-8">
            <View>
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

            <View>
              <Text className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Password</Text>
              <TextInput
                className="w-full bg-black/40 border border-white/10 px-4 py-4 rounded-xl text-white text-base"
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity className="w-full overflow-hidden rounded-xl mb-4" onPress={handleSignUp} disabled={isLoading}>
            <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
              {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-black tracking-widest uppercase">Register</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity className="w-full py-4 rounded-xl items-center" onPress={() => navigation.goBack()} disabled={isLoading}>
            <Text className="text-gray-400 font-bold tracking-wider uppercase text-xs">Cancel and Return</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}