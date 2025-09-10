import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

interface VoiceAnalysisResult {
  stressScore: number;
  confidence: number;
  emotions: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  transcript?: string;
  shouldTriggerAlert: boolean;
}

interface VoiceMonitoringState {
  isListening: boolean;
  isAnalyzing: boolean;
  lastAnalysis: VoiceAnalysisResult | null;
  error: string | null;
  audioLevel: number;
  supportedFeatures: {
    speechRecognition: boolean;
    mediaRecorder: boolean;
    audioContext: boolean;
  };
}

export function useVoiceMonitoring() {
  const [state, setState] = useState<VoiceMonitoringState>({
    isListening: false,
    isAnalyzing: false,
    lastAnalysis: null,
    error: null,
    audioLevel: 0,
    supportedFeatures: {
      speechRecognition: false,
      mediaRecorder: false,
      audioContext: false,
    },
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>();

  // Check browser capabilities
  useEffect(() => {
    const features = {
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      mediaRecorder: 'MediaRecorder' in window,
      audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    };

    setState(prev => ({ ...prev, supportedFeatures: features }));
  }, []);

  // Initialize audio analysis
  const initializeAudioAnalysis = useCallback(async (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start monitoring audio levels
      const monitorAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average audio level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = (average / 255) * 100;
        
        setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
        
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      };

      monitorAudioLevel();
    } catch (error) {
      console.error("Failed to initialize audio analysis:", error);
    }
  }, []);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!state.supportedFeatures.speechRecognition) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      // Analyze transcript for stress keywords
      if (transcript.length > 10) {
        analyzeVoiceStress(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setState(prev => ({ ...prev, error: `Speech recognition error: ${event.error}` }));
    };

    recognitionRef.current = recognition;
  }, [state.supportedFeatures.speechRecognition]);

  // Analyze voice stress using AI
  const analyzeVoiceStress = useCallback(async (audioData: string, context?: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await apiRequest('POST', '/api/ai/voice-analysis', {
        audioData,
        userId: 'current-user-id', // TODO: Get actual user ID
        context: context || 'Real-time voice monitoring'
      });

      const analysis: VoiceAnalysisResult = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        lastAnalysis: analysis,
        isAnalyzing: false 
      }));

      // Trigger emergency if high stress detected
      if (analysis.shouldTriggerAlert) {
        console.warn("High stress detected in voice - emergency protocols may be triggered");
        // The emergency trigger is handled by the server automatically
      }

      return analysis;
    } catch (error) {
      console.error("Voice stress analysis failed:", error);
      setState(prev => ({ 
        ...prev, 
        error: "Failed to analyze voice stress",
        isAnalyzing: false 
      }));
      return null;
    }
  }, []);

  // Start voice monitoring
  const startMonitoring = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Initialize audio analysis
      if (state.supportedFeatures.audioContext) {
        await initializeAudioAnalysis(stream);
      }

      // Initialize speech recognition
      if (state.supportedFeatures.speechRecognition) {
        initializeSpeechRecognition();
        recognitionRef.current?.start();
      }

      // Initialize media recorder for audio capture
      if (state.supportedFeatures.mediaRecorder) {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];

          // Convert to base64 for analysis
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const audioData = base64.split(',')[1]; // Remove data URL prefix
            analyzeVoiceStress(audioData, 'Continuous monitoring');
          };
          reader.readAsDataURL(audioBlob);
        };

        // Record in 30-second chunks
        mediaRecorder.start();
        setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setTimeout(() => {
              if (streamRef.current && streamRef.current.active) {
                mediaRecorder.start();
              }
            }, 1000);
          }
        }, 30000);

        mediaRecorderRef.current = mediaRecorder;
      }

      setState(prev => ({ ...prev, isListening: true }));
    } catch (error) {
      console.error("Failed to start voice monitoring:", error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : "Failed to access microphone"
      }));
    }
  }, [state.supportedFeatures, initializeAudioAnalysis, initializeSpeechRecognition, analyzeVoiceStress]);

  // Stop voice monitoring
  const stopMonitoring = useCallback(() => {
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Reset refs
    mediaRecorderRef.current = null;
    recognitionRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;

    setState(prev => ({ 
      ...prev, 
      isListening: false,
      audioLevel: 0 
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Manual voice stress analysis
  const analyzeCurrentSpeech = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      setState(prev => ({ ...prev, error: "Voice monitoring is not active" }));
      return null;
    }

    // Force stop current recording to get analysis
    mediaRecorderRef.current.stop();
    
    return new Promise<VoiceAnalysisResult | null>((resolve) => {
      const originalOnStop = mediaRecorderRef.current?.onstop;
      
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = async (event) => {
          // Call original handler
          if (originalOnStop && mediaRecorderRef.current) {
            originalOnStop.call(mediaRecorderRef.current, event);
          }
          
          // Wait for analysis to complete
          setTimeout(() => {
            resolve(state.lastAnalysis);
          }, 2000);
        };
      }
    });
  }, [state.lastAnalysis]);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    analyzeCurrentSpeech,
    analyzeVoiceStress,
  };
}

export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const commands = {
    emergency: ['help', 'emergency', 'sos', 'raksha help'],
    fake_call: ['fake call', 'call mom', 'call dad'],
    location: ['where am i', 'location', 'send location'],
    cancel: ['cancel', 'stop', 'nevermind'],
  };

  const initializeVoiceCommands = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setLastCommand(transcript);
      
      // Check for emergency commands
      if (commands.emergency.some(cmd => transcript.includes(cmd))) {
        console.log("Emergency command detected:", transcript);
        // Emergency will be handled by parent component
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Voice command error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      initializeVoiceCommands();
    }
    
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start voice commands:", error);
    }
  }, [initializeVoiceCommands]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    isListening,
    lastCommand,
    startListening,
    stopListening,
    commands,
  };
}
