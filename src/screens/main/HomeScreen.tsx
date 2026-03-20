import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, Modal, Animated, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';

const CATEGORIES = ['All Items', 'Ending Soon', 'High Value', 'Tech', 'Vehicles'];
const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { auctions, isLoading, fetchAuctions } = useAuctionStore();
  const { user, signOut } = useAuthStore();
  
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true); 
  
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAuctions();
  }, []);

  const openCommandCenter = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const closeCommandCenter = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  const handleNavigateDetail = (id: string) => {
    closeCommandCenter();
    navigation.navigate('AuctionDetail', { auctionId: id });
  };

  // --- NEW: Sign Out Confirmation Warning ---
  const handleSignOutConfirm = () => {
    Alert.alert(
      "Terminate Session",
      "Are you sure you want to securely log out of BidNexus?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: () => {
            closeCommandCenter();
            signOut();
          } 
        }
      ]
    );
  };
  // ------------------------------------------

  const filteredAuctions = useMemo(() => {
    return auctions.filter((auction) => {
      if (activeCategory === 'All Items') return true;
      if (activeCategory === 'Ending Soon') {
        const hoursLeft = (new Date(auction.end_time).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        return hoursLeft > 0 && hoursLeft <= 24; 
      }
      if (activeCategory === 'High Value') {
        return Number(auction.current_price) >= 500;
      }
      if (activeCategory === 'Tech') {
        const text = `${auction.title} ${auction.description}`.toLowerCase();
        return text.includes('tech') || text.includes('phone') || text.includes('laptop') || text.includes('pc') || text.includes('computer');
      }
      if (activeCategory === 'Vehicles') {
        const text = `${auction.title} ${auction.description}`.toLowerCase();
        return text.includes('car') || text.includes('vehicle') || text.includes('bike') || text.includes('motor') || text.includes('truck');
      }
      return true;
    });
  }, [auctions, activeCategory]);

  const renderAuctionCard = ({ item }: { item: any }) => {
    const timeLeft = new Date(item.end_time).toLocaleDateString();

    return (
      <TouchableOpacity 
        className="mb-6 shadow-2xl shadow-black/50"
        onPress={() => handleNavigateDetail(item.id)}
        activeOpacity={0.8}
      >
        <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {item.image_url && (
            <View className="w-full h-40 bg-black/60 border-b border-white/5">
              <Image source={{ uri: item.image_url }} className="w-full h-full opacity-70" resizeMode="cover" />
            </View>
          )}

          <View className="p-5">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-sm shadow-cyan-400 animate-pulse" />
                <Text className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Active</Text>
              </View>
              <Text className="text-gray-600 text-[10px] tracking-[2px] uppercase font-bold">Item: {item.id.substring(0, 8)}</Text>
            </View>

            <Text className="text-xl font-bold text-white mb-4">{item.title}</Text>
            
            <View className="flex-row justify-between items-end bg-black/40 p-4 rounded-2xl border border-white/5">
              <View>
                <Text className="text-gray-500 text-xs uppercase tracking-widest mb-1 font-bold">Current Bid</Text>
                <Text className="text-2xl font-black text-cyan-400">₹{Number(item.current_price).toLocaleString()}</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-500 text-xs uppercase tracking-widest mb-1 font-bold">Ends In</Text>
                <Text className="text-gray-300 font-medium">{timeLeft}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" backgroundColor="#09090E" />
      <View className="absolute top-0 right-0 w-full h-96 bg-[#1e3a8a] opacity-20 rounded-b-full" />

      <SafeAreaView className="flex-1">
        
        <View className="bg-cyan-900/20 border-b border-cyan-500/20 py-2 px-6 flex-row items-center">
          <Text className="text-cyan-400 text-[10px] font-black tracking-[3px] uppercase mr-3">Update</Text>
          <Text className="text-cyan-100/70 text-xs tracking-wider" numberOfLines={1}>
            Welcome to BidNexus. Live auctions are updating in real-time.
          </Text>
        </View>

        <View className="px-6 py-4 flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={openCommandCenter} className="mr-4 -ml-1">
              <Ionicons name="menu" size={32} color="#22d3ee" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-white tracking-wider">AUCTIONS</Text>
              <Text className="text-gray-500 text-xs tracking-widest uppercase mt-1">Live Market</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-full items-center justify-center border transition-all ${
              showFilters ? 'bg-cyan-500/20 border-cyan-400/50' : 'bg-white/5 border-white/10'
            }`}
          >
            <Ionicons name="options-outline" size={20} color={showFilters ? "#22d3ee" : "#9ca3af"} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={{ height: 50, marginBottom: 16 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center' }}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  onPress={() => setActiveCategory(cat)}
                  style={{
                    marginRight: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    backgroundColor: activeCategory === cat ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: activeCategory === cat ? 'rgba(34, 211, 238, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: activeCategory === cat ? '#22d3ee' : '#9ca3af'
                  }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {isLoading && auctions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#06b6d4" />
          </View>
        ) : (
          <FlatList
            data={filteredAuctions} 
            keyExtractor={(item) => item.id}
            renderItem={renderAuctionCard}
            contentContainerClassName="p-6 pt-0 pb-24"
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchAuctions}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20">
                <View className="w-16 h-16 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-4">
                  <Ionicons name="search" size={24} color="#6b7280" />
                </View>
                <Text className="text-gray-500 text-sm tracking-widest uppercase font-bold text-center">
                  {activeCategory === 'All Items' ? 'No active auctions found.' : `No ${activeCategory} auctions found.`}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <Modal visible={isSidebarOpen} transparent animationType="none" onRequestClose={closeCommandCenter}>
        <View className="flex-1 flex-row">
          
          <Animated.View style={{ opacity: fadeAnim, position: 'absolute', width: '100%', height: '100%' }}>
            <TouchableOpacity activeOpacity={1} onPress={closeCommandCenter} className="flex-1 bg-black/80" />
          </Animated.View>

          <Animated.View 
            style={{ transform: [{ translateX: slideAnim }], width: width * 0.75 }} 
            className="h-full bg-[#050508] border-r border-cyan-500/30 shadow-2xl z-50 pt-16 px-6 justify-between pb-12"
          >
            <View>
              <View className="mb-10 flex-row items-center border-b border-white/10 pb-6">
                <View className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/50 items-center justify-center mr-4 shadow-lg shadow-cyan-500/20">
                  <Text className="text-cyan-400 text-2xl font-black uppercase">{user?.email?.charAt(0) || 'U'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-black tracking-widest uppercase">Operator</Text>
                  <Text className="text-gray-400 text-[10px] tracking-[1px] uppercase" numberOfLines={1}>{user?.email}</Text>
                </View>
              </View>

              <View className="space-y-2 mb-10">
                <TouchableOpacity 
                  onPress={() => { closeCommandCenter(); navigation.navigate('Profile'); }}
                  className="flex-row items-center py-4 px-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <Ionicons name="person-outline" size={20} color="#22d3ee" className="mr-4" />
                  <Text className="text-white text-sm font-bold tracking-widest uppercase">Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => { closeCommandCenter(); navigation.navigate('Profile'); }}
                  className="flex-row items-center py-4 px-2 rounded-xl"
                >
                  <Ionicons name="bookmark-outline" size={20} color="#9ca3af" className="mr-4" />
                  <Text className="text-gray-400 text-sm font-bold tracking-widest uppercase">Watchlist</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => { closeCommandCenter(); navigation.navigate('CreateAuction'); }}
                  className="flex-row items-center py-4 px-2 rounded-xl"
                >
                  <Ionicons name="add-circle-outline" size={20} color="#9ca3af" className="mr-4" />
                  <Text className="text-gray-400 text-sm font-bold tracking-widest uppercase">New Listing</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
             <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 shadow-lg">
                <View className="flex-row justify-between items-center mb-4 border-b border-white/5 pb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="wallet-outline" size={16} color="#22d3ee" className="mr-2" />
                    <Text className="text-cyan-400 text-[10px] font-black tracking-[2px] uppercase">My Wallet</Text>
                  </View>
                  <TouchableOpacity>
                    <Text className="text-cyan-500 text-[10px] font-bold uppercase tracking-wider">+ Add Funds</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="mb-4">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Available Balance</Text>
                  <Text className="text-3xl font-black text-white tracking-wide">₹24,500</Text>
                </View>
                
                <View className="flex-row justify-between pt-3 border-t border-white/5">
                  <Text className="text-gray-400 text-xs font-bold tracking-wider">Active Bids</Text>
                  <View className="bg-cyan-500/20 px-2 py-1 rounded-md border border-cyan-500/30">
                    <Text className="text-cyan-400 text-[10px] font-black">3 ITEMS</Text>
                  </View>
                </View>
              </View>

              {/* FIX: Wired the button to the new handleSignOutConfirm function */}
              <TouchableOpacity 
                onPress={handleSignOutConfirm} 
                className="flex-row items-center justify-center py-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" className="mr-2" />
                <Text className="text-red-500 text-sm font-black tracking-widest uppercase">Terminate Session</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}