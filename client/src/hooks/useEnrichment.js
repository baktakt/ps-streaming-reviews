import { useState, useEffect, useRef } from 'react';
import { fetchEnrichBatch } from '../lib/api';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1500;

// Progressively enriches games in the background with RAWG + OpenCritic data
export function useEnrichment(games) {
  const [enriched, setEnriched] = useState({});
  const [isEnriching, setIsEnriching] = useState(false);
  const processedRef = useRef(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    if (!games || games.length === 0) return;

    const toProcess = games
      .filter((g) => !processedRef.current.has(g.id))
      .map((g) => g.id);

    if (toProcess.length === 0) return;

    // Mark all as queued
    toProcess.forEach((id) => processedRef.current.add(id));

    let batchIndex = 0;
    setIsEnriching(true);

    function processBatch() {
      const batch = toProcess.slice(batchIndex, batchIndex + BATCH_SIZE);
      if (batch.length === 0) {
        setIsEnriching(false);
        return;
      }

      batchIndex += BATCH_SIZE;

      fetchEnrichBatch(batch)
        .then((results) => {
          setEnriched((prev) => ({ ...prev, ...results }));
          timerRef.current = setTimeout(processBatch, BATCH_DELAY_MS);
        })
        .catch((err) => {
          console.warn('Enrichment batch failed:', err.message);
          timerRef.current = setTimeout(processBatch, BATCH_DELAY_MS * 2);
        });
    }

    // Start enrichment after a short delay
    timerRef.current = setTimeout(processBatch, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [games]);

  return { enriched, isEnriching };
}
