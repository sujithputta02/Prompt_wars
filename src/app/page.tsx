"use client";

import React, { useState } from 'react';
import DashboardContainer from '@/components/layout/DashboardContainer';
import Sidebar from '@/components/layout/Sidebar';
import ARTeaser from '@/components/ui/ARTeaser';
import SkipToContent from '@/components/ui/SkipToContent';
import ClientOnly from '@/components/ClientOnly';

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

  const handleRoutesFound = (foundRoutes: RouteWithScore[]) => {
    setRoutes(foundRoutes);
    setSelectedRouteId(foundRoutes[0]?.id || null);
  };

  const handleRouteSelect = (route: RouteWithScore) => {
    setSelectedRouteId(route.id);
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
        
        <ARTeaser />
      </main>
    </ClientOnly>
  );
}
