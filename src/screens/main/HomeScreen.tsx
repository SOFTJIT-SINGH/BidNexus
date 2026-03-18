import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { auctions, isLoading, fetchAuctions } = useAuctionStore();
  const { signOut } = useAuthStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const renderAuctionCard = ({ item }: { item: any }) => {
    const timeLeft = new Date(item.end_time).toLocaleDateString();

    return (
      <TouchableOpacity 
        className="mb-5 shadow-2xl shadow-black/50"
        onPress={() => navigation.navigate('AuctionDetail', { auctionId: item.id })}
        activeOpacity={0.8}
      >
        <BlurView 
          intensity={20} 
          tint="dark" 
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5"
        >
          {/* Live Indicator */}
          <View className="flex-row items-center mb-3">
            <View className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-lg shadow-cyan-400" />
            <Text className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Live</Text>
          </View>

          <Text className="text-xl font-bold text-white mb-4">{item.title}</Text>
          
          <View className="flex-row justify-between items-end bg-black/30 p-4 rounded-2xl border border-white/5">
            <View>
              <Text className="text-gray-500 text-xs uppercase tracking-widest mb-1 font-bold">Current Bid</Text>
              <Text className="text-2xl font-black text-cyan-400">
                ${item.current_price.toLocaleString()}
              </Text>
            </View>
            
            <View className="items-end">
              <Text className="text-gray-500 text-xs uppercase tracking-widest mb-1 font-bold">Ends</Text>
              <Text className="text-gray-300 font-medium">{timeLeft}</Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" />
      {/* Background glow */}
      <View className="absolute top-0 right-0 w-full h-96 bg-blue-900/10 blur-[120px]" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-black text-white tracking-wider">MARKET</Text>
            <Text className="text-gray-500 text-xs tracking-widest uppercase mt-1">Global Feed</Text>
          </View>
          <TouchableOpacity 
            onPress={signOut} 
            className="bg-white/10 border border-white/10 px-4 py-2 rounded-full"
          >
            <Text className="text-gray-300 font-bold text-xs uppercase tracking-wider">Disconnect</Text>
          </TouchableOpacity>
        </View>

        {/* Feed */}
        {isLoading && auctions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#06b6d4" />
          </View>
        ) : (
          <FlatList
            data={auctions}
            keyExtractor={(item) => item.id}
            renderItem={renderAuctionCard}
            contentContainerClassName="p-6 pb-24"
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchAuctions}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20">
                <Text className="text-gray-500 text-lg">No active signals found.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Futuristic Floating Action Button */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-cyan-500/50"
        onPress={() => navigation.navigate('CreateAuction')} 
        activeOpacity={0.8}
      >
        <BlurView intensity={50} tint="dark" className="absolute w-full h-full rounded-full border border-cyan-400/50" />
        <Text className="text-cyan-400 text-4xl font-light mb-1">+</Text>
      </TouchableOpacity>
    </View>
  );
}