import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';

const DURATIONS = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
];

export default function CreateAuctionScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { fetchAuctions } = useAuctionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(3); // Default 3 days
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAuction = async () => {
    if (!title || !startingPrice) {
      return Alert.alert('Missing Fields', 'Please provide a title and a starting price.');
    }

    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) {
      return Alert.alert('Invalid Price', 'Starting price must be a valid number greater than 0.');
    }

    setIsSubmitting(true);

    try {
      // Calculate future end date
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + selectedDuration);

      const { error } = await supabase.from('auctions').insert({
        title,
        description,
        starting_price: price,
        current_price: price, // Initial current_price equals starting_price
        end_time: endTime.toISOString(),
        created_by: user?.id,
      });

      if (error) throw error;

      Alert.alert('Success', 'Your auction is now live!');
      
      // Refresh the global store so the new item appears on the Home feed instantly
      await fetchAuctions(); 
      navigation.goBack();

    } catch (error: any) {
      Alert.alert('Error Creating Auction', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="p-6">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl font-black text-gray-900">New Auction</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-gray-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2 uppercase">Item Title</Text>
              <TextInput
                className="w-full bg-gray-50 px-4 py-4 rounded-xl text-lg font-medium text-gray-900 border border-gray-100"
                placeholder="e.g. Vintage Rolex Submariner"
                value={title}
                onChangeText={setTitle}
                editable={!isSubmitting}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2 uppercase">Description</Text>
              <TextInput
                className="w-full bg-gray-50 px-4 py-4 rounded-xl text-base text-gray-900 border border-gray-100 min-h-[100px]"
                placeholder="Describe the condition, history, etc..."
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                editable={!isSubmitting}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2 uppercase">Starting Price ($)</Text>
              <TextInput
                className="w-full bg-gray-50 px-4 py-4 rounded-xl text-lg font-bold text-gray-900 border border-gray-100"
                placeholder="0.00"
                keyboardType="numeric"
                value={startingPrice}
                onChangeText={setStartingPrice}
                editable={!isSubmitting}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2 uppercase">Auction Duration</Text>
              <View className="flex-row justify-between space-x-2">
                {DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration.days}
                    className={`flex-1 py-3 rounded-xl border ${
                      selectedDuration === duration.days
                        ? 'bg-blue-50 border-blue-600'
                        : 'bg-white border-gray-200'
                    }`}
                    onPress={() => setSelectedDuration(duration.days)}
                    disabled={isSubmitting}
                  >
                    <Text
                      className={`text-center font-bold ${
                        selectedDuration === duration.days ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center mt-10 ${
              isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
            }`}
            onPress={handleCreateAuction}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-lg">List Item</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}