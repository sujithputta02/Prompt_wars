/**
 * Weather Service Tests
 * Comprehensive test suite for weather data fetching
 */

import { fetchWeatherData, WeatherData } from '../weather-service';

// Mock fetch globally
global.fetch = jest.fn();

describe('Weather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY = 'test-weather-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  });

  describe('fetchWeatherData', () => {
    it('should return mock weather when API key is not configured', async () => {
      delete process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

      const result = await fetchWeatherData(19.0760, 72.8777);

      expect(result.temperature).toBe(22);
      expect(result.condition).toBe('Partly Cloudy');
      expect(result.severity).toBe(25);
    });

    it('should call WeatherAPI with correct parameters', async () => {
      const mockResponse = {
        current: {
          temp_c: 32,
          condition: {
            text: 'Partly cloudy',
          },
          wind_kph: 15,
          precip_mm: 0,
          vis_km: 10,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchWeatherData(19.0760, 72.8777);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.weatherapi.com/v1/current.json')
      );
    });

    it('should parse WeatherAPI response correctly', async () => {
      const mockResponse = {
        current: {
          temp_c: 32,
          condition: {
            text: 'Partly cloudy',
          },
          wind_kph: 15,
          precip_mm: 0,
          vis_km: 10,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWeatherData(19.0760, 72.8777);

      expect(result.temperature).toBe(32);
      expect(result.condition).toBe('Partly cloudy');
      expect(result.severity).toBeGreaterThanOrEqual(0);
      expect(result.severity).toBeLessThanOrEqual(100);
    });

    it('should calculate severity for rainy conditions', async () => {
      const mockResponse = {
        current: {
          temp_c: 25,
          condition: {
            text: 'Heavy rain',
          },
          wind_kph: 30,
          precip_mm: 50,
          vis_km: 2,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWeatherData(19.0760, 72.8777);

      expect(result.severity).toBeGreaterThan(50);
    });

    it('should calculate severity for clear conditions', async () => {
      const mockResponse = {
        current: {
          temp_c: 28,
          condition: {
            text: 'Clear',
          },
          wind_kph: 10,
          precip_mm: 0,
          vis_km: 10,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWeatherData(19.0760, 72.8777);

      expect(result.severity).toBeLessThan(20);
    });

    it('should fallback to mock data when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await fetchWeatherData(19.0760, 72.8777);

      expect(result.temperature).toBe(22);
      expect(result.condition).toBe('Partly Cloudy');
    });

    it('should fallback to mock data when fetch throws error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchWeatherData(19.0760, 72.8777);

      expect(result.temperature).toBe(22);
      expect(result.condition).toBe('Partly Cloudy');
    });

    it('should handle different locations', async () => {
      const mockResponse = {
        current: {
          temp_c: 20,
          condition: {
            text: 'Cloudy',
          },
          wind_kph: 12,
          precip_mm: 0,
          vis_km: 8,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWeatherData(28.7041, 77.1025);

      expect(result.temperature).toBe(20);
      expect(result.condition).toBe('Cloudy');
    });

    it('should clamp severity between 0 and 100', async () => {
      const mockResponse = {
        current: {
          temp_c: 45,
          condition: {
            text: 'Extreme heat',
          },
          wind_kph: 100,
          precip_mm: 200,
          vis_km: 0.1,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWeatherData(0, 0);

      expect(result.severity).toBeGreaterThanOrEqual(0);
      expect(result.severity).toBeLessThanOrEqual(100);
    });

    it('should handle missing weather data fields gracefully', async () => {
      const mockResponse = {
        current: {
          temp_c: 25,
          condition: {
            text: 'Unknown',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWeatherData(0, 0);

      expect(result.temperature).toBe(25);
      expect(result.condition).toBe('Unknown');
      expect(result.severity).toBeDefined();
    });
  });

  describe('Mock Weather Data', () => {
    it('should return consistent mock data structure', async () => {
      delete process.env.NEXT_PUBLIC_WEATHER_API_KEY;

      const result = await fetchWeatherData(0, 0);

      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('condition');
      expect(result).toHaveProperty('severity');
      expect(typeof result.temperature).toBe('number');
      expect(typeof result.condition).toBe('string');
      expect(typeof result.severity).toBe('number');
    });

    it('should have valid severity in mock data', async () => {
      delete process.env.NEXT_PUBLIC_WEATHER_API_KEY;

      const result = await fetchWeatherData(0, 0);

      expect(result.severity).toBeGreaterThanOrEqual(0);
      expect(result.severity).toBeLessThanOrEqual(100);
    });
  });
});
