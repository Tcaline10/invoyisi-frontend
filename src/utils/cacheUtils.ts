/**
 * Simple in-memory cache utility
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class Cache {
  private cache: Record<string, CacheItem<any>> = {};
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;
    
    this.cache[key] = {
      data,
      timestamp,
      expiresAt
    };
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache[key] as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.remove(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    delete this.cache[key];
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache[key];
    
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.remove(key);
      return false;
    }
    
    return true;
  }
}

// Create a singleton instance
const cache = new Cache();

export default cache;
