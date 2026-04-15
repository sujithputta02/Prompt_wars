/**
 * Error Handler Tests
 * Comprehensive test suite for error handling functionality
 */

import { errorHandler, ErrorType } from '../error-handler';

describe('Error Handler', () => {
  beforeEach(() => {
    errorHandler.clearErrors();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleError', () => {
    it('should create and store error', () => {
      const error = errorHandler.handleError(ErrorType.NETWORK, 'Network failed');

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.message).toBe('Network failed');
      expect(error.timestamp).toBeDefined();
      expect(typeof error.timestamp).toBe('number');
    });

    it('should log error to console', () => {
      errorHandler.handleError(ErrorType.API, 'API error');

      expect(console.error).toHaveBeenCalledWith(
        '[API_ERROR]',
        'API error',
        undefined
      );
    });

    it('should store error details', () => {
      const details = { statusCode: 404, endpoint: '/api/test' };
      const error = errorHandler.handleError(ErrorType.API, 'Not found', details);

      expect(error.details).toEqual(details);
    });

    it('should add error to errors array', () => {
      errorHandler.handleError(ErrorType.NETWORK, 'Error 1');
      errorHandler.handleError(ErrorType.API, 'Error 2');

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(2);
    });
  });

  describe('handleAPIError', () => {
    it('should create API error with correct format', () => {
      const error = errorHandler.handleAPIError('Google Maps', 403, 'Forbidden');

      expect(error.type).toBe(ErrorType.API);
      expect(error.message).toContain('Google Maps');
      expect(error.message).toContain('403');
      expect(error.message).toContain('Forbidden');
    });

    it('should include API details', () => {
      const error = errorHandler.handleAPIError('Gemini', 429, 'Rate limit');

      expect(error.details).toEqual({
        apiName: 'Gemini',
        statusCode: 429,
      });
    });

    it('should handle different status codes', () => {
      const error400 = errorHandler.handleAPIError('API', 400, 'Bad Request');
      const error500 = errorHandler.handleAPIError('API', 500, 'Server Error');

      expect(error400.message).toContain('400');
      expect(error500.message).toContain('500');
    });
  });

  describe('handleNetworkError', () => {
    it('should create network error', () => {
      const error = errorHandler.handleNetworkError('Connection timeout');

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.message).toBe('Connection timeout');
    });

    it('should handle different network error messages', () => {
      const errors = [
        'Connection refused',
        'DNS lookup failed',
        'Request timeout',
      ];

      errors.forEach((msg) => {
        const error = errorHandler.handleNetworkError(msg);
        expect(error.message).toBe(msg);
        expect(error.type).toBe(ErrorType.NETWORK);
      });
    });
  });

  describe('handleValidationError', () => {
    it('should create validation error with field', () => {
      const error = errorHandler.handleValidationError('email', 'Invalid format');

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('email');
      expect(error.message).toContain('Invalid format');
    });

    it('should include field in details', () => {
      const error = errorHandler.handleValidationError('password', 'Too short');

      expect(error.details).toEqual({ field: 'password' });
    });

    it('should handle multiple validation errors', () => {
      errorHandler.handleValidationError('email', 'Required');
      errorHandler.handleValidationError('password', 'Too weak');

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe(ErrorType.VALIDATION);
      expect(errors[1].type).toBe(ErrorType.VALIDATION);
    });
  });

  describe('handlePermissionError', () => {
    it('should create permission error', () => {
      const error = errorHandler.handlePermissionError('camera', 'Access denied');

      expect(error.type).toBe(ErrorType.PERMISSION);
      expect(error.message).toContain('camera');
      expect(error.message).toContain('Access denied');
    });

    it('should include permission in details', () => {
      const error = errorHandler.handlePermissionError('microphone', 'Not granted');

      expect(error.details).toEqual({ permission: 'microphone' });
    });

    it('should handle different permissions', () => {
      const permissions = ['camera', 'microphone', 'location', 'notifications'];

      permissions.forEach((perm) => {
        const error = errorHandler.handlePermissionError(perm, 'Denied');
        expect(error.message).toContain(perm);
      });
    });
  });

  describe('getErrors', () => {
    it('should return all stored errors', () => {
      errorHandler.handleError(ErrorType.NETWORK, 'Error 1');
      errorHandler.handleError(ErrorType.API, 'Error 2');
      errorHandler.handleError(ErrorType.VALIDATION, 'Error 3');

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(3);
    });

    it('should return empty array when no errors', () => {
      const errors = errorHandler.getErrors();
      expect(errors).toEqual([]);
    });

    it('should maintain error order', () => {
      errorHandler.handleError(ErrorType.NETWORK, 'First');
      errorHandler.handleError(ErrorType.API, 'Second');
      errorHandler.handleError(ErrorType.VALIDATION, 'Third');

      const errors = errorHandler.getErrors();
      expect(errors[0].message).toBe('First');
      expect(errors[1].message).toBe('Second');
      expect(errors[2].message).toBe('Third');
    });
  });

  describe('clearErrors', () => {
    it('should remove all errors', () => {
      errorHandler.handleError(ErrorType.NETWORK, 'Error 1');
      errorHandler.handleError(ErrorType.API, 'Error 2');

      errorHandler.clearErrors();

      const errors = errorHandler.getErrors();
      expect(errors).toEqual([]);
    });

    it('should allow new errors after clearing', () => {
      errorHandler.handleError(ErrorType.NETWORK, 'Error 1');
      errorHandler.clearErrors();
      errorHandler.handleError(ErrorType.API, 'Error 2');

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Error 2');
    });
  });

  describe('Error Timestamps', () => {
    it('should have increasing timestamps', async () => {
      const error1 = errorHandler.handleError(ErrorType.NETWORK, 'First');
      
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      const error2 = errorHandler.handleError(ErrorType.API, 'Second');

      expect(error2.timestamp).toBeGreaterThan(error1.timestamp);
    });

    it('should have recent timestamps', () => {
      const before = Date.now();
      const error = errorHandler.handleError(ErrorType.NETWORK, 'Test');
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error messages', () => {
      const error = errorHandler.handleError(ErrorType.UNKNOWN, '');
      expect(error.message).toBe('');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(1000);
      const error = errorHandler.handleError(ErrorType.NETWORK, longMessage);
      expect(error.message).toBe(longMessage);
    });

    it('should handle complex error details', () => {
      const complexDetails = {
        nested: {
          level1: {
            level2: {
              value: 'deep',
            },
          },
        },
        array: [1, 2, 3],
        null: null,
        undefined: undefined,
      };

      const error = errorHandler.handleError(
        ErrorType.API,
        'Complex error',
        complexDetails
      );

      expect(error.details).toEqual(complexDetails);
    });

    it('should handle rapid error creation', () => {
      for (let i = 0; i < 100; i++) {
        errorHandler.handleError(ErrorType.NETWORK, `Error ${i}`);
      }

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(100);
    });
  });
});
