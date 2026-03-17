import { supabase } from '@/src/services/supabase/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToAuction(
  auctionId: string,
  onUpdate: (data: any) => void
): RealtimeChannel {
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
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromAuction(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}