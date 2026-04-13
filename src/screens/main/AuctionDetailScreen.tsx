import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/services/supabase/supabase';
import { useAuthStore } from '@/src/features/auth/store/useAuthStore';
import { useAuctionStore } from '@/src/features/auctions/store/useAuctionStore';
import { useAuctionTimer } from '@/src/features/auctions/hooks/useAuctionTimer';

const CATEGORIES = ['Tech', 'Vehicles', 'Fashion', 'Home', 'Other'];

export default function AuctionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { auctionId } = route.params;
  const { user } = useAuthStore();
  const { fetchAuctions } = useAuctionStore();

  const [auction, setAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBidding, setIsBidding] = useState(false);
  
  // Edit Mode State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStartingPrice, setEditStartingPrice] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Save/Bookmark State
  const [isSaved, setIsSaved] = useState(false);
  
  // Bid History State
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [showBidHistory, setShowBidHistory] = useState(false);

  const { timeLeft, isEnded } = useAuctionTimer(auction?.end_time);
  const isOwner = user?.id === auction?.created_by;
  const hasBids = auction && Number(auction.current_price) > Number(auction.starting_price);

  useEffect(() => {
    fetchAuctionDetails();
    checkIfSaved();
    fetchBidHistory();
    const channel = supabase.channel(`auction-${auctionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` }, 
      (payload) => {
        setAuction(payload.new);
        fetchBidHistory();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [auctionId]);

  const checkIfSaved = async () => {
    try {
      const { data } = await supabase.from('watchlist').select('*').eq('auction_id', auctionId).eq('user_id', user?.id).maybeSingle();
      setIsSaved(!!data);
    } catch (e) {
      console.log('Error checking saved status', e);
    }
  };

  const fetchBidHistory = async () => {
    try {
      const { data } = await supabase
        .from('bids')
        .select('amount, created_at, user_id')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setBidHistory(data);
    } catch (e) {
      console.log('Error fetching bid history', e);
    }
  };

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        await supabase.from('watchlist').delete().match({ auction_id: auctionId, user_id: user?.id });
        setIsSaved(false);
      } else {
        await supabase.from('watchlist').insert({ auction_id: auctionId, user_id: user?.id });
        setIsSaved(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update saved items.');
    }
  };

  const fetchAuctionDetails = async () => {
    try {
      const { data, error } = await supabase.from('auctions').select('*').eq('id', auctionId).single();
      if (error) throw error;
      setAuction(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load this item.');
      navigation.goBack();
    } finally { setIsLoading(false); }
  };

  // --- OWNER: Open Edit Modal with current values ---
  const openEditModal = () => {
    setEditTitle(auction.title || '');
    setEditDescription(auction.description || '');
    setEditCategory(auction.category || 'Other');
    setEditStartingPrice(String(auction.starting_price || auction.current_price || ''));
    setEditImageUri(null); // null means "keep current image"
    setIsEditModalVisible(true);
  };

  const handleEditImageSelection = () => {
    Alert.alert("Change Photo", "Choose a new photo for your item", [
      { text: "📷 Take a Photo", onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return Alert.alert("Permission Needed", "Please allow camera access.");
          const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!res.canceled) setEditImageUri(res.assets[0].uri);
      }},
      { text: "🖼️ Choose from Gallery", onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
          if (!res.canceled) setEditImageUri(res.assets[0].uri);
      }},
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleSaveEdits = async () => {
    if (!editTitle.trim()) {
      return Alert.alert('Missing Title', 'Your item needs a name.');
    }

    setIsUpdating(true);
    try {
      let newImageUrl = auction.image_url; // Keep existing by default

      // Upload new image if one was selected
      if (editImageUri) {
        const base64 = await FileSystem.readAsStringAsync(editImageUri, { encoding: FileSystem.EncodingType.Base64 });
        const fileName = `${user?.id}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('auction-images').upload(fileName, decode(base64), { contentType: 'image/jpeg' });
        if (uploadError) throw new Error('Failed to upload new image');
        newImageUrl = supabase.storage.from('auction-images').getPublicUrl(fileName).data.publicUrl;
      }

      // Build update object
      const updates: any = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        image_url: newImageUrl,
      };

      // Only allow price change if no bids have been placed yet
      if (!hasBids) {
        const newPrice = parseFloat(editStartingPrice);
        if (!isNaN(newPrice) && newPrice > 0) {
          updates.starting_price = newPrice;
          updates.current_price = newPrice;
        }
      }

      const { error } = await supabase.from('auctions').update(updates).eq('id', auctionId);
      if (error) throw error;

      setAuction({ ...auction, ...updates });
      setIsEditModalVisible(false);
      await fetchAuctions(); // Refresh the home list too
      Alert.alert('Updated! ✅', 'Your item has been updated.');
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteItem = () => {
    Alert.alert("Delete Item", "This will permanently remove your item and all its bids. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await supabase.from('auctions').delete().eq('id', auctionId);
          await fetchAuctions();
          navigation.goBack();
      }}
    ]);
  };

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.current_price) {
      return Alert.alert('Invalid Bid', `Your bid must be higher than ₹${Number(auction.current_price).toLocaleString()}.`);
    }
    setIsBidding(true);
    try {
      const { error } = await supabase.rpc('place_bid', { p_auction_id: auctionId, p_user_id: user?.id, p_amount: amount });
      if (error) throw error;
      setBidAmount('');
      Alert.alert('Bid Placed! 🎉', `You bid ₹${amount.toLocaleString()} on ${auction.title}.`);
    } catch (error: any) { Alert.alert('Bid Failed', error.message); } 
    finally { setIsBidding(false); }
  };

  // Quick bid amounts
  const suggestedBids = auction ? [
    Math.ceil((auction.current_price * 1.05) / 10) * 10,
    Math.ceil((auction.current_price * 1.10) / 10) * 10,
    Math.ceil((auction.current_price * 1.20) / 10) * 10,
  ] : [];

  if (isLoading || !auction) return <View className="flex-1 justify-center items-center bg-[#09090E]"><ActivityIndicator color="#06b6d4" /><Text className="text-gray-500 text-xs mt-3">Loading...</Text></View>;

  return (
    <View className="flex-1 bg-[#09090E]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
      
      {auction.image_url && (
        <View className="absolute top-0 left-0 w-full h-80">
          <Image source={{ uri: auction.image_url }} className="w-full h-full" resizeMode="cover" style={{ opacity: 0.5 }} />
          <LinearGradient colors={['transparent', '#09090E']} className="absolute bottom-0 w-full h-48" />
        </View>
      )}

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : "height"} className="flex-1">
          
          {/* Top Bar */}
          <View className="px-5 py-3 flex-row items-center justify-between z-10 w-full">
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-black/60 rounded-full items-center justify-center border border-white/10">
              <Ionicons name="chevron-back" size={22} color="#22d3ee" />
            </TouchableOpacity>
            <View className="flex-row items-center space-x-2">
              {!isEnded && (
                <View className="flex-row items-center bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                  <Text className="text-emerald-400 text-[11px] font-semibold">Live</Text>
                </View>
              )}
              <TouchableOpacity onPress={handleToggleSave} className="w-10 h-10 bg-black/60 rounded-full items-center justify-center border border-white/10">
                <Ionicons name={isSaved ? "heart" : "heart-outline"} size={18} color={isSaved ? "#f87171" : "#9ca3af"} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerClassName="p-5 pb-32 pt-24">
            
            {/* Main Info Card */}
            <View className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#13131a] p-6 mb-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-2xl font-black text-white flex-1 mr-3">{auction.title}</Text>
                {auction.category && (
                  <View className="bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-400/20">
                    <Text className="text-cyan-400 text-[10px] font-bold">{auction.category}</Text>
                  </View>
                )}
              </View>
              
              {auction.description ? (
                <Text className="text-gray-400 text-sm mb-6 leading-relaxed">{auction.description}</Text>
              ) : null}

              {/* Price & Timer */}
              <View className="bg-black/40 p-5 rounded-2xl border border-white/[0.04]">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Current Price</Text>
                    <Text className="text-3xl font-black text-cyan-400">₹{Number(auction.current_price).toLocaleString()}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Time Left</Text>
                    <Text className={`text-base font-bold ${isEnded ? 'text-red-400' : 'text-white'}`}>{timeLeft}</Text>
                  </View>
                </View>
                {auction.starting_price && (
                  <View className="mt-3 pt-3 border-t border-white/[0.04] flex-row items-center">
                    <Text className="text-gray-600 text-[11px]">Started at ₹{Number(auction.starting_price).toLocaleString()}</Text>
                    {hasBids && (
                      <View className="ml-2 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <Text className="text-emerald-400 text-[10px] font-bold">
                          +{Math.round(((auction.current_price - auction.starting_price) / auction.starting_price) * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Bid History */}
            {bidHistory.length > 0 && (
              <TouchableOpacity 
                onPress={() => setShowBidHistory(!showBidHistory)}
                className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13131a] mb-4"
              >
                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-violet-500/10 items-center justify-center mr-3">
                      <Ionicons name="stats-chart-outline" size={14} color="#a78bfa" />
                    </View>
                    <Text className="text-white font-bold text-sm">Bid History</Text>
                    <View className="bg-white/[0.06] px-2 py-0.5 rounded-full ml-2">
                      <Text className="text-gray-400 text-[10px] font-bold">{bidHistory.length}</Text>
                    </View>
                  </View>
                  <Ionicons name={showBidHistory ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
                </View>
                
                {showBidHistory && (
                  <View className="px-4 pb-4">
                    {bidHistory.map((bid, index) => (
                      <View key={index} className="flex-row items-center justify-between py-2.5 border-t border-white/[0.03]">
                        <View className="flex-row items-center">
                          <View className={`w-6 h-6 rounded-full items-center justify-center mr-2.5 ${index === 0 ? 'bg-cyan-500/15' : 'bg-white/[0.04]'}`}>
                            <Text className={`text-[10px] font-black ${index === 0 ? 'text-cyan-400' : 'text-gray-500'}`}>
                              {index + 1}
                            </Text>
                          </View>
                          <Text className={`text-sm font-bold ${index === 0 ? 'text-cyan-400' : 'text-gray-300'}`}>
                            ₹{Number(bid.amount).toLocaleString()}
                          </Text>
                          {bid.user_id === user?.id && (
                            <View className="bg-cyan-500/10 px-2 py-0.5 rounded ml-2">
                              <Text className="text-cyan-400 text-[9px] font-bold">You</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 text-[11px]">
                          {new Date(bid.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Owner Panel or Bid Panel */}
            {isOwner ? (
               <View className="overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-900/[0.08] p-5">
                 <View className="flex-row items-center mb-3">
                   <View className="w-8 h-8 rounded-full bg-violet-500/15 items-center justify-center mr-3">
                     <Ionicons name="settings-outline" size={14} color="#a78bfa" />
                   </View>
                   <View className="flex-1">
                     <Text className="text-violet-400 font-bold text-sm">Your Item</Text>
                     <Text className="text-gray-500 text-[11px]">You can edit all details of your listing</Text>
                   </View>
                 </View>
                 
                 <TouchableOpacity 
                   onPress={openEditModal} 
                   className="bg-violet-500/10 border border-violet-500/20 py-3.5 rounded-xl items-center mb-2.5 flex-row justify-center"
                   activeOpacity={0.7}
                 >
                   <Ionicons name="create-outline" size={16} color="#a78bfa" />
                   <Text className="text-violet-300 font-semibold text-sm ml-2">Edit Item Details</Text>
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
                   onPress={handleDeleteItem} 
                   className="bg-red-500/[0.08] border border-red-500/15 py-3.5 rounded-xl items-center flex-row justify-center"
                   activeOpacity={0.7}
                 >
                   <Ionicons name="trash-outline" size={16} color="#f87171" />
                   <Text className="text-red-400 font-semibold text-sm ml-2">Delete Item</Text>
                 </TouchableOpacity>
               </View>
            ) : !isEnded ? (
              <View className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#13131a] p-5">
                <Text className="text-white font-bold text-sm mb-4">Place Your Bid</Text>
                
                {/* Quick Bid Options */}
                <View className="flex-row mb-4 space-x-2">
                  {suggestedBids.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => setBidAmount(String(amount))}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        bidAmount === String(amount) 
                          ? 'bg-cyan-500/15 border-cyan-400/30' 
                          : 'bg-white/[0.03] border-white/[0.06]'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${bidAmount === String(amount) ? 'text-cyan-400' : 'text-gray-400'}`}>
                        ₹{amount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="flex-row items-center mb-4 bg-black/40 border border-white/[0.06] rounded-xl px-4 py-1">
                  <Text className="text-xl font-black text-cyan-600 mr-2">₹</Text>
                  <TextInput 
                    className="flex-1 py-3 text-xl font-black text-white" 
                    keyboardType="numeric" 
                    value={bidAmount} 
                    onChangeText={setBidAmount} 
                    editable={!isBidding}
                    placeholder="Enter amount"
                    placeholderTextColor="#3f3f46"
                  />
                </View>
                
                <TouchableOpacity className="w-full overflow-hidden rounded-xl" onPress={handlePlaceBid} disabled={isBidding || !bidAmount}>
                  <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center flex-row justify-center">
                    {isBidding ? <ActivityIndicator color="#ffffff" /> : (
                      <>
                        <Ionicons name="flash" size={18} color="white" />
                        <Text className="text-white font-black text-sm ml-2">Place Bid</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="overflow-hidden rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-5 items-center">
                <View className="w-12 h-12 rounded-full bg-red-500/10 items-center justify-center mb-3">
                  <Ionicons name="time-outline" size={24} color="#f87171" />
                </View>
                <Text className="text-red-400 font-bold text-sm mb-1">This Auction Has Ended</Text>
                <Text className="text-gray-500 text-xs text-center">Bidding is no longer available for this item.</Text>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* FULL EDIT MODAL */}
      <Modal visible={isEditModalVisible} transparent={false} animationType="slide">
        <View className="flex-1 bg-[#09090E]">
          <SafeAreaView className="flex-1">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
              
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className="flex-row items-center">
                  <Ionicons name="close" size={22} color="#9ca3af" />
                  <Text className="text-gray-400 font-semibold text-sm ml-1">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-white font-bold text-base">Edit Item</Text>
                <TouchableOpacity 
                  onPress={handleSaveEdits} 
                  disabled={isUpdating}
                  className="bg-cyan-500/15 border border-cyan-500/20 px-4 py-2 rounded-full"
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#22d3ee" size="small" />
                  ) : (
                    <Text className="text-cyan-400 font-bold text-[12px]">Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                {/* Image Section */}
                <TouchableOpacity 
                  onPress={handleEditImageSelection} 
                  className="w-full h-48 rounded-2xl overflow-hidden mb-6 border border-white/[0.06]"
                  activeOpacity={0.7}
                >
                  {(editImageUri || auction.image_url) ? (
                    <View className="w-full h-full">
                      <Image 
                        source={{ uri: editImageUri || auction.image_url }} 
                        style={{ width: '100%', height: '100%' }} 
                        resizeMode="cover" 
                      />
                      <View className="absolute inset-0 bg-black/30 items-center justify-center">
                        <View className="bg-black/60 px-4 py-2 rounded-full flex-row items-center border border-white/20">
                          <Ionicons name="camera-outline" size={16} color="white" />
                          <Text className="text-white text-xs font-semibold ml-1.5">Change Photo</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="w-full h-full bg-white/[0.02] items-center justify-center">
                      <Ionicons name="camera-outline" size={32} color="#6b7280" />
                      <Text className="text-gray-500 text-xs mt-2">Add a Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Title */}
                <View className="mb-5">
                  <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Item Name</Text>
                  <TextInput 
                    className="w-full bg-[#13131a] border border-white/[0.06] px-4 py-3.5 rounded-xl text-white text-[15px]"
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="What are you selling?"
                    placeholderTextColor="#3f3f46"
                  />
                </View>

                {/* Category */}
                <View className="mb-5">
                  <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity 
                        key={cat} 
                        onPress={() => setEditCategory(cat)} 
                        className={`mr-2 px-4 py-2.5 rounded-xl border ${
                          editCategory === cat 
                            ? 'bg-cyan-500/12 border-cyan-400/25' 
                            : 'bg-[#13131a] border-white/[0.06]'
                        }`}
                      >
                        <Text className={`text-xs font-semibold ${editCategory === cat ? 'text-cyan-400' : 'text-gray-500'}`}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Description */}
                <View className="mb-5">
                  <Text className="text-gray-400 text-xs font-semibold mb-2 ml-1">Description</Text>
                  <TextInput 
                    className="w-full bg-[#13131a] border border-white/[0.06] px-4 py-3.5 rounded-xl text-white text-sm min-h-[120px]"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Describe the item, condition, etc."
                    placeholderTextColor="#3f3f46"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Starting Price */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-2 ml-1">
                    <Text className="text-gray-400 text-xs font-semibold">Starting Price</Text>
                    {hasBids && (
                      <View className="bg-amber-500/10 px-2 py-0.5 rounded ml-2">
                        <Text className="text-amber-400 text-[9px] font-bold">Locked — Bids exist</Text>
                      </View>
                    )}
                  </View>
                  <View className={`flex-row items-center bg-[#13131a] border border-white/[0.06] rounded-xl px-4 ${hasBids ? 'opacity-40' : ''}`}>
                    <Text className="text-cyan-500 font-bold text-lg mr-1">₹</Text>
                    <TextInput 
                      className="flex-1 py-3.5 text-cyan-400 font-bold text-[15px]"
                      value={editStartingPrice}
                      onChangeText={setEditStartingPrice}
                      keyboardType="numeric"
                      editable={!hasBids}
                      placeholder="0"
                      placeholderTextColor="#3f3f46"
                    />
                  </View>
                  {hasBids && (
                    <Text className="text-gray-600 text-[11px] mt-1.5 ml-1">
                      Price can't be changed after someone places a bid.
                    </Text>
                  )}
                </View>

                {/* Save Button (Bottom) */}
                <TouchableOpacity 
                  className="w-full rounded-xl overflow-hidden" 
                  onPress={handleSaveEdits} 
                  disabled={isUpdating}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#06b6d4', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center flex-row justify-center">
                    {isUpdating ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                        <Text className="text-white font-black text-sm ml-2">Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>

    </View>
  );
}