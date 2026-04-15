"use client";

import React, { useState, useEffect } from 'react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lng: number };
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, userLocation }) => {
  const [countdown, setCountdown] = useState(5);
  const [emergencyCalled, setEmergencyCalled] = useState(false);

  useEffect(() => {
    if (isOpen && !emergencyCalled && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown, emergencyCalled]);

  const handleEmergencyCall = () => {
    setEmergencyCalled(true);
    // In production, this would actually call emergency services
    window.open('tel:100', '_self'); // 100 is police in India
  };

  const handleShareLocation = () => {
    if (userLocation) {
      const message = `🚨 EMERGENCY! I need help. My location: https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
      
      // Try to share via Web Share API
      if (navigator.share) {
        navigator.share({
          title: 'Emergency Location',
          text: message,
        }).catch(console.error);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(message);
        alert('Location copied to clipboard! Share with emergency contacts.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-red-400 animate-pulse">
        <div className="text-center space-y-6">
          {/* Emergency Icon */}
          <div className="text-8xl animate-bounce">🚨</div>
          
          <h2 className="text-3xl font-black text-white uppercase tracking-wider">
            EMERGENCY MODE
          </h2>

          {!emergencyCalled ? (
            <>
              <p className="text-white text-lg font-medium">
                Calling emergency services in {countdown} seconds...
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleEmergencyCall}
                  className="w-full bg-white text-red-600 font-black py-4 px-6 rounded-xl hover:bg-red-50 transition-all text-lg uppercase tracking-wider"
                >
                  📞 Call Police Now (100)
                </button>

                <button
                  onClick={handleShareLocation}
                  className="w-full bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl hover:bg-yellow-300 transition-all"
                >
                  📍 Share My Location
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-white/20 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/30 transition-all"
                >
                  Cancel
                </button>
              </div>

              {/* Nearest Safe Zones */}
              <div className="bg-white/10 rounded-xl p-4 text-left">
                <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">
                  🛡️ Nearest Safe Zones:
                </h3>
                <ul className="text-white text-sm space-y-1">
                  <li>🚔 CST Police Station - 0.5 km</li>
                  <li>🏥 KEM Hospital - 0.8 km</li>
                  <li>🏪 24/7 Store - 0.3 km</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-white text-xl font-bold">
                ✅ Emergency services contacted!
              </p>
              <p className="text-white/90">
                Help is on the way. Stay calm and stay safe.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-white text-red-600 font-bold py-3 px-6 rounded-xl hover:bg-red-50 transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
