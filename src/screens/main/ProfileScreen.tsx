import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused(); // To refresh data when user returns to this tab
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bids' | 'watchlist' | 'listings'>('bids');
  
  const [myBids, setMyBids] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myWatchlist, setMyWatchlist] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBids: 0 });

  useEffect(() => { 
    if (isFocused) fetchDashboardData(); 
  }, [isFocused]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { count } = await supabase.from('bids').select('*', { count: 'exact', head: true }).eq('user_id', user?.id);
      setStats({ totalBids: count || 0 });

      // 1. Fetch Bids
      const { data: bidsData } = await supabase
        .from('bids')
        .select(`amount, created_at, auctions (id, title, current_price, end_time)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (bidsData) setMyBids(bidsData);

      // 2. Fetch Listings
      const { data: listingsData } = await supabase
        .from('auctions')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });
      if (listingsData) setMyListings(listingsData);

      // 3. Fetch Watchlist
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select(`id, auctions (id, title, current_price, end_time)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (watchlistData) setMyWatchlist(watchlistData);

    } catch (error: any) {
      console.error('Error Syncing Data', error.message);
    } finally { 
      setLoading(false); 
    }
  };

  const handleSignOutConfirm = () => {
    Alert.alert(
      "Terminate Session",
      "Are you sure you want to log out of BidNexus?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: signOut }
      ]
    );
  };

  const renderAuctionItem = ({ item, type }: { item: any, type: string }) => {
    // Standardize data access since the join structure differs slightly between bids and watchlist
    const auctionData = type === 'listings' ? item : item.auctions;
    if (!auctionData) return null;

    const isEnded = new Date(auctionData.end_time) < new Date();

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('AuctionDetail', { auctionId: auctionData.id })}
        className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-3 flex-row justify-between items-center"
      >
        <View className="flex-1 pr-4">
          <Text className="text-white font-bold mb-1" numberOfLines={1}>{auctionData.title}</Text>
          
          {type === 'bids' ? (
            <Text className="text-gray-500 text-[10px] tracking-widest uppercase">Offered on {new Date(item.created_at).toLocaleDateString()}</Text>
          ) : (
            <Text className={`text-[10px] font-bold uppercase tracking-widest ${isEnded ? 'text-red-400' : 'text-green-400'}`}>
              {isEnded ? 'Listing Ended' : 'Live Item'}
            </Text>
          )}
        </View>

        <View className="items-end">
          <Text className="text-gray-400 text-[9px] uppercase tracking-widest mb-1">
            {type === 'bids' ? 'Your Offer' : 'Current Value'}
          </Text>
          <Text className="text-cyan-400 font-black text-lg">
            ${type === 'bids' ? item.amount : auctionData.current_price}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getActiveData = () => {
    if (activeTab === 'bids') return myBids;
    if (activeTab === 'watchlist') return myWatchlist;
    return myListings;
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const fullName = `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || 'No Name Provided';

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        
        {/* Header Profile Section */}
        <View className="px-6 pt-6 pb-6 border-b border-white/10">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-3xl font-black text-white tracking-widest uppercase mb-1">My Profile</Text>
              <Text className="text-cyan-500 font-bold text-[10px] tracking-[3px] uppercase mb-4">{user?.email}</Text>
              
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="person-circle-outline" size={16} color="#9ca3af" className="mr-2" />
                  <Text className="text-gray-300 text-xs">{fullName}</Text>
                </View>
                {user?.user_metadata?.phone_number && (
                  <View className="flex-row items-center">
                    <Ionicons name="call-outline" size={16} color="#9ca3af" className="mr-2" />
                    <Text className="text-gray-300 text-xs">{user.user_metadata.phone_number}</Text>
                  </View>
                )}
                {user?.user_metadata?.age && (
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" className="mr-2" />
                    <Text className="text-gray-300 text-xs">Age: {user.user_metadata.age}</Text>
                  </View>
                )}
              </View>
            </View>
            <View className="items-end space-y-3">
              <TouchableOpacity onPress={handleEditProfile} className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 rounded-lg w-20 items-center">
                <Text className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignOutConfirm} className="bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg w-20 items-center">
                <Text className="text-red-400 font-bold text-[10px] uppercase tracking-wider">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row mt-6 bg-black/40 p-4 rounded-2xl border border-white/5">
            <View className="flex-1 items-center border-r border-white/10">
              <Text className="text-xl font-black text-cyan-400">{stats.totalBids}</Text>
              <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-1">Offers</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xl font-black text-purple-400">{myListings.length}</Text>
              <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-1">Items</Text>
            </View>
          </View>
        </View>

        {/* 3-Way Dashboard Tabs */}
        <View className="flex-row px-6 mt-6 mb-4 space-x-2">
          {['bids', 'watchlist', 'listings'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 rounded-xl border ${activeTab === tab ? 'bg-cyan-500/20 border-cyan-400/50' : 'bg-transparent border-transparent'}`}
            >
              <Text className={`text-center font-bold tracking-widest uppercase text-[10px] ${activeTab === tab ? 'text-cyan-400' : 'text-gray-500'}`}>
                {tab === 'bids' ? 'Offers' : tab === 'watchlist' ? 'Saved' : 'Items'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List Content */}
        <View className="flex-1 px-6">
          {loading ? (
            <ActivityIndicator color="#06b6d4" className="mt-10" />
          ) : (
            <FlatList
              data={getActiveData()}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              renderItem={({ item }) => renderAuctionItem({ item, type: activeTab })}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <View className="mt-10 items-center bg-white/5 border border-white/10 p-6 rounded-3xl">
                  <Ionicons name={activeTab === 'watchlist' ? 'bookmark-outline' : 'folder-open-outline'} size={40} color="#4b5563" className="mb-4" />
                  <Text className="text-gray-500 font-bold uppercase tracking-widest text-center text-xs">
                    {activeTab === 'bids' && 'You haven\'t made any offers yet.'}
                    {activeTab === 'watchlist' && 'Your saved list is empty.'}
                    {activeTab === 'listings' && 'You have no active items.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}