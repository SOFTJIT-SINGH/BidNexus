import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpWithEmail, isLoading } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleSignUp = async () => {
    try {
      await signUpWithEmail(email, password);
      // Navigate to OTP screen after signup
      navigation.navigate('OTP', { email });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View className="flex-1 p-6 justify-center bg-white">
      <Text className="text-3xl font-bold mb-8">Create Account</Text>
      <TextInput 
        className="bg-gray-100 p-4 rounded-xl mb-4" 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
      />
      <TextInput 
        className="bg-gray-100 p-4 rounded-xl mb-6" 
        placeholder="Password" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
      />
      <TouchableOpacity 
        className="bg-blue-600 p-4 rounded-xl" 
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text className="text-white text-center font-bold">Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}