import { supabase } from '@/src/services/supabase/supabase';

export async function getAuctions() {
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAuctionById(id: string) {
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}