import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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
    <View className="flex-1 bg-[#09090E]">
      {/* Background Tech Gradients / Glowing Orbs */}
      <View className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/30 rounded-full blur-[100px]" />
      <View className="absolute top-1/2 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />

      <SafeAreaView className="flex-1 px-6 justify-center">
        
        <View className="mb-12">
          <Text className="text-5xl font-black text-white tracking-widest mb-2 shadow-cyan-500/50 shadow-lg">
            NEXUS
          </Text>
          <Text className="text-cyan-400 font-medium tracking-widest uppercase text-xs">
            AI-Driven Auction Protocol
          </Text>
        </View>

        {/* Glassmorphic Form Card */}
        <BlurView 
          intensity={30} 
          tint="dark" 
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl"
        >
          <View className="space-y-5 mb-8">
            <View>
              <Text className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Identity (Email)</Text>
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
              <Text className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Access Key (Password)</Text>
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

          <TouchableOpacity
            className="w-full overflow-hidden rounded-xl mb-4"
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#06b6d4', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 items-center"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-black tracking-widest uppercase">Initialize Session</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full py-4 rounded-xl items-center border border-white/10 bg-black/20"
            onPress={() => navigation.navigate('SignUp')}
            disabled={isLoading}
          >
            <Text className="text-gray-300 font-bold tracking-wider">Create Account</Text>
          </TouchableOpacity>
        </BlurView>

      </SafeAreaView>
    </View>
  );
}