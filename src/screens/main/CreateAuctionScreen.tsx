import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';

const DURATIONS = [{ label: '1 Day', days: 1 }, { label: '3 Days', days: 3 }, { label: '7 Days', days: 7 }];

export default function CreateAuctionScreen() {
  const router = useNavigation();
  const { user } = useAuthStore();
  const { fetchAuctions } = useAuctionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoBack = () => {
    router.goBack();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateAuction = async () => {
    if (!title || !startingPrice) return Alert.alert('Missing Details', 'Please provide a title and starting price.');
    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) return Alert.alert('Invalid Price', 'Starting price must be a valid number.');

    setIsSubmitting(true);
    try {
      let publicImageUrl = null;

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const fileName = `${user?.id}_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('auction-images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw new Error('Failed to upload image: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
          .from('auction-images')
          .getPublicUrl(fileName);
          
        publicImageUrl = publicUrl;
      }

      const endTime = new Date();
      endTime.setDate(endTime.getDate() + selectedDuration);
      
      const { error } = await supabase.from('auctions').insert({
        title, 
        description, 
        starting_price: price, 
        current_price: price, 
        end_time: endTime.toISOString(), 
        created_by: user?.id,
        image_url: publicImageUrl
      });
      
      if (error) throw error;
      
      await fetchAuctions(); 
      handleGoBack();
    } catch (error: any) {
      Alert.alert('Listing Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // FIX 1: Hardcode the outer style so it physically cannot collapse or be white
    <View style={{ flex: 1, backgroundColor: '#09090E' }}>
      <StatusBar barStyle="light-content" backgroundColor="#09090E" />
      
      {/* Background glow effect */}
      <View style={{ position: 'absolute', bottom: -128, left: -128, width: 384, height: 384, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 192 }} />

      {/* FIX 2: Hardcode SafeAreaView flex */}
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* FIX 3: Remove behavior='height' on Android, it causes screen wipeouts */}
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* FIX 4: Hardcode ScrollView content container styles */}
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-3xl font-black text-white tracking-wider">CREATE</Text>
                <Text className="text-cyan-400 text-xs tracking-widest uppercase font-bold">New Auction Listing</Text>
              </View>
              <TouchableOpacity onPress={handleGoBack} className="bg-white/5 p-2 rounded-full border border-white/10">
                <Text className="text-gray-400 text-xs px-2 font-bold uppercase">Cancel</Text>
              </TouchableOpacity>
            </View>

            <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
              
              <TouchableOpacity 
                onPress={pickImage} 
                className={`w-full h-48 rounded-2xl items-center justify-center overflow-hidden border-2 ${imageUri ? 'border-transparent' : 'border-dashed border-white/20 bg-black/40'}`}
              >
                {imageUri ? (
                  <>
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-bold uppercase">Change Photo</Text>
                    </View>
                  </>
                ) : (
                  <View className="items-center">
                    <Text className="text-cyan-400 text-4xl mb-2">+</Text>
                    <Text className="text-gray-500 text-xs font-bold tracking-widest uppercase">Tap to Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View>
                <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Item Title</Text>
                <TextInput 
                  className="w-full bg-black/40 px-4 py-4 rounded-xl text-white font-medium border border-white/5" 
                  placeholder="What are you selling?" 
                  placeholderTextColor="#4b5563" 
                  value={title} 
                  onChangeText={setTitle} 
                />
              </View>

              <View>
                <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Description</Text>
                <TextInput 
                  className="w-full bg-black/40 px-4 py-4 rounded-xl text-white border border-white/5 min-h-[100px]" 
                  placeholder="Describe the condition, features, etc..." 
                  placeholderTextColor="#4b5563" 
                  multiline 
                  value={description} 
                  onChangeText={setDescription} 
                  textAlignVertical="top"
                />
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Starting Price ($)</Text>
                  <TextInput 
                    className="w-full bg-black/40 px-4 py-4 rounded-xl text-cyan-400 font-bold border border-white/5" 
                    placeholder="0.00" 
                    placeholderTextColor="#4b5563" 
                    keyboardType="numeric" 
                    value={startingPrice} 
                    onChangeText={setStartingPrice} 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Duration</Text>
                  <View className="flex-row justify-between bg-black/40 p-1 rounded-xl border border-white/5">
                    {DURATIONS.map((d) => (
                      <TouchableOpacity 
                        key={d.days} 
                        onPress={() => setSelectedDuration(d.days)} 
                        className={`flex-1 py-3 rounded-lg ${selectedDuration === d.days ? 'bg-cyan-500' : ''}`}
                      >
                        <Text className={`text-center text-[10px] font-black ${selectedDuration === d.days ? 'text-black' : 'text-gray-400'}`}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity className="w-full overflow-hidden rounded-xl mt-4" onPress={handleCreateAuction} disabled={isSubmitting}>
                <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                  {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-black tracking-widest uppercase">Publish Auction</Text>}
                </LinearGradient>
              </TouchableOpacity>
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}