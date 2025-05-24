import crypto from 'crypto';

/**
 * @typedef {Object} CacheEntry
 * @property {any} data
 * @property {number} timestamp
 * @property {string} hash
 */

export class Cache {
  /**
   * @param {number} timeoutMs 
   */
  constructor(timeoutMs = 300000) { // 5 minutes default
    this.cache = new Map();
    this.timeout = timeoutMs;
  }

  /**
   * Set cache entry
   * @param {string} key 
   * @param {any} data 
   */
  set(key, data) {
    try {
      const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        hash
      });
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Get cache entry
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.timeout) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }
}