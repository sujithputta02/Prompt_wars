/**
 * Input Sanitizer Tests
 */

import {
  sanitizeInput,
  sanitizeLocation,
  isValidEmail,
  sanitizeUrl,
  escapeHtml,
  sanitizeNumber,
} from '../input-sanitizer';

describe('Input Sanitizer', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
    });

    it('should limit length to 500 characters', () => {
      const longString = 'a'.repeat(600);
      expect(sanitizeInput(longString)).toHaveLength(500);
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });
  });

  describe('sanitizeLocation', () => {
    it('should allow valid addresses', () => {
      expect(sanitizeLocation('123 Main St, Mumbai')).toBe('123 Main St, Mumbai');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeLocation('<script>Mumbai</script>')).toBe('scriptMumbai/script');
    });

    it('should limit length to 200 characters', () => {
      const longAddress = 'a'.repeat(250);
      expect(sanitizeLocation(longAddress)).toHaveLength(200);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should reject emails over 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('should allow valid HTTP URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should reject data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<div>Test</div>')).toBe('&lt;div&gt;Test&lt;&#x2F;div&gt;');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"test"')).toBe('&quot;test&quot;');
      expect(escapeHtml("'test'")).toBe('&#x27;test&#x27;');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape forward slashes', () => {
      expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumber('42')).toBe(42);
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('3.14')).toBe(3.14);
    });

    it('should return null for invalid numbers', () => {
      expect(sanitizeNumber('not a number')).toBeNull();
      expect(sanitizeNumber(NaN)).toBeNull();
      expect(sanitizeNumber(Infinity)).toBeNull();
    });

    it('should enforce minimum value', () => {
      expect(sanitizeNumber(5, 10)).toBe(10);
      expect(sanitizeNumber(15, 10)).toBe(15);
    });

    it('should enforce maximum value', () => {
      expect(sanitizeNumber(100, undefined, 50)).toBe(50);
      expect(sanitizeNumber(30, undefined, 50)).toBe(30);
    });

    it('should enforce both min and max', () => {
      expect(sanitizeNumber(5, 10, 50)).toBe(10);
      expect(sanitizeNumber(100, 10, 50)).toBe(50);
      expect(sanitizeNumber(30, 10, 50)).toBe(30);
    });
  });
});
