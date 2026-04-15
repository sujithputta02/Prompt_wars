"use client";

import React, { useState } from 'react';
import { Search, MapPin, Navigation, Info, ShieldCheck } from '../ui/Icons';
import RouteCard from '../ui/RouteCard';
import VoiceInput from '../ui/VoiceInput';
import { fetchRouteAlternatives, RouteAlternative } from '@/lib/routes-service';
import { fetchWeatherData } from '@/lib/weather-service';
import { getTimeOfDayRisk } from '@/lib/zone-risk-service';
import { calculateSafetyScore, getRiskLevel } from '@/lib/safety-engine';
import { generateSafetyExplanation, getNeighborhoodSafetyProfile } from '@/lib/ai-provider';
import { sanitizeLocation } from '@/lib/input-sanitizer';
import { analytics } from '@/lib/analytics';
import { cacheManager } from '@/lib/cache-manager';
import { analyzePolyline, Hazard } from '@/lib/polyline-analyzer';

interface RouteWithScore extends RouteAlternative {
  safetyScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
  weatherCondition?: string;
  theftRisk?: 'Low' | 'Medium' | 'High';
  accidentZone?: boolean;
  zoneRiskData?: {
    areaName: string;
    crimeReports: number;
    accidentReports: number;
  };
  hazards?: Hazard[];
}

