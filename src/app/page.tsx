"use client";

import React, { useState } from 'react';
import DashboardContainer from '@/components/layout/DashboardContainer';
import Sidebar from '@/components/layout/Sidebar';
import ARTeaser from '@/components/ui/ARTeaser';
import SkipToContent from '@/components/ui/SkipToContent';
import ClientOnly from '@/components/ClientOnly';

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <ClientOnly>
      <SkipToContent />
      <main id="main-content" className="min-h-screen" role="main" aria-label="Velora SafeRoute Application">
        <DashboardContainer origin={origin} destination={destination}>
          <Sidebar onRouteSearch={(orig, dest) => {
            setOrigin(orig);
            setDestination(dest);
          }} />
        </DashboardContainer>
        
        <ARTeaser />
      </main>
    </ClientOnly>
  );
}
