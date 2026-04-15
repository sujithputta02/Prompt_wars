"use client";

import React, { useState } from 'react';
import DashboardContainer from '@/components/layout/DashboardContainer';
import Sidebar from '@/components/layout/Sidebar';
import ARTeaser from '@/components/ui/ARTeaser';
import SkipToContent from '@/components/ui/SkipToContent';
import ClientOnly from '@/components/ClientOnly';
import EmergencyModal from '@/components/ui/EmergencyModal';

interface RouteWithScore {
  id: string;
  polyline: string;
  safetyScore: number;
  congestionLevel: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
  name: string;
  eta: string;
  distance: string;
  complexity: number;
}

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState<RouteWithScore[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  const handleRoutesFound = (foundRoutes: RouteWithScore[]) => {
    setRoutes(foundRoutes);
    setSelectedRouteId(foundRoutes[0]?.id || null);
  };

  const handleRouteSelect = (route: RouteWithScore) => {
    setSelectedRouteId(route.id);
  };

  const handleEmergency = () => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setShowEmergency(true);
        },
        () => {
          // If location fails, still show emergency modal
          setShowEmergency(true);
        }
      );
    } else {
      setShowEmergency(true);
    }
  };

  const mapRoutes = routes.map((route, index) => ({
    id: route.id,
    polyline: route.polyline,
    safetyScore: route.safetyScore,
    congestionLevel: route.congestionLevel,
    isOptimal: index === 0
  }));

  return (
    <ClientOnly>
      <SkipToContent />
      <main id="main-content" className="min-h-screen" role="main" aria-label="Velora SafeRoute Application">
        <DashboardContainer 
          origin={origin} 
          destination={destination}
          routes={mapRoutes}
          selectedRouteId={selectedRouteId}
          onEmergency={handleEmergency}
        >
          <Sidebar 
            onRouteSearch={(orig, dest) => {
              setOrigin(orig);
              setDestination(dest);
            }}
            onRoutesFound={handleRoutesFound}
            onRouteSelect={handleRouteSelect}
          />
        </DashboardContainer>
        
        <ARTeaser 
          selectedRoute={routes.find(r => r.id === selectedRouteId)} 
        />
        
        <EmergencyModal 
          isOpen={showEmergency}
          onClose={() => setShowEmergency(false)}
          userLocation={userLocation}
        />
      </main>
    </ClientOnly>
  );
}
