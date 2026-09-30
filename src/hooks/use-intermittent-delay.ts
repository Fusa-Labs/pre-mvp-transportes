'use client';

import { useEffect, useState } from 'react';

/**
 * Computes a pseudo-random integer in the inclusive range [min, max].
 */
function getRandomInt(min: number, max: number): number {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);
  if (lower > upper) {
    return lower;
  }
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

/**
 * Custom hook that generates a simulated delay in minutes, intermittently updating
 * between `min` and `max` values on a fixed timer interval.
 *
 * @param min - Minimum delay in minutes (default: 2)
 * @param max - Maximum delay in minutes (default: 9)
 * @param intervalMs - Timer interval in milliseconds to update the delay (default: 8000)
 * @returns An integer representing the current simulated delay in minutes.
 */
export function useIntermittentDelay(
  min = 2,
  max = 9,
  intervalMs = 8000,
): number {
  // Deterministic initial value prevents hydration mismatch during server pre-rendering.
  const [delay, setDelay] = useState<number>(() => Math.round((min + max) / 2));

  useEffect(() => {
    // Generate initial randomized delay on client mount
    setDelay(getRandomInt(min, max));

    const timer = setInterval(() => {
      setDelay(getRandomInt(min, max));
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [min, max, intervalMs]);

  return delay;
}
