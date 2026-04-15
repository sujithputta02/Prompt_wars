/**
 * Routes Service
 * Integrates with Google Maps Routes API to fetch route alternatives
 */

export interface RouteAlternative {
  id: string;
  name: string;
  eta: string;
  distance: string;
  polyline: string;
  congestionLevel: number;
  complexity: number;
  incidents?: Array<{
    type: string;
    description: string;
    lat: number;
    lng: number;
  }>;
}

export interface RouteSearchParams {
  origin: string;
  destination: string;
  travelMode: 'DRIVE' | 'WALK' | 'BICYCLE';
}

export interface RouteSearchResult {
  routes: RouteAlternative[];
  error?: string;
}

/**
 * Fetch route alternatives from Google Maps Routes API
 * For MVP, returns mock data if API key is not configured
 */
export const fetchRouteAlternatives = async (
  params: RouteSearchParams
): Promise<RouteSearchResult> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key not configured, using mock data');
    return getMockRoutes(params);
  }

  try {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs,routes.travelAdvisory',
        },
        body: JSON.stringify({
          origin: { address: params.origin },
          destination: { address: params.destination },
          travelMode: params.travelMode,
          routingPreference: 'TRAFFIC_AWARE',
          computeAlternativeRoutes: true,
          routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Routes API not available:', errorData.error?.message || response.statusText);
      console.warn('Using mock data. To enable real routes, enable Routes API in Google Cloud Console.');
      return getMockRoutes(params);
    }

    const data = await response.json();
    return parseGoogleRoutesResponse(data);
  } catch (error) {
    console.warn('Routes API fetch error, using mock data:', error);
    return getMockRoutes(params);
  }
};

/**
 * Parse Google Routes API response into our format with real traffic data
 */
const parseGoogleRoutesResponse = (data: any): RouteSearchResult => {
  if (!data.routes || data.routes.length === 0) {
    return { routes: [], error: 'No routes found' };
  }

  const routes: RouteAlternative[] = data.routes.map((route: any, index: number) => {
    const leg = route.legs[0];
    const distance = leg.distanceMeters;
    const duration = leg.duration;

    // Parse duration (format: "1234s")
    const durationSeconds = parseInt(duration.replace('s', ''));
    const minutes = Math.ceil(durationSeconds / 60);

    // Extract REAL congestion from Google's traffic data
    let congestionLevel = 30; // Default moderate
    
    // Google provides staticDuration (no traffic) and duration (with traffic)
    if (leg.staticDuration && leg.duration) {
      const staticSeconds = parseInt(leg.staticDuration.replace('s', ''));
      const actualSeconds = parseInt(leg.duration.replace('s', ''));
      
      // Calculate congestion based on delay
      const delayRatio = (actualSeconds - staticSeconds) / staticSeconds;
      
      if (delayRatio > 0.5) {
        congestionLevel = 80; // Heavy traffic (50%+ delay)
      } else if (delayRatio > 0.25) {
        congestionLevel = 60; // Moderate-heavy traffic (25-50% delay)
      } else if (delayRatio > 0.1) {
        congestionLevel = 40; // Light-moderate traffic (10-25% delay)
      } else {
        congestionLevel = 20; // Light traffic (<10% delay)
      }
    }
    
    // Extract real incidents if available in travelAdvisory
    const incidents: NonNullable<RouteAlternative['incidents']> = [];
    if (route.travelAdvisory?.trafficIncidents) {
      route.travelAdvisory.trafficIncidents.forEach((inc: any) => {
        incidents.push({
          type: inc.type || 'HAZARD',
          description: inc.description || 'Road incident reported',
          lat: inc.location?.latLng?.latitude || 0,
          lng: inc.location?.latLng?.longitude || 0
        });
      });
    }

    return {
      id: `route-${index}`,
      name: `Route ${String.fromCharCode(65 + index)}`,
      eta: `${minutes} min`,
      distance: `${(distance / 1000).toFixed(1)} km`,
      polyline: route.polyline?.encodedPolyline || '',
      congestionLevel,
      complexity: estimateComplexity(leg),
      incidents
    };
  });

  return { routes };
};

/**
 * Estimate congestion level from traffic data (0-100)
 */
const estimateCongestion = (leg: any): number => {
  if (!leg.trafficInfo) return 30;

  const speedRatio = leg.trafficInfo.currentSpeed / leg.trafficInfo.speedLimit;
  return Math.max(0, Math.min(100, Math.round((1 - speedRatio) * 100)));
};

/**
 * Estimate route complexity based on number of steps (0-100)
 */
const estimateComplexity = (leg: any): number => {
  const steps = leg.steps || [];
  return Math.min(100, Math.round((steps.length / 20) * 100));
};

/**
 * Mock routes for demo/MVP with varied characteristics
 */
const getMockRoutes = (params: RouteSearchParams): RouteSearchResult => {
  // Generate varied routes with different characteristics
  const routes: RouteAlternative[] = [
    {
      id: 'route-0',
      name: 'Route A',
      eta: '18 min',
      distance: '8.2 km',
      polyline: 'mock-polyline-a',
      congestionLevel: 25, // Low congestion - should score high
      complexity: 35,
    },
    {
      id: 'route-1',
      name: 'Route B',
      eta: '14 min',
      distance: '7.5 km',
      polyline: 'mock-polyline-b',
      congestionLevel: 75, // High congestion - should score lower
      complexity: 45,
    },
    {
      id: 'route-2',
      name: 'Route C',
      eta: '22 min',
      distance: '9.1 km',
      polyline: 'mock-polyline-c',
      congestionLevel: 50, // Medium congestion - should score medium
      complexity: 60,
    },
  ];

  return { routes };
};
