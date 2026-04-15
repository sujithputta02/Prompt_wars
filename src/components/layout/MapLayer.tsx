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
}

interface GoogleMapsRoute {
  legs?: Array<{
    polyline?: {
      encodedPolyline?: string;
    };
  }>;
}

const MapLayer: React.FC<MapLayerProps> = ({ origin, destination }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

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

      // Suppress deprecation warnings for DirectionsRenderer
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        const firstArg = args[0];
        if (typeof firstArg === 'string' && firstArg.includes('DirectionsRenderer is deprecated')) return;
        originalWarn.apply(console, args);
      };

      // Initialize DirectionsRenderer
      directionsRenderer.current = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#D4AF37',
          strokeWeight: 6,
          strokeOpacity: 0.8
        }
      });

      // Restore original console.warn
      console.warn = originalWarn;

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

  const drawRouteFromPolyline = useCallback((route: GoogleMapsRoute) => {
    if (!mapInstance || !window.google?.maps) return;

    try {
      const polyline = route.legs?.[0]?.polyline?.encodedPolyline;
      if (!polyline) {
        console.warn('[Velora] No polyline data');
        return;
      }

      // Decode polyline
      const path = window.google.maps.geometry.encoding.decodePath(polyline);

      // Draw polyline
      new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#D4AF37',
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: mapInstance
      });

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

      // Add markers
      if (path.length > 0) {
        new window.google.maps.Marker({
          position: path[0],
          map: mapInstance,
          title: 'Origin',
          label: 'A'
        });

        new window.google.maps.Marker({
          position: path[path.length - 1],
          map: mapInstance,
          title: 'Destination',
          label: 'B'
        });

        // Fit bounds
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((point: google.maps.LatLng) => bounds.extend(point));
        mapInstance.fitBounds(bounds);
      }

      // Restore console.warn
      console.warn = originalWarn;
    } catch (err) {
      console.error('[Velora] Error drawing route:', err);
    }
  }, [mapInstance]);

  // Fallback: Draw simple line when Directions API is not available
  const drawSimpleLine = useCallback(async (originAddr: string, destinationAddr: string) => {
    if (!mapInstance || !window.google?.maps) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      // Geocode origin
      const originResult = await new Promise<google.maps.LatLng | null>((resolve) => {
        geocoder.geocode({ address: originAddr }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].geometry.location);
          } else {
            resolve(null);
          }
        });
      });

      // Geocode destination
      const destResult = await new Promise<google.maps.LatLng | null>((resolve) => {
        geocoder.geocode({ address: destinationAddr }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].geometry.location);
          } else {
            resolve(null);
          }
        });
      });

      if (originResult && destResult) {
        // Draw line
        new window.google.maps.Polyline({
          path: [originResult, destResult],
          geodesic: true,
          strokeColor: '#D4AF37',
          strokeOpacity: 0.8,
          strokeWeight: 6,
          map: mapInstance
        });

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

        // Add markers
        new window.google.maps.Marker({
          position: originResult,
          map: mapInstance,
          title: 'Origin',
          label: 'A'
        });

        new window.google.maps.Marker({
          position: destResult,
          map: mapInstance,
          title: 'Destination',
          label: 'B'
        });

        // Restore console.warn
        console.warn = originalWarn;

        // Fit bounds
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(originResult);
        bounds.extend(destResult);
        mapInstance.fitBounds(bounds);

        console.log('[Velora] Showing direct line (Directions API not enabled)');
      }
    } catch (err) {
      console.error('[Velora] Error drawing fallback line:', err);
    }
  }, [mapInstance]);

  const fetchAndDrawRoute = useCallback(async (originAddr: string, destinationAddr: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.legs.polyline,routes.distanceMeters,routes.duration'
        },
        body: JSON.stringify({
          origin: { address: originAddr },
          destination: { address: destinationAddr },
          travelMode: 'DRIVE',
          computeAlternativeRoutes: false
        })
      });

      if (!response.ok) {
        console.warn('[Velora] Routes API not available, using fallback visualization');
        await drawSimpleLine(originAddr, destinationAddr);
        return;
      }

      const data = await response.json();
      if (data.routes && data.routes[0]) {
        drawRouteFromPolyline(data.routes[0]);
        console.log('[Velora] Route displayed using Routes API');
      } else {
        await drawSimpleLine(originAddr, destinationAddr);
      }
    } catch (err) {
      console.warn('[Velora] Routes API error, using fallback');
      await drawSimpleLine(originAddr, destinationAddr);
    }
  }, [drawRouteFromPolyline, drawSimpleLine]);

  // Update map when origin/destination changes
  useEffect(() => {
    if (!mapInstance || !window.google?.maps || !origin || !destination) return;

    fetchAndDrawRoute(origin, destination);
  }, [mapInstance, origin, destination, fetchAndDrawRoute]);

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
