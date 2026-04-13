import { create } from 'zustand';
import { getAuctions } from '../api/auctionApi';

interface Auction {
  id: string;
  title: string;
  description?: string;
  current_price: number;
  starting_price?: number;
  end_time: string;
  image_url?: string;
  category?: string;
  created_by?: string;
}

interface AuctionState {
  auctions: Auction[];
  isLoading: boolean;

  fetchAuctions: () => Promise<void>;
  // Action to be called by your realtime listener
  updateAuctionInStore: (updatedAuction: Partial<Auction> & { id: string }) => void;
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

  updateAuctionInStore: (updatedAuction) => {
    set((state) => ({
      auctions: state.auctions.map((auction) =>
        auction.id === updatedAuction.id
          ? { ...auction, ...updatedAuction }
          : auction
      ),
    }));
  },
}));