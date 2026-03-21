import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeCommandCenter = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
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
    Alert.alert('Terminate Session', 'Are you sure you want to securely log out of BidNexus?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          closeCommandCenter();
          signOut();
        },
      },
    ]);
  };
  // ------------------------------------------

  const filteredAuctions = useMemo(() => {
    return auctions.filter((auction) => {
      if (activeCategory === 'All Items') return true;
      if (activeCategory === 'Ending Soon') {
        const hoursLeft =
          (new Date(auction.end_time).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        return hoursLeft > 0 && hoursLeft <= 24;
      }
      if (activeCategory === 'High Value') {
        return Number(auction.current_price) >= 500;
      }
      if (activeCategory === 'Tech') {
        const text = `${auction.title} ${auction.description}`.toLowerCase();
        return (
          text.includes('tech') ||
          text.includes('phone') ||
          text.includes('laptop') ||
          text.includes('pc') ||
          text.includes('computer')
        );
      }
      if (activeCategory === 'Vehicles') {
        const text = `${auction.title} ${auction.description}`.toLowerCase();
        return (
          text.includes('car') ||
          text.includes('vehicle') ||
          text.includes('bike') ||
          text.includes('motor') ||
          text.includes('truck')
        );
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
        activeOpacity={0.8}>
        <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {item.image_url && (
            <View className="h-40 w-full border-b border-white/5 bg-black/60">
              <Image
                source={{ uri: item.image_url }}
                className="h-full w-full opacity-70"
                resizeMode="cover"
              />
            </View>
          )}

          <View className="p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                <Text className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                  Active
                </Text>
              </View>
              <Text className="text-[10px] font-bold uppercase tracking-[2px] text-gray-600">
                Item: {item.id.substring(0, 8)}
              </Text>
            </View>

            <Text className="mb-4 text-xl font-bold text-white">{item.title}</Text>

            <View className="flex-row items-end justify-between rounded-2xl border border-white/5 bg-black/40 p-4">
              <View>
                <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Current Bid
                </Text>
                <Text className="text-2xl font-black text-cyan-400">
                  ₹{Number(item.current_price).toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Ends In
                </Text>
                <Text className="font-medium text-gray-300">{timeLeft}</Text>
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
      <View className="absolute right-0 top-0 h-96 w-full rounded-b-full bg-[#1e3a8a] opacity-20" />

      <SafeAreaView className="flex-1">
        <View className="flex-row items-center border-b border-cyan-500/20 bg-cyan-900/20 px-6 py-2">
          <Text className="mr-3 text-[10px] font-black uppercase tracking-[3px] text-cyan-400">
            Update
          </Text>
          <Text className="text-xs tracking-wider text-cyan-100/70" numberOfLines={1}>
            Welcome to BidNexus. Live auctions are updating in real-time.
          </Text>
        </View>

        <View className="mt-2 flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={openCommandCenter} className="-ml-1 mr-4">
              <Ionicons name="menu" size={32} color="#22d3ee" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black tracking-wider text-white">AUCTIONS</Text>
              <Text className="mt-1 text-xs uppercase tracking-widest text-gray-500">
                Live Market
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`h-10 w-10 items-center justify-center rounded-full border transition-all ${
              showFilters ? 'border-cyan-400/50 bg-cyan-500/20' : 'border-white/10 bg-white/5'
            }`}>
            <Ionicons
              name="options-outline"
              size={20}
              color={showFilters ? '#22d3ee' : '#9ca3af'}
            />
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
                    backgroundColor:
                      activeCategory === cat
                        ? 'rgba(6, 182, 212, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                    borderColor:
                      activeCategory === cat
                        ? 'rgba(34, 211, 238, 0.5)'
                        : 'rgba(255, 255, 255, 0.1)',
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: activeCategory === cat ? '#22d3ee' : '#9ca3af',
                    }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {isLoading && auctions.length === 0 ? (
          <View className="flex-1 items-center justify-center">
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
              <View className="mt-20 flex-1 items-center justify-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Ionicons name="search" size={24} color="#6b7280" />
                </View>
                <Text className="text-center text-sm font-bold uppercase tracking-widest text-gray-500">
                  {activeCategory === 'All Items'
                    ? 'No active auctions found.'
                    : `No ${activeCategory} auctions found.`}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <Modal
        visible={isSidebarOpen}
        transparent
        animationType="none"
        onRequestClose={closeCommandCenter}>
        <View className="flex-1 flex-row">
          <Animated.View
            style={{ opacity: fadeAnim, position: 'absolute', width: '100%', height: '100%' }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={closeCommandCenter}
              className="flex-1 bg-black/80"
            />
          </Animated.View>

          <Animated.View
            style={{ transform: [{ translateX: slideAnim }], width: width * 0.75 }}
            className="z-50 h-full justify-between border-r border-cyan-500/30 bg-[#050508] px-6 pb-12 pt-16 shadow-2xl">
            <View>
              <View className="mb-10 flex-row items-center border-b border-white/10 pb-6">
                <View className="mr-4 h-14 w-14 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 shadow-lg shadow-cyan-500/20">
                  <Text className="text-2xl font-black uppercase text-cyan-400">
                    {user?.email?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black uppercase tracking-widest text-white">
                    Operator
                  </Text>
                  <Text
                    className="text-[10px] uppercase tracking-[1px] text-gray-400"
                    numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>

              <View className="mb-10 space-y-2">
                <TouchableOpacity
                  onPress={() => {
                    closeCommandCenter();
                    navigation.navigate('Profile');
                  }}
                  className="flex-row items-center rounded-xl border border-white/5 bg-white/5 px-2 py-4">
                  <Ionicons name="person-outline" size={20} color="#22d3ee" className="mr-4" />
                  <Text className="text-sm font-bold uppercase tracking-widest text-white">
                    Dashboard
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    closeCommandCenter();
                    navigation.navigate('Profile');
                  }}
                  className="flex-row items-center rounded-xl px-2 py-4">
                  <Ionicons name="bookmark-outline" size={20} color="#9ca3af" className="mr-4" />
                  <Text className="text-sm font-bold uppercase tracking-widest text-gray-400">
                    Watchlist
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    closeCommandCenter();
                    navigation.navigate('CreateAuction');
                  }}
                  className="flex-row items-center rounded-xl px-2 py-4">
                  <Ionicons name="add-circle-outline" size={20} color="#9ca3af" className="mr-4" />
                  <Text className="text-sm font-bold uppercase tracking-widest text-gray-400">
                    New Listing
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              {/* Wallet card  */}
              {/* <View className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg"> */}
                {/* <View className="flex-row justify-between items-center mb-4 border-b border-white/5 pb-3">
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
                </View> */}
                {/* <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Academic Demo Mode',
                      'Payment gateway integration is simulated for this project. Virtual bidding funds are automatically allocated to all operator accounts.'
                    )
                  }>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                    + Add Funds
                  </Text>
                </TouchableOpacity> */}
              {/* </View> */}

              {/* FIX: Wired the button to the new handleSignOutConfirm function */}
              <TouchableOpacity
                onPress={handleSignOutConfirm}
                className="flex-row items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 py-4">
                <Ionicons name="log-out-outline" size={20} color="#ef4444" className="mr-2" />
                <Text className="text-sm font-black uppercase tracking-widest text-red-500">
                  Terminate Session
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
