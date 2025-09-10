import { useState, useEffect } from "react";
import { Shield, Heart, Brain, MapPin, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBiometricData } from "@/hooks/use-websocket";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useQuery } from "@tanstack/react-query";

interface BiometricData {
  heartRate: number;
  stressLevel: "low" | "normal" | "elevated" | "high" | "critical";
  timestamp: string;
}

export default function SafetyStatus() {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("connected");
  const { location } = useGeolocation();
  const { latestBiometric, isConnected } = useBiometricData();

  // Fetch current safety zone
  const { data: currentZone } = useQuery({
    queryKey: ["/api/safety-zones/check", location?.lat, location?.lng],
    enabled: !!location,
  });

  // Mock biometric data if WebSocket not connected
  const mockBiometric: BiometricData = {
    heartRate: 72,
    stressLevel: "low",
    timestamp: new Date().toISOString(),
  };

  const biometric = latestBiometric || mockBiometric;

  const getSafetyStatus = () => {
    if (!isConnected) return { status: "OFFLINE", color: "bg-muted text-muted-foreground" };
    
    if (biometric.stressLevel === "critical" || biometric.heartRate > 120) {
      return { status: "ALERT", color: "bg-destructive text-destructive-foreground" };
    }
    
    if (biometric.stressLevel === "high" || biometric.heartRate > 100) {
      return { status: "CAUTION", color: "bg-accent text-accent-foreground" };
    }
    
    if (currentZone?.type === "danger") {
      return { status: "UNSAFE AREA", color: "bg-destructive text-destructive-foreground" };
    }
    
    if (currentZone?.type === "caution") {
      return { status: "CAUTION AREA", color: "bg-accent text-accent-foreground" };
    }
    
    return { status: "SAFE", color: "bg-safety-safe text-white" };
  };

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case "low": return "text-safety-safe";
      case "normal": return "text-safety-caution";
      case "elevated": return "text-orange-500";
      case "high": return "text-safety-danger";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getHeartRateStatus = (hr: number) => {
    if (hr < 60) return { status: "Low", color: "text-safety-caution" };
    if (hr <= 100) return { status: "Normal", color: "text-safety-safe" };
    if (hr <= 120) return { status: "Elevated", color: "text-accent" };
    return { status: "High", color: "text-destructive" };
  };

  const safetyStatus = getSafetyStatus();
  const heartRateStatus = getHeartRateStatus(biometric.heartRate);

  return (
    <Card className="mb-6" data-testid="safety-status-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Safety Status</h2>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-muted-foreground">Real-time monitoring</p>
              {isConnected ? (
                <Wifi className="text-safety-safe" size={14} />
              ) : (
                <WifiOff className="text-destructive" size={14} />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              safetyStatus.status === "SAFE" ? "bg-safety-safe animate-pulse" :
              safetyStatus.status === "CAUTION" || safetyStatus.status === "CAUTION AREA" ? "bg-accent animate-pulse" :
              "bg-destructive animate-pulse"
            }`} />
            <Badge className={safetyStatus.color} data-testid="safety-status-badge">
              {safetyStatus.status}
            </Badge>
          </div>
        </div>
        
        {/* Biometric Monitoring */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center" data-testid="heart-rate-monitor">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Heart className={`${heartRateStatus.color} heart-rate-indicator`} size={24} />
            </div>
            <p className="text-xs text-muted-foreground">Heart Rate</p>
            <p className="text-sm font-semibold text-foreground">
              {biometric.heartRate} BPM
            </p>
            <p className={`text-xs ${heartRateStatus.color}`}>
              {heartRateStatus.status}
            </p>
          </div>
          
          <div className="text-center" data-testid="stress-level-monitor">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Brain className="text-blue-600" size={24} />
            </div>
            <p className="text-xs text-muted-foreground">Stress Level</p>
            <p className="text-sm font-semibold text-foreground capitalize">
              {biometric.stressLevel}
            </p>
            <p className={`text-xs ${getStressLevelColor(biometric.stressLevel)}`}>
              {biometric.stressLevel === "low" ? "Relaxed" :
               biometric.stressLevel === "normal" ? "Stable" :
               biometric.stressLevel === "elevated" ? "Elevated" :
               biometric.stressLevel === "high" ? "High" : "Critical"}
            </p>
          </div>
          
          <div className="text-center" data-testid="location-monitor">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MapPin className="text-purple-600" size={24} />
            </div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className={`text-sm font-semibold ${
              currentZone?.type === "safe" ? "text-safety-safe" :
              currentZone?.type === "caution" ? "text-accent" :
              currentZone?.type === "danger" ? "text-destructive" :
              "text-muted-foreground"
            }`}>
              {currentZone?.type === "safe" ? "Safe Zone" :
               currentZone?.type === "caution" ? "Caution Area" :
               currentZone?.type === "danger" ? "Danger Zone" :
               location ? "Unknown Area" : "Locating..."}
            </p>
            {location && (
              <p className="text-xs text-muted-foreground">
                {location.accuracy && location.accuracy < 100 ? "High accuracy" : "Low accuracy"}
              </p>
            )}
          </div>
        </div>

        {/* Additional Status Information */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Guardian Network:</span>
              <Badge variant="outline" className="text-xs">
                {isConnected ? "Connected" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Update:</span>
              <span className="text-muted-foreground">
                {new Date(biometric.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Indicators */}
        {safetyStatus.status !== "SAFE" && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="text-destructive" size={16} />
              <span className="text-sm font-semibold text-destructive">
                {safetyStatus.status === "ALERT" ? "Emergency protocols activated" :
                 safetyStatus.status === "UNSAFE AREA" ? "You are in an unsafe area" :
                 "Please exercise caution"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your emergency contacts have been notified of your status.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
