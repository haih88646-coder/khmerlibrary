import { useEffect, useState } from 'react';
import { getFavoriteCounts } from '../supabase/users';

// One shared fetch per TTL window, no matter how many cards ask for counts.
let cachePromise = null;
let cacheTime = 0;
const TTL = 60 * 1000;

const load = () => {
  if (!cachePromise || Date.now() - cacheTime > TTL) {
    cacheTime = Date.now();
    cachePromise = getFavoriteCounts().catch(() => ({}));
  }
  return cachePromise;
};

export const useFavoriteCounts = () => {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let alive = true;
    load().then((c) => {
      if (alive) setCounts(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  return counts;
};

// Call after a user toggles a favorite so the next mount refetches fresh data.
export const invalidateFavoriteCounts = () => {
  cachePromise = null;
};
