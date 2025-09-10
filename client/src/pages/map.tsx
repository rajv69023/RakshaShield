import { useState, useEffect } from "react";
import { MapPin, Navigation, Shield, AlertTriangle, Clock, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useQuery } from "@tanstack/react-query";

interface SafetyZone {
  id: string;
  name: string;
  type: "safe" | "caution" | "danger" | "restricted";
  safetyScore: number;
  crowdDensity: string;
  policePresence: boolean;
  distance?: number;
}

interface Guardian {
  id: string;
  name: string;
  distance: number;
  responseTime: number;
  rating: number;
  isActive: boolean;
}

export default function Map() {
  const [selectedZone, setSelectedZone] = useState<SafetyZone | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { location, error: locationError, requestLocation } = useGeolocation();

  // Fetch nearby safety zones
  const { data: safetyZones = [] } = useQuery({
    queryKey: ["/api/safety-zones"],
    enabled: !!location,
  });

  // Fetch nearby guardians
  const { data: nearbyGuardians = [] } = useQuery({
    queryKey: ["/api/guardians/nearby", location?.lat, location?.lng, 5],
    enabled: !!location,
  });

  useEffect(() => {
    if (!location) {
      requestLocation();
    }
  }, [location, requestLocation]);

  const getZoneColor = (type: string) => {
    switch (type) {
      case "safe": return "bg-safety-safe text-white";
      case "caution": return "bg-safety-caution text-black";
      case "danger": return "bg-safety-danger text-white";
      case "restricted": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case "safe": return <Shield size={16} />;
      case "caution": return <AlertTriangle size={16} />;
      case "danger": return <AlertTriangle size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  if (locationError) {
    return (
      <div className="min-h-screen bg-background p-4" data-testid="map-error">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Location Access Required</h2>
            <p className="text-sm text-muted-foreground mb-4">
              To provide safety recommendations and show nearby resources, we need access to your location.
            </p>
            <Button onClick={requestLocation} data-testid="button-enable-location">
              Enable Location
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background p-4" data-testid="map-loading">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Getting your location...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground" data-testid="page-title">Safety Map</h1>
            <Button variant="ghost" size="sm" data-testid="button-my-location">
              <Navigation size={20} />
            </Button>
          </div>
          
          {/* Search */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search location or landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-location"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Current Location Status */}
        <Card className="mb-6" data-testid="card-current-location">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="text-primary" size={20} />
                <span className="font-semibold">Current Location</span>
              </div>
              <Badge className="bg-safety-safe text-white" data-testid="badge-safety-status">
                Safe Zone
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Safety Score</p>
                <p className="text-lg font-bold text-safety-safe">8.5/10</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Crowd Density</p>
                <p className="text-sm font-semibold">Low</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Police Nearby</p>
                <p className="text-sm font-semibold text-safety-safe">Yes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Safety Map */}
        <Card className="mb-6" data-testid="card-safety-map">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Safety Map</span>
              <Badge variant="outline" data-testid="badge-last-updated">
                <Clock size={12} className="mr-1" />
                2min ago
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Map Legend */}
            <div className="flex items-center justify-between mb-4 text-xs">
              <div className="flex items-center space-x-4">
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
              </div>
            </div>
            
            {/* Mock Map Visualization */}
            <div 
              className="h-64 bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 relative rounded-lg overflow-hidden"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
              data-testid="interactive-map"
            >
              {/* Safe Zone Overlay */}
              <div className="absolute top-4 left-4 safe-zone rounded-lg p-3 map-overlay">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-safety-safe rounded-full" />
                  <span className="text-xs font-medium text-safety-safe">Metro Station - Safe</span>
                </div>
              </div>
              
              {/* Warning Zone */}
              <div className="absolute top-4 right-4 danger-zone rounded-lg p-3 map-overlay">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-safety-danger rounded-full" />
                  <span className="text-xs font-medium text-safety-danger">Construction Area - Avoid</span>
                </div>
              </div>
              
              {/* Your Location */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary/90 rounded-lg p-3 map-overlay">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-primary">You are here</span>
                </div>
              </div>
              
              {/* Active Guards */}
              <div className="absolute bottom-4 right-4 bg-card/90 rounded-lg p-3 map-overlay">
                <div className="flex items-center space-x-2">
                  <Shield className="text-secondary" size={14} />
                  <span className="text-xs font-medium">{nearbyGuardians.length} Guards Nearby</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nearby Guardians */}
        <Card className="mb-6" data-testid="card-nearby-guardians">
          <CardHeader>
            <CardTitle>Nearby Guardians</CardTitle>
          </CardHeader>
          <CardContent>
            {nearbyGuardians.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No guardians found in your area</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyGuardians.slice(0, 5).map((guardian: Guardian) => (
                  <div key={guardian.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`guardian-${guardian.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${guardian.isActive ? 'bg-safety-safe' : 'bg-muted-foreground'}`} />
                      <div>
                        <p className="font-medium text-sm">Guardian #{guardian.id.slice(-4)}</p>
                        <p className="text-xs text-muted-foreground">
                          {guardian.distance}km away • ⭐ {guardian.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Response</p>
                      <p className="text-sm font-semibold">{guardian.responseTime}s</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safety Zones */}
        <Card data-testid="card-safety-zones">
          <CardHeader>
            <CardTitle>Area Safety Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: "1", name: "Metro Station Area", type: "safe", safetyScore: 9.2, crowdDensity: "medium", policePresence: true },
                { id: "2", name: "Market Street", type: "caution", safetyScore: 6.8, crowdDensity: "high", policePresence: false },
                { id: "3", name: "Construction Zone", type: "danger", safetyScore: 3.2, crowdDensity: "low", policePresence: false },
              ].map((zone) => (
                <div 
                  key={zone.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedZone(zone)}
                  data-testid={`zone-${zone.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getZoneColor(zone.type)}`}>
                      {getZoneIcon(zone.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Safety Score: {zone.safetyScore}/10 • {zone.crowdDensity} density
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {zone.policePresence && (
                      <Badge variant="outline" className="text-xs">
                        Police
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
