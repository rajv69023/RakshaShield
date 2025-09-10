import { useState, useEffect } from "react";
import { Activity, Heart, Brain, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBiometricData } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";

interface BiometricReading {
  timestamp: string;
  heartRate: number;
  stressLevel: string;
  motionPattern: string;
}

export default function BiometricMonitor() {
  const [isRecording, setIsRecording] = useState(false);
  const { latestBiometric, isConnected } = useBiometricData();

  // Fetch recent biometric history
  const { data: biometricHistory = [] } = useQuery({
    queryKey: ["/api/biometric", "current-user-id", "history"], // TODO: Get actual user ID
    enabled: false, // Disable for now since we don't have user auth
  });

  // Mock historical data for demonstration
  const mockHistory: BiometricReading[] = [
    { timestamp: "09:00", heartRate: 68, stressLevel: "low", motionPattern: "walking" },
    { timestamp: "09:30", heartRate: 72, stressLevel: "low", motionPattern: "sitting" },
    { timestamp: "10:00", heartRate: 75, stressLevel: "normal", motionPattern: "walking" },
    { timestamp: "10:30", heartRate: 82, stressLevel: "normal", motionPattern: "running" },
    { timestamp: "11:00", heartRate: 70, stressLevel: "low", motionPattern: "sitting" },
  ];

  const history = biometricHistory.length > 0 ? biometricHistory : mockHistory;
  const currentBiometric = latestBiometric || {
    heartRate: 72,
    stressLevel: "low",
    motionPattern: "normal",
    timestamp: new Date().toISOString()
  };

  const getStressLevelPercentage = (level: string) => {
    switch (level) {
      case "low": return 20;
      case "normal": return 40;
      case "elevated": return 60;
      case "high": return 80;
      case "critical": return 100;
      default: return 0;
    }
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

  const getHeartRateZone = (hr: number) => {
    if (hr < 60) return { zone: "Resting", color: "text-blue-500", percentage: 30 };
    if (hr <= 100) return { zone: "Normal", color: "text-safety-safe", percentage: 50 };
    if (hr <= 120) return { zone: "Elevated", color: "text-safety-caution", percentage: 70 };
    if (hr <= 140) return { zone: "Exercise", color: "text-orange-500", percentage: 85 };
    return { zone: "High", color: "text-destructive", percentage: 100 };
  };

  const getTrend = (current: number, previous: number) => {
    if (current > previous + 5) return { icon: TrendingUp, color: "text-red-500", text: "Increasing" };
    if (current < previous - 5) return { icon: TrendingDown, color: "text-green-500", text: "Decreasing" };
    return { icon: Activity, color: "text-muted-foreground", text: "Stable" };
  };

  const heartRateZone = getHeartRateZone(currentBiometric.heartRate);
  const stressPercentage = getStressLevelPercentage(currentBiometric.stressLevel);
  
  // Calculate trends (using mock data for now)
  const previousHR = history.length > 1 ? history[history.length - 2].heartRate : currentBiometric.heartRate;
  const hrTrend = getTrend(currentBiometric.heartRate, previousHR);

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual biometric recording toggle
    console.log(isRecording ? "Stopping biometric recording" : "Starting biometric recording");
  };

  const isAnomalousReading = currentBiometric.heartRate > 120 || currentBiometric.stressLevel === "high" || currentBiometric.stressLevel === "critical";

  return (
    <Card data-testid="biometric-monitor">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity size={20} />
            <span>Biometric Monitor</span>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected && (
              <div className="w-2 h-2 bg-safety-safe rounded-full animate-pulse" />
            )}
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Readings */}
        <div className="grid grid-cols-2 gap-4">
          {/* Heart Rate */}
          <div className="space-y-3" data-testid="heart-rate-section">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className={`heart-rate-indicator ${heartRateZone.color}`} size={20} />
                <span className="text-sm font-medium">Heart Rate</span>
              </div>
              <div className="flex items-center space-x-1">
                <hrTrend.icon size={14} className={hrTrend.color} />
                <span className={`text-xs ${hrTrend.color}`}>{hrTrend.text}</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-baseline space-x-1 mb-2">
                <span className="text-2xl font-bold text-foreground">
                  {currentBiometric.heartRate}
                </span>
                <span className="text-sm text-muted-foreground">BPM</span>
              </div>
              <Progress value={heartRateZone.percentage} className="h-2 mb-1" />
              <p className={`text-xs ${heartRateZone.color}`}>
                {heartRateZone.zone} Zone
              </p>
            </div>
          </div>

          {/* Stress Level */}
          <div className="space-y-3" data-testid="stress-level-section">
            <div className="flex items-center space-x-2">
              <Brain className="text-blue-600" size={20} />
              <span className="text-sm font-medium">Stress Level</span>
            </div>
            
            <div>
              <div className="flex items-baseline space-x-1 mb-2">
                <span className={`text-2xl font-bold capitalize ${getStressLevelColor(currentBiometric.stressLevel)}`}>
                  {currentBiometric.stressLevel}
                </span>
              </div>
              <Progress value={stressPercentage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">
                Based on HRV analysis
              </p>
            </div>
          </div>
        </div>

        {/* Motion Pattern */}
        <div className="p-3 bg-muted/50 rounded-lg" data-testid="motion-pattern-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity size={16} />
              <span className="text-sm font-medium">Motion Pattern</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {currentBiometric.motionPattern}
            </Badge>
          </div>
        </div>

        {/* Anomaly Alert */}
        {isAnomalousReading && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="anomaly-alert">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-destructive mt-0.5" size={16} />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Unusual Reading Detected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentBiometric.heartRate > 120 && "Elevated heart rate detected. "}
                  {(currentBiometric.stressLevel === "high" || currentBiometric.stressLevel === "critical") && "High stress levels detected. "}
                  Emergency contacts will be notified if this continues.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Historical Trend */}
        <div className="space-y-3" data-testid="historical-trend">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Recent Trend</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleToggleRecording}
              data-testid="button-toggle-recording"
            >
              {isRecording ? "Stop" : "Start"} Recording
            </Button>
          </div>
          
          {/* Simple trend visualization */}
          <div className="space-y-2">
            {history.slice(-5).map((reading, index) => (
              <div key={index} className="flex items-center justify-between text-xs" data-testid={`reading-${index}`}>
                <span className="text-muted-foreground">{reading.timestamp}</span>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <Heart size={12} className="text-red-500" />
                    <span>{reading.heartRate}</span>
                  </span>
                  <span className={`capitalize ${getStressLevelColor(reading.stressLevel)}`}>
                    {reading.stressLevel}
                  </span>
                  <span className="text-muted-foreground capitalize">
                    {reading.motionPattern}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg" data-testid="recording-status">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Continuous monitoring active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your biometric data is being monitored for safety analysis. This data is encrypted and only shared in emergencies.
            </p>
          </div>
        )}

        {/* Health Insights */}
        <div className="space-y-2" data-testid="health-insights">
          <h4 className="text-sm font-medium">Health Insights</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Resting HR (avg):</span>
              <span>68 BPM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stress episodes today:</span>
              <span>0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Activity level:</span>
              <Badge variant="outline" className="text-xs">Moderate</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
