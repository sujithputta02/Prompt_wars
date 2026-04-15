/**
 * Analytics Tests
 * Comprehensive test suite for analytics tracking
 */

import { analytics } from '../analytics';

describe('Analytics', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('trackEvent', () => {
    it('should track event with name and properties', () => {
      analytics.trackEvent('route_search', {
        origin: 'Mumbai',
        destination: 'Bandra',
      });

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'route_search',
        expect.objectContaining({
          origin: 'Mumbai',
          destination: 'Bandra',
        })
      );
    });

    it('should track event without properties', () => {
      analytics.trackEvent('page_view');

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'page_view',
        undefined
      );
    });

    it('should handle different event types', () => {
      const events = [
        'route_search',
        'voice_input_used',
        'ar_view_opened',
        'route_selected',
      ];

      events.forEach((event) => {
        analytics.trackEvent(event);
        expect(console.log).toHaveBeenCalledWith('[Analytics]', event, undefined);
      });
    });

    it('should handle complex properties', () => {
      const properties = {
        user: { id: '123', type: 'premium' },
        route: { distance: 8.2, duration: 18 },
        safety: { score: 85, level: 'Low' },
      };

      analytics.trackEvent('route_completed', properties);

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'route_completed',
        properties
      );
    });
  });

  describe('trackPageView', () => {
    it('should track page view with path', () => {
      analytics.trackPageView('/dashboard');

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'page_view',
        expect.objectContaining({
          path: '/dashboard',
        })
      );
    });

    it('should track page view with title', () => {
      analytics.trackPageView('/dashboard', 'Dashboard');

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'page_view',
        expect.objectContaining({
          path: '/dashboard',
          title: 'Dashboard',
        })
      );
    });

    it('should handle different paths', () => {
      const paths = ['/', '/routes', '/settings', '/help'];

      paths.forEach((path) => {
        analytics.trackPageView(path);
        expect(console.log).toHaveBeenCalledWith(
          '[Analytics]',
          'page_view',
          expect.objectContaining({ path })
        );
      });
    });
  });

  describe('trackError', () => {
    it('should track error with message', () => {
      analytics.trackError('API request failed');

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'error',
        expect.objectContaining({
          message: 'API request failed',
        })
      );
    });

    it('should track error with context', () => {
      const context = {
        api: 'Google Maps',
        statusCode: 403,
        endpoint: '/routes',
      };

      analytics.trackError('API error', context);

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'error',
        expect.objectContaining({
          message: 'API error',
          ...context,
        })
      );
    });

    it('should handle different error types', () => {
      const errors = [
        'Network timeout',
        'Invalid input',
        'Permission denied',
        'Resource not found',
      ];

      errors.forEach((error) => {
        analytics.trackError(error);
        expect(console.log).toHaveBeenCalledWith(
          '[Analytics]',
          'error',
          expect.objectContaining({ message: error })
        );
      });
    });
  });

  describe('trackTiming', () => {
    it('should track timing with category and duration', () => {
      analytics.trackTiming('api_call', 'route_fetch', 1250);

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'timing',
        expect.objectContaining({
          category: 'api_call',
          variable: 'route_fetch',
          duration: 1250,
        })
      );
    });

    it('should handle different timing categories', () => {
      const timings = [
        { category: 'api_call', variable: 'weather', duration: 500 },
        { category: 'render', variable: 'map', duration: 200 },
        { category: 'calculation', variable: 'safety_score', duration: 50 },
      ];

      timings.forEach(({ category, variable, duration }) => {
        analytics.trackTiming(category, variable, duration);
        expect(console.log).toHaveBeenCalledWith(
          '[Analytics]',
          'timing',
          expect.objectContaining({ category, variable, duration })
        );
      });
    });

    it('should handle zero duration', () => {
      analytics.trackTiming('instant', 'operation', 0);

      expect(console.log).toHaveBeenCalledWith(
        '[Analytics]',
        'timing',
        expect.objectContaining({ duration: 0 })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty event names', () => {
      analytics.trackEvent('');
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle null properties', () => {
      analytics.trackEvent('test', null as any);
      expect(console.log).toHaveBeenCalledWith('[Analytics]', 'test', null);
    });

    it('should handle undefined properties', () => {
      analytics.trackEvent('test', undefined);
      expect(console.log).toHaveBeenCalledWith('[Analytics]', 'test', undefined);
    });

    it('should handle very long event names', () => {
      const longName = 'event_' + 'x'.repeat(100);
      analytics.trackEvent(longName);
      expect(console.log).toHaveBeenCalledWith('[Analytics]', longName, undefined);
    });

    it('should handle special characters in event names', () => {
      const specialNames = [
        'event-with-dash',
        'event_with_underscore',
        'event.with.dot',
        'event:with:colon',
      ];

      specialNames.forEach((name) => {
        analytics.trackEvent(name);
        expect(console.log).toHaveBeenCalledWith('[Analytics]', name, undefined);
      });
    });

    it('should handle rapid event tracking', () => {
      for (let i = 0; i < 100; i++) {
        analytics.trackEvent(`event_${i}`);
      }

      expect(console.log).toHaveBeenCalledTimes(100);
    });

    it('should handle circular references in properties', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not throw error
      expect(() => analytics.trackEvent('test', circular)).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should track complete user journey', () => {
      analytics.trackPageView('/');
      analytics.trackEvent('route_search', { origin: 'A', destination: 'B' });
      analytics.trackTiming('api_call', 'routes', 1200);
      analytics.trackEvent('route_selected', { routeId: 'route-0' });

      expect(console.log).toHaveBeenCalledTimes(4);
    });

    it('should track error recovery flow', () => {
      analytics.trackError('API failed', { api: 'Google Maps' });
      analytics.trackEvent('fallback_used', { type: 'mock_data' });
      analytics.trackEvent('route_displayed');

      expect(console.log).toHaveBeenCalledTimes(3);
    });
  });
});
