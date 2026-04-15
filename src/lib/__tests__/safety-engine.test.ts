/**
 * Safety Engine Tests
 * Comprehensive test suite for safety scoring algorithm
 */

import { calculateSafetyScore, getRiskLevel, RouteContext } from '../safety-engine';

describe('Safety Engine', () => {
  describe('calculateSafetyScore', () => {
    it('should return 100 for perfect conditions', () => {
      const context: RouteContext = {
        congestionLevel: 0,
        zoneRiskIndex: 0,
        timeOfDay: 'day',
        weatherSeverity: 0,
        complexity: 0,
      };
      expect(calculateSafetyScore(context)).toBe(100);
    });

    it('should return 0 for worst conditions', () => {
      const context: RouteContext = {
        congestionLevel: 100,
        zoneRiskIndex: 100,
        timeOfDay: 'night',
        weatherSeverity: 100,
        complexity: 100,
      };
      expect(calculateSafetyScore(context)).toBe(9); // 60 * 0.15 = 9
    });

    it('should apply correct weights to each factor', () => {
      const context: RouteContext = {
        congestionLevel: 50,
        zoneRiskIndex: 50,
        timeOfDay: 'day',
        weatherSeverity: 50,
        complexity: 50,
      };
      // Expected: (50*0.35) + (50*0.25) + (100*0.15) + (50*0.15) + (50*0.10)
      // = 17.5 + 12.5 + 15 + 7.5 + 5 = 57.5 ≈ 58
      expect(calculateSafetyScore(context)).toBe(58);
    });

    it('should handle evening time correctly', () => {
      const context: RouteContext = {
        congestionLevel: 0,
        zoneRiskIndex: 0,
        timeOfDay: 'evening',
        weatherSeverity: 0,
        complexity: 0,
      };
      // Expected: 35 + 25 + (85*0.15) + 15 + 10 = 97.75 ≈ 98
      expect(calculateSafetyScore(context)).toBe(98);
    });

    it('should handle night time correctly', () => {
      const context: RouteContext = {
        congestionLevel: 0,
        zoneRiskIndex: 0,
        timeOfDay: 'night',
        weatherSeverity: 0,
        complexity: 0,
      };
      // Expected: 35 + 25 + (60*0.15) + 15 + 10 = 94
      expect(calculateSafetyScore(context)).toBe(94);
    });

    it('should clamp scores between 0 and 100', () => {
      const highContext: RouteContext = {
        congestionLevel: -50,
        zoneRiskIndex: -50,
        timeOfDay: 'day',
        weatherSeverity: -50,
        complexity: -50,
      };
      expect(calculateSafetyScore(highContext)).toBeLessThanOrEqual(100);

      const lowContext: RouteContext = {
        congestionLevel: 150,
        zoneRiskIndex: 150,
        timeOfDay: 'night',
        weatherSeverity: 150,
        complexity: 150,
      };
      expect(calculateSafetyScore(lowContext)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRiskLevel', () => {
    it('should return Low for scores >= 85', () => {
      expect(getRiskLevel(85)).toBe('Low');
      expect(getRiskLevel(90)).toBe('Low');
      expect(getRiskLevel(100)).toBe('Low');
    });

    it('should return Medium for scores between 60 and 84', () => {
      expect(getRiskLevel(60)).toBe('Medium');
      expect(getRiskLevel(70)).toBe('Medium');
      expect(getRiskLevel(84)).toBe('Medium');
    });

    it('should return High for scores < 60', () => {
      expect(getRiskLevel(0)).toBe('High');
      expect(getRiskLevel(30)).toBe('High');
      expect(getRiskLevel(59)).toBe('High');
    });
  });
});
