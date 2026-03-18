import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

  const { timeLeft, isEnded } = useAuctionTimer(auction?.end_time);

  useEffect(() => {
    fetchAuctionDetails();

    // Real-time WebSocket Subscription
    const channel = supabase
      .channel(`auction-${auctionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` },
        (payload) => setAuction(payload.new)
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
      Alert.alert('Error', 'Could not load auction data.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!user) return Alert.alert('Access Denied', 'Authentication required to place bids.');
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.current_price) {
      return Alert.alert('Invalid Parameter', 'Bid must exceed the current market price.');
    }

    setIsBidding(true);
    try {
      const { error } = await supabase.rpc('place_bid', {
        p_auction_id: auctionId,
        p_user_id: user.id,
        p_amount: amount,
      });

      if (error) {
        if (error.message.includes('Auction ended')) throw new Error('Terminal closed. Auction has ended.');
        if (error.message.includes('Bid too low')) throw new Error('Outbid! A higher bid was processed fractions of a second before yours.');
        throw error;
      }

      setBidAmount('');
    } catch (error: any) {
      Alert.alert('Transaction Failed', error.message);
    } finally {
      setIsBidding(false);
    }
  };

  if (isLoading || !auction) {
    return (
      <View className="flex-1 justify-center items-center bg-[#09090E]">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      
      {/* Background Ambient Glow */}
      <View className="absolute top-0 left-0 w-full h-80 bg-cyan-900/20 blur-[100px]" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5">
            <TouchableOpacity onPress={() => navigation.goBack()} className="py-2 pr-4">
              <Text className="text-cyan-400 font-bold tracking-widest text-xs uppercase">← Return</Text>
            </TouchableOpacity>
            {/* Live pulsing indicator */}
            {!isEnded && (
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                <Text className="text-red-500 text-xs font-bold tracking-widest uppercase">Live</Text>
              </View>
            )}
          </View>

          <ScrollView contentContainerClassName="p-6 pb-32">
            
            {/* Main Data Terminal */}
            <BlurView 
              intensity={20} 
              tint="dark" 
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 mb-6 shadow-2xl shadow-cyan-500/10"
            >
              <Text className="text-3xl font-black text-white mb-2 tracking-wide">
                {auction.title}
              </Text>
              <Text className="text-gray-400 text-sm mb-8 leading-relaxed">
                {auction.description || 'No system logs provided for this asset.'}
              </Text>

              {/* Data Grid */}
              <View className="bg-black/40 p-5 rounded-2xl border border-white/5 flex-row justify-between items-center">
                <View>
                  <Text className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">Market Value</Text>
                  <Text className="text-3xl font-black text-cyan-400">
                    ${Number(auction.current_price).toLocaleString()}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">Time-to-Live</Text>
                  <Text className={`text-lg font-bold tracking-widest ${isEnded ? 'text-red-500' : 'text-white'}`}>
                    {timeLeft}
                  </Text>
                </View>
              </View>
            </BlurView>

            {/* Execution Interface */}
            {!isEnded ? (
              <BlurView 
                intensity={30} 
                tint="dark" 
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <Text className="text-sm font-bold text-white mb-4 tracking-widest uppercase">
                  Execute Trade
                </Text>
                
                <View className="flex-row items-center mb-6 bg-black/50 border border-white/10 rounded-2xl px-4 py-2">
                  <Text className="text-2xl font-black text-cyan-600 mr-2">$</Text>
                  <TextInput
                    className="flex-1 py-3 text-2xl font-black text-white"
                    placeholder={(Number(auction.current_price) + 1).toString()}
                    placeholderTextColor="#4b5563"
                    keyboardType="numeric"
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    editable={!isBidding}
                    selectionColor="#06b6d4"
                  />
                </View>

                <TouchableOpacity
                  className="w-full overflow-hidden rounded-xl"
                  onPress={handlePlaceBid}
                  disabled={isBidding || !bidAmount}
                >
                  <LinearGradient
                    colors={isBidding ? ['#374151', '#1f2937'] : ['#06b6d4', '#3b82f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-4 items-center"
                  >
                    {isBidding ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white font-black tracking-widest uppercase text-sm">
                        Transmit Bid
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            ) : (
              <BlurView 
                intensity={20} 
                tint="dark" 
                className="overflow-hidden rounded-3xl border border-red-500/30 bg-red-900/20 p-6 items-center"
              >
                <Text className="text-red-400 font-black tracking-widest uppercase text-lg mb-2">
                  Market Closed
                </Text>
                <Text className="text-red-300/70 text-center font-medium">
                  Asset acquired at ${Number(auction.current_price).toLocaleString()}.
                </Text>
              </BlurView>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}