import { supabase } from '@/src/services/supabase/supabase';

export async function getAuctions() {
  const { data, error } = await supabase
    .from('auctions')
    .select('*, seller:profiles(first_name, last_name), bids( amount, profiles(first_name, last_name) )')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAuctionById(id: string) {
  const { data, error } = await supabase
    .from('auctions')
    .select('*, seller:profiles(first_name, last_name), bids( amount, profiles(first_name, last_name) )')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}