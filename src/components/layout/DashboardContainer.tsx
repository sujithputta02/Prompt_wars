import React from 'react';
import MapLayer from './MapLayer';

interface DashboardContainerProps {
  children: React.ReactNode;
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
  onEmergency?: () => void;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ children, origin, destination, routes, selectedRouteId, onEmergency }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0D11] text-foreground font-sans">
      {/* Sidebar Area - High-end Glass Transition */}
      <div className="w-full md:w-[480px] lg:w-[520px] h-full flex-shrink-0 z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)] animate-fade-up">
        {children}
      </div>

      {/* Map Area - Cinematic Presentation */}
      <div className="flex-1 h-full relative bg-[#0B0D11] animate-fade-scale [animation-delay:400ms]">
        <MapLayer 
          origin={origin} 
          destination={destination} 
          routes={routes} 
          selectedRouteId={selectedRouteId}
          onEmergency={onEmergency}
        />
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 pointer-events-none border-[40px] border-transparent shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] opacity-60" />
      </div>
    </div>
  );
};

export default DashboardContainer;
