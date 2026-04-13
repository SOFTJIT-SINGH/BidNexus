import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const [showPassword, setShowPassword] = useState(false);
  
  const { signUpWithEmail, isLoading } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      return Alert.alert('Missing Info', 'Please fill in all required fields.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Passwords Don\'t Match', 'Please make sure both passwords are the same.');
    }
    if (password.length < 6) {
      return Alert.alert('Password Too Short', 'Your password needs at least 6 characters.');
    }

    try {
      const userData = { firstName, lastName, age, phone };
      await signUpWithEmail(email, password, userData);
      navigation.navigate('OTP', { email });
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  const fields = [
    {
      row: true,
      items: [
        { label: 'First Name', value: firstName, onChange: setFirstName, placeholder: 'John', icon: 'person-outline', required: true, keyboardType: 'default' as const, autoCapitalize: 'sentences' as const, maxLength: undefined as number | undefined },
        { label: 'Last Name', value: lastName, onChange: setLastName, placeholder: 'Doe', icon: 'person-outline', required: true, keyboardType: 'default' as const, autoCapitalize: 'sentences' as const, maxLength: undefined as number | undefined },
      ]
    },
    {
      row: true,
      items: [
        { label: 'Age', value: age, onChange: setAge, placeholder: '25', icon: 'calendar-outline', required: false, keyboardType: 'numeric' as const, autoCapitalize: 'sentences' as const, maxLength: 3 as number | undefined },
        { label: 'Phone', value: phone, onChange: setPhone, placeholder: '+91 98765...', icon: 'call-outline', required: false, keyboardType: 'phone-pad' as const, autoCapitalize: 'sentences' as const, maxLength: undefined as number | undefined },
      ]
    },
    {
      row: false,
      items: [
        { label: 'Email', value: email, onChange: setEmail, placeholder: 'you@example.com', icon: 'mail-outline', required: true, keyboardType: 'email-address' as const, autoCapitalize: 'none' as const, maxLength: undefined as number | undefined },
      ]
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <View style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: 175 }} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* Header */}
            <View className="mb-6 mt-6">
              <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center mb-6">
                <Ionicons name="chevron-back" size={20} color="#22d3ee" />
                <Text className="text-cyan-400 font-semibold text-sm ml-0.5">Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-black text-white mb-2">
                Create Account
              </Text>
              <Text className="text-gray-400 text-sm">
                Join BidNexus to start buying & selling
              </Text>
            </View>

            {/* Form Card */}
            <View className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#13131a] p-6">
              
              {/* Dynamic Fields */}
              {fields.map((group, groupIndex) => (
                <View key={groupIndex} className={group.row ? 'flex-row space-x-3 mb-4' : 'mb-4'}>
                  {group.items.map((field, fieldIndex) => (
                    <View key={field.label} className={group.row ? 'flex-1' : ''} style={group.row && fieldIndex === 1 ? { marginLeft: 8 } : undefined}>
                      <View className="flex-row items-center mb-1.5 ml-1">
                        <Text className="text-gray-400 text-[11px] font-semibold">{field.label}</Text>
                        {field.required && <Text className="text-red-400 text-[11px] ml-0.5">*</Text>}
                      </View>
                      <View className="flex-row items-center bg-black/30 border border-white/[0.06] rounded-xl px-3">
                        <Ionicons name={field.icon as any} size={16} color="#4b5563" />
                        <TextInput 
                          className="flex-1 py-3 px-2 text-white text-sm" 
                          placeholder={field.placeholder} 
                          placeholderTextColor="#3f3f46" 
                          value={field.value} 
                          onChangeText={field.onChange}
                          keyboardType={field.keyboardType || 'default'}
                          autoCapitalize={field.autoCapitalize || 'sentences'}
                          maxLength={field.maxLength}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ))}

              {/* Password */}
              <View className="mb-4">
                <View className="flex-row items-center mb-1.5 ml-1">
                  <Text className="text-gray-400 text-[11px] font-semibold">Password</Text>
                  <Text className="text-red-400 text-[11px] ml-0.5">*</Text>
                </View>
                <View className="flex-row items-center bg-black/30 border border-white/[0.06] rounded-xl px-3">
                  <Ionicons name="lock-closed-outline" size={16} color="#4b5563" />
                  <TextInput 
                    className="flex-1 py-3 px-2 text-white text-sm" 
                    placeholder="Min. 6 characters" 
                    placeholderTextColor="#3f3f46" 
                    secureTextEntry={!showPassword} 
                    value={password} 
                    onChangeText={setPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <View className="flex-row items-center mb-1.5 ml-1">
                  <Text className="text-gray-400 text-[11px] font-semibold">Confirm Password</Text>
                  <Text className="text-red-400 text-[11px] ml-0.5">*</Text>
                </View>
                <View className="flex-row items-center bg-black/30 border border-white/[0.06] rounded-xl px-3">
                  <Ionicons name="shield-checkmark-outline" size={16} color="#4b5563" />
                  <TextInput 
                    className="flex-1 py-3 px-2 text-white text-sm" 
                    placeholder="Type password again" 
                    placeholderTextColor="#3f3f46" 
                    secureTextEntry={!showPassword}
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  />
                </View>
                {confirmPassword.length > 0 && (
                  <View className="flex-row items-center mt-2 ml-1">
                    <Ionicons 
                      name={password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                      size={14} 
                      color={password === confirmPassword ? "#34d399" : "#f87171"} 
                    />
                    <Text className={`text-[11px] ml-1 ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                      {password === confirmPassword ? 'Passwords match' : 'Passwords don\'t match'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity className="w-full overflow-hidden rounded-xl mb-3" onPress={handleSignUp} disabled={isLoading} activeOpacity={0.85}>
                <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center flex-row justify-center">
                  {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                    <>
                      <Ionicons name="person-add-outline" size={18} color="white" />
                      <Text className="text-white font-black text-sm ml-2">Create Account</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity className="w-full py-3 rounded-xl items-center" onPress={() => navigation.goBack()} disabled={isLoading}>
                <Text className="text-gray-500 text-sm">Already have an account? <Text className="text-cyan-400 font-semibold">Sign In</Text></Text>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}