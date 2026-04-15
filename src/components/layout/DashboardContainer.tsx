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
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ children, origin, destination, routes, selectedRouteId }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar Area */}
      <div className="w-full md:w-[450px] lg:w-[500px] h-full flex-shrink-0 z-10 premium-gradient border-r border-card-border shadow-2xl overflow-y-auto">
        {children}
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative bg-zinc-900">
        <MapLayer origin={origin} destination={destination} routes={routes} selectedRouteId={selectedRouteId} />
        
        {/* Overlay elements for the map */}
        <div className="absolute top-6 right-6 z-20">
          <div className="glass-morphism p-4 rounded-2xl flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-accent uppercase tracking-widest">Active Safety Layer</h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium opacity-80">Real-time scoring active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;
