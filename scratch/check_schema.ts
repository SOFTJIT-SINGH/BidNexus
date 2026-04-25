import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cjftebpyscrcvcruirdc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZnRlYnB5c2NyY3ZjcnVpcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mjk0MjIsImV4cCI6MjA4OTMwNTQyMn0.XHctISNMsnW2zj_Tzn_yOL8X52XgYdEwDQqYUVLjT9g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('auctions').select('*').limit(1);
  if (error) {
    console.error('Error fetching auctions:', error);
  } else {
    console.log('Auction columns:', Object.keys(data[0] || {}));
  }
}

checkSchema();
