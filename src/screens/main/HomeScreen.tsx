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

const CATEGORIES = ['All', 'Ending Soon', 'High Value', 'Tech', 'Vehicles'];
const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { auctions, isLoading, fetchAuctions } = useAuctionStore();
  const { user, signOut } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAuctions();
  }, []);

  const openMenu = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  const handleNavigateDetail = (id: string) => {
    closeMenu();
    navigation.navigate('AuctionDetail', { auctionId: id });
  };

  const handleLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          closeMenu();
          signOut();
        },
      },
    ]);
  };

  const filteredAuctions = useMemo(() => {
    return auctions.filter((auction) => {
      if (activeCategory === 'All') return true;
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

  const getTimeRemaining = (endTime: string) => {
    const diff = new Date(endTime).getTime() - new Date().getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}d ${hours}h left`;
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    return `${hours}h ${minutes}m left`;
  };

  const renderAuctionCard = ({ item }: { item: any }) => {
    const timeRemaining = getTimeRemaining(item.end_time);
    const isEnded = timeRemaining === 'Ended';
    const isEndingSoon = !isEnded && (new Date(item.end_time).getTime() - new Date().getTime()) / (1000 * 60 * 60) <= 24;

    // Extract unique bidder names
    const bidderNames = item.bids 
      ? Array.from(new Set(item.bids.map((b: any) => b.profiles?.first_name).filter(Boolean)))
      : [];
    const biddersText = bidderNames.length > 0
      ? `Bids by: ${bidderNames.slice(0, 3).join(', ')}${bidderNames.length > 3 ? '...' : ''}`
      : 'No bids yet';

    return (
      <TouchableOpacity
        className="mb-4"
        onPress={() => handleNavigateDetail(item.id)}
        activeOpacity={0.8}>
        <View className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13131a]">
          {item.image_url && (
            <View className="h-44 w-full bg-black/40">
              <Image
                source={{ uri: item.image_url }}
                className="h-full w-full"
                resizeMode="cover"
                style={{ opacity: 0.85 }}
              />
              {/* Time badge on image */}
              <View className="absolute top-3 right-3 flex-row items-center bg-black/70 px-3 py-1.5 rounded-full border border-white/10">
                <Ionicons name="time-outline" size={12} color={isEndingSoon ? '#f87171' : '#9ca3af'} />
                <Text className={`text-[11px] font-bold ml-1.5 ${isEndingSoon ? 'text-red-400' : 'text-gray-300'}`}>
                  {timeRemaining}
                </Text>
              </View>
            </View>
          )}

          <View className="p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`mr-2 h-1.5 w-1.5 rounded-full ${isEnded ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <Text className={`text-[11px] font-semibold ${isEnded ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isEnded ? 'Ended' : 'Live'}
                </Text>
              </View>
              {item.category && (
                <View className="bg-white/[0.06] px-2.5 py-1 rounded-full">
                  <Text className="text-[10px] font-bold text-gray-400">{item.category}</Text>
                </View>
              )}
            </View>

            <Text className="mb-1 text-lg font-bold text-white">{item.title}</Text>
            
            {/* Added Seller Profile Display */}
            <View className="flex-row items-center mb-3">
               <Ionicons name="person-circle-outline" size={14} color="#6b7280" />
               <Text className="text-gray-500 text-xs ml-1">
                 Listed by {item.seller && item.seller.first_name ? item.seller.first_name : 'Anonymous'}
               </Text>
            </View>

            {!item.image_url && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="time-outline" size={12} color={isEndingSoon ? '#f87171' : '#6b7280'} />
                <Text className={`text-[11px] ml-1.5 ${isEndingSoon ? 'text-red-400' : 'text-gray-500'}`}>
                  {timeRemaining}
                </Text>
              </View>
            )}

            <View className="flex-row items-center mb-3 space-x-1 border-b border-white/[0.04] pb-3">
              <Ionicons name="people-outline" size={14} color="#9ca3af" />
              <Text className="text-[11px] text-gray-400 font-medium ml-1">
                {biddersText}
              </Text>
            </View>

            <View className="flex-row items-end justify-between rounded-xl border border-white/[0.04] bg-black/30 p-3.5">
              <View>
                <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Current Price
                </Text>
                <Text className="text-xl font-black text-cyan-400">
                  ₹{Number(item.current_price).toLocaleString()}
                </Text>
              </View>
              <View className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 rounded-xl">
                <Text className="text-cyan-400 text-[11px] font-bold">Place Bid →</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const firstName = user?.user_metadata?.first_name || 'there';

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" backgroundColor="#09090E" />

      <SafeAreaView className="flex-1">
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={openMenu} className="mr-3">
              <View className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.06] items-center justify-center">
                <Ionicons name="menu" size={22} color="#22d3ee" />
              </View>
            </TouchableOpacity>
            <View>
              <Text className="text-[13px] text-gray-400">Hi, {firstName} 👋</Text>
              <Text className="text-lg font-black text-white">Explore Auctions</Text>
            </View>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              className="h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04]">
              <Ionicons name="notifications-outline" size={18} color="#9ca3af" />
              {/* Optional: Add a tiny red dot absolute positioned here for indicator */}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className={`h-10 w-10 items-center justify-center rounded-full border ${
                showFilters ? 'border-cyan-400/30 bg-cyan-500/10' : 'border-white/[0.06] bg-white/[0.04]'
              }`}>
              <Ionicons
                name="options-outline"
                size={18}
                color={showFilters ? '#22d3ee' : '#9ca3af'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filters */}
        {showFilters && (
          <View style={{ height: 48, marginBottom: 8 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 20, alignItems: 'center' }}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  onPress={() => setActiveCategory(cat)}
                  style={{
                    marginRight: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    backgroundColor:
                      activeCategory === cat
                        ? 'rgba(6, 182, 212, 0.12)'
                        : 'rgba(255, 255, 255, 0.03)',
                    borderColor:
                      activeCategory === cat
                        ? 'rgba(34, 211, 238, 0.3)'
                        : 'rgba(255, 255, 255, 0.06)',
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: activeCategory === cat ? '#22d3ee' : '#9ca3af',
                    }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Auction List */}
        {isLoading && auctions.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text className="text-gray-500 text-xs mt-3">Loading auctions...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAuctions}
            keyExtractor={(item) => item.id}
            renderItem={renderAuctionCard}
            contentContainerClassName="px-5 pb-24"
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchAuctions}
            ListEmptyComponent={
              <View className="mt-20 flex-1 items-center justify-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06]">
                  <Ionicons name="search" size={24} color="#6b7280" />
                </View>
                <Text className="text-gray-400 text-sm font-semibold text-center mb-1">
                  No items found
                </Text>
                <Text className="text-gray-600 text-xs text-center">
                  {activeCategory === 'All'
                    ? 'There are no auctions right now. Pull down to refresh.'
                    : `No "${activeCategory}" items available.`}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Side Menu */}
      <Modal
        visible={isSidebarOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}>
        <View className="flex-1 flex-row">
          <Animated.View
            style={{ opacity: fadeAnim, position: 'absolute', width: '100%', height: '100%' }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={closeMenu}
              className="flex-1 bg-black/80"
            />
          </Animated.View>

          <Animated.View
            style={{ transform: [{ translateX: slideAnim }], width: width * 0.78 }}
            className="z-50 h-full justify-between border-r border-white/[0.06] bg-[#0a0a10] px-6 pb-12 pt-16">
            <View>
              {/* User Section */}
              <View className="mb-8 pb-6 border-b border-white/[0.06]">
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-400/20 items-center justify-center mr-4">
                    <Text className="text-cyan-400 text-xl font-black">
                      {user?.user_metadata?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold">
                      {user?.user_metadata?.first_name || 'User'}
                    </Text>
                    <Text className="text-gray-500 text-[11px]" numberOfLines={1}>
                      {user?.email}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Menu Items */}
              <View className="space-y-1">
                {[
                  { icon: 'home-outline', label: 'Home', onPress: () => { closeMenu(); } },
                  { icon: 'person-outline', label: 'My Profile', onPress: () => { closeMenu(); navigation.navigate('Profile'); } },
                  { icon: 'heart-outline', label: 'Saved Items', onPress: () => { closeMenu(); navigation.navigate('Profile'); } },
                  { icon: 'add-circle-outline', label: 'Sell Something', onPress: () => { closeMenu(); navigation.navigate('CreateAuction'); } },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.onPress}
                    className="flex-row items-center rounded-xl px-3 py-4"
                    activeOpacity={0.6}
                  >
                    <View className="w-9 h-9 rounded-full bg-white/[0.04] items-center justify-center mr-3">
                      <Ionicons name={item.icon as any} size={18} color="#9ca3af" />
                    </View>
                    <Text className="text-gray-300 text-sm font-semibold">{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bottom Actions */}
            <View>
              <TouchableOpacity
                onPress={handleLogOut}
                className="flex-row items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.06] py-4"
                activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={18} color="#f87171" />
                <Text className="text-red-400 font-bold text-sm ml-2">Log Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
