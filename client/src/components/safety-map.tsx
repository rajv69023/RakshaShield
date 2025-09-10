import { useState } from "react";
import { MapPin, Navigation, Clock, Shield, Users, AlertTriangle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useQuery } from "@tanstack/react-query";

interface SafetyOverlay {
  id: string;
  type: "safe" | "caution" | "danger" | "guardian" | "police";
  position: { top: string; left: string };
  label: string;
  details?: string;
}

export default function SafetyMap() {
  const [mapView, setMapView] = useState("safety");
  const [selectedOverlay, setSelectedOverlay] = useState<SafetyOverlay | null>(null);
  const { location } = useGeolocation();

  // Fetch nearby guardians
  const { data: nearbyGuardians = [] } = useQuery({
    queryKey: ["/api/guardians/nearby", location?.lat, location?.lng, 5],
    enabled: !!location,
  });

  // Mock safety overlays for demonstration
  const safetyOverlays: SafetyOverlay[] = [
    {
      id: "1",
      type: "safe",
      position: { top: "20%", left: "25%" },
      label: "Metro Station",
      details: "Well-lit, high security, CCTV coverage"
    },
    {
      id: "2", 
      type: "danger",
      position: { top: "15%", left: "75%" },
      label: "Construction Zone",
      details: "Poor lighting, isolated area"
    },
    {
      id: "3",
      type: "guardian",
      position: { top: "60%", left: "40%" },
      label: "Guardian Priya",
      details: "Response time: 2 min, Rating: 4.9"
    },
    {
      id: "4",
      type: "police",
      position: { top: "70%", left: "20%" },
      label: "Police Station",
      details: "24/7 operations, Emergency response"
    },
    {
      id: "5",
      type: "caution",
      position: { top: "45%", left: "80%" },
      label: "Market Area",
      details: "High crowd density during evening"
    }
  ];

  const getOverlayIcon = (type: string) => {
    switch (type) {
      case "safe": return <Shield size={16} />;
      case "danger": return <AlertTriangle size={16} />;
      case "caution": return <Eye size={16} />;
      case "guardian": return <Users size={16} />;
      case "police": return <Shield size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  const getOverlayColor = (type: string) => {
    switch (type) {
      case "safe": return "bg-safety-safe text-white";
      case "danger": return "bg-safety-danger text-white";
      case "caution": return "bg-safety-caution text-black";
      case "guardian": return "bg-secondary text-secondary-foreground";
      case "police": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getZoneDescription = (type: string) => {
    switch (type) {
      case "safe": return "Safe zones with good lighting and security";
      case "caution": return "Areas requiring extra attention";
      case "danger": return "High-risk areas to avoid";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground" data-testid="safety-map-title">Live Safety Map</h2>
        <div className="flex items-center space-x-2">
          <Select value={mapView} onValueChange={setMapView}>
            <SelectTrigger className="w-32" data-testid="select-map-view">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="guardians">Guardians</SelectItem>
              <SelectItem value="traffic">Traffic</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" data-testid="badge-last-updated">
            <Clock size={12} className="mr-1" />
            2min ago
          </Badge>
        </div>
      </div>

      <Card data-testid="card-interactive-map">
        <CardContent className="p-0">
          {/* Map Legend */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-safety-safe rounded-full" />
                  <span>Safe Zones</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-safety-caution rounded-full" />
                  <span>Caution</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-safety-danger rounded-full" />
                  <span>Avoid</span>
                </div>
                {mapView === "guardians" && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-secondary rounded-full" />
                    <span>Guardians</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Tap markers for details</span>
            </div>
          </div>
          
          {/* Interactive Map */}
          <div 
            className="h-80 bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 relative overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
            data-testid="interactive-map-container"
          >
            {/* Safety Zone Overlays */}
            {safetyOverlays.map((overlay) => (
              <button
                key={overlay.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-110 ${getOverlayColor(overlay.type)} map-overlay`}
                style={{ top: overlay.position.top, left: overlay.position.left }}
                onClick={() => setSelectedOverlay(overlay)}
                data-testid={`map-overlay-${overlay.id}`}
              >
                <div className="flex items-center space-x-1">
                  {getOverlayIcon(overlay.type)}
                  <span className="text-xs font-medium">{overlay.label}</span>
                </div>
              </button>
            ))}
            
            {/* Current Location */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 map-overlay"
              style={{ top: "50%", left: "50%" }}
              data-testid="current-location-marker"
            >
              <div className="relative">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-primary rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="mt-1 px-2 py-1 bg-primary/90 text-primary-foreground rounded text-xs font-medium">
                You are here
              </div>
            </div>

            {/* Route Visualization */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" data-testid="route-visualization">
              {/* Safe route path */}
              <path
                d="M 50% 50% Q 40% 30% 25% 20%"
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth="3"
                strokeDasharray="5,5"
                fill="none"
                opacity="0.7"
              />
              {/* Alternative route */}
              <path
                d="M 50% 50% Q 60% 40% 75% 15%"
                stroke="hsl(43.3 96.4% 56.3%)"
                strokeWidth="2"
                strokeDasharray="3,3"
                fill="none"
                opacity="0.5"
              />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Map Controls */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="flex items-center space-x-2" data-testid="button-center-location">
          <Navigation size={16} />
          <span>Center on Me</span>
        </Button>
        <Button variant="outline" className="flex items-center space-x-2" data-testid="button-refresh-map">
          <Clock size={16} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Safety Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card data-testid="stat-guardians-nearby">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="text-secondary-foreground" size={16} />
            </div>
            <p className="text-lg font-bold text-foreground">{nearbyGuardians.length || 15}</p>
            <p className="text-xs text-muted-foreground">Active Guardians</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-safe-zones">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-safety-safe rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="text-white" size={16} />
            </div>
            <p className="text-lg font-bold text-foreground">8</p>
            <p className="text-xs text-muted-foreground">Safe Zones</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-response-time">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="text-accent-foreground" size={16} />
            </div>
            <p className="text-lg font-bold text-foreground">3.2m</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </CardContent>
        </Card>
      </div>

      {/* Zone Information */}
      {mapView === "safety" && (
        <Card data-testid="card-zone-information">
          <CardHeader>
            <CardTitle>Zone Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["safe", "caution", "danger"].map((zoneType) => (
              <div key={zoneType} className="flex items-start space-x-3">
                <div className={`w-4 h-4 rounded-full mt-1 ${
                  zoneType === "safe" ? "bg-safety-safe" :
                  zoneType === "caution" ? "bg-safety-caution" :
                  "bg-safety-danger"
                }`} />
                <div>
                  <p className="font-medium text-sm capitalize">{zoneType} Zones</p>
                  <p className="text-xs text-muted-foreground">
                    {getZoneDescription(zoneType)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Overlay Details */}
      {selectedOverlay && (
        <Card className="border-primary" data-testid="card-overlay-details">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${getOverlayColor(selectedOverlay.type)}`}>
                  {getOverlayIcon(selectedOverlay.type)}
                </div>
                <span>{selectedOverlay.label}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedOverlay(null)}
                data-testid="button-close-overlay-details"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {selectedOverlay.details}
            </p>
            {selectedOverlay.type === "guardian" && (
              <div className="flex space-x-2">
                <Button size="sm" data-testid="button-contact-guardian">
                  Contact
                </Button>
                <Button size="sm" variant="outline" data-testid="button-guardian-profile">
                  View Profile
                </Button>
              </div>
            )}
            {selectedOverlay.type === "danger" && (
              <div className="p-2 bg-destructive/10 rounded-lg">
                <p className="text-xs text-destructive">
                  ⚠️ Avoid this area, especially during evening hours
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
