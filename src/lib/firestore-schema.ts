/**
 * Firestore Data Schema for Velora SafeRoute
 * This file documents the data structure for Firestore collections
 */

/**
 * Collection: hotspots
 * Stores area risk data and safety hotspots
 */
export interface HotspotDocument {
  areaName: string;
  lat: number;
  lng: number;
  riskIndex: number; // 0-100
  tags: string[]; // e.g., ["high-traffic", "poor-lighting", "construction"]
  updatedAt: Date;
  source?: string; // e.g., "user-report", "crime-data", "traffic-api"
}

/**
 * Collection: routeSearches
 * Stores user route search history for analytics and personalization
 */
export interface RouteSearchDocument {
  origin: string;
  destination: string;
  travelMode: 'DRIVE' | 'WALK' | 'BICYCLE';
  recommendedRoute: {
    name: string;
    safetyScore: number;
    eta: string;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
  explanation: string;
  weatherCondition: string;
  createdAt: Date;
  userId?: string; // Optional for anonymous usage
}

/**
 * Collection: users (optional)
 * Stores user preferences and personalization data
 */
export interface UserDocument {
  displayName?: string;
  preferredMode: 'DRIVE' | 'WALK' | 'BICYCLE';
  frequentRoutes: Array<{
    origin: string;
    destination: string;
    savedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper to initialize Firestore collections
 * Call this once during app setup
 */
export const initializeFirestoreSchema = async () => {
  // This would be called in a Firebase Cloud Function or admin script
  // to ensure collections and indexes are properly set up
  console.log('Firestore schema initialized');
};
