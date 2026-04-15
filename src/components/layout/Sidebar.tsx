"use client";

import React, { useState } from 'react';
import { Search, MapPin, Navigation, Info, ShieldCheck } from '../ui/Icons';
import RouteCard from '../ui/RouteCard';
import VoiceInput from '../ui/VoiceInput';
import { fetchRouteAlternatives, RouteAlternative } from '@/lib/routes-service';
import { fetchWeatherData } from '@/lib/weather-service';
import { getZoneRisk, getTimeOfDayRisk } from '@/lib/zone-risk-service';
import { calculateSafetyScore, getRiskLevel } from '@/lib/safety-engine';
import { generateSafetyExplanation } from '@/lib/ai-provider';
import { sanitizeLocation } from '@/lib/input-sanitizer';
import { analytics } from '@/lib/analytics';
import { cacheManager } from '@/lib/cache-manager';

interface RouteWithScore extends RouteAlternative {
  safetyScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
}

interface SidebarProps {
  onRouteSearch?: (origin: string, destination: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onRouteSearch }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [routes, setRoutes] = useState<RouteWithScore[]>([]);
  const [explanation, setExplanation] = useState('');

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Use Google Maps Geocoding API to get address
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
          );
          const data = await response.json();
          
          if (data.results && data.results[0]) {
            setOrigin(data.results[0].formatted_address);
            analytics.trackEvent('current_location_used', { latitude, longitude });
          } else {
            setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } else {
        setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error: any) {
      console.error('Location error:', error);
      if (error.code === 1) {
        alert('Location access denied. Please enable location permissions.');
      } else if (error.code === 2) {
        alert('Location unavailable. Please try again.');
      } else if (error.code === 3) {
        alert('Location request timed out. Please try again.');
      } else {
        alert('Unable to get your location. Please enter manually.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearch = async () => {
    if (!origin || !destination) return;

    const searchStartTime = Date.now();

    // Sanitize user inputs to prevent XSS
    const sanitizedOrigin = sanitizeLocation(origin);
    const sanitizedDestination = sanitizeLocation(destination);

    if (!sanitizedOrigin || !sanitizedDestination) {
      console.error('Invalid location input');
      return;
    }

    // Check cache first
    const cacheKey = `route:${sanitizedOrigin}:${sanitizedDestination}`;
    const cachedResult = cacheManager.get<RouteWithScore[]>(cacheKey);
    
    if (cachedResult) {
      setRoutes(cachedResult);
      analytics.trackEvent('cache_hit', { cacheKey });
      return;
    }

    // Notify parent component about the search
    if (onRouteSearch) {
      onRouteSearch(sanitizedOrigin, sanitizedDestination);
    }

    setIsSearching(true);
    setRoutes([]);
    setExplanation('');

    try {
      // Fetch routes
      const routeResult = await fetchRouteAlternatives({
        origin: sanitizedOrigin,
        destination: sanitizedDestination,
        travelMode: 'DRIVE',
      });

      // Track analytics
      analytics.trackRouteSearch(sanitizedOrigin, sanitizedDestination, routeResult.routes.length);
      analytics.trackPerformance('route_search', Date.now() - searchStartTime);

      if (routeResult.error || !routeResult.routes.length) {
        setIsSearching(false);
        return;
      }

      // Fetch weather data (using mock coordinates for demo)
      const weatherData = await fetchWeatherData(19.0760, 72.8777); // Mumbai coordinates

      // Get zone risk
      const zoneRisk = await getZoneRisk(19.0760, 72.8777);

      // Get time of day risk
      const now = new Date();
      const timeRisk = getTimeOfDayRisk(now.getHours());

      // Score each route
      const scoredRoutes: RouteWithScore[] = await Promise.all(
        routeResult.routes.map(async (route) => {
          const safetyScore = calculateSafetyScore({
            congestionLevel: route.congestionLevel,
            zoneRiskIndex: zoneRisk.riskIndex,
            timeOfDay: timeRisk.level,
            weatherSeverity: weatherData.severity,
            complexity: route.complexity,
          });

          const riskLevel = getRiskLevel(safetyScore);

          const explanation = await generateSafetyExplanation(
            route.name,
            safetyScore,
            riskLevel,
            {
              congestion: route.congestionLevel > 50 ? 'Heavy' : 'Light',
              weather: weatherData.condition,
              zone: zoneRisk.areaName,
            }
          );

          return {
            ...route,
            safetyScore,
            riskLevel,
            explanation,
          };
        })
      );

      // Sort by safety score (highest first)
      scoredRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

      setRoutes(scoredRoutes);

      // Set explanation for top route
      if (scoredRoutes.length > 0) {
        setExplanation(scoredRoutes[0].explanation);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-lg">
            <ShieldCheck className="w-6 h-6 text-background" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">Velora</h1>
        </div>
        <p className="text-sm font-medium opacity-60 uppercase tracking-widest pl-11">SafeRoute Intelligence</p>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <div className="space-y-2 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 z-10">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search Origin..."
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-accent transition-all font-sans"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-accent/20 rounded-lg transition-all group"
            title="Use current location"
          >
            {isGettingLocation ? (
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>

        <div className="space-y-2 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">
            <Navigation className="w-4 h-4 text-accent" />
          </div>
          <input
            type="text"
            placeholder="Search Destination..."
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-16 focus:outline-none focus:border-accent transition-all font-sans"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <VoiceInput onResult={(text: string) => setDestination(text)} />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full bg-accent text-background font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
        >
          {isSearching ? (
            <div className="w-6 h-6 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              Explore Smart Routes
              <div className="group-hover:translate-x-1 transition-transform">
                <Search className="w-5 h-5" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto space-y-6 -mx-2 px-2">
        {routes.length > 0 && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold italic text-accent opacity-90">AI Synthesis</h3>
                <Info className="w-4 h-4 opacity-40" />
              </div>
              
              <div className="glass-morphism p-6 rounded-3xl space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-40" />
                <p className="text-sm leading-relaxed italic opacity-90">
                  {explanation || 'Analyzing routes...'}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest pt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Gemini Insight Engine
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recommended Paths</h3>
              <div className="space-y-4 pb-8">
                {routes.map((route, index) => (
                  <RouteCard
                    key={route.id}
                    name={route.name}
                    safetyScore={route.safetyScore}
                    eta={route.eta}
                    risk={route.riskLevel}
                    isRecommended={index === 0}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {!isSearching && routes.length === 0 && (origin || destination) && (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <p className="text-sm">No routes found. Try different locations.</p>
          </div>
        )}

        {!isSearching && routes.length === 0 && !origin && !destination && (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <p className="text-sm">Enter origin and destination to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
