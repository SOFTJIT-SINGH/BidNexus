const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cjftebpyscrcvcruirdc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZnRlYnB5c2NyY3ZjcnVpcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mjk0MjIsImV4cCI6MjA4OTMwNTQyMn0.XHctISNMsnW2zj_Tzn_yOL8X52XgYdEwDQqYUVLjT9g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function placeCrossBids() {
  // 1. Get the new auction
  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('title', 'iPhone 15 Pro - Titanium Blue')
    .single();

  if (!auction) return;

  // 2. Get another user (not Rafeh)
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', 'eb160af9-8d7d-48a1-a1c6-83c44e541c8c')
    .limit(2);

  if (!users || users.length === 0) {
    console.log('No other users found to place bids.');
    return;
  }

  // 3. Place bids from these users
  for (let i = 0; i < users.length; i++) {
    const amount = auction.current_price + (i + 1) * 500;
    const { error } = await supabase.rpc('place_bid', {
      p_auction_id: auction.id,
      p_user_id: users[i].id,
      p_amount: amount
    });

    if (error) {
      console.log(`Error bidding for user ${i}:`, error.message);
    } else {
      console.log(`User ${i} placed a bid of ₹${amount}`);
    }
  }
}

placeCrossBids();
