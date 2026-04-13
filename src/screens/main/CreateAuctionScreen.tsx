import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; 
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';

const CATEGORIES = ['Tech', 'Vehicles', 'Fashion', 'Home', 'Other'];
const DURATIONS = [
  { label: '1 Day', value: '1' },
  { label: '3 Days', value: '3' },
  { label: '7 Days', value: '7' },
  { label: '14 Days', value: '14' },
];

export default function CreateAuctionScreen() {
  const router = useNavigation();
  const { user } = useAuthStore();
  const { fetchAuctions } = useAuctionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [durationDays, setDurationDays] = useState('3');
  const [selectedCategory, setSelectedCategory] = useState('Tech');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoBack = () => router.goBack();

  const handleImageSelection = () => {
    Alert.alert("Add Photo", "Choose how you'd like to add a photo", [
      { text: "📷 Take a Photo", onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return Alert.alert("Permission Needed", "Please allow camera access to take photos.");
          const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!res.canceled) setImageUri(res.assets[0].uri);
      }},
      { text: "🖼️ Choose from Gallery", onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!res.canceled) setImageUri(res.assets[0].uri);
      }},
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleCreateAuction = async () => {
    if (!title.trim()) return Alert.alert('Missing Title', 'Please give your item a name.');
    if (!startingPrice) return Alert.alert('Missing Price', 'Set a starting price for your item.');
    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) return Alert.alert('Invalid Price', 'Please enter a valid starting price.');

    setIsSubmitting(true);
    try {
      let publicImageUrl = null;
      if (imageUri) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        const fileName = `${user?.id}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('auction-images').upload(fileName, decode(base64), { contentType: 'image/jpeg' });
        if (uploadError) throw new Error('Failed to upload image');
        publicImageUrl = supabase.storage.from('auction-images').getPublicUrl(fileName).data.publicUrl;
      }

      const endTime = new Date();
      const days = parseInt(durationDays, 10);
      if (isNaN(days) || days <= 0) return Alert.alert('Invalid Duration', 'Please select a valid duration.');
      endTime.setDate(endTime.getDate() + days);
      
      const { error } = await supabase.from('auctions').insert({
        title: title.trim(), 
        description: description.trim(), 
        starting_price: price, 
        current_price: price, 
        end_time: endTime.toISOString(), 
        created_by: user?.id, 
        image_url: publicImageUrl,
        category: selectedCategory,
      });
      
      if (error) throw error;
      await fetchAuctions(); 
      handleGoBack();
    } catch (error: any) { Alert.alert('Something went wrong', error.message); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <StatusBar barStyle="light-content" backgroundColor="#09090E" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <TouchableOpacity onPress={handleGoBack} className="flex-row items-center py-1">
              <Ionicons name="chevron-back" size={22} color="#22d3ee" />
              <Text className="text-cyan-400 font-semibold text-sm ml-0.5">Back</Text>
            </TouchableOpacity>
            <Text className="text-white font-bold text-base">Sell an Item</Text>
            <View className="w-16" />
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            {/* Image Upload */}
            <TouchableOpacity 
              onPress={handleImageSelection} 
              className={`w-full h-52 rounded-2xl items-center justify-center overflow-hidden mb-6 ${imageUri ? '' : 'border-2 border-dashed border-white/10'}`}
              style={!imageUri ? { backgroundColor: 'rgba(255,255,255,0.02)' } : undefined}
              activeOpacity={0.7}
            >
              {imageUri ? (
                <View className="w-full h-full">
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <View className="absolute bottom-3 right-3 bg-black/70 px-3 py-1.5 rounded-full border border-white/10 flex-row items-center">
                    <Ionicons name="camera-outline" size={14} color="#22d3ee" />
                    <Text className="text-cyan-400 text-[11px] font-semibold ml-1.5">Change</Text>
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <View className="w-14 h-14 rounded-full bg-white/[0.04] items-center justify-center mb-3">
                    <Ionicons name="camera-outline" size={24} color="#6b7280" />
                  </View>
                  <Text className="text-gray-400 text-sm font-semibold mb-1">Add a Photo</Text>
                  <Text className="text-gray-600 text-xs">Items with photos get more bids!</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Form Fields in a Card */}
            <View className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13131a] p-5">
              
              {/* Title */}
              <View className="mb-5">
                <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Item Name</Text>
                <TextInput 
                  className="w-full bg-black/30 px-4 py-3.5 rounded-xl text-white text-[15px] border border-white/[0.04]" 
                  placeholder="What are you selling?" 
                  placeholderTextColor="#3f3f46" 
                  value={title} 
                  onChangeText={setTitle} 
                />
              </View>

              {/* Category */}
              <View className="mb-5">
                <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => setSelectedCategory(cat)} 
                      className={`mr-2 px-4 py-2.5 rounded-xl border ${
                        selectedCategory === cat 
                          ? 'bg-cyan-500/12 border-cyan-400/25' 
                          : 'bg-black/20 border-white/[0.04]'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${selectedCategory === cat ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Description */}
              <View className="mb-5">
                <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Description</Text>
                <TextInput 
                  className="w-full bg-black/30 px-4 py-3.5 rounded-xl text-white text-[14px] border border-white/[0.04] min-h-[100px]" 
                  placeholder="Describe the item, condition, and any details buyers should know..." 
                  placeholderTextColor="#3f3f46" 
                  multiline 
                  value={description} 
                  onChangeText={setDescription} 
                  textAlignVertical="top"
                />
              </View>

              {/* Price & Duration Row */}
              <View className="flex-row space-x-3 mb-5">
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Starting Price (₹)</Text>
                  <View className="flex-row items-center bg-black/30 rounded-xl border border-white/[0.04] px-4">
                    <Text className="text-cyan-500 font-bold text-lg mr-1">₹</Text>
                    <TextInput 
                      className="flex-1 py-3.5 text-cyan-400 font-bold text-[15px]" 
                      keyboardType="numeric" 
                      value={startingPrice} 
                      onChangeText={setStartingPrice}
                      placeholder="0"
                      placeholderTextColor="#3f3f46"
                    />
                  </View>
                </View>
              </View>

              {/* Duration Selector */}
              <View className="mb-5">
                <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Auction Duration</Text>
                <View className="flex-row space-x-2">
                  {DURATIONS.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      onPress={() => setDurationDays(d.value)}
                      className={`flex-1 py-3 rounded-xl border items-center ${
                        durationDays === d.value
                          ? 'bg-cyan-500/12 border-cyan-400/25'
                          : 'bg-black/20 border-white/[0.04]'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${durationDays === d.value ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity className="w-full rounded-xl overflow-hidden mt-2" onPress={handleCreateAuction} disabled={isSubmitting} activeOpacity={0.85}>
                <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center flex-row justify-center">
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="rocket-outline" size={18} color="white" />
                      <Text className="text-white font-black text-sm ml-2 tracking-wide">List My Item</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}