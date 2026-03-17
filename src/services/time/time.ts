import { supabase } from '@/src/services/supabase/supabase';

let cachedServerTime: number | null = null;
let lastFetchedAt: number | null = null;

const CACHE_DURATION = 60 * 1000; // 1 minute

export async function getServerTime(): Promise<number> {
  const now = Date.now();

  // return cached value if still valid
  if (cachedServerTime && lastFetchedAt && now - lastFetchedAt < CACHE_DURATION) {
    return cachedServerTime;
  }

  const { data, error } = await supabase.rpc('get_server_time');

  if (error) {
    throw new Error(error.message);
  }

  const serverTime = new Date(data).getTime();

  cachedServerTime = serverTime;
  lastFetchedAt = now;

  return serverTime;
}