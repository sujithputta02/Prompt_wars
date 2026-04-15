"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Shield, AlertCircle, MapPin, X, ShieldCheck } from './Icons';

interface ARTeaserProps {
  selectedRoute?: {
    id: string;
    safetyScore: number;
    eta: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    name: string;
  };
}

const ARTeaser: React.FC<ARTeaserProps> = ({ selectedRoute }) => {
  const [isActive, setIsActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setHasCamera(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable');
    }
  }, []);

  useEffect(() => {
    if (isActive && hasCamera) {
      setIsScanning(true);
      startCamera();
      
      const timer = setTimeout(() => {
        setIsScanning(false);
      }, 3500);
      
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    }
  }, [isActive, hasCamera, startCamera, stopCamera]);

  const handleClose = () => {
    setIsActive(false);
    setIsScanning(false);
    setCameraError('');
    stopCamera();
  };

  if (!hasCamera) return null;

  const HUDContent = () => (
    <div className={`relative h-full flex flex-col p-6 pointer-events-none transition-all duration-700 ${isScanning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Top HUD Row */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="glass-morphism px-4 py-2 rounded-xl flex items-center gap-3 border-accent/20">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <div className="text-[10px] font-black uppercase tracking-widest text-accent">AI Shield Active</div>
          </div>
          <div className="glass-morphism px-4 py-2 rounded-xl text-white/60">
             <div className="text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5">Tactical Core</div>
             <div className="text-[10px] font-black text-white">V.4.2 READY</div>
          </div>
        </div>
        
        {!isVRMode && (
          <button 
            onClick={handleClose}
            className="pointer-events-auto p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all border border-white/10 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Center Reticles & Target Boxes */}
      <div className="flex-1 flex items-center justify-center relative">
         {/* Simulated Object Detection */}
         <div className="absolute top-1/2 left-[10%] w-24 h-24 border-2 border-rose-500/50 hazard-box rounded-lg bg-rose-500/5">
            <div className="absolute -top-6 left-0 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-background/80 px-2 py-0.5 rounded animate-glitch">
              Hazard Detected
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
               <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
         </div>
         <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-accent/50 hazard-box rounded-lg">
            <div className="absolute -top-6 left-0 text-[10px] font-black uppercase tracking-widest text-accent bg-background/80 px-2 py-0.5 rounded">
              Verified Zone
            </div>
         </div>
         <div className="absolute bottom-1/3 right-[15%] w-48 h-24 border-2 border-emerald-500/30 rounded-lg animate-pulse">
            <div className="absolute -top-6 left-0 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-background/80 px-2 py-0.5 rounded">
              Safe Entry Found
            </div>
         </div>
         
         {/* Main Navigation Waypoint */}
         <div className="flex flex-col items-center gap-4 group">
           <div className="w-32 h-32 rounded-full border-2 border-dashed border-accent rotate-slow flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-accent shadow-[0_0_40px_rgba(212,175,55,0.4)] flex items-center justify-center animate-pulse">
                <MapPin className="w-10 h-10 text-accent" />
              </div>
           </div>
           <div className="glass-morphism px-8 py-3 rounded-2xl flex flex-col items-center border-accent/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <p className="text-3xl font-black text-accent tracking-tighter italic">
                {selectedRoute?.name?.split(',')[0].toUpperCase() || 'SANTACRUZ'}
              </p>
              <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em] mt-1">Live Path Verified</p>
           </div>
         </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="flex justify-center mt-auto">
        <div className="glass-morphism px-8 py-5 rounded-3xl flex items-center gap-8 max-w-2xl w-full border-accent/20 shadow-2xl">
           <div className="flex flex-col items-center">
             <div className="text-[8px] font-black text-accent uppercase tracking-widest mb-1">Safety Index</div>
             <div className="text-3xl font-black text-white">{selectedRoute?.safetyScore || 94}</div>
           </div>
           <div className="h-10 w-px bg-white/10" />
           <div className="flex-1">
             <div className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Navigation Intel</div>
             <div className="text-sm font-bold text-white/90">
               Arriving in {selectedRoute?.eta || '18 min'} • {selectedRoute?.riskLevel || 'Low'} Risk Zone
             </div>
           </div>
           <div className="flex gap-2">
             <div className="w-1 h-8 bg-accent animate-pulse" />
             <div className="w-1 h-5 bg-accent/40 animate-pulse [animation-delay:200ms]" />
             <div className="w-1 h-3 bg-accent/20 animate-pulse [animation-delay:400ms]" />
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed top-8 right-8 z-50">
      <button
        onClick={() => setIsActive(true)}
        className="glass-morphism p-4 rounded-full text-accent shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 pr-7 group"
      >
        <div className="bg-accent text-background p-2.5 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <Camera className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Safety View</span>
          <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest mt-0.5">AI Enabled</span>
        </div>
      </button>

      {isActive && (
        <div className="fixed inset-0 z-[100] bg-background">
          {/* Main Video Background */}
          <div className={`relative w-full h-full flex ${isVRMode ? 'divide-x divide-white/10' : ''}`}>
             {[1, 2].map((i) => (
                (i === 1 || isVRMode) && (
                  <div key={i} className="flex-1 relative overflow-hidden h-full flex flex-col">
                    {/* Camera Feed */}
                    <div className="absolute inset-0 bg-[#0B0D11]">
                       {cameraError ? (
                         <div 
                           className="w-full h-full opacity-40 bg-cover bg-center grayscale contrast-125"
                           style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")' }}
                         />
                       ) : (
                         <video
                           ref={i === 1 ? videoRef : null}
                           autoPlay playsInline muted
                           className={`w-full h-full object-cover transition-all duration-1000 ${isScanning ? 'grayscale blur-md' : 'grayscale-[0.4] brightness-75'}`}
                         />
                       )}
                       <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
                    </div>

                    {/* Scanning Animation */}
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                         <div className="absolute top-0 left-0 w-full h-1 bg-accent/40 animate-scan shadow-[0_0_20px_#D4AF37]" />
                         <div className="relative text-center animate-glitch">
                            <div className="w-48 h-48 rounded-full border border-accent/20 flex items-center justify-center animate-ping" />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <div className="text-accent text-[8px] font-black uppercase tracking-[0.5em] animate-pulse">
                                  Calibrating HUD<br/>
                                  Spatial Analysis Initialized
                               </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* HUD Layer */}
                    <HUDContent />

                    {/* V-Lens Effect (Vignette) */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] border-[60px] border-transparent" />
                  </div>
                )
             ))}
          </div>

          {/* Mode Controls */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 flex flex-col gap-4 z-[110]">
             <button 
                onClick={() => setIsVRMode(!isVRMode)}
                className={`glass-morphism p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${isVRMode ? 'border-accent bg-accent/10' : 'border-white/5 opacity-60 hover:opacity-100'}`}
             >
                <div className="text-xs font-black text-accent uppercase tracking-widest">{isVRMode ? 'VR ON' : 'VR OFF'}</div>
                <div className="text-[8px] font-bold opacity-40 uppercase">Stereoscopic</div>
             </button>
             
             {isVRMode && (
               <button 
                onClick={handleClose}
                className="glass-morphism p-4 rounded-2xl flex flex-col items-center gap-2 border-2 border-white/5 hover:bg-white/5 transition-all group"
               >
                 <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                 <div className="text-[8px] font-black uppercase tracking-widest">Exit</div>
               </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ARTeaser;
