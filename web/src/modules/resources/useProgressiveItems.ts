import { useEffect, useRef, useState } from 'react';

const defaultBatchSize = 12;

export function useProgressiveItems<T>(
  items: T[],
  resetKey: string,
  batchSize = defaultBatchSize,
) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, resetKey]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (!('IntersectionObserver' in window)) {
      setVisibleCount(items.length);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((current) => Math.min(current + batchSize, items.length));
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [batchSize, hasMore, items.length]);

  return {
    visibleItems: items.slice(0, visibleCount),
    visibleCount: Math.min(visibleCount, items.length),
    hasMore,
    sentinelRef,
  };
}
