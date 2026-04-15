/**
 * Zone Risk Service
 * Evaluates area safety based on location data
 */

export interface ZoneRiskData {
  areaName: string;
  riskIndex: number; // 0-100
  tags: string[];
  lastUpdated: string;
  theftRisk: 'Low' | 'Medium' | 'High';
  accidentZone: boolean;
  crimeReports: number; // Recent crime reports in area
  accidentReports: number; // Recent accident reports
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
 * Mock zone risk data with theft and accident information
 * In production, this would query real-time crime and accident databases
 */
const getMockZoneRisk = (_lat: number, _lng: number): ZoneRiskData => {
  // Simulate different risk levels based on coordinates
  // Each zone has unique theft risk and accident data
  const riskLevels = [
    { 
      name: 'Downtown', 
      risk: 35, 
      tags: ['commercial', 'well-lit', 'busy'],
      theftRisk: 'Medium' as const,
      accidentZone: true,
      crimeReports: 12,
      accidentReports: 8
    },
    { 
      name: 'Residential', 
      risk: 20, 
      tags: ['quiet', 'safe', 'family-friendly'],
      theftRisk: 'Low' as const,
      accidentZone: false,
      crimeReports: 2,
      accidentReports: 1
    },
    { 
      name: 'Industrial', 
      risk: 55, 
      tags: ['sparse', 'limited-lighting', 'caution'],
      theftRisk: 'High' as const,
      accidentZone: true,
      crimeReports: 18,
      accidentReports: 15
    },
    { 
      name: 'Transit Hub', 
      risk: 40, 
      tags: ['crowded', 'monitored', 'public'],
      theftRisk: 'Medium' as const,
      accidentZone: true,
      crimeReports: 9,
      accidentReports: 6
    },
  ];

  const selected = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  return {
    areaName: selected.name,
    riskIndex: selected.risk,
    tags: selected.tags,
    lastUpdated: new Date().toISOString(),
    theftRisk: selected.theftRisk,
    accidentZone: selected.accidentZone,
    crimeReports: selected.crimeReports,
    accidentReports: selected.accidentReports,
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

/**
 * Get zone risk index for a location string (0-100)
 * Used for safety score calculation
 */
export const getZoneRiskIndex = (location: string): number => {
  const locationLower = location.toLowerCase();

  // High-risk zones (60-100)
  const highRiskZones = ['dharavi', 'kurla', 'mankhurd'];
  if (highRiskZones.some((zone) => locationLower.includes(zone))) {
    return 70;
  }

  // Medium-risk zones (30-59)
  const mediumRiskZones = ['andheri', 'borivali', 'malad'];
  if (mediumRiskZones.some((zone) => locationLower.includes(zone))) {
    return 45;
  }

  // Low-risk zones (0-29)
  const lowRiskZones = ['bandra', 'juhu', 'powai', 'colaba'];
  if (lowRiskZones.some((zone) => locationLower.includes(zone))) {
    return 20;
  }

  // Default medium risk for unknown zones
  return 40;
};

/**
 * Get route-specific zone risk by analyzing multiple points along the route
 * Returns aggregated risk data for the entire route
 */
export const getRouteZoneRisk = async (routeIndex: number): Promise<ZoneRiskData> => {
  // Simulate different zone risks for different routes
  // In production, this would analyze multiple GPS points along the route polyline
  
  const routeZones: ZoneRiskData[] = [
    // Route A - Safest route through residential areas
    {
      areaName: 'Residential Area',
      riskIndex: 20,
      tags: ['quiet', 'safe', 'well-lit'],
      lastUpdated: new Date().toISOString(),
      theftRisk: 'Low',
      accidentZone: false,
      crimeReports: 2,
      accidentReports: 1,
    },
    // Route B - Through busy commercial area with higher theft risk
    {
      areaName: 'Commercial District',
      riskIndex: 55,
      tags: ['busy', 'theft-prone', 'monitored'],
      lastUpdated: new Date().toISOString(),
      theftRisk: 'High',
      accidentZone: true,
      crimeReports: 18,
      accidentReports: 12,
    },
    // Route C - Mixed area with moderate risks
    {
      areaName: 'Transit Hub',
      riskIndex: 40,
      tags: ['crowded', 'pickpocket-risk', 'public'],
      lastUpdated: new Date().toISOString(),
      theftRisk: 'Medium',
      accidentZone: true,
      crimeReports: 9,
      accidentReports: 7,
    },
  ];

  // Return zone data based on route index
  return routeZones[routeIndex % routeZones.length];
};
