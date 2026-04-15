/**
 * Zone Risk Service
 * Evaluates area safety based on location data
 */

export interface ZoneRiskData {
  areaName: string;
  riskIndex: number; // 0-100
  tags: string[];
  lastUpdated: string;
}

/**
 * Get zone risk for a location
 * For MVP, uses mock data from Firestore collection
 */
export const getZoneRisk = async (
  lat: number,
  lng: number
): Promise<ZoneRiskData> => {
  try {
    // In production, this would query Firestore hotspots collection
    // For MVP, return mock data
    return getMockZoneRisk(lat, lng);
  } catch (error) {
    console.error('Zone risk fetch error:', error);
    return getMockZoneRisk(lat, lng);
  }
};

/**
 * Mock zone risk data
 */
const getMockZoneRisk = (_lat: number, _lng: number): ZoneRiskData => {
  // Simulate different risk levels based on coordinates
  const riskLevels = [
    { name: 'Downtown', risk: 35, tags: ['commercial', 'well-lit', 'busy'] },
    { name: 'Residential', risk: 20, tags: ['quiet', 'safe', 'family-friendly'] },
    { name: 'Industrial', risk: 55, tags: ['sparse', 'limited-lighting', 'caution'] },
    { name: 'Transit Hub', risk: 40, tags: ['crowded', 'monitored', 'public'] },
  ];

  const selected = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  return {
    areaName: selected.name,
    riskIndex: selected.risk,
    tags: selected.tags,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Get time-of-day risk multiplier
 */
export const getTimeOfDayRisk = (hour: number): { level: 'day' | 'evening' | 'night'; multiplier: number } => {
  if (hour >= 6 && hour < 18) {
    return { level: 'day', multiplier: 0.8 };
  } else if (hour >= 18 && hour < 21) {
    return { level: 'evening', multiplier: 1.0 };
  } else {
    return { level: 'night', multiplier: 1.4 };
  }
};
