import { create } from 'zustand';
import { getAuctions } from '../api/auctionApi';

interface Auction {
  id: string;
  title: string;
  current_price: number;
  end_time: string;
}

interface AuctionState {
  auctions: Auction[];
  isLoading: boolean;

  fetchAuctions: () => Promise<void>;
}

export const useAuctionStore = create<AuctionState>((set) => ({
  auctions: [],
  isLoading: false,

  fetchAuctions: async () => {
    try {
      set({ isLoading: true });
      const data = await getAuctions();
      set({ auctions: data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));