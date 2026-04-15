/**
 * Zone Risk Service Tests
 * Comprehensive test suite for zone risk assessment
 */

import { getZoneRiskIndex } from '../zone-risk-service';

describe('Zone Risk Service', () => {
  describe('getZoneRiskIndex', () => {
    it('should return risk index for known high-risk zones', () => {
      const highRiskZones = ['Dharavi', 'Kurla', 'Mankhurd'];
      
      highRiskZones.forEach((zone) => {
        const risk = getZoneRiskIndex(zone);
        expect(risk).toBeGreaterThanOrEqual(60);
        expect(risk).toBeLessThanOrEqual(100);
      });
    });

    it('should return risk index for known medium-risk zones', () => {
      const mediumRiskZones = ['Andheri', 'Borivali', 'Malad'];
      
      mediumRiskZones.forEach((zone) => {
        const risk = getZoneRiskIndex(zone);
        expect(risk).toBeGreaterThanOrEqual(30);
        expect(risk).toBeLessThan(60);
      });
    });

    it('should return risk index for known low-risk zones', () => {
      const lowRiskZones = ['Bandra', 'Juhu', 'Powai', 'Colaba'];
      
      lowRiskZones.forEach((zone) => {
        const risk = getZoneRiskIndex(zone);
        expect(risk).toBeGreaterThanOrEqual(0);
        expect(risk).toBeLessThan(30);
      });
    });

    it('should return default medium risk for unknown zones', () => {
      const unknownZones = ['Unknown Area', 'Test Zone', 'Random Place'];
      
      unknownZones.forEach((zone) => {
        const risk = getZoneRiskIndex(zone);
        expect(risk).toBe(40);
      });
    });

    it('should be case-insensitive', () => {
      expect(getZoneRiskIndex('BANDRA')).toBe(getZoneRiskIndex('bandra'));
      expect(getZoneRiskIndex('Bandra')).toBe(getZoneRiskIndex('BANDRA'));
      expect(getZoneRiskIndex('dharavi')).toBe(getZoneRiskIndex('DHARAVI'));
    });

    it('should handle partial matches in location strings', () => {
      expect(getZoneRiskIndex('Bandra West, Mumbai')).toBeLessThan(30);
      expect(getZoneRiskIndex('Near Dharavi, Mumbai')).toBeGreaterThanOrEqual(60);
      expect(getZoneRiskIndex('Andheri East Station')).toBeGreaterThanOrEqual(30);
    });

    it('should return values within valid range', () => {
      const testLocations = [
        'Bandra',
        'Dharavi',
        'Andheri',
        'Unknown',
        'Colaba',
        'Kurla',
        'Powai',
      ];

      testLocations.forEach((location) => {
        const risk = getZoneRiskIndex(location);
        expect(risk).toBeGreaterThanOrEqual(0);
        expect(risk).toBeLessThanOrEqual(100);
      });
    });

    it('should handle empty strings', () => {
      const risk = getZoneRiskIndex('');
      expect(risk).toBe(40);
    });

    it('should handle special characters', () => {
      const risk = getZoneRiskIndex('Test@#$%');
      expect(risk).toBe(40);
    });

    it('should return consistent results for same input', () => {
      const location = 'Bandra';
      const risk1 = getZoneRiskIndex(location);
      const risk2 = getZoneRiskIndex(location);
      expect(risk1).toBe(risk2);
    });

    it('should differentiate between different risk levels', () => {
      const lowRisk = getZoneRiskIndex('Bandra');
      const mediumRisk = getZoneRiskIndex('Andheri');
      const highRisk = getZoneRiskIndex('Dharavi');

      expect(lowRisk).toBeLessThan(mediumRisk);
      expect(mediumRisk).toBeLessThan(highRisk);
    });
  });
});
