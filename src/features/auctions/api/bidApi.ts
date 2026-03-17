import { supabase } from '@/src/services/supabase/supabase';

export async function placeBid(
  auctionId: string,
  userId: string,
  amount: number
) {
  const { error } = await supabase.rpc('place_bid', {
    p_auction_id: auctionId,
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }
}