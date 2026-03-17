import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useAuctionTimer } from '@/src/features/auctions/hooks/useAuctionTimer';

export default function AuctionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { auctionId } = route.params;
  const { user } = useAuthStore();

  const [auction, setAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBidding, setIsBidding] = useState(false);

  // Use our custom live timer hook
  const { timeLeft, isEnded } = useAuctionTimer(auction?.end_time);

  useEffect(() => {
    fetchAuctionDetails();

    // 1. Subscribe to real-time updates for THIS specific auction
    const channel = supabase
      .channel(`auction-${auctionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` },
        (payload) => {
          // Instantly update the UI when someone else bids!
          setAuction(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  const fetchAuctionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

      if (error) throw error;
      setAuction(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load auction details.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!user) return Alert.alert('Error', 'You must be logged in to bid.');
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.current_price) {
      return Alert.alert('Invalid Bid', 'Your bid must be higher than the current price.');
    }

    setIsBidding(true);
    try {
      // 2. Call the secure Postgres function we created earlier
      const { error } = await supabase.rpc('place_bid', {
        p_auction_id: auctionId,
        p_user_id: user.id,
        p_amount: amount,
      });

      if (error) {
        // Handle custom SQL errors gracefully
        if (error.message.includes('Auction ended')) throw new Error('This auction has already ended.');
        if (error.message.includes('Bid too low')) throw new Error('Someone just outbid you! Try a higher amount.');
        throw error;
      }

      Alert.alert('Success!', 'Your bid was placed successfully.');
      setBidAmount(''); // Clear input
      
    } catch (error: any) {
      Alert.alert('Bid Failed', error.message);
    } finally {
      setIsBidding(false);
    }
  };

  if (isLoading || !auction) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="p-6">
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
            <Text className="text-blue-600 font-semibold text-base">← Back</Text>
          </TouchableOpacity>

          {/* Auction Info */}
          <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-3xl font-black text-gray-900 mb-2">{auction.title}</Text>
            <Text className="text-gray-500 text-base mb-6 leading-relaxed">
              {auction.description || 'No description provided.'}
            </Text>

            <View className="flex-row justify-between items-center bg-gray-50 p-4 rounded-2xl">
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">Current Bid</Text>
                <Text className="text-3xl font-black text-green-600">
                  ${Number(auction.current_price).toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-medium text-gray-500 mb-1">Time Remaining</Text>
                <Text className={`text-lg font-bold ${isEnded ? 'text-red-500' : 'text-gray-900'}`}>
                  {timeLeft}
                </Text>
              </View>
            </View>
          </View>

          {/* Bid Input Area */}
          {!isEnded ? (
            <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <Text className="text-lg font-bold text-gray-900 mb-4">Place a Bid</Text>
              
              <View className="flex-row items-center mb-4">
                <Text className="text-2xl font-bold text-gray-400 mr-2">$</Text>
                <TextInput
                  className="flex-1 bg-gray-50 px-4 py-4 rounded-xl text-xl font-bold text-gray-900"
                  placeholder={(Number(auction.current_price) + 1).toString()}
                  keyboardType="numeric"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  editable={!isBidding}
                />
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-xl items-center ${isBidding ? 'bg-blue-400' : 'bg-blue-600'}`}
                onPress={handlePlaceBid}
                disabled={isBidding || !bidAmount}
              >
                {isBidding ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-lg">Confirm Bid</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-red-50 p-6 rounded-3xl items-center border border-red-100">
              <Text className="text-red-600 font-bold text-xl">Auction Closed</Text>
              <Text className="text-red-500 mt-2 text-center">
                This item sold for ${Number(auction.current_price).toLocaleString()}.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}