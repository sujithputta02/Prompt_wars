/**
 * Cache Manager Tests
 * Comprehensive test suite for caching functionality
 */

import { cacheManager } from '../cache-manager';

describe('Cache Manager', () => {
  beforeEach(() => {
    cacheManager.clearAll();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const testData = { name: 'Test', value: 123 };
      cacheManager.set('test-key', testData);

      const retrieved = cacheManager.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      cacheManager.set('string', 'test string');
      cacheManager.set('number', 42);
      cacheManager.set('boolean', true);
      cacheManager.set('array', [1, 2, 3]);
      cacheManager.set('object', { a: 1, b: 2 });

      expect(cacheManager.get('string')).toBe('test string');
      expect(cacheManager.get('number')).toBe(42);
      expect(cacheManager.get('boolean')).toBe(true);
      expect(cacheManager.get('array')).toEqual([1, 2, 3]);
      expect(cacheManager.get('object')).toEqual({ a: 1, b: 2 });
    });

    it('should overwrite existing keys', () => {
      cacheManager.set('key', 'value1');
      cacheManager.set('key', 'value2');

      expect(cacheManager.get('key')).toBe('value2');
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cacheManager.set('short-lived', 'data', 100); // 100ms TTL

      expect(cacheManager.get('short-lived')).toBe('data');

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cacheManager.get('short-lived')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cacheManager.set('default-ttl', 'data');

      const retrieved = cacheManager.get('default-ttl');
      expect(retrieved).toBe('data');
    });

    it('should not expire before TTL', async () => {
      cacheManager.set('long-lived', 'data', 1000); // 1 second TTL

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cacheManager.get('long-lived')).toBe('data');
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cacheManager.set('exists', 'data');
      expect(cacheManager.has('exists')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cacheManager.has('does-not-exist')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cacheManager.set('expires', 'data', 100);

      expect(cacheManager.has('expires')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cacheManager.has('expires')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove specific cache entry', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      cacheManager.clear('key1');

      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBe('value2');
    });

    it('should not throw error when clearing non-existent key', () => {
      expect(() => cacheManager.clear('non-existent')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should remove all cache entries', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');

      cacheManager.clearAll();

      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
      expect(cacheManager.get('key3')).toBeNull();
    });

    it('should reset cache statistics', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      cacheManager.clearAll();

      const stats = cacheManager.getStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return correct cache size', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');

      const stats = cacheManager.getStats();
      expect(stats.size).toBe(3);
    });

    it('should return all cache keys', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      const stats = cacheManager.getStats();
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).toHaveLength(2);
    });

    it('should return empty stats for empty cache', () => {
      const stats = cacheManager.getStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('cleanExpired', () => {
    it('should remove expired entries', async () => {
      cacheManager.set('expires1', 'data1', 100);
      cacheManager.set('expires2', 'data2', 100);
      cacheManager.set('persists', 'data3', 10000);

      await new Promise((resolve) => setTimeout(resolve, 150));

      cacheManager.cleanExpired();

      expect(cacheManager.get('expires1')).toBeNull();
      expect(cacheManager.get('expires2')).toBeNull();
      expect(cacheManager.get('persists')).toBe('data3');
    });

    it('should not remove non-expired entries', () => {
      cacheManager.set('key1', 'value1', 10000);
      cacheManager.set('key2', 'value2', 10000);

      cacheManager.cleanExpired();

      expect(cacheManager.get('key1')).toBe('value1');
      expect(cacheManager.get('key2')).toBe('value2');
    });

    it('should handle empty cache', () => {
      expect(() => cacheManager.cleanExpired()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      cacheManager.set('null-value', null);
      expect(cacheManager.get('null-value')).toBeNull();
    });

    it('should handle undefined values', () => {
      cacheManager.set('undefined-value', undefined);
      expect(cacheManager.get('undefined-value')).toBeUndefined();
    });

    it('should handle very large objects', () => {
      const largeObject = {
        data: Array(1000).fill({ id: 1, name: 'test', values: [1, 2, 3] }),
      };
      cacheManager.set('large', largeObject);
      expect(cacheManager.get('large')).toEqual(largeObject);
    });

    it('should handle special characters in keys', () => {
      const specialKeys = ['key-with-dash', 'key_with_underscore', 'key.with.dot', 'key:with:colon'];
      
      specialKeys.forEach((key) => {
        cacheManager.set(key, 'value');
        expect(cacheManager.get(key)).toBe('value');
      });
    });

    it('should handle concurrent operations', () => {
      for (let i = 0; i < 100; i++) {
        cacheManager.set(`key${i}`, `value${i}`);
      }

      for (let i = 0; i < 100; i++) {
        expect(cacheManager.get(`key${i}`)).toBe(`value${i}`);
      }
    });
  });
});
