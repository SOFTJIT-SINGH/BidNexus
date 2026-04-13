import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/services/supabase/supabase';

export default function EditProfileScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone_number || '');
  const [age, setAge] = useState(user?.user_metadata?.age ? String(user?.user_metadata?.age) : '');

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First and Last name are required.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          age: age ? parseInt(age, 10) : null
        }
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090E]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/10">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#06b6d4" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg uppercase tracking-widest">Edit Profile</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
          
          <Text className="text-gray-400 font-bold mb-2 uppercase tracking-wide text-xs">First Name</Text>
          <View className="bg-white/5 border border-white/10 rounded-xl mb-6 flex-row items-center px-4">
            <Ionicons name="person-outline" size={20} color="#06b6d4" />
            <TextInput 
              className="flex-1 py-4 px-3 text-white font-medium"
              placeholder="First Name"
              placeholderTextColor="#6b7280"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <Text className="text-gray-400 font-bold mb-2 uppercase tracking-wide text-xs">Last Name</Text>
          <View className="bg-white/5 border border-white/10 rounded-xl mb-6 flex-row items-center px-4">
            <Ionicons name="person-outline" size={20} color="#06b6d4" />
            <TextInput 
              className="flex-1 py-4 px-3 text-white font-medium"
              placeholder="Last Name"
              placeholderTextColor="#6b7280"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <Text className="text-gray-400 font-bold mb-2 uppercase tracking-wide text-xs">Phone Number</Text>
          <View className="bg-white/5 border border-white/10 rounded-xl mb-6 flex-row items-center px-4">
            <Ionicons name="call-outline" size={20} color="#06b6d4" />
            <TextInput 
              className="flex-1 py-4 px-3 text-white font-medium"
              placeholder="Phone Number"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text className="text-gray-400 font-bold mb-2 uppercase tracking-wide text-xs">Age</Text>
          <View className="bg-white/5 border border-white/10 rounded-xl mb-8 flex-row items-center px-4">
            <Ionicons name="calendar-outline" size={20} color="#06b6d4" />
            <TextInput 
              className="flex-1 py-4 px-3 text-white font-medium"
              placeholder="Age"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>

          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            className="bg-cyan-500 py-4 rounded-xl items-center shadow-lg shadow-cyan-500/30"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black uppercase tracking-[2px]">Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
