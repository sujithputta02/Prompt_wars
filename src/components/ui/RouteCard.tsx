"use client";

import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight } from './Icons';
import SafetyGauge from './SafetyGauge';

interface RouteCardProps {
  name: string;
  safetyScore: number;
  eta: string;
  risk: 'Low' | 'Medium' | 'High';
  isRecommended?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  congestionLevel?: number;
  complexity?: number;
  weatherCondition?: string;
  theftRisk?: 'Low' | 'Medium' | 'High';
  accidentZone?: boolean;
  zoneRiskData?: {
    areaName: string;
    crimeReports: number;
    accidentReports: number;
  };
}

const RouteCard: React.FC<RouteCardProps> = ({ 
  name, 
  safetyScore, 
  eta, 
  risk, 
  isRecommended, 
  onClick, 
  isSelected, 
  congestionLevel = 0, 
  complexity = 0, 
  weatherCondition = 'Clear',
  theftRisk = 'Low',
  accidentZone = false,
  zoneRiskData
}) => {
  const getRiskColor = (r: string) => {
    switch (r) {
      case 'Low': return 'text-emerald-400';
      case 'Medium': return 'text-amber-400';
      case 'High': return 'text-rose-400';
      default: return 'text-zinc-400';
    }
  };

  const getTrafficCondition = () => {
    if (congestionLevel < 30) return 'LIGHT';
    if (congestionLevel < 60) return 'MODERATE';
    return 'HEAVY';
  };

  const getWeatherDisplay = () => {
    const weather = weatherCondition.toLowerCase();
    if (weather.includes('clear') || weather.includes('sunny')) return '☀️';
    if (weather.includes('cloud')) return '☁️';
    if (weather.includes('rain')) return '🌧️';
    if (weather.includes('storm')) return '⛈️';
    return '⛅';
  };

  return (
    <div 
      onClick={onClick}
      className={`relative group cursor-pointer transition-all duration-500 rounded-3xl overflow-hidden ${
        isSelected ? 'scale-[1.02] active:scale-100' : 'hover:scale-[1.01]'
      }`}
    >
      {/* Background with Glow */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent blur-3xl scale-110" />
      </div>

      <div className={`relative glass-morphism p-6 flex flex-col gap-6 border-white/5 transition-all duration-500 ${
        isSelected ? 'border-accent/40 bg-accent/5' : 'group-hover:border-white/20'
      }`}>
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute top-0 right-0 bg-accent px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-[0.2em] text-background shadow-lg">
            OPTIMAL PATH
          </div>
        )}

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className={`text-2xl font-black tracking-tight transition-colors ${isSelected ? 'text-accent' : 'text-white'}`}>
              {name}
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 tracking-widest uppercase">
                <Clock className="w-3.5 h-3.5 text-accent" />
                {eta}
              </div>
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <div className={`flex items-center gap-2 text-[10px] font-black tracking-widest uppercase ${getRiskColor(risk)}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {risk} RISK
              </div>
            </div>
          </div>
          <div className="relative">
             <SafetyGauge score={safetyScore} size={80} strokeWidth={8} />
             <div className="absolute inset-0 flex items-center justify-center pt-1">
                <span className="text-xl font-black text-white">{safetyScore}</span>
             </div>
          </div>
        </div>

        {/* Dynamic Metrics Row */}
        <div className="grid grid-cols-3 gap-6 py-4 border-y border-white/5">
           <div className="space-y-1">
              <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase block">Traffic</span>
              <span className="text-xs font-black text-white/80">{getTrafficCondition()}</span>
           </div>
           <div className="space-y-1">
              <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase block">Weather</span>
              <span className="text-xs font-black text-white/80">{getWeatherDisplay()} {weatherCondition.toUpperCase()}</span>
           </div>
           <div className="space-y-1">
              <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase block">Area Risk</span>
              <span className={`text-xs font-black ${theftRisk === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {theftRisk.toUpperCase()}
              </span>
           </div>
        </div>

        {/* Detailed Insights (Only for selected) */}
        {isSelected && (
          <div className="animate-fade-up flex flex-col gap-4">
            {zoneRiskData && (
              <div className="flex gap-6 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex-1 space-y-1">
                   <span className="text-[9px] font-bold text-accent tracking-widest uppercase">{zoneRiskData.areaName} Intel</span>
                   <div className="flex gap-4">
                      <div className="text-[10px] text-white/60">
                         <span className="text-white font-bold">{zoneRiskData.crimeReports}</span> CRIME ALERTS
                      </div>
                      <div className="text-[10px] text-white/60">
                         <span className="text-white font-bold">{zoneRiskData.accidentReports}</span> ACCIDENTS
                      </div>
                   </div>
                </div>
                {accidentZone && (
                  <div className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-3 py-1 rounded-full border border-rose-500/30 uppercase tracking-widest">
                    Caution Zone
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 text-accent group/btn">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Route Details</span>
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteCard;
