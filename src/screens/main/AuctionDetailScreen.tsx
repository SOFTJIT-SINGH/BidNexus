import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image, Modal } from 'react-native';
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
  
  // NEW: Edit Mode State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  const { timeLeft, isEnded } = useAuctionTimer(auction?.end_time);
  const isOwner = user?.id === auction?.created_by; // Check if user is the seller

  useEffect(() => {
    fetchAuctionDetails();
    const channel = supabase.channel(`auction-${auctionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` }, 
      (payload) => setAuction(payload.new)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [auctionId]);

  const fetchAuctionDetails = async () => {
    try {
      const { data, error } = await supabase.from('auctions').select('*').eq('id', auctionId).single();
      if (error) throw error;
      setAuction(data);
      setEditDescription(data.description);
    } catch (error) {
      Alert.alert('Error', 'Could not load item.');
      navigation.goBack();
    } finally { setIsLoading(false); }
  };

  // --- NEW: OWNER CONTROLS ---
  const handleUpdateDescription = async () => {
    try {
      const { error } = await supabase.from('auctions').update({ description: editDescription }).eq('id', auctionId);
      if (error) throw error;
      setAuction({ ...auction, description: editDescription });
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Listing updated!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDeleteAuction = () => {
    Alert.alert("Delete Listing", "Are you sure you want to permanently delete this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await supabase.from('auctions').delete().eq('id', auctionId);
          navigation.goBack();
      }}
    ]);
  };
  // ---------------------------

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.current_price) return Alert.alert('Invalid Bid', 'Must be higher than current bid.');
    setIsBidding(true);
    try {
      const { error } = await supabase.rpc('place_bid', { p_auction_id: auctionId, p_user_id: user?.id, p_amount: amount });
      if (error) throw error;
      setBidAmount('');
    } catch (error: any) { Alert.alert('Bid Failed', error.message); } 
    finally { setIsBidding(false); }
  };

  if (isLoading || !auction) return <View className="flex-1 justify-center items-center bg-[#09090E]"><ActivityIndicator color="#06b6d4" /></View>;

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
      
      {auction.image_url && (
        <View className="absolute top-0 left-0 w-full h-96">
          <Image source={{ uri: auction.image_url }} className="w-full h-full opacity-40" resizeMode="cover" />
          <LinearGradient colors={['transparent', '#09090E']} className="absolute bottom-0 w-full h-48" />
        </View>
      )}

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : "height"} className="flex-1">
          
          <View className="px-6 py-4 flex-row items-center justify-between z-10">
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/10">
              <Ionicons name="chevron-back" size={24} color="#06b6d4" />
            </TouchableOpacity>
            {!isEnded && (
              <View className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
                <View className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                <Text className="text-red-500 text-xs font-bold tracking-widest uppercase">Live</Text>
              </View>
            )}
          </View>

          <ScrollView contentContainerClassName="p-6 pb-32 pt-32">
            
            <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#09090E]/80 p-6 mb-6 shadow-2xl">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-3xl font-black text-white flex-1">{auction.title}</Text>
                {/* Badge showing category */}
                <View className="bg-cyan-500/20 px-2 py-1 rounded border border-cyan-400/50">
                  <Text className="text-cyan-400 text-[10px] font-bold uppercase">{auction.category}</Text>
                </View>
              </View>
              
              <Text className="text-gray-400 text-sm mb-8 leading-relaxed">{auction.description}</Text>

              <View className="bg-black/60 p-5 rounded-2xl border border-white/5 flex-row justify-between items-center">
                <View>
                  <Text className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Current Bid</Text>
                  <Text className="text-3xl font-black text-cyan-400">${Number(auction.current_price).toLocaleString()}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Time Left</Text>
                  <Text className={`text-lg font-bold tracking-widest ${isEnded ? 'text-red-500' : 'text-white'}`}>{timeLeft}</Text>
                </View>
              </View>
            </View>

            {/* CONDITIONAL UI: Owner Panel vs Bidder Panel */}
            {isOwner ? (
               <View className="overflow-hidden rounded-3xl border border-purple-500/30 bg-purple-900/10 p-6">
                 <Text className="text-purple-400 font-black tracking-widest uppercase text-sm mb-4">Seller Controls</Text>
                 <Text className="text-gray-400 text-xs mb-4">You cannot bid on your own item. Manage your listing below.</Text>
                 
                 <TouchableOpacity onPress={() => setIsEditModalVisible(true)} className="bg-white/5 border border-white/10 py-4 rounded-xl items-center mb-3">
                   <Text className="text-white font-bold uppercase text-xs tracking-widest">Edit Description</Text>
                 </TouchableOpacity>
                 
                 <TouchableOpacity onPress={handleDeleteAuction} className="bg-red-500/20 border border-red-500/30 py-4 rounded-xl items-center">
                   <Text className="text-red-400 font-bold uppercase text-xs tracking-widest">Delete Listing</Text>
                 </TouchableOpacity>
               </View>
            ) : !isEnded ? (
              <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#09090E]/80 p-6">
                <Text className="text-sm font-bold text-white mb-4 tracking-widest uppercase">Place Your Bid</Text>
                <View className="flex-row items-center mb-6 bg-black/50 border border-white/10 rounded-2xl px-4 py-2">
                  <Text className="text-2xl font-black text-cyan-600 mr-2">₹</Text>
                  <TextInput className="flex-1 py-3 text-2xl font-black text-white" keyboardType="numeric" value={bidAmount} onChangeText={setBidAmount} editable={!isBidding} />
                </View>
                <TouchableOpacity className="w-full overflow-hidden rounded-xl" onPress={handlePlaceBid} disabled={isBidding || !bidAmount}>
                  <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                    {isBidding ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-black tracking-widest uppercase text-sm">Submit Bid</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* EDIT DESCRIPTION MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#12121a] p-6 rounded-t-3xl border-t border-white/10">
            <Text className="text-white font-black tracking-widest uppercase mb-4 text-lg">Edit Description</Text>
            <TextInput 
              className="bg-black/50 text-white p-4 rounded-xl border border-white/10 mb-6 h-32"
              multiline textAlignVertical="top"
              value={editDescription} onChangeText={setEditDescription}
            />
            <View className="flex-row space-x-4">
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className="flex-1 py-4 border border-white/10 rounded-xl items-center bg-white/5">
                <Text className="text-gray-400 font-bold uppercase tracking-widest">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateDescription} className="flex-1 py-4 bg-cyan-600 rounded-xl items-center">
                <Text className="text-white font-bold uppercase tracking-widest">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}