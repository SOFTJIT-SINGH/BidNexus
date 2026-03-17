import { useState, useEffect } from 'react';

export function useAuctionTimer(endTime: string | null) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsEnded(true);
        setTimeLeft('Auction Ended');
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Run immediately, then every second
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return { timeLeft, isEnded };
}