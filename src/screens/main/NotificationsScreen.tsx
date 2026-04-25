import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';

import { notificationService, Notification } from '@/src/services/notifications/notificationService';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const [bidsReceived, setBidsReceived] = useState<any[]>([]);
  const [myWins, setMyWins] = useState<any[]>([]);
  const [mySales, setMySales] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<Notification[]>([]);
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
        .select('id, title, current_price, claim_code, status, winner_id, created_by, seller:profiles!created_by(first_name)')
        .eq('winner_id', user?.id)
        .order('end_time', { ascending: false });
        
      // 3. Fetch MY sold items (Sales history)
      const { data: sData_history } = await supabase
        .from('auctions')
        .select('id, title, current_price, status, winner_id, created_by, winner:profiles!winner_id(first_name)')
        .eq('created_by', user?.id)
        .not('winner_id', 'is', null)
        .order('end_time', { ascending: false });

      // 4. Fetch Persistent System Notifications
      const sData = await notificationService.getNotifications(user?.id!);

      if (bData) setBidsReceived(bData);
      if (wData) setMyWins(wData);
      if (sData_history) setMySales(sData_history);
      if (sData) setSystemNotifications(sData);
    } catch (e) {
      console.log('Error fetching notifications', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (auctionId: string, currentStatus: string) => {
    const statusOrder = ['sold', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return;
    
    const nextStatus = statusOrder[currentIndex + 1];
    
    Alert.alert("Update Status", `Move delivery status to "${nextStatus.toUpperCase()}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Update", onPress: async () => {
        setIsLoading(true);
        await supabase.from('auctions').update({ status: nextStatus }).eq('id', auctionId);
        await fetchNotifications();
      }}
    ]);
  };

  const handleDeleteBid = (bid: any) => {
    Alert.alert("Delete Bid", `Are you sure you want to remove ${bid.profiles?.first_name}'s bid of ₹${bid.amount}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setIsLoading(true);
        await supabase.from('bids').delete().eq('id', bid.id);
        const { data: remainingBids } = await supabase.from('bids').select('amount').eq('auction_id', bid.auctions.id).order('amount', { ascending: false });
        const newHighest = remainingBids && remainingBids.length > 0 ? remainingBids[0].amount : 0;
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
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from('auctions').update({
          end_time: new Date().toISOString(),
          winner_id: bid.user_id,
          claim_code: code,
          current_price: bid.amount,
          status: 'sold'
        }).eq('id', bid.auctions.id);
        Alert.alert("Winner Declared! 🎉", `${bid.profiles?.first_name} has won the item.`);
        await fetchNotifications();
      }}
    ]);
  };

  const StatusProgressBar = ({ status }: { status: string }) => {
    const statusOrder = ['sold', 'shipped', 'delivered'];
    const currentStep = statusOrder.indexOf(status || 'sold');
    const displayStep = currentStep === -1 ? 0 : currentStep;
    
    return (
      <View className="mt-4 mb-2">
        <View className="flex-row justify-between mb-2">
          {statusOrder.map((s, i) => (
            <Text key={s} className={`text-[9px] font-black uppercase tracking-tighter ${i <= displayStep ? 'text-cyan-400' : 'text-gray-600'}`}>
              {s}
            </Text>
          ))}
        </View>
        <View className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden flex-row">
          <View 
            className="h-full bg-cyan-500" 
            style={{ width: `${((displayStep + 1) / statusOrder.length) * 100}%` }} 
          />
        </View>
      </View>
    );
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
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleDeleteBid(item)} className="flex-1 py-3 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
          <Text className="text-red-400 text-xs font-bold">Delete Bid</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleMakeWinner(item)} className="flex-1 rounded-xl overflow-hidden">
          <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-3 items-center justify-center">
            <Text className="text-white text-xs font-black">Accept Winner</Text>
          </LinearGradient>
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
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-indigo-200 font-bold text-base">You Won! 🎉</Text>
            <View className="bg-emerald-500/20 px-2 py-0.5 rounded">
              <Text className="text-emerald-400 text-[9px] font-bold uppercase">{item.status || 'Sold'}</Text>
            </View>
          </View>
          <Text className="text-indigo-300/70 text-xs">For "{item.title}" at ₹{item.current_price}</Text>
        </View>
      </View>
      
      <StatusProgressBar status={item.status} />
      
      <View className="bg-black/40 rounded-xl p-4 mt-2 border border-white/5 items-center">
        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Your Claim Code</Text>
        <Text className="text-white text-3xl font-black tracking-[0.2em]">{item.claim_code}</Text>
        <Text className="text-gray-500 text-xs mt-3 text-center">Show this code to {item.seller?.first_name || 'the seller'} to claim.</Text>
      </View>
    </LinearGradient>
  );

  const renderSoldItem = ({ item }: { item: any }) => (
    <View className="bg-[#13131a] rounded-2xl p-5 mb-4 border border-cyan-500/20">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-bold text-base">Item Sold! 💵</Text>
        <View className="bg-cyan-500/10 px-2 py-0.5 rounded">
          <Text className="text-cyan-400 text-[9px] font-bold uppercase">{item.status || 'Sold'}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-xs mb-3">"{item.title}" sold to {item.winner?.first_name} for ₹{item.current_price}</Text>
      <StatusProgressBar status={item.status} />
      {item.status !== 'delivered' && (
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleUpdateStatus(item.id, item.status || 'sold')} className="mt-2 bg-cyan-500/10 border border-cyan-500/20 py-3 rounded-xl items-center">
          <Text className="text-cyan-400 text-xs font-bold">Update Shipping Status</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSystemNotification = ({ item }: { item: Notification }) => {
    let iconName: any = 'notifications-outline';
    let iconColor = '#9ca3af';
    let bgColor = 'bg-white/[0.04]';
    switch (item.type) {
      case 'bid': iconName = 'trending-up'; iconColor = '#22d3ee'; bgColor = 'bg-cyan-500/10'; break;
      case 'outbid': iconName = 'warning'; iconColor = '#fbbf24'; bgColor = 'bg-amber-500/10'; break;
      case 'win': iconName = 'trophy'; iconColor = '#a78bfa'; bgColor = 'bg-violet-500/10'; break;
      case 'update': iconName = 'flash'; iconColor = '#34d399'; bgColor = 'bg-emerald-500/10'; break;
    }
    return (
      <View className="bg-[#13131a] rounded-2xl p-4 mb-3 border border-white/[0.04] flex-row items-start">
        <View className={`w-10 h-10 rounded-full ${bgColor} items-center justify-center mr-3`}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <Text className="text-white font-bold text-sm flex-1 mr-2">{item.title}</Text>
            <Text className="text-gray-600 text-[10px]">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 leading-relaxed">{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        <View className="px-5 py-4 border-b border-white/[0.06] flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-10 h-10 rounded-full bg-white/[0.05] items-center justify-center">
            <Ionicons name="chevron-back" size={20} color="#22d3ee" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-white">Notifications</Text>
        </View>
        {isLoading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator color="#06b6d4" /></View>
        ) : (
          <FlatList
            className="flex-1"
            contentContainerClassName="p-5 pb-12"
            data={[
              { type: 'header_wins' }, ...myWins, 
              { type: 'header_sales' }, ...mySales,
              { type: 'header_bids' }, ...bidsReceived,
              { type: 'header_system' }, ...systemNotifications
            ]}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchNotifications}
            renderItem={({ item }) => {
              if (item.type === 'header_wins') return myWins.length > 0 ? <Text className="text-white font-bold text-lg mb-4 mt-2">🏆 My Winnings</Text> : null;
              if (item.type === 'header_sales') return mySales.length > 0 ? <Text className="text-white font-bold text-lg mb-4 mt-6">💰 My Sales</Text> : null;
              if (item.type === 'header_bids') return bidsReceived.length > 0 ? <Text className="text-white font-bold text-lg mb-4 mt-6">🔔 Bids on My Items</Text> : null;
              if (item.type === 'header_system') return systemNotifications.length > 0 ? <Text className="text-white font-bold text-lg mb-4 mt-6">✨ Activity Log</Text> : null;
              
              if (item.claim_code && item.winner_id === user?.id) return renderWinItem({ item });
              if (item.winner_id && item.created_by === user?.id) return renderSoldItem({ item });
              if (item.message) return renderSystemNotification({ item: item as Notification });
              if (item.amount) return renderBidItem({ item });
              return null;
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center pt-32">
                <Ionicons name="mail-unread-outline" size={32} color="#6b7280" />
                <Text className="text-white font-bold text-lg mt-4 mb-2">No Notifications</Text>
                <Text className="text-gray-500 text-sm text-center px-8">Check back later for updates on your auctions and bids.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
