import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; 
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';

const CATEGORIES = ['Tech', 'Vehicles', 'High Value', 'Other']; // NEW: Category Tags

export default function CreateAuctionScreen() {
  const router = useNavigation();
  const { user } = useAuthStore();
  const { fetchAuctions } = useAuctionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [durationDays, setDurationDays] = useState('3');
  const [selectedCategory, setSelectedCategory] = useState('Tech'); // NEW: State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoBack = () => router.goBack();

  const handleImageSelection = () => {
    Alert.alert("Add Item Photo", "Choose a photo source", [
      { text: "Take a Photo", onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return Alert.alert("Permission Required");
          const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!res.canceled) setImageUri(res.assets[0].uri);
      }},
      { text: "Choose from Gallery", onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!res.canceled) setImageUri(res.assets[0].uri);
      }},
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleCreateAuction = async () => {
    if (!title || !startingPrice) return Alert.alert('Missing Details', 'Please provide a title and starting price.');
    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) return Alert.alert('Invalid Price', 'Starting price must be a valid number.');

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
      if (isNaN(days) || days <= 0) return Alert.alert('Invalid Duration', 'Please enter a valid number of days.');
      endTime.setDate(endTime.getDate() + days);
      
      const { error } = await supabase.from('auctions').insert({
        title, description, starting_price: price, current_price: price, 
        end_time: endTime.toISOString(), created_by: user?.id, image_url: publicImageUrl,
        category: selectedCategory // NEW: Saving the category
      });
      
      if (error) throw error;
      await fetchAuctions(); 
      handleGoBack();
    } catch (error: any) { Alert.alert('Listing Failed', error.message); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <StatusBar barStyle="light-content" backgroundColor="#09090E" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-3xl font-black text-white tracking-wider">SELL</Text>
                <Text className="text-cyan-400 text-xs tracking-widest uppercase font-bold">New Item Listing</Text>
              </View>
              <TouchableOpacity onPress={handleGoBack} className="bg-white/5 p-2 rounded-full border border-white/10">
                <Text className="text-gray-400 text-xs px-2 font-bold uppercase">Cancel</Text>
              </TouchableOpacity>
            </View>

            <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
              
              <TouchableOpacity onPress={handleImageSelection} className={`w-full h-48 rounded-2xl items-center justify-center overflow-hidden border-2 ${imageUri ? 'border-transparent' : 'border-dashed border-white/20 bg-black/40'}`}>
                {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-cyan-400 text-4xl mb-2">+</Text>}
              </TouchableOpacity>

              <View>
                <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Item Title</Text>
                <TextInput className="w-full bg-black/40 px-4 py-4 rounded-xl text-white font-medium border border-white/5" placeholder="What are you selling?" placeholderTextColor="#4b5563" value={title} onChangeText={setTitle} />
              </View>

              {/* NEW: Category Selector */}
              <View>
                <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Category Tag</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} className={`mr-2 px-4 py-2 rounded-xl border ${selectedCategory === cat ? 'bg-cyan-500/20 border-cyan-400' : 'bg-black/40 border-white/5'}`}>
                      <Text className={`text-xs font-bold ${selectedCategory === cat ? 'text-cyan-400' : 'text-gray-500'}`}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Description</Text>
                <TextInput className="w-full bg-black/40 px-4 py-4 rounded-xl text-white border border-white/5 min-h-[100px]" placeholder="Describe the condition..." placeholderTextColor="#4b5563" multiline value={description} onChangeText={setDescription} textAlignVertical="top"/>
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Start Price (₹)</Text>
                  <TextInput className="w-full bg-black/40 px-4 py-4 rounded-xl text-cyan-400 font-bold border border-white/5" keyboardType="numeric" value={startingPrice} onChangeText={setStartingPrice} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Duration (Days)</Text>
                  <TextInput className="w-full bg-black/40 px-4 py-4 rounded-xl text-cyan-400 font-bold border border-white/5" keyboardType="numeric" value={durationDays} onChangeText={setDurationDays} />
                </View>
              </View>

              <TouchableOpacity className="w-full rounded-xl mt-4" onPress={handleCreateAuction} disabled={isSubmitting}>
                <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                  {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-black tracking-widest uppercase">List Item</Text>}
                </LinearGradient>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}