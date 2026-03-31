import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { signUpWithEmail, isLoading } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !age || !phone || !email || !password) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Password Mismatch', 'Your passwords do not match. Please try again.');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    }

    try {
      const userData = { firstName, lastName, age, phone };
      await signUpWithEmail(email, password, userData);
      navigation.navigate('OTP', { email });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <View style={{ position: 'absolute', top: -128, right: -128, width: 384, height: 384, backgroundColor: 'rgba(37, 99, 235, 0.15)', borderRadius: 192 }} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            <View className="mb-8 mt-8">
              <Text className="text-4xl font-black text-white tracking-widest mb-2 shadow-cyan-500/50 shadow-lg">
                Welcome
              </Text>
              <Text className="text-cyan-400 font-medium tracking-widest uppercase text-xs">
                Create Your Account
              </Text>
            </View>

            <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl space-y-4">
              
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 font-bold">First Name</Text>
                  <TextInput className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm" placeholder="John" placeholderTextColor="#4b5563" value={firstName} onChangeText={setFirstName} />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 font-bold">Last Name</Text>
                  <TextInput className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm" placeholder="Doe" placeholderTextColor="#4b5563" value={lastName} onChangeText={setLastName} />
                </View>
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-[10px] uppercase tracking-wider my-2 font-bold">Age</Text>
                  <TextInput className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm" placeholder="26" placeholderTextColor="#4b5563" keyboardType="numeric" value={age} onChangeText={setAge} />
                </View>
                <View className="flex-2 w-3/5">
                  <Text className="text-gray-400 text-[10px] uppercase tracking-wider my-2 font-bold">Phone Number</Text>
                  <TextInput className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm" placeholder="+91..." placeholderTextColor="#4b5563" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>
              </View>

              <View>
                <Text className="text-gray-400 text-[10px] uppercase tracking-wider my-2 font-bold">Email Address</Text>
                <TextInput className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm" placeholder="you@example.com" placeholderTextColor="#4b5563" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
              </View>

              <View>
                <Text className="text-gray-400 text-[10px] uppercase tracking-wider my-2 font-bold">Password</Text>
                <TextInput className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm" placeholder="••••••••" placeholderTextColor="#4b5563" secureTextEntry value={password} onChangeText={setPassword} />
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-[10px] uppercase tracking-wider my-2 font-bold">Confirm Password</Text>
                <TextInput className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm" placeholder="••••••••" placeholderTextColor="#4b5563" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
              </View>

              <TouchableOpacity className="w-full overflow-hidden rounded-xl mb-2" onPress={handleSignUp} disabled={isLoading}>
                <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                  {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-black tracking-widest uppercase">Register</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity className="w-full py-3 rounded-xl items-center" onPress={() => navigation.goBack()} disabled={isLoading}>
                <Text className="text-gray-400 font-bold tracking-wider uppercase text-xs">Cancel</Text>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}