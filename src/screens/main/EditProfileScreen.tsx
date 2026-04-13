import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/services/supabase/supabase';

interface ProfileField {
  label: string;
  icon: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  multiline?: boolean;
  maxLength?: number;
  required?: boolean;
}

export default function EditProfileScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone_number || '');
  const [age, setAge] = useState(user?.user_metadata?.age ? String(user?.user_metadata?.age) : '');
  const [bio, setBio] = useState(user?.user_metadata?.bio || '');
  const [city, setCity] = useState(user?.user_metadata?.city || '');

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Info', 'First and Last name are required.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phone.trim(),
          age: age ? parseInt(age, 10) : null,
          bio: bio.trim(),
          city: city.trim(),
        }
      });

      if (error) {
        throw error;
      }

      Alert.alert('Profile Updated!', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields: ProfileField[] = [
    {
      label: 'First Name',
      icon: 'person-outline',
      value: firstName,
      onChangeText: setFirstName,
      placeholder: 'Enter your first name',
      required: true,
    },
    {
      label: 'Last Name',
      icon: 'person-outline',
      value: lastName,
      onChangeText: setLastName,
      placeholder: 'Enter your last name',
      required: true,
    },
    {
      label: 'Phone Number',
      icon: 'call-outline',
      value: phone,
      onChangeText: setPhone,
      placeholder: '+91 98765 43210',
      keyboardType: 'phone-pad',
    },
    {
      label: 'Age',
      icon: 'calendar-outline',
      value: age,
      onChangeText: setAge,
      placeholder: 'Your age',
      keyboardType: 'numeric',
      maxLength: 3,
    },
    {
      label: 'City',
      icon: 'location-outline',
      value: city,
      onChangeText: setCity,
      placeholder: 'Where do you live?',
    },
  ];

  const charCount = bio.length;
  const maxBioChars = 150;

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center py-1">
              <Ionicons name="chevron-back" size={22} color="#22d3ee" />
              <Text className="text-cyan-400 font-semibold text-sm ml-0.5">Back</Text>
            </TouchableOpacity>
            <Text className="text-white font-bold text-base">Edit Profile</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={loading}
              className="bg-cyan-500/15 border border-cyan-500/20 px-4 py-2 rounded-full"
            >
              {loading ? (
                <ActivityIndicator color="#22d3ee" size="small" />
              ) : (
                <Text className="text-cyan-400 font-bold text-[12px]">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            
            {/* Avatar Preview */}
            <View className="items-center mt-8 mb-8">
              <View className="w-24 h-24 rounded-full items-center justify-center border-2 border-cyan-400/30 mb-3" 
                style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)' }}>
                <Text className="text-cyan-400 text-3xl font-black">
                  {`${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U'}
                </Text>
              </View>
              <Text className="text-gray-500 text-xs">Your avatar is generated from your initials</Text>
            </View>

            {/* Fields Section */}
            <View className="px-6">
              <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-4 ml-1">Personal Information</Text>
              
              {fields.map((field, index) => (
                <View key={field.label} className="mb-4">
                  <View className="flex-row items-center mb-2 ml-1">
                    <Text className="text-gray-400 font-semibold text-xs">
                      {field.label}
                    </Text>
                    {field.required && (
                      <Text className="text-red-400 text-xs ml-1">*</Text>
                    )}
                  </View>
                  <View className="bg-[#13131a] border border-white/[0.06] rounded-2xl flex-row items-center px-4">
                    <View className="w-8 h-8 rounded-full bg-white/[0.04] items-center justify-center mr-3">
                      <Ionicons name={field.icon as any} size={16} color="#06b6d4" />
                    </View>
                    <TextInput 
                      className="flex-1 py-4 text-white text-[15px]"
                      placeholder={field.placeholder}
                      placeholderTextColor="#3f3f46"
                      value={field.value}
                      onChangeText={field.onChangeText}
                      keyboardType={field.keyboardType || 'default'}
                      maxLength={field.maxLength}
                    />
                  </View>
                </View>
              ))}

              {/* Bio Field (separate because of multiline) */}
              <View className="mb-4 mt-2">
                <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-4 ml-1">About You</Text>
                <View className="flex-row items-center mb-2 ml-1">
                  <Text className="text-gray-400 font-semibold text-xs">Bio</Text>
                </View>
                <View className="bg-[#13131a] border border-white/[0.06] rounded-2xl px-4 pt-3 pb-2">
                  <TextInput 
                    className="text-white text-[15px] min-h-[100px]"
                    placeholder="Tell others about yourself..."
                    placeholderTextColor="#3f3f46"
                    value={bio}
                    onChangeText={(text) => text.length <= maxBioChars && setBio(text)}
                    multiline
                    textAlignVertical="top"
                    maxLength={maxBioChars}
                  />
                  <Text className={`text-right text-[11px] mt-1 mb-1 ${charCount > maxBioChars * 0.8 ? 'text-amber-400' : 'text-gray-600'}`}>
                    {charCount}/{maxBioChars}
                  </Text>
                </View>
              </View>

              {/* Email (read-only) */}
              <View className="mb-6">
                <View className="flex-row items-center mb-2 ml-1">
                  <Text className="text-gray-400 font-semibold text-xs">Email</Text>
                  <View className="bg-white/[0.04] px-2 py-0.5 rounded ml-2">
                    <Text className="text-gray-600 text-[9px] font-bold uppercase">Cannot Change</Text>
                  </View>
                </View>
                <View className="bg-[#0e0e14] border border-white/[0.04] rounded-2xl flex-row items-center px-4 opacity-60">
                  <View className="w-8 h-8 rounded-full bg-white/[0.04] items-center justify-center mr-3">
                    <Ionicons name="mail-outline" size={16} color="#4b5563" />
                  </View>
                  <Text className="py-4 text-gray-500 text-[15px]">{user?.email}</Text>
                </View>
              </View>
            </View>

            {/* Save Button (bottom) */}
            <View className="px-6">
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={loading}
                className="py-4 rounded-2xl items-center shadow-lg overflow-hidden"
                style={{ backgroundColor: '#06b6d4' }}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                    <Text className="text-white font-black text-sm ml-2 tracking-wide">Save Changes</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
