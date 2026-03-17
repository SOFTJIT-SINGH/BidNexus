import { supabase } from '@/src/services/supabase/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuctionStore } from './store/useAuctionStore';

export function subscribeToAuction(auctionId: string): RealtimeChannel {
  const channel = supabase
    .channel(`auction-${auctionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auctionId}`,
      },
      (payload) => {
        // Automatically update global state when a bid hits the database
        useAuctionStore.getState().updateAuctionInStore(payload.new as any);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromAuction(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}