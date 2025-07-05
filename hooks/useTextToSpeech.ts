"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Voice {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isDefault: boolean;
}

interface UseTextToSpeechProps {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
  autoPlay?: boolean;
}

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: Voice[];
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  progress: number;
}

export function useTextToSpeech({
  rate = 1,
  pitch = 1,
  volume = 1,
  voice = null,
  autoPlay = false
}: UseTextToSpeechProps = {}): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(voice);
  const [currentRate, setCurrentRate] = useState(rate);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [progress, setProgress] = useState(0);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        const voiceList: Voice[] = availableVoices.map(voice => ({
          voice,
          name: voice.name,
          lang: voice.lang,
          isDefault: voice.default
        }));
        
        setVoices(voiceList);
        
        // Set default voice if none selected
        if (!currentVoice && voiceList.length > 0) {
          const defaultVoice = voiceList.find(v => v.isDefault) || voiceList[0];
          setCurrentVoice(defaultVoice.voice);
        }
      };
      
      // Load voices immediately
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      
      // Check if voices are already loaded
      if (synthRef.current.getVoices().length === 0) {
        // Wait a bit for voices to load
        setTimeout(loadVoices, 100);
      }
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentVoice]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !synthRef.current) {
      toast.error('Text-to-speech is not supported in this browser.');
      return;
    }
    
    if (!text.trim()) {
      toast.error('No text to speak.');
      return;
    }
    
    // Stop any current speech
    stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = currentRate;
    utterance.pitch = currentPitch;
    utterance.volume = currentVolume;
    
    if (currentVoice) {
      utterance.voice = currentVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setProgress(0);
      
      // Start progress tracking
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            return 100;
          }
          return prev + 1;
        });
      }, text.length * 10); // Approximate progress based on text length
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(100);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      toast.error('Speech synthesis error occurred.');
      setIsSpeaking(false);
      setIsPaused(false);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    
    utterance.onpause = () => {
      setIsPaused(true);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    
    utterance.onresume = () => {
      setIsPaused(false);
      
      // Resume progress tracking
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            return 100;
          }
          return prev + 1;
        });
      }, text.length * 10);
    };
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [isSupported, currentVoice, currentRate, currentPitch, currentVolume]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(0);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
    }
  }, [isPaused]);

  const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setCurrentVoice(voice);
  }, []);

  const setRate = useCallback((rate: number) => {
    setCurrentRate(Math.max(0.1, Math.min(10, rate)));
  }, []);

  const setPitch = useCallback((pitch: number) => {
    setCurrentPitch(Math.max(0, Math.min(2, pitch)));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setCurrentVolume(Math.max(0, Math.min(1, volume)));
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    setVoice,
    setRate,
    setPitch,
    setVolume,
    progress
  };
}