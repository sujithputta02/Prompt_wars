"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    initMap?: () => void;
  }
}

interface MapLayerProps {
  origin?: string;
  destination?: string;
  routes?: Array<{
    id: string;
    polyline: string;
    safetyScore: number;
    congestionLevel: number;
    isOptimal?: boolean;
  }>;
  selectedRouteId?: string | null;
}

const MapLayer: React.FC<MapLayerProps> = ({ origin, destination, routes, selectedRouteId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const routePolylines = useRef<google.maps.Polyline[]>([]);
  const markers = useRef<google.maps.Marker[]>([]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps?.Map) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 19.0760, lng: 72.8777 },
        zoom: 12,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1A1D23" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0F1115" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2D323A" }] },
          { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3D4451" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0F1419" }] }
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });

      setMapInstance(map);
      console.log('[Velora] Google Maps initialized successfully');
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.Map) {
      initializeMap();
      return;
    }

    // Define callback function
    window.initMap = () => {
      setMapLoaded(true);
      initializeMap();
    };

    // Load script with proper async loading
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initMap&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error('[Velora] Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      delete window.initMap;
    };
  }, [initializeMap]);

  const clearMapRoutes = useCallback(() => {
    // Clear existing polylines
    routePolylines.current.forEach(polyline => polyline.setMap(null));
    routePolylines.current = [];
    
    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];
  }, []);

  const getRouteColor = (safetyScore: number, isOptimal: boolean, isSelected: boolean, congestionLevel: number) => {
    if (isOptimal && isSelected) {
      return '#10B981'; // Green for optimal route
    }
    if (isSelected) {
      return '#D4AF37'; // Gold for selected
    }
    
    // Color based on congestion level
    if (congestionLevel > 70) {
      return '#EF4444'; // Red for high congestion
    } else if (congestionLevel > 40) {
      return '#F59E0B'; // Orange for medium congestion
    } else {
      return '#6B7280'; // Gray for low congestion
    }
  };

  const drawMultipleRoutes = useCallback((routesToDraw: typeof routes) => {
    if (!mapInstance || !window.google?.maps || !routesToDraw || routesToDraw.length === 0) return;

    clearMapRoutes();

    try {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidRoute = false;

      // Suppress marker deprecation warnings
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        const firstArg = args[0];
        if (typeof firstArg === 'string' && (
          firstArg.includes('google.maps.Marker is deprecated') ||
          firstArg.includes('AdvancedMarkerElement')
        )) return;
        originalWarn.apply(console, args);
      };

      routesToDraw.forEach((route, index) => {
        if (!route.polyline) return;

        try {
          const path = window.google.maps.geometry.encoding.decodePath(route.polyline);
          if (path.length === 0) return;

          hasValidRoute = true;
          const isOptimal = index === 0;
          const isSelected = route.id === selectedRouteId;
          const color = getRouteColor(route.safetyScore, isOptimal, isSelected, route.congestionLevel);

          // Draw polyline
          const polyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: isSelected ? 0.9 : 0.5,
            strokeWeight: isSelected ? 8 : 5,
            map: mapInstance,
            zIndex: isSelected ? 1000 : (isOptimal ? 100 : 10)
          });

          routePolylines.current.push(polyline);

          // Add to bounds
          path.forEach((point: google.maps.LatLng) => bounds.extend(point));

          // Add markers only for the selected route
          if (isSelected && path.length > 0) {
            const originMarker = new window.google.maps.Marker({
              position: path[0],
              map: mapInstance,
              title: 'Origin',
              label: {
                text: 'A',
                color: '#FFFFFF',
                fontWeight: 'bold'
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }
            });

            const destMarker = new window.google.maps.Marker({
              position: path[path.length - 1],
              map: mapInstance,
              title: 'Destination',
              label: {
                text: 'B',
                color: '#FFFFFF',
                fontWeight: 'bold'
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }
            });

            markers.current.push(originMarker, destMarker);
          }
        } catch (err) {
          console.error('[Velora] Error drawing route:', err);
        }
      });

      // Restore console.warn
      console.warn = originalWarn;

      // Fit bounds if we have valid routes
      if (hasValidRoute) {
        mapInstance.fitBounds(bounds);
      }

      console.log(`[Velora] Displayed ${routesToDraw.length} routes on map`);
    } catch (err) {
      console.error('[Velora] Error drawing multiple routes:', err);
    }
  }, [mapInstance, selectedRouteId, clearMapRoutes]);

  // Update map when routes change
  useEffect(() => {
    if (!mapInstance || !window.google?.maps || !routes || routes.length === 0) return;

    drawMultipleRoutes(routes);
  }, [mapInstance, routes, selectedRouteId, drawMultipleRoutes]);

  return (
    <div className="w-full h-full relative bg-[#1A1D23] overflow-hidden">
      {/* Google Maps Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1D23]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-accent font-medium">Loading Map...</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
    </div>
  );
};

export default MapLayer;
