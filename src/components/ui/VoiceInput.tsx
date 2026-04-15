"use client";

import React, { useState, useCallback } from 'react';
import { Mic } from './Icons';

interface VoiceInputProps {
  onResult: (text: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  });

  const toggleListening = useCallback(() => {
    if (!isSupported) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening, isSupported, onResult]);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-lg transition-all ${
        isListening
          ? 'bg-accent text-background animate-pulse'
          : 'bg-surface hover:bg-surface-hover text-foreground'
      }`}
      title="Voice input"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};

export default VoiceInput;
