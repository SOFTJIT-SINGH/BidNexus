import { useEffect, useState } from 'react';

interface Props {
  endTime: string; // ISO string from DB
  serverTime: number; // server timestamp (ms)
}

export function useAuctionTimer({ endTime, serverTime }: Props) {
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const end = new Date(endTime).getTime();

    // calculate offset between device and server
    const offset = Date.now() - serverTime;

    const interval = setInterval(() => {
      const now = Date.now() - offset;
      const diff = end - now;

      setRemainingTime(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, serverTime]);

  return remainingTime;
}