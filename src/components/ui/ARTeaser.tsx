"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Shield, AlertCircle, MapPin, X } from './Icons';

const ARTeaser: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check if camera is available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setHasCamera(true);
    }
  }, []);

  useEffect(() => {
    if (isActive && hasCamera && videoRef.current) {
      // Request camera access
      navigator.mediaDevices
        .getUserMedia({ 
          video: { 
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setCameraError('Camera access denied or unavailable');
        });
    }

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, hasCamera]);

  const handleClose = () => {
    setIsActive(false);
    setCameraError('');
  };

  if (!hasCamera) {
    return null; // Don't show AR button if no camera support
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsActive(true)}
        className="glass-morphism p-4 rounded-full text-accent shadow-xl hover:scale-110 transition-transform flex items-center gap-3 pr-6"
      >
        <div className="bg-accent text-background p-2 rounded-full">
          <Camera className="w-5 h-5" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">Live Safety View</span>
      </button>

      {isActive && (
        <div className="fixed inset-4 z-[100] glass-morphism rounded-[2.5rem] overflow-hidden border-2 border-accent/20 shadow-2xl animate-in zoom-in-90 duration-300">
          {/* Camera Feed or Fallback */}
          <div className="absolute inset-0 bg-[#1A1D23]">
            {cameraError ? (
              // Fallback to placeholder image if camera fails
              <>
                <div 
                  className="w-full h-full opacity-40 bg-cover bg-center"
                  style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-sm text-foreground/60">{cameraError}</p>
                  <p className="text-xs text-foreground/40 mt-2">Using demo mode</p>
                </div>
              </>
            ) : (
              // Live camera feed
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/60" />
              </>
            )}
          </div>

          {/* HUD Elements */}
          <div className="relative h-full flex flex-col p-8 pointer-events-none">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="glass-morphism px-4 py-2 rounded-xl flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none mb-1">Safety Status</p>
                    <p className="text-xs font-black text-green-400">OPTIMAL PATH</p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto">
                <button 
                  onClick={handleClose}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Floating Spatial Cues */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Direction Marker */}
              <div className="flex flex-col items-center gap-4 animate-bounce duration-[2000ms]">
                <div className="w-24 h-24 rounded-full border-4 border-accent animate-pulse flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)]">
                  <MapPin className="w-10 h-10 text-accent" />
                </div>
                <div className="glass-morphism px-6 py-3 rounded-2xl flex flex-col items-center">
                  <p className="text-2xl font-black text-accent italic tracking-tighter">SANTACRUZ</p>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Next Junction • 400m</p>
                </div>
              </div>

              {/* Risk Warning Alert */}
              <div className="absolute right-0 top-1/4 glass-morphism border-red-500/20 bg-red-500/5 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500">
                 <div className="p-2 bg-red-500 text-white rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-xs font-black text-red-500 uppercase tracking-widest">Risk Alert</p>
                   <p className="text-sm font-medium opacity-80">Poor visibility ahead (Rain)</p>
                 </div>
              </div>
            </div>

            {/* Bottom Nav Hint */}
            <div className="flex justify-center">
              <div className="glass-morphism px-8 py-4 rounded-full flex items-center gap-4 max-w-md w-full border-accent/20">
                 <div className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center font-black text-accent">18</div>
                 <div className="flex-1">
                   <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Recommended Route</p>
                   <p className="text-sm font-bold">ETA: 18 min • Safety Score: 94</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARTeaser;
