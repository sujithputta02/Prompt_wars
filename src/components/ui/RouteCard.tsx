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
}

const RouteCard: React.FC<RouteCardProps> = ({ name, safetyScore, eta, risk, isRecommended }) => {
  const getRiskColor = (r: string) => {
    switch (r) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div 
      className={`relative glass-morphism p-5 rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        isRecommended ? 'border-accent/40 bg-accent/5 gold-glow shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'hover:border-white/20'
      }`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-6 flex items-center gap-1.5 bg-accent text-background px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
          <CheckCircle2 className="w-3 h-3" />
          Velora Choice
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div>
            <h4 className="text-xl font-bold tracking-tight">{name}</h4>
            <div className="flex items-center gap-3 mt-1.5 opacity-60">
              <div className="flex items-center gap-1 text-xs font-medium">
                <Clock className="w-3 h-3" />
                {eta}
              </div>
              <div className="text-[10px]">•</div>
              <div className={`flex items-center gap-1 text-xs font-bold ${getRiskColor(risk)}`}>
                <AlertTriangle className="w-3 h-3" />
                {risk} Risk
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase opacity-40 tracking-wider">Safety Score</span>
              <span className="text-2xl font-black text-accent">{safetyScore}<span className="text-xs opacity-40 font-normal ml-0.5">/100</span></span>
            </div>
            <div className="w-px h-10 bg-card-border" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold uppercase opacity-40 tracking-wider">Conditions</span>
              <span className="text-xs font-medium mt-1 truncate">Clear traffic • Well lit</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between h-full pl-4 border-l border-card-border ml-4">
          <SafetyGauge score={safetyScore} size={60} strokeWidth={6} />
          <div className="mt-4 opacity-20">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;
