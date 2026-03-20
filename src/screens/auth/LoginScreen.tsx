import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, isLoading } = useAuthStore();

  const handleLogin = async () => {
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <View style={{ position: 'absolute', top: -128, left: -128, width: 384, height: 384, backgroundColor: 'rgba(6, 182, 212, 0.15)', borderRadius: 192 }} />
      <View style={{ position: 'absolute', top: '50%', right: -128, width: 320, height: 320, backgroundColor: 'rgba(147, 51, 234, 0.1)', borderRadius: 192 }} />

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        
        <View className="mb-12">
          <Text className="text-5xl font-black text-white tracking-widest mb-2 shadow-cyan-500/50 shadow-lg">
            BidNexus
          </Text>
          <Text className="text-cyan-400 font-medium tracking-widest uppercase text-xs">
            Premium Live Auctions
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
              <TouchableOpacity className="mt-3 items-end" onPress={() => navigation.navigate('ResetPassword')}>
                <Text className="text-cyan-400 text-xs font-bold tracking-wider">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity className="w-full overflow-hidden rounded-xl mb-4" onPress={handleLogin} disabled={isLoading}>
            <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
              {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-black tracking-widest uppercase">Sign In</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity className="w-full py-4 rounded-xl items-center border border-white/10 bg-black/20" onPress={() => navigation.navigate('SignUp')} disabled={isLoading}>
            <Text className="text-gray-300 font-bold tracking-wider uppercase text-xs">Create Account</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}