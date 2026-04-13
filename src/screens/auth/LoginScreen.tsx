import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmail, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Missing Info', 'Please enter your email and password.');
    }
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      {/* Background accents */}
      <View style={{ position: 'absolute', top: -100, left: -100, width: 350, height: 350, backgroundColor: 'rgba(6, 182, 212, 0.08)', borderRadius: 175 }} />
      <View style={{ position: 'absolute', bottom: -80, right: -80, width: 280, height: 280, backgroundColor: 'rgba(99, 102, 241, 0.06)', borderRadius: 140 }} />

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        
        {/* Branding */}
        <View className="mb-10 items-center">
          <View className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 items-center justify-center mb-5">
            <Ionicons name="flash" size={28} color="#22d3ee" />
          </View>
          <Text className="text-4xl font-black text-white tracking-wider mb-2">
            BidNexus
          </Text>
          <Text className="text-gray-400 text-sm">
            Buy & Sell through Live Auctions
          </Text>
        </View>

        {/* Login Form */}
        <View className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#13131a] p-6">
          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Email</Text>
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

            <View>
              <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1 mt-2">Password</Text>
              <View className="flex-row items-center bg-black/30 border border-white/[0.06] rounded-xl px-4">
                <Ionicons name="lock-closed-outline" size={18} color="#4b5563" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-[15px]"
                  placeholder="••••••••"
                  placeholderTextColor="#3f3f46"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity className="mt-3 items-end" onPress={() => navigation.navigate('ResetPassword')}>
                <Text className="text-cyan-400 text-xs font-semibold">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity className="w-full overflow-hidden rounded-xl mb-3" onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center flex-row justify-center">
              {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                <>
                  <Ionicons name="log-in-outline" size={18} color="white" />
                  <Text className="text-white font-black text-sm ml-2">Sign In</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity className="w-full py-4 rounded-xl items-center border border-white/[0.06] bg-white/[0.02]" onPress={() => navigation.navigate('SignUp')} disabled={isLoading}>
            <Text className="text-gray-300 font-semibold text-sm">Create an Account</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}