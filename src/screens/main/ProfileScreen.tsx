import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bids' | 'saved' | 'my_items'>('bids');
  
  const [myBids, setMyBids] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myWatchlist, setMyWatchlist] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBids: 0, totalWon: 0 });

  useEffect(() => { 
    if (isFocused) fetchDashboardData(); 
  }, [isFocused]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      setUserProfile(profile);
      
      const { count } = await supabase.from('bids').select('*', { count: 'exact', head: true }).eq('user_id', user?.id);
      setStats({ totalBids: count || 0, totalWon: 0 });

      // 1. Fetch My Bids
      const { data: bidsData } = await supabase
        .from('bids')
        .select(`amount, created_at, auctions (id, title, current_price, end_time, category)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (bidsData) setMyBids(bidsData.filter((b: any) => b.auctions?.category === 'Mobiles'));

      // 2. Fetch My Listings
      const { data: listingsData } = await supabase
        .from('auctions')
        .select('*')
        .eq('created_by', user?.id)
        .eq('category', 'Mobiles')
        .order('created_at', { ascending: false });
      if (listingsData) setMyListings(listingsData);

      // 3. Fetch Saved Items
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select(`id, auctions (id, title, current_price, end_time, category)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (watchlistData) setMyWatchlist(watchlistData.filter((w: any) => w.auctions?.category === 'Mobiles'));

    } catch (error: any) {
      console.error('Error loading profile data', error.message);
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogOut = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: signOut }
      ]
    );
  };

  const renderItem = ({ item, type }: { item: any, type: string }) => {
    const auctionData = type === 'my_items' ? item : item.auctions;
    if (!auctionData) return null;

    const isEnded = new Date(auctionData.end_time) < new Date();

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('AuctionDetail', { auctionId: auctionData.id })}
        className="bg-[#13131a] border border-white/[0.06] p-4 rounded-2xl mb-3"
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-white font-bold text-[15px] mb-1.5" numberOfLines={1}>{auctionData.title}</Text>
            
            {type === 'bids' ? (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={12} color="#6b7280" />
                <Text className="text-gray-500 text-[11px] ml-1">Bid placed {new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isEnded ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <Text className={`text-[11px] font-semibold ${isEnded ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isEnded ? 'Ended' : 'Live Now'}
                </Text>
              </View>
            )}
          </View>

          <View className="items-end">
            <Text className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">
              {type === 'bids' ? 'Your Bid' : 'Price'}
            </Text>
            <Text className="text-cyan-400 font-black text-lg">
              ₹{Number(type === 'bids' ? item.amount : auctionData.current_price).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getActiveData = () => {
    if (activeTab === 'bids') return myBids;
    if (activeTab === 'saved') return myWatchlist;
    return myListings;
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const fullName = `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || 'No Name Set';
  const initials = `${user?.user_metadata?.first_name?.charAt(0) || ''}${user?.user_metadata?.last_name?.charAt(0) || ''}`.toUpperCase() || 'U';
  
  // Member since
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  const tabs = [
    { key: 'bids', label: 'My Bids', icon: 'pricetag-outline', count: myBids.length },
    { key: 'saved', label: 'Saved', icon: 'heart-outline', count: myWatchlist.length },
    { key: 'my_items', label: 'My Items', icon: 'cube-outline', count: myListings.length },
  ];

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Text className="text-xl font-black text-white tracking-wide">My Profile</Text>
          <View className="flex-row items-center space-x-2">
            {userProfile?.role === 'admin' && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('AdminDashboard')} 
                className="bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-full flex-row items-center mr-1"
              >
                <Ionicons name="shield-checkmark-outline" size={14} color="#a78bfa" />
                <Text className="text-violet-400 font-bold text-[11px] ml-1.5">Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={handleEditProfile} 
              className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full flex-row items-center"
            >
              <Ionicons name="create-outline" size={14} color="#22d3ee" />
              <Text className="text-cyan-400 font-bold text-[11px] ml-1.5">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Profile Card */}
          <View className="mx-6 mt-4 rounded-3xl overflow-hidden border border-white/[0.06]">
            {/* Gradient Header Background */}
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.15)', 'rgba(99, 102, 241, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24, paddingBottom: 20 }}
            >
              <View className="flex-row items-center">
                {/* Avatar */}
                <View className="w-20 h-20 rounded-full items-center justify-center mr-4 border-2 border-cyan-400/30" 
                  style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)' }}>
                  <Text className="text-cyan-400 text-2xl font-black">{initials}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-white text-xl font-black mb-1">{fullName}</Text>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="mail-outline" size={13} color="#6b7280" />
                    <Text className="text-gray-400 text-xs ml-1.5" numberOfLines={1}>{user?.email}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={13} color="#6b7280" />
                    <Text className="text-gray-500 text-[11px] ml-1.5">Member since {memberSince}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* User Details Section */}
            <View className="px-5 pb-5">
              {/* Bio */}
              {user?.user_metadata?.bio ? (
                <View className="mb-4 bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.04]">
                  <Text className="text-gray-300 text-[13px] leading-5">{user.user_metadata.bio}</Text>
                </View>
              ) : null}

              {/* Info Grid */}
              <View className="flex-row flex-wrap">
                {user?.user_metadata?.phone_number && (
                  <View className="flex-row items-center mr-5 mb-3">
                    <View className="w-7 h-7 rounded-full bg-emerald-500/10 items-center justify-center mr-2">
                      <Ionicons name="call-outline" size={13} color="#34d399" />
                    </View>
                    <Text className="text-gray-300 text-xs">{user.user_metadata.phone_number}</Text>
                  </View>
                )}
                {user?.user_metadata?.age && (
                  <View className="flex-row items-center mr-5 mb-3">
                    <View className="w-7 h-7 rounded-full bg-violet-500/10 items-center justify-center mr-2">
                      <Ionicons name="person-outline" size={13} color="#a78bfa" />
                    </View>
                    <Text className="text-gray-300 text-xs">{user.user_metadata.age} years old</Text>
                  </View>
                )}
                {user?.user_metadata?.city && (
                  <View className="flex-row items-center mr-5 mb-3">
                    <View className="w-7 h-7 rounded-full bg-amber-500/10 items-center justify-center mr-2">
                      <Ionicons name="location-outline" size={13} color="#fbbf24" />
                    </View>
                    <Text className="text-gray-300 text-xs">{user.user_metadata.city}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row mx-6 mt-4 space-x-3">
            <View className="flex-1 bg-[#13131a] border border-white/[0.06] rounded-2xl p-4 items-center">
              <Text className="text-2xl font-black text-cyan-400">{stats.totalBids}</Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">Total Bids</Text>
            </View>
            <View className="flex-1 bg-[#13131a] border border-white/[0.06] rounded-2xl p-4 items-center">
              <Text className="text-2xl font-black text-violet-400">{myListings.length}</Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">My Items</Text>
            </View>
            <View className="flex-1 bg-[#13131a] border border-white/[0.06] rounded-2xl p-4 items-center">
              <Text className="text-2xl font-black text-emerald-400">{myWatchlist.length}</Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">Saved</Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View className="flex-row mx-6 mt-6 bg-[#0e0e14] rounded-2xl p-1.5 border border-white/[0.04]">
            {tabs.map((tab) => (
              <TouchableOpacity 
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                  activeTab === tab.key ? 'bg-cyan-500/15' : ''
                }`}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={14} 
                  color={activeTab === tab.key ? '#22d3ee' : '#6b7280'} 
                />
                <Text className={`text-[11px] font-bold ml-1.5 ${
                  activeTab === tab.key ? 'text-cyan-400' : 'text-gray-500'
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List Content */}
          <View className="px-6 mt-4">
            {loading ? (
              <ActivityIndicator color="#06b6d4" className="mt-10" />
            ) : getActiveData().length === 0 ? (
              <View className="mt-6 items-center bg-[#13131a] border border-white/[0.06] p-8 rounded-3xl">
                <View className="w-14 h-14 rounded-full bg-white/[0.04] items-center justify-center mb-4">
                  <Ionicons 
                    name={activeTab === 'saved' ? 'heart-outline' : activeTab === 'bids' ? 'pricetag-outline' : 'cube-outline'} 
                    size={24} 
                    color="#4b5563" 
                  />
                </View>
                <Text className="text-gray-500 font-semibold text-sm text-center mb-1">
                  {activeTab === 'bids' && 'No bids yet'}
                  {activeTab === 'saved' && 'Nothing saved yet'}
                  {activeTab === 'my_items' && 'No items listed yet'}
                </Text>
                <Text className="text-gray-600 text-xs text-center">
                  {activeTab === 'bids' && 'Start bidding on items you love!'}
                  {activeTab === 'saved' && 'Save items to keep track of them.'}
                  {activeTab === 'my_items' && 'List your first item for sale!'}
                </Text>
              </View>
            ) : (
              getActiveData().map((item, index) => (
                <View key={item.id ? item.id.toString() : index.toString()}>
                  {renderItem({ item, type: activeTab })}
                </View>
              ))
            )}
          </View>

          {/* Log Out Button */}
          <TouchableOpacity 
            onPress={handleLogOut} 
            className="mx-6 mt-8 flex-row items-center justify-center py-4 rounded-2xl border border-red-500/15 bg-red-500/[0.06]"
          >
            <Ionicons name="log-out-outline" size={18} color="#f87171" />
            <Text className="text-red-400 font-bold text-sm ml-2">Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}