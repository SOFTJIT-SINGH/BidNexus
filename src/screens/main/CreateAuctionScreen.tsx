import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';

const DURATIONS = [
  { label: '24H', days: 1 },
  { label: '72H', days: 3 },
  { label: '168H', days: 7 },
];

export default function CreateAuctionScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { fetchAuctions } = useAuctionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAuction = async () => {
    if (!title || !startingPrice) {
      return Alert.alert('Invalid Entry', 'Title and starting price are required for deployment.');
    }

    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) {
      return Alert.alert('Invalid Price', 'Starting price must be a positive integer.');
    }

    setIsSubmitting(true);
    try {
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + selectedDuration);

      const { error } = await supabase.from('auctions').insert({
        title,
        description,
        starting_price: price,
        current_price: price,
        end_time: endTime.toISOString(),
        created_by: user?.id,
      });

      if (error) throw error;

      await fetchAuctions(); 
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Deployment Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      <View className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView contentContainerClassName="p-6">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-3xl font-black text-white tracking-wider">DEPLOY</Text>
                <Text className="text-cyan-400 text-xs tracking-widest uppercase font-bold">New Auction Node</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} className="bg-white/5 p-2 rounded-full border border-white/10">
                <Text className="text-gray-400 text-xs px-2 font-bold uppercase">Cancel</Text>
              </TouchableOpacity>
            </View>

            <BlurView intensity={20} tint="dark" className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
              <View>
                <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Asset Name</Text>
                <TextInput
                  className="w-full bg-black/40 px-4 py-4 rounded-xl text-white font-medium border border-white/5"
                  placeholder="Asset designation..."
                  placeholderTextColor="#4b5563"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View>
                <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Specifications</Text>
                <TextInput
                  className="w-full bg-black/40 px-4 py-4 rounded-xl text-white border border-white/5 min-h-[100px]"
                  placeholder="Technical description..."
                  placeholderTextColor="#4b5563"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Base Price ($)</Text>
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
                  <Text className="text-[10px] font-black text-gray-500 mb-2 tracking-[2px] uppercase">Runtime</Text>
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

              <TouchableOpacity
                className="w-full overflow-hidden rounded-xl mt-4"
                onPress={handleCreateAuction}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#06b6d4', '#3b82f6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  className="py-4 items-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-black tracking-widest uppercase">Initialize Deployment</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}