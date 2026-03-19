import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const [winnerId, setWinnerId] = useState<string | null>(null);
  
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false);

  const { timeLeft, isEnded } = useAuctionTimer(auction?.end_time);

  useEffect(() => {
    fetchAuctionDetails();
    if (user) checkWatchlistStatus();

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

  // Check for winner when auction ends
  useEffect(() => {
    if (isEnded && auction) {
      determineWinner();
    }
  }, [isEnded, auction]);

  const fetchAuctionDetails = async () => {
    try {
      const { data, error } = await supabase.from('auctions').select('*').eq('id', auctionId).single();
      if (error) throw error;
      setAuction(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load item details.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const determineWinner = async () => {
    try {
      const { data } = await supabase
        .from('bids')
        .select('user_id')
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setWinnerId(data.user_id);
    } catch (e) {
      console.log('No bids placed or error fetching winner', e);
    }
  };

  const checkWatchlistStatus = async () => {
    const { data } = await supabase.from('watchlist').select('id').eq('user_id', user?.id).eq('auction_id', auctionId).single();
    if (data) setIsWatchlisted(true);
  };

  const toggleWatchlist = async () => {
    if (!user) return Alert.alert('Sign In Required', 'Please sign in to save items.');
    setIsTogglingWatchlist(true);
    try {
      if (isWatchlisted) {
        await supabase.from('watchlist').delete().eq('user_id', user.id).eq('auction_id', auctionId);
        setIsWatchlisted(false);
      } else {
        await supabase.from('watchlist').insert({ user_id: user.id, auction_id: auctionId });
        setIsWatchlisted(true);
      }
    } catch (error) {
      console.error('Watchlist Error', error);
    } finally {
      setIsTogglingWatchlist(false);
    }
  };

  // --- BID INCREMENT LOGIC ---
  const getMinimumNextBid = (currentPrice: number) => {
    if (currentPrice < 100) return currentPrice + 5;
    if (currentPrice < 500) return currentPrice + 10;
    if (currentPrice < 1000) return currentPrice + 25;
    return currentPrice + 50;
  };

  const handlePlaceBid = async () => {
    if (!user) return Alert.alert('Sign In Required', 'Please sign in to place a bid.');
    
    const amount = parseFloat(bidAmount);
    const minBid = getMinimumNextBid(Number(auction.current_price));

    if (isNaN(amount) || amount < minBid) {
      return Alert.alert('Invalid Bid', `The minimum accepted bid is $${minBid.toLocaleString()}`);
    }

    setIsBidding(true);
    try {
      const { error } = await supabase.rpc('place_bid', {
        p_auction_id: auctionId,
        p_user_id: user.id,
        p_amount: amount,
      });

      if (error) {
        if (error.message.includes('Auction ended')) throw new Error('This auction has already ended.');
        if (error.message.includes('Bid too low')) throw new Error('You were outbid! Someone placed a higher bid just before you.');
        throw error;
      }

      setBidAmount('');
    } catch (error: any) {
      Alert.alert('Bid Failed', error.message);
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

  const minBid = getMinimumNextBid(Number(auction.current_price));

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Image Background or Fallback Glow */}
      {auction.image_url ? (
        <View className="absolute top-0 left-0 w-full h-96">
          <Image source={{ uri: auction.image_url }} className="w-full h-full opacity-40" resizeMode="cover" />
          <LinearGradient colors={['transparent', '#09090E']} className="absolute bottom-0 w-full h-48" />
        </View>
      ) : (
        <View className="absolute top-0 left-0 w-full h-80 bg-cyan-900/20 blur-[100px]" />
      )}

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          
          <View className="px-6 py-4 flex-row items-center justify-between z-10">
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/10 backdrop-blur-md">
              <Ionicons name="chevron-back" size={24} color="#06b6d4" />
            </TouchableOpacity>
            
            <View className="flex-row items-center space-x-4">
              {!isEnded && (
                <View className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
                  <View className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                  <Text className="text-red-500 text-xs font-bold tracking-widest uppercase">Live</Text>
                </View>
              )}
              <TouchableOpacity onPress={toggleWatchlist} disabled={isTogglingWatchlist} className="w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/10">
                <Ionicons name={isWatchlisted ? "bookmark" : "bookmark-outline"} size={20} color={isWatchlisted ? "#06b6d4" : "#9ca3af"} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerClassName="p-6 pb-32 pt-32">
            
            <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#09090E]/80 p-6 mb-6 shadow-2xl backdrop-blur-xl">
              <Text className="text-3xl font-black text-white mb-2 tracking-wide">
                {auction.title}
              </Text>
              <Text className="text-gray-400 text-sm mb-8 leading-relaxed">
                {auction.description || 'No description provided for this item.'}
              </Text>

              <View className="bg-black/60 p-5 rounded-2xl border border-white/5 flex-row justify-between items-center">
                <View>
                  <Text className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">Current Bid</Text>
                  <Text className="text-3xl font-black text-cyan-400">
                    ${Number(auction.current_price).toLocaleString()}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">Time Left</Text>
                  <Text className={`text-lg font-bold tracking-widest ${isEnded ? 'text-red-500' : 'text-white'}`}>
                    {timeLeft}
                  </Text>
                </View>
              </View>
            </View>

            {!isEnded ? (
              <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#09090E]/80 p-6 backdrop-blur-xl">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-sm font-bold text-white tracking-widest uppercase">Place Your Bid</Text>
                  <Text className="text-[10px] font-bold text-cyan-500 tracking-widest uppercase">Min. ${minBid.toLocaleString()}</Text>
                </View>
                
                <View className="flex-row items-center mb-6 bg-black/50 border border-white/10 rounded-2xl px-4 py-2 focus:border-cyan-500/50">
                  <Text className="text-2xl font-black text-cyan-600 mr-2">$</Text>
                  <TextInput
                    className="flex-1 py-3 text-2xl font-black text-white"
                    placeholder={minBid.toString()}
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
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    className="py-4 items-center"
                  >
                    {isBidding ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white font-black tracking-widest uppercase text-sm">Submit Bid</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              // WINNER DECLARATION UI
              <View className={`overflow-hidden rounded-3xl border p-6 items-center backdrop-blur-xl ${user?.id === winnerId ? 'border-green-500/30 bg-green-900/20' : 'border-red-500/30 bg-red-900/20'}`}>
                {user?.id === winnerId ? (
                  <>
                    <Text className="text-green-400 font-black tracking-widest uppercase text-2xl mb-2 text-center">
                      🏆 You Won!
                    </Text>
                    <Text className="text-green-300/70 text-center font-medium">
                      Congratulations! You secured this item for ${Number(auction.current_price).toLocaleString()}.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-red-400 font-black tracking-widest uppercase text-lg mb-2">
                      Auction Ended
                    </Text>
                    <Text className="text-red-300/70 text-center font-medium">
                      Winning bid: ${Number(auction.current_price).toLocaleString()}
                    </Text>
                  </>
                )}
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}