"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  isDisabled?: boolean;
  className?: string;
  language?: string;
  autoSend?: boolean;
}

export function VoiceInput({ 
  onTranscript, 
  onInterimTranscript,
  onVoiceStart, 
  onVoiceEnd, 
  isDisabled = false, 
  className = "",
  language = "auto",
  autoSend = true
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEndTimeRef = useRef<number>(0);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for browser support
      const SpeechRecognition = 
        window.SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Changed to false for better control
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        // Set language based on prop or auto-detect
        if (language === "auto") {
          // Auto-detect browser language or use Portuguese as default for Brazil
          const browserLang = navigator.language || 'pt-BR';
          recognition.lang = browserLang;
          console.log('Auto-detected language:', browserLang);
        } else {
          recognition.lang = language;
        }
        
        // Log offline capabilities
        console.log('Speech Recognition Info:', {
          serviceURI: (recognition as any).serviceURI || 'Default (likely online)',
          continuous: recognition.continuous,
          interimResults: recognition.interimResults,
          lang: recognition.lang,
          userAgent: navigator.userAgent
        });
        
        recognition.onstart = () => {
          console.log('Voice recognition started');
          setIsListening(true);
          setIsProcessing(false);
          onVoiceStart?.();
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimText = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimText += transcript;
            }
          }
          
          if (finalTranscript) {
            const newTranscript = transcript + finalTranscript;
            setTranscript(newTranscript);
            setInterimTranscript('');
            
            console.log('🎤 Final transcript received:', newTranscript);
            
            // Send both final and interim to parent for input field update
            onTranscript(newTranscript);
            
            // Auto-stop and trigger auto-send after getting final result
            setTimeout(() => {
              console.log('🎤 Auto-stopping after final transcript...');
              stopListening();
              
              // Trigger auto-send immediately after stopping
              if (autoSend && newTranscript.trim()) {
                console.log('🎤 Triggering auto-send from onresult...');
                setTimeout(() => {
                  onVoiceEnd?.();
                }, 100);
              }
            }, 300);
          } else {
            setInterimTranscript(interimText);
            
            // Send interim transcript to parent for real-time input field update
            if (onInterimTranscript) {
              onInterimTranscript(transcript + interimText);
            }
          }
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          
          if (event.error === 'not-allowed') {
            setPermissionGranted(false);
            toast.error('Microphone permission denied. Please enable microphone access.');
          } else if (event.error === 'no-speech') {
            toast.error('No speech detected. Please try again.');
          } else {
            toast.error('Voice recognition error. Please try again.');
          }
          
          setIsListening(false);
          setIsProcessing(false);
          onVoiceEnd?.();
        };
        
        recognition.onend = () => {
          console.log('Voice recognition ended');
          setIsListening(false);
          setIsProcessing(false);
          
          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Process final transcript and auto-send if enabled
          const finalText = transcript.trim();
          const now = Date.now();
          
          console.log('Safari onend - finalText:', finalText, 'autoSend:', autoSend, 'lastEndTime:', lastEndTimeRef.current);
          
          // Debounce: prevent multiple calls within 2 seconds
          if (now - lastEndTimeRef.current < 2000) {
            console.log('🚫 Debounced: ignoring duplicate onend call');
            return;
          }
          
          lastEndTimeRef.current = now;
          
          if (finalText && autoSend) {
            console.log('🎤 onend: Auto-sending transcript:', finalText);
            onTranscript(finalText);
            
            // Clear the transcript after sending
            setTranscript('');
            setInterimTranscript('');
            
            // Trigger auto-send by calling onVoiceEnd
            console.log('🎤 onend: Calling onVoiceEnd for auto-send...');
            onVoiceEnd?.();
          } else if (finalText) {
            // Just update input field without auto-sending
            console.log('🎤 onend: Updating input without auto-send');
            onTranscript(finalText);
            setTranscript('');
            setInterimTranscript('');
            onVoiceEnd?.();
          } else {
            console.log('🎤 onend: No final text to process');
            // Call onVoiceEnd anyway to clean up state
            onVoiceEnd?.();
          }
        };
        
        recognitionRef.current = recognition;
      } else {
        console.log('Speech recognition not supported');
        setIsSupported(false);
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language]); // Re-initialize when language changes

  const startListening = async () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }
    
    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized.');
      return;
    }
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately, we just needed permission
      
      setPermissionGranted(true);
      setIsProcessing(true);
      setTranscript('');
      setInterimTranscript('');
      
      recognitionRef.current.start();
      toast.success('Voice recognition started. Speak now...');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setPermissionGranted(false);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    console.log('stopListening called, isListening:', isListening);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Recognition stop called');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Force state update if needed
    setIsListening(false);
    setIsProcessing(false);
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Fallback for unsupported browsers
  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <MicOff className="w-4 h-4" />
        <span className="text-sm">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Voice Input Button */}
      <motion.button
        onClick={handleClick}
        disabled={isDisabled || isProcessing}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
        } ${
          isDisabled || isProcessing
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        
        {/* Pulse animation when listening */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500 opacity-30"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        )}
      </motion.button>
      
      {/* Voice Status Indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
        >
          🎤 Listening...
        </motion.div>
      )}
    </div>
  );
}