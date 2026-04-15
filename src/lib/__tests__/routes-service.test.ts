/**
 * Routes Service Tests
 * Comprehensive test suite for route fetching and parsing
 */

import { fetchRouteAlternatives, RouteSearchParams } from '../routes-service';

// Mock fetch globally
global.fetch = jest.fn();

describe('Routes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set API key for tests
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  });

  describe('fetchRouteAlternatives', () => {
    const mockParams: RouteSearchParams = {
      origin: 'Mumbai Central',
      destination: 'Bandra West',
      travelMode: 'DRIVE',
    };

    it('should return mock routes when API key is not configured', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      const result = await fetchRouteAlternatives(mockParams);
      
      expect(result.routes).toHaveLength(3);
      expect(result.routes[0].name).toBe('Route Alpha');
      expect(result.error).toBeUndefined();
    });

    it('should call Routes API with correct parameters', async () => {
      const mockResponse = {
        routes: [
          {
            legs: [
              {
                distanceMeters: 8200,
                duration: '1080s',
                steps: Array(10).fill({}),
              },
            ],
            polyline: { encodedPolyline: 'test_polyline' },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchRouteAlternatives(mockParams);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': 'test-api-key',
          }),
        })
      );
    });

    it('should parse Google Routes API response correctly', async () => {
      const mockResponse = {
        routes: [
          {
            legs: [
              {
                distanceMeters: 8200,
                duration: '1080s',
                steps: Array(10).fill({}),
              },
            ],
            polyline: { encodedPolyline: 'test_polyline' },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRouteAlternatives(mockParams);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].distance).toBe('8.2 km');
      expect(result.routes[0].eta).toBe('18 min');
      expect(result.routes[0].polyline).toBe('test_polyline');
    });

    it('should fallback to mock data when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: { message: 'API not enabled' } }),
      });

      const result = await fetchRouteAlternatives(mockParams);

      expect(result.routes).toHaveLength(3);
      expect(result.routes[0].name).toBe('Route Alpha');
    });

    it('should fallback to mock data when fetch throws error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchRouteAlternatives(mockParams);

      expect(result.routes).toHaveLength(3);
    });

    it('should handle empty routes response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [] }),
      });

      const result = await fetchRouteAlternatives(mockParams);

      expect(result.routes).toHaveLength(0);
      expect(result.error).toBe('No routes found');
    });

    it('should calculate congestion level correctly', async () => {
      const mockResponse = {
        routes: [
          {
            legs: [
              {
                distanceMeters: 5000,
                duration: '600s',
                steps: [],
                trafficInfo: {
                  currentSpeed: 20,
                  speedLimit: 40,
                },
              },
            ],
            polyline: { encodedPolyline: 'test' },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRouteAlternatives(mockParams);

      expect(result.routes[0].congestionLevel).toBeGreaterThan(0);
      expect(result.routes[0].congestionLevel).toBeLessThanOrEqual(100);
    });

    it('should calculate complexity based on number of steps', async () => {
      const mockResponse = {
        routes: [
          {
            legs: [
              {
                distanceMeters: 5000,
                duration: '600s',
                steps: Array(20).fill({}),
              },
            ],
            polyline: { encodedPolyline: 'test' },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRouteAlternatives(mockParams);

      expect(result.routes[0].complexity).toBeGreaterThan(0);
      expect(result.routes[0].complexity).toBeLessThanOrEqual(100);
    });

    it('should support different travel modes', async () => {
      const walkParams: RouteSearchParams = {
        ...mockParams,
        travelMode: 'WALK',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const result = await fetchRouteAlternatives(walkParams);

      expect(result.routes).toBeDefined();
    });
  });

  describe('Mock Routes', () => {
    it('should return consistent mock data structure', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      const params: RouteSearchParams = {
        origin: 'Test Origin',
        destination: 'Test Destination',
        travelMode: 'DRIVE',
      };

      const result = await fetchRouteAlternatives(params);

      expect(result.routes).toHaveLength(3);
      result.routes.forEach((route) => {
        expect(route).toHaveProperty('id');
        expect(route).toHaveProperty('name');
        expect(route).toHaveProperty('eta');
        expect(route).toHaveProperty('distance');
        expect(route).toHaveProperty('congestionLevel');
        expect(route).toHaveProperty('complexity');
      });
    });

    it('should have valid congestion levels in mock data', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      const result = await fetchRouteAlternatives({
        origin: 'A',
        destination: 'B',
        travelMode: 'DRIVE',
      });

      result.routes.forEach((route) => {
        expect(route.congestionLevel).toBeGreaterThanOrEqual(0);
        expect(route.congestionLevel).toBeLessThanOrEqual(100);
      });
    });
  });
});
