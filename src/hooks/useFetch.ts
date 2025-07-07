import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface UseFetchOptions<T> {
  initialData?: T;
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Simple in-memory cache
const cache: Record<string, any> = {};

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
) {
  const {
    initialData,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage = 'Data loaded successfully'
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache first if cacheKey is provided
    if (cacheKey && !skipCache) {
      const cachedItem = cache[cacheKey] as CacheItem<T> | undefined;
      if (cachedItem && Date.now() - cachedItem.timestamp < cacheDuration) {
        setData(cachedItem.data);
        if (onSuccess) onSuccess(cachedItem.data);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      
      // Cache the result if cacheKey is provided
      if (cacheKey) {
        cache[cacheKey] = {
          data: result,
          timestamp: Date.now()
        };
      }
      
      if (onSuccess) onSuccess(result);
      if (showSuccessToast) showToast('success', successMessage);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      if (onError) onError(error);
      if (showErrorToast) showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, cacheDuration, onSuccess, onError, showToast, showErrorToast, showSuccessToast, successMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      delete cache[cacheKey];
    }
  }, [cacheKey]);

  return { data, loading, error, refetch, clearCache };
}

export default useFetch;
