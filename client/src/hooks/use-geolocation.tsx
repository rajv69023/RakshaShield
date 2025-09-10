import { useState, useEffect, useCallback, useRef } from "react";

interface GeolocationState {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  const defaultOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 300000, // 5 minutes
  };

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      }).catch(() => {
        setPermissionStatus("unknown");
      });
    }
  }, []);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    
    // Avoid too frequent updates (minimum 30 seconds unless high accuracy change)
    if (location && now - lastUpdateRef.current < 30000) {
      const distanceChange = calculateDistance(
        location.lat, location.lng,
        position.coords.latitude, position.coords.longitude
      );
      
      // Only update if moved more than 50 meters or accuracy improved significantly
      if (distanceChange < 0.05 && position.coords.accuracy >= location.accuracy - 10) {
        return;
      }
    }
    
    const newLocation: GeolocationState = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
    
    setLocation(newLocation);
    setError(null);
    setIsLoading(false);
    lastUpdateRef.current = now;
    
    console.log("Location updated:", {
      lat: newLocation.lat,
      lng: newLocation.lng,
      accuracy: `${newLocation.accuracy}m`
    });
  }, [location]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const geolocationError: GeolocationError = {
      code: error.code,
      message: getErrorMessage(error.code),
    };
    
    setError(geolocationError);
    setIsLoading(false);
    
    console.error("Geolocation error:", geolocationError);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: "Geolocation is not supported by this browser."
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );
  }, [handleSuccess, handleError, defaultOptions]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: "Geolocation is not supported by this browser."
      });
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );
  }, [handleSuccess, handleError, defaultOptions]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // Auto-start watching if enabled
  useEffect(() => {
    if (options.watchPosition && permissionStatus === "granted") {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [options.watchPosition, permissionStatus, startWatching, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  const getCurrentPosition = useCallback(async (): Promise<GeolocationState> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: GeolocationState = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve(locationData);
        },
        (error) => {
          reject(new Error(getErrorMessage(error.code)));
        },
        defaultOptions
      );
    });
  }, [defaultOptions]);

  return {
    location,
    error,
    isLoading,
    permissionStatus,
    requestLocation,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
}

function getErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access denied by user. Please enable location permissions in your browser settings.";
    case 2:
      return "Location information is unavailable. Please check your internet connection and GPS settings.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "An unknown error occurred while retrieving location.";
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export function useLocationTracking() {
  const { location, startWatching, stopWatching, error } = useGeolocation({
    enableHighAccuracy: true,
    watchPosition: true,
    timeout: 15000,
    maximumAge: 60000, // 1 minute
  });

  const [isTracking, setIsTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState<GeolocationState[]>([]);

  // Track location history
  useEffect(() => {
    if (location) {
      setLocationHistory(prev => {
        const updated = [...prev, location];
        // Keep only last 100 locations
        return updated.slice(-100);
      });
    }
  }, [location]);

  const enableTracking = useCallback(() => {
    setIsTracking(true);
    startWatching();
  }, [startWatching]);

  const disableTracking = useCallback(() => {
    setIsTracking(false);
    stopWatching();
  }, [stopWatching]);

  const clearHistory = useCallback(() => {
    setLocationHistory([]);
  }, []);

  return {
    location,
    error,
    isTracking,
    locationHistory,
    enableTracking,
    disableTracking,
    clearHistory,
  };
}
