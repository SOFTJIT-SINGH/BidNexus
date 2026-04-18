import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const [bidsReceived, setBidsReceived] = useState<any[]>([]);
  const [myWins, setMyWins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch bids on MY active items (to allow accept/delete)
      const { data: bData } = await supabase
        .from('bids')
        .select(`
          id, amount, created_at, user_id, 
          profiles (first_name, last_name),
          auctions!inner (id, title, created_by, winner_id, current_price)
        `)
        .eq('auctions.created_by', user?.id)
        .is('auctions.winner_id', null)
        .order('created_at', { ascending: false });

      // 2. Fetch MY won items
      const { data: wData } = await supabase
        .from('auctions')
        .select('id, title, current_price, claim_code, seller:profiles!created_by(first_name)')
        .eq('winner_id', user?.id)
        .order('end_time', { ascending: false });

      if (bData) setBidsReceived(bData);
      if (wData) setMyWins(wData);
    } catch (e) {
      console.log('Error fetching notifications', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBid = (bid: any) => {
    Alert.alert("Delete Bid", `Are you sure you want to remove ${bid.profiles?.first_name}'s bid of ₹${bid.amount}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setIsLoading(true);
        // 1. Delete the bid
        await supabase.from('bids').delete().eq('id', bid.id);
        
        // 2. Recalculate max bid for the auction
        const { data: remainingBids } = await supabase
          .from('bids')
          .select('amount')
          .eq('auction_id', bid.auctions.id)
          .order('amount', { ascending: false });
          
        const newHighest = remainingBids && remainingBids.length > 0 
          ? remainingBids[0].amount 
          : 0; // Or starting_price ideally, but keeping 0 is safe enough for fallback
        
        // 3. Update auction price
        if (newHighest > 0) {
           await supabase.from('auctions').update({ current_price: newHighest }).eq('id', bid.auctions.id);
        }
        
        await fetchNotifications();
      }}
    ]);
  };

  const handleMakeWinner = (bid: any) => {
    Alert.alert("Declare Winner", `Accept ₹${bid.amount} and make ${bid.profiles?.first_name} the winner? This ends the auction immediately.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Accept & End", onPress: async () => {
        setIsLoading(true);
        // Generate a random 6-character claim code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await supabase.from('auctions').update({
          end_time: new Date().toISOString(), // end immediately
          winner_id: bid.user_id,
          claim_code: code,
          current_price: bid.amount // lock it to this bid
        }).eq('id', bid.auctions.id);

        Alert.alert("Winner Declared! 🎉", `${bid.profiles?.first_name} has won the item.`);
        await fetchNotifications();
      }}
    ]);
  };

  const renderBidItem = ({ item }: { item: any }) => (
    <View className="bg-[#13131a] rounded-2xl p-4 mb-4 border border-white/[0.06]">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-cyan-500/10 items-center justify-center mr-3 border border-cyan-500/20">
            <Ionicons name="person" size={16} color="#22d3ee" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-sm">{item.profiles?.first_name} bid ₹{item.amount}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">on "{item.auctions?.title}"</Text>
          </View>
        </View>
        <Text className="text-gray-600 text-[10px]">
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <View className="flex-row space-x-3 mt-1">
        <TouchableOpacity 
          onPress={() => handleDeleteBid(item)}
          className="flex-1 py-3 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <Text className="text-red-400 text-xs font-bold">Delete Bid</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleMakeWinner(item)}
          className="flex-1 py-3 items-center justify-center rounded-xl overflow-hidden"
        >
          <LinearGradient colors={['#06b6d4', '#3b82f6']} className="absolute inset-0" />
          <Text className="text-white text-xs font-black">Accept Winner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWinItem = ({ item }: { item: any }) => (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} className="rounded-2xl p-5 mb-4 border border-indigo-500/30">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
          <Ionicons name="trophy" size={20} color="#818cf8" />
        </View>
        <View>
          <Text className="text-indigo-200 font-bold text-base">You Won! 🎉</Text>
          <Text className="text-indigo-300/70 text-xs">For "{item.title}" at ₹{item.current_price}</Text>
        </View>
      </View>
      
      <View className="bg-black/40 rounded-xl p-4 mt-2 border border-white/5 items-center">
        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Your Claim Code</Text>
        <Text className="text-white text-3xl font-black tracking-[0.2em]">{item.claim_code}</Text>
        <Text className="text-gray-500 text-xs mt-3 text-center">
          Show this unique code to {item.seller?.first_name || 'the seller'} to claim your item.
        </Text>
      </View>
    </LinearGradient>
  );

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-5 py-4 border-b border-white/[0.06] flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 rounded-full bg-white/[0.05] items-center justify-center">
            <Ionicons name="chevron-back" size={20} color="#22d3ee" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-white">Notifications</Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#06b6d4" />
          </View>
        ) : (
          <FlatList
            className="flex-1 p-5"
            data={[{ type: 'header_wins' }, ...myWins, { type: 'header_bids' }, ...bidsReceived]}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchNotifications}
            renderItem={({ item }) => {
              if (item.type === 'header_wins' && myWins.length > 0) {
                return <Text className="text-white font-bold text-lg mb-4 mt-2">🏆 My Winnings</Text>;
              }
              if (item.type === 'header_bids' && bidsReceived.length > 0) {
                return <Text className="text-white font-bold text-lg mb-4 mt-6">🔔 Bids on My Items</Text>;
              }
              if (item.type) return null;
              
              if (item.claim_code) return renderWinItem({ item });
              return renderBidItem({ item });
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center pt-32">
                <View className="w-20 h-20 bg-white/[0.03] rounded-full items-center justify-center mb-6 border border-white/[0.05]">
                  <Ionicons name="mail-unread-outline" size={32} color="#6b7280" />
                </View>
                <Text className="text-white font-bold text-lg mb-2">No Notification Available</Text>
                <Text className="text-gray-500 text-sm text-center px-8">
                  Pull down to refresh and check for updates.
                </Text>
              </View>
            }
          />
        )}
        
      </SafeAreaView>
    </View>
  );
}