interface SidebarProps {
  onRouteSearch?: (origin: string, destination: string) => void;
  onRoutesFound?: (routes: RouteWithScore[]) => void;
  onRouteSelect?: (route: RouteWithScore) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onRouteSearch, onRoutesFound, onRouteSelect }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [routes, setRoutes] = useState<RouteWithScore[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [currentTimeRisk, setCurrentTimeRisk] = useState<{ level: 'day' | 'evening' | 'night'; multiplier: number }>({ level: 'day', multiplier: 0.8 });

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
        const data = await response.json();
        if (data.results && data.results[0]) {
          setOrigin(data.results[0].formatted_address);
        } else {
          setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } else {
        setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearch = async () => {
    if (!origin || !destination) return;
    const sanitizedOrigin = sanitizeLocation(origin);
    const sanitizedDestination = sanitizeLocation(destination);
    if (!sanitizedOrigin || !sanitizedDestination) return;

    if (onRouteSearch) onRouteSearch(sanitizedOrigin, sanitizedDestination);
    setIsSearching(true);
    setRoutes([]);
    setExplanation('');

    try {
      const routeResult = await fetchRouteAlternatives({ origin: sanitizedOrigin, destination: sanitizedDestination, travelMode: 'DRIVE' });
      if (routeResult.error || !routeResult.routes.length) {
        setIsSearching(false);
        return;
      }

      // Get weather for the origin of the first route
      let weatherOrigin = { lat: 19.0760, lng: 72.8777 }; // Default Mumbai
      try {
        if (routeResult.routes[0]?.polyline) {
          const path = window.google.maps.geometry.encoding.decodePath(routeResult.routes[0].polyline);
          if (path && path.length > 0) {
            const lat = path[0].lat();
            const lng = path[0].lng();
            // Validate coordinates are within world bounds before calling Weather API
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              weatherOrigin = { lat, lng };
            }
          }
        }
      } catch (e) { 
        console.warn('[Velora] Weather coordinate extraction failed, using tactical default.'); 
      }
      
      const weatherData = await fetchWeatherData(weatherOrigin.lat, weatherOrigin.lng);
      const now = new Date();
      const timeRisk = getTimeOfDayRisk(now.getHours());
      setCurrentTimeRisk(timeRisk);

      // PERFORM AI SAFETY AUDIT for the route neighborhoods
      // For MVP, we use origin and destination as our neighborhood focus
      const safetyProfiles = await getNeighborhoodSafetyProfile([sanitizedOrigin, sanitizedDestination]);

      const scoredRoutes: RouteWithScore[] = await Promise.all(
        routeResult.routes.map(async (route, index) => {
          // Pass real-time incidents and AI profiles to the analyzer
          const polylineAnalysis = analyzePolyline(route.polyline, route.incidents, safetyProfiles);
          
          const zoneRiskIndex = polylineAnalysis.crimeRisk === 'High' ? 70 : polylineAnalysis.crimeRisk === 'Medium' ? 45 : 20;
          const safetyScore = calculateSafetyScore({ 
            congestionLevel: route.congestionLevel, 
            zoneRiskIndex, 
            timeOfDay: timeRisk.level, 
            weatherSeverity: weatherData.severity, 
            complexity: route.complexity 
          });
          const riskLevel = getRiskLevel(safetyScore);
          
          let explanationText = `Tactical route verified for current ${riskLevel} risk environment.`;
          if (index < 2) {
            try {
              explanationText = await generateSafetyExplanation(
                `Route ${String.fromCharCode(65 + index)}`,
                safetyScore,
                riskLevel,
                { 
                  congestion: route.congestionLevel > 60 ? 'Heavy' : route.congestionLevel > 30 ? 'Moderate' : 'Light', 
                  weather: weatherData.condition, 
                  zone: polylineAnalysis.areaName 
                }
              );
            } catch (aiErr) {
              console.warn('AI Explanation failed for route', index);
            }
          }

          return { 
            ...route, 
            safetyScore, 
            riskLevel, 
            explanation: explanationText, 
            weatherCondition: weatherData.condition, 
            theftRisk: polylineAnalysis.crimeRisk, 
            accidentZone: polylineAnalysis.accidentZone, 
            hazards: polylineAnalysis.hazards,
            zoneRiskData: { 
              areaName: polylineAnalysis.areaName, 
              crimeReports: polylineAnalysis.crimeReports, 
              accidentReports: polylineAnalysis.accidentReports 
            } 
          };
        })
      );

      scoredRoutes.sort((a, b) => b.safetyScore - a.safetyScore);
      setRoutes(scoredRoutes);
      setSelectedRouteId(scoredRoutes[0]?.id || null);
      if (onRoutesFound) onRoutesFound(scoredRoutes);
      if (scoredRoutes.length > 0) setExplanation(scoredRoutes[0].explanation);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRouteSelect = (route: RouteWithScore) => {
    setSelectedRouteId(route.id);
    setExplanation(route.explanation);
    if (onRouteSelect) onRouteSelect(route);
  };

  return (
    <div className="flex flex-col h-full p-10 space-y-10 bg-[#0B0D11]/40 backdrop-blur-3xl border-r border-white/5 shadow-2xl overflow-hidden">
      {/* Premium Header */}
      <div className="space-y-1 animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <ShieldCheck className="w-8 h-8 text-background" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-white">VELORA</h1>
            <p className="text-[10px] font-bold text-accent tracking-[0.4em] uppercase opacity-80">SafeRoute AI</p>
          </div>
        </div>
      </div>

      {/* Integrated Search Module */}
      <div className="space-y-4 animate-fade-up [animation-delay:200ms]">
        <div className="relative group">
          <div className="absolute inset-0 bg-accent/5 rounded-3xl blur-xl group-focus-within:bg-accent/10 transition-all" />
          <div className="relative glass-morphism rounded-3xl overflow-hidden border-white/5 focus-within:border-accent/40 transition-all">
            <div className="flex items-center px-6 py-5 gap-4">
              <MapPin className="w-5 h-5 text-accent/40" />
              <input
                type="text"
                placeholder="CURRENT LOCATION"
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold tracking-widest uppercase placeholder:text-white/20"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
              <button onClick={getCurrentLocation} className="p-2 hover:bg-accent/20 rounded-xl transition-all">
                {isGettingLocation ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <Navigation className="w-4 h-4 text-accent" />}
              </button>
            </div>
            <div className="h-px bg-white/5 mx-6" />
            <div className="flex items-center px-6 py-5 gap-4">
              <Navigation className="w-5 h-5 text-accent" />
              <input
                type="text"
                placeholder="DESTINATION"
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold tracking-widest uppercase placeholder:text-white/20"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <VoiceInput onResult={(text) => setDestination(text)} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full relative group overflow-hidden bg-accent text-background font-black py-6 rounded-3xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-[0.98]"
        >
          <div className="relative z-10 flex items-center justify-center gap-3 tracking-[0.1em] uppercase">
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ANALYZING ROUTES...
              </>
            ) : (
              <>
                CALCULATE OPTIMAL PATH
                <Search className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </button>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {isSearching && (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/5" />
            ))}
          </div>
        )}

        {routes.length > 0 && (
          <div className="space-y-10 animate-fade-up">
            {/* AI Insights Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60">Velora Intelligence</h3>
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-transparent rounded-3xl opacity-50 blur" />
                <div className="relative glass-morphism p-8 rounded-3xl border-white/10 bg-black/40">
                  <p className="text-base leading-relaxed italic text-white/90 font-serif">
                    " {explanation} "
                  </p>
                </div>
              </div>
            </div>

            {/* Path Selection */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60 px-2">Validated Paths</h3>
              <div className="space-y-6 pb-20">
                {routes.map((route, index) => (
                  <div key={route.id} className="animate-fade-up" style={{ animationDelay: `${(index + 3) * 150}ms` }}>
                    <RouteCard
                      {...route}
                      risk={route.riskLevel}
                      isRecommended={index === 0}
                      isSelected={route.id === selectedRouteId}
                      onClick={() => handleRouteSelect(route)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isSearching && routes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center mb-6 opacity-20">
              <Navigation className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Awaiting Search Parameters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
