"use client";

import React, { useState } from 'react';
import DashboardContainer from '@/components/layout/DashboardContainer';
import Sidebar from '@/components/layout/Sidebar';
import ARTeaser from '@/components/ui/ARTeaser';

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <main className="min-h-screen">
      <DashboardContainer origin={origin} destination={destination}>
        <Sidebar onRouteSearch={(orig, dest) => {
          setOrigin(orig);
          setDestination(dest);
        }} />
      </DashboardContainer>
      
      <ARTeaser />
    </main>
  );
}
