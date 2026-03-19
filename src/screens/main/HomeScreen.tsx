import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, ScrollView, Modal, Animated, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';

const CATEGORIES = ['All Items', 'Ending Soon', 'High Value', 'Tech', 'Vehicles'];
const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { auctions, isLoading, fetchAuctions } = useAuctionStore();
  const { user, signOut } = useAuthStore();
  
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    fetchAuctions();
  }, []);

  const openCommandCenter = () => {
    setIsSidebarOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
  };

  const closeCommandCenter = () => {
    Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }).start(() => setIsSidebarOpen(false));
  };

  const handleNavigateDetail = (id: string) => {
    closeCommandCenter();
    navigation.navigate('AuctionDetail', { auctionId: id });
  };

  // --- FILTERING LOGIC ---
  const filteredAuctions = useMemo(() => {
    return auctions.filter((auction) => {
      if (activeCategory === 'All Items') return true;

      if (activeCategory === 'Ending Soon') {
        // Less than 24 hours left
        const hoursLeft = (new Date(auction.end_time).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        return hoursLeft > 0 && hoursLeft <= 24; 
      }

      if (activeCategory === 'High Value') {
        return Number(auction.current_price) >= 500;
      }

      // Keyword matching for Tech
      if (activeCategory === 'Tech') {
        const text = `${auction.title} ${auction.description}`.toLowerCase();
        return text.includes('tech') || text.includes('phone') || text.includes('laptop') || text.includes('pc') || text.includes('computer') || text.includes('watch') || text.includes('gaming');
      }

      // Keyword matching for Vehicles
      if (activeCategory === 'Vehicles') {
        const text = `${auction.title} ${auction.description}`.toLowerCase();
        return text.includes('car') || text.includes('vehicle') || text.includes('bike') || text.includes('motor') || text.includes('truck');
      }

      return true;
    });
  }, [auctions, activeCategory]);
  // -----------------------

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
                <Text className="text-2xl font-black text-cyan-400">
                  ${Number(item.current_price).toLocaleString()}
                </Text>
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
            <TouchableOpacity onPress={openCommandCenter} className="mr-4 p-2 -ml-2">
              <Text className="text-cyan-400 text-3xl font-light">≡</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-white tracking-wider">AUCTIONS</Text>
              <Text className="text-gray-500 text-xs tracking-widest uppercase mt-1">Live Market</Text>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-6 py-2">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                className={`mr-3 px-5 py-2 rounded-full border ${
                  activeCategory === cat ? 'bg-cyan-500/20 border-cyan-400/50' : 'bg-white/5 border-white/10'
                }`}
              >
                <Text className={`text-xs font-bold tracking-widest uppercase ${activeCategory === cat ? 'text-cyan-400' : 'text-gray-400'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading && auctions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#06b6d4" />
          </View>
        ) : (
          <FlatList
            data={filteredAuctions} // Uses the filtered array here!
            keyExtractor={(item) => item.id}
            renderItem={renderAuctionCard}
            contentContainerClassName="p-6 pt-2 pb-24"
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchAuctions}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20">
                <View className="w-16 h-16 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-4">
                  <Text className="text-gray-500 text-2xl">∅</Text>
                </View>
                <Text className="text-gray-500 text-sm tracking-widest uppercase font-bold text-center">
                  {activeCategory === 'All Items' ? 'No active auctions found.' : `No ${activeCategory} auctions found.`}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <TouchableOpacity 
        className="absolute bottom-20 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg bg-cyan-500/20 border border-cyan-400/50"
        onPress={() => navigation.navigate('CreateAuction')}
        activeOpacity={0.8}
      >
        <Text className="text-cyan-400 text-4xl font-light mb-1">+</Text>
      </TouchableOpacity>

      <Modal visible={isSidebarOpen} transparent animationType="fade" onRequestClose={closeCommandCenter}>
        <View className="flex-1 flex-row">
          
          <Animated.View 
            style={{ transform: [{ translateX: slideAnim }], width: width * 0.75 }} 
            className="h-full bg-[#050508] border-r border-cyan-500/30 shadow-2xl z-50 pt-16 px-6"
          >
            <View className="mb-10">
              <View className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 items-center justify-center mb-4">
                <Text className="text-cyan-400 text-xl font-black uppercase">{user?.email?.charAt(0) || 'U'}</Text>
              </View>
              <Text className="text-white text-lg font-black tracking-widest uppercase">My Account</Text>
              <Text className="text-gray-500 text-[10px] tracking-[2px] uppercase">{user?.email}</Text>
            </View>

            <View className="space-y-6 mb-10">
              <TouchableOpacity onPress={() => { closeCommandCenter(); navigation.navigate('Profile'); }}>
                <Text className="text-white text-sm font-bold tracking-widest uppercase">⎔ Profile & Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { closeCommandCenter(); navigation.navigate('Profile'); }}>
                <Text className="text-gray-400 text-sm font-bold tracking-widest uppercase">⎔ My Watchlist</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-auto">
              <Text className="text-cyan-400 text-[10px] font-black tracking-[2px] uppercase mb-3">App Status</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 text-xs font-bold">Connection</Text>
                <Text className="text-green-400 text-xs font-bold">ONLINE</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-xs font-bold">Version</Text>
                <Text className="text-white text-xs font-bold">1.0.0</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => { closeCommandCenter(); signOut(); }} 
              className="py-4 border-t border-white/10 mt-6"
            >
              <Text className="text-red-500 text-sm font-black tracking-widest uppercase">Log Out</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity activeOpacity={1} onPress={closeCommandCenter} className="flex-1 bg-black/70" />
        </View>
      </Modal>
    </View>
  );
}