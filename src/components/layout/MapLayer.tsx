"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    initMap?: () => void;
  }
}

import { Hazard } from '@/lib/polyline-analyzer';

interface MapLayerProps {
  origin?: string;
  destination?: string;
  routes?: Array<{
    id: string;
    polyline: string;
    safetyScore: number;
    congestionLevel: number;
    isOptimal?: boolean;
    hazards?: Hazard[];
  }>;
  selectedRouteId?: string | null;
  onEmergency?: () => void;
}

// Premium Luxury Map Style
const MAP_STYLE_PREMIUM = [
  { elementType: "geometry", stylers: [{ color: "#0B0D11" }] },
  { elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4B5563" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "administrative.province", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0F1115" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#0F1115" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#4B5563" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2D343F" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1F2937" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#4B5563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050608" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
];

const MapLayer: React.FC<MapLayerProps> = ({ origin, destination, routes, selectedRouteId, onEmergency }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [showStreetView, setShowStreetView] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState<{ lat: number; lng: number } | null>(null);
  const routePolylines = useRef<google.maps.Polyline[]>([]);
  const flowPolylines = useRef<google.maps.Polyline[]>([]);
  const markers = useRef<any[]>([]);
  const hazardMarkers = useRef<any[]>([]);
  const safeZoneMarkers = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps?.Map) return;

    try {
      // Determine color scheme based on current time (Tactical Sync)
      const currentHour = new Date().getHours();
      const isNightTime = currentHour >= 18 || currentHour <= 6;
      const colorScheme = isNightTime ? 'DARK' : 'LIGHT' as any;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 19.0760, lng: 72.8777 },
        zoom: 12,
        mapTypeId: mapType,
        mapId: 'DEMO_MAP_ID',
        colorScheme: colorScheme,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        backgroundColor: isNightTime ? '#0B0D11' : '#F5F5F0',
      });

      setMapInstance(map);
      console.log('[Velora] Premium Maps initialized with Advanced Marker support');
    } catch (err) {
      console.error('[Velora] Error initializing map:', err);
    }
  }, [mapType]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    // Check if script already exists to prevent multiple injections (HMR)
    const scriptId = 'google-maps-engine';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (window.google?.maps?.Map) {
      setMapLoaded(true);
      initializeMap();
      return;
    }

    window.initMap = () => {
      console.log('[Velora] Google Maps Core, Geometry & Markers ready');
      setMapLoaded(true);
      initializeMap();
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.google?.maps) {
      // Script exists but maybe not initialized in this component mount
      window.initMap();
    }

    return () => { 
      // Do not delete window.initMap as it might be needed by other instances or re-mounts
    };
  }, [initializeMap]);

  const clearMapRoutes = useCallback(() => {
    routePolylines.current.forEach(p => p.setMap(null));
    routePolylines.current = [];
    flowPolylines.current.forEach(p => p.setMap(null));
    flowPolylines.current = [];
    markers.current.forEach(m => (m.map = null));
    markers.current = [];
    hazardMarkers.current.forEach(m => (m.map = null));
    hazardMarkers.current = [];
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const createIconElement = (icon: any) => {
    const div = document.createElement('div');
    if (!icon || !icon.path) return div;

    div.style.position = 'relative';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', (24 * (icon.scale || 1)).toString());
    svg.setAttribute('height', (24 * (icon.scale || 1)).toString());
    svg.style.filter = 'drop-shadow(0 0 10px rgba(0,0,0,0.5))';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Handle Google Maps Symbol constants vs Path strings
    let d = icon.path;
    if (typeof d === 'number' && window.google?.maps?.SymbolPath) {
      if (d === window.google.maps.SymbolPath.CIRCLE) {
        d = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z";
      }
    }

    path.setAttribute('d', d);
    path.setAttribute('fill', icon.fillColor || '#D4AF37');
    if (icon.strokeColor) {
      path.setAttribute('stroke', icon.strokeColor);
      path.setAttribute('stroke-width', (icon.strokeWeight || 1).toString());
    }

    svg.appendChild(path);
    div.appendChild(svg);
    return div;
  };

  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'crime':
        return {
          path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 1.2
        };
      case 'accident':
        return {
          path: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
          fillColor: '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 1.2
        };
      case 'traffic':
        return {
          path: "M20 10h-3V8.86c1.72-.45 3-2 3-3.86 0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.86 1.28 3.41 3 3.86V10H9V8.86c1.72-.45 3-2 3-3.86 0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.86 1.28 3.41 3 3.86V10H4c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h1v2c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-2h6v2c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-2h1c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2z",
          fillColor: '#D4AF37',
          fillOpacity: 1,
          strokeColor: '#000000',
          strokeWeight: 1,
          scale: 1
        };
      case 'weather':
        return {
          path: "M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z",
          fillColor: '#FFFFFF',
          fillOpacity: 0.8,
          strokeColor: '#D4AF37',
          strokeWeight: 1,
          scale: 1
        };
      default:
        return { path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", fillColor: '#D4AF37', scale: 0.5 };
    }
  };

  const animateFlow = useCallback(() => {
    let count = 0;
    const step = () => {
      count = (count + 1) % 200;
      flowPolylines.current.forEach(line => {
        const icons = line.get('icons');
        if (icons && icons[0]) {
          icons[0].offset = (count / 2) + '%';
          line.set('icons', icons);
        }
      });
      animationFrameRef.current = requestAnimationFrame(step);
    };
    step();
  }, []);

  const getRouteColor = (safetyScore: number, isOptimal: boolean, isSelected: boolean, congestionLevel: number) => {
    if (isOptimal && isSelected) return '#D4AF37'; // Luxury Gold
    if (isSelected) return '#D4AF37'; 
    if (isOptimal) return 'rgba(212, 175, 55, 0.4)';
    
    if (congestionLevel > 70) return '#EF4444'; 
    if (congestionLevel > 40) return '#F59E0B'; 
    return 'rgba(255, 255, 255, 0.15)';
  };

  const drawHazardMarkers = useCallback((hazards: Hazard[]) => {
    if (!mapInstance || !hazards) return;
    if (!(window.google as any).maps.marker?.AdvancedMarkerElement) {
      console.warn('[Velora] AdvancedMarkerElement library not loaded yet');
      return;
    }

    hazards.forEach((hazard) => {
      const marker = new (window.google as any).maps.marker.AdvancedMarkerElement({
        position: { lat: hazard.lat, lng: hazard.lng },
        map: mapInstance,
        content: createIconElement(getHazardIcon(hazard.type)),
        title: hazard.label,
        zIndex: 3000,
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; background: #0B0D11; border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; color: white; font-family: sans-serif;">
            <div style="font-size: 10px; font-weight: 800; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Tactical Alert</div>
            <div style="font-size: 13px; font-weight: 600;">${hazard.label}</div>
            <div style="font-size: 10px; opacity: 0.6; margin-top: 4px;">Severity: ${hazard.severity}</div>
          </div>
        `,
        disableAutoPan: true,
      });

      marker.addListener('click', () => infoWindow.open(mapInstance, marker));

      hazardMarkers.current.push(marker);
    });
  }, [mapInstance]);

  const drawMultipleRoutes = useCallback((routesToDraw: NonNullable<MapLayerProps['routes']>) => {
    if (!mapInstance || !window.google?.maps || !routesToDraw || routesToDraw.length === 0) return;

    // Safety guard for geometry library
    if (!window.google.maps.geometry?.encoding) {
      console.warn('[Velora] Geometry library not yet available, deferring render');
      setTimeout(() => drawMultipleRoutes(routesToDraw), 500);
      return;
    }

    try {
      clearMapRoutes();
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidPoints = false;
      const markersLibrary = (window.google as any).maps.marker;

      routesToDraw.forEach((route, index) => {
        if (!route.polyline) return;
        
        try {
          const path = window.google.maps.geometry.encoding.decodePath(route.polyline);
          if (!path || path.length === 0) return;

          const isOptimal = index === 0;
          const isSelected = route.id === selectedRouteId;
          const color = getRouteColor(route.safetyScore, isOptimal, isSelected, route.congestionLevel);

          // Base Polyline (Background)
          const polyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: isSelected ? '#D4AF37' : color,
            strokeOpacity: isSelected ? 1 : 0.6,
            strokeWeight: isSelected ? 6 : 4,
            map: mapInstance,
            zIndex: isSelected ? 1000 : (isOptimal ? 100 : 10)
          });
          routePolylines.current.push(polyline);

          // Draw Hazards ONLY for the selected route
          if (isSelected && route.hazards) {
            drawHazardMarkers(route.hazards);
          }

          // Flow Animation Polyline (Only for selected or optimal)
          if (isSelected || (isOptimal && !selectedRouteId)) {
            const flowLine = new window.google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: '#FFFFFF',
              strokeOpacity: 0,
              icons: [{
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 3,
                  fillColor: '#FFFFFF',
                  fillOpacity: 1,
                  strokeWeight: 0
                },
                offset: '0%',
                repeat: '50px'
              }],
              map: mapInstance,
              zIndex: 1001
            });
            flowPolylines.current.push(flowLine);
          }

          path.forEach(point => {
            bounds.extend(point);
            hasValidPoints = true;
          });

          if (isSelected && path.length > 0 && markersLibrary?.AdvancedMarkerElement) {
            // Custom Pulsing Origin Marker
            const originMarker = new markersLibrary.AdvancedMarkerElement({
              position: path[0],
              map: mapInstance,
              content: createIconElement({
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 0.8,
                fillColor: '#D4AF37',
                strokeColor: '#FFFFFF',
                strokeWeight: 3
              }),
              zIndex: 2000
            });

            // Custom Destination Marker
            const destMarker = new markersLibrary.AdvancedMarkerElement({
              position: path[path.length - 1],
              map: mapInstance,
              content: createIconElement({
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: '#D4AF37',
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 1.5
              }),
              zIndex: 2000
            });

            markers.current.push(originMarker, destMarker);
          }
        } catch (routeErr) {
          console.error('[Velora] Error drawing individual route:', routeErr);
        }
      });

      if (hasValidPoints && !bounds.isEmpty()) {
        mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 450 });
      }
      animateFlow();
    } catch (err) {
      console.error('[Velora] Fatal error in drawMultipleRoutes:', err);
    }
  }, [mapInstance, selectedRouteId, clearMapRoutes, animateFlow]);

  useEffect(() => {
    if (!mapInstance || !routes || routes.length === 0) return;
    drawMultipleRoutes(routes);
  }, [mapInstance, routes, selectedRouteId, drawMultipleRoutes]);

  useEffect(() => {
    if (mapInstance) mapInstance.setMapTypeId(mapType);
  }, [mapInstance, mapType]);

  return (
    <div className="w-full h-full relative bg-[#0B0D11] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />

      {/* Luxury Loading */}
      {!mapLoaded && !mapInstance && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D11] z-50">
          <div className="relative">
            <div className="w-24 h-24 border-t-2 border-accent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-b-2 border-accent/40 rounded-full animate-spin [animation-duration:3s]" />
            </div>
            <p className="mt-8 text-[10px] font-bold text-accent tracking-[0.5em] uppercase animate-pulse text-center">Calibrating</p>
          </div>
        </div>
      )}

      {/* SOS Button - Premium Redesign */}
      <div className="absolute top-8 left-8 z-30">
        <button
          onClick={onEmergency}
          className="group relative overflow-hidden bg-red-600/10 backdrop-blur-xl border border-red-500/30 p-1 rounded-2xl transition-all hover:scale-105 active:scale-95"
        >
          <div className="flex items-center gap-4 px-6 py-4 rounded-xl bg-gradient-to-br from-red-600 to-red-800 shadow-[0_0_40px_rgba(220,38,38,0.2)]">
            <span className="text-2xl animate-pulse">🚨</span>
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Emergency</div>
              <div className="text-lg font-black text-white leading-tight">ACTIVE SOS</div>
            </div>
          </div>
          <div className="absolute inset-0 bg-red-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </button>
      </div>

      {/* Map Controls - Premium Redesign */}
      <div className="absolute bottom-12 right-12 z-20 flex items-end gap-6">
        <div className="glass-morphism p-2 rounded-2xl flex flex-col gap-1 border-white/5">
          <button onClick={() => mapInstance?.setZoom((mapInstance?.getZoom() || 12) + 1)} className="w-10 h-10 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center text-accent">＋</button>
          <div className="h-px bg-white/5 mx-2" />
          <button onClick={() => mapInstance?.setZoom((mapInstance?.getZoom() || 12) - 1)} className="w-10 h-10 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center text-accent">－</button>
        </div>

        <div className="glass-morphism px-6 py-4 rounded-3xl border-white/5 flex gap-8 items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-accent/40 uppercase tracking-widest">Perspective</span>
            <div className="flex gap-4">
              {['roadmap', 'satellite', 'hybrid'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMapType(type as any)}
                  className={`text-xs font-bold uppercase tracking-widest transition-all ${
                    mapType === type ? 'text-accent' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0B0D11] via-transparent to-transparent opacity-80" />
    </div>
  );
};

export default MapLayer;
