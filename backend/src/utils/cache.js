import NodeCache from 'node-cache';

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Don't clone values for better performance
  maxKeys: 1000, // Maximum number of keys
});

/**
 * Cache middleware for Express routes
 */
export const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from request
    const cacheKey = `${req.originalUrl || req.url}`;

    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for a specific key pattern
 */
export const clearCache = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  let cleared = 0;

  keys.forEach((key) => {
    if (regex.test(key)) {
      cache.del(key);
      cleared++;
    }
  });

  return cleared;
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.flushAll();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cache.getStats();
};

/**
 * Cache helper functions
 */
export const cacheService = {
  get: (key) => cache.get(key),
  set: (key, value, ttl = 300) => cache.set(key, value, ttl),
  del: (key) => cache.del(key),
  has: (key) => cache.has(key),
  flush: () => cache.flushAll(),
  keys: () => cache.keys(),
  stats: () => cache.getStats(),
};

export default cache;

