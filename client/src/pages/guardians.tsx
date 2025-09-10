import { useState } from "react";
import { Shield, Users, Phone, MessageCircle, Star, Clock, MapPin, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface Guardian {
  id: string;
  name: string;
  distance: number;
  responseTime: number;
  rating: number;
  totalResponses: number;
  isActive: boolean;
  verificationStatus: string;
  specialties: string[];
  lastSeen: string;
}

interface EmergencyAlert {
  id: string;
  type: string;
  priority: string;
  status: string;
  location: string;
  timestamp: string;
  guardiansResponded: number;
}

export default function Guardians() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistance, setFilterDistance] = useState("all");
  const [sortBy, setSortBy] = useState("distance");

  // Fetch nearby guardians
  const { data: guardians = [], isLoading } = useQuery({
    queryKey: ["/api/guardians/nearby", 28.6139, 77.2090, 10], // Delhi coordinates
  });

  // Fetch recent emergency alerts
  const { data: recentAlerts = [] } = useQuery({
    queryKey: ["/api/emergency/active"],
  });

  const mockGuardians: Guardian[] = [
    {
      id: "1",
      name: "Priya Sharma",
      distance: 0.8,
      responseTime: 180,
      rating: 4.9,
      totalResponses: 45,
      isActive: true,
      verificationStatus: "verified",
      specialties: ["Medical", "Self Defense"],
      lastSeen: "2 min ago"
    },
    {
      id: "2", 
      name: "Anjali Singh",
      distance: 1.2,
      responseTime: 240,
      rating: 4.7,
      totalResponses: 32,
      isActive: true,
      verificationStatus: "verified",
      specialties: ["Legal Aid", "Counseling"],
      lastSeen: "5 min ago"
    },
    {
      id: "3",
      name: "Kavya Reddy",
      distance: 2.1,
      responseTime: 300,
      rating: 4.8,
      totalResponses: 28,
      isActive: false,
      verificationStatus: "verified",
      specialties: ["Transport", "Safe Haven"],
      lastSeen: "1 hour ago"
    }
  ];

  const filteredGuardians = mockGuardians.filter(guardian => {
    const matchesSearch = guardian.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guardian.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDistance = filterDistance === "all" || 
                           (filterDistance === "near" && guardian.distance <= 1) ||
                           (filterDistance === "medium" && guardian.distance <= 3) ||
                           (filterDistance === "far" && guardian.distance > 3);
    
    return matchesSearch && matchesDistance;
  });

  const handleContactGuardian = (guardianId: string) => {
    console.log(`Contacting guardian ${guardianId}`);
  };

  const handleBecomeGuardian = () => {
    console.log("Initiating guardian registration process");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-foreground" data-testid="page-title">Guardian Network</h1>
          <p className="text-sm text-muted-foreground">Connect with verified safety responders</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Network Stats */}
        <Card className="mb-6" data-testid="card-network-stats">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Users className="text-secondary" size={24} />
                </div>
                <p className="text-lg font-bold text-foreground">247</p>
                <p className="text-xs text-muted-foreground">Active Guardians</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Clock className="text-accent" size={24} />
                </div>
                <p className="text-lg font-bold text-foreground">3.2m</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Shield className="text-safety-safe" size={24} />
                </div>
                <p className="text-lg font-bold text-foreground">98.5%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Become a Guardian CTA */}
        <Card className="mb-6 bg-gradient-to-r from-secondary/10 to-primary/10" data-testid="card-become-guardian">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Shield className="text-secondary-foreground" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Become a Guardian</h3>
                  <p className="text-sm text-muted-foreground">Help protect women in your community</p>
                </div>
              </div>
              <Button 
                onClick={handleBecomeGuardian}
                data-testid="button-become-guardian"
              >
                Join Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="nearby" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nearby" data-testid="tab-nearby">Nearby Guardians</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">Active Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <Input
                placeholder="Search guardians by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-guardians"
              />
              
              <div className="flex space-x-3">
                <Select value={filterDistance} onValueChange={setFilterDistance}>
                  <SelectTrigger className="flex-1" data-testid="select-distance">
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Distances</SelectItem>
                    <SelectItem value="near">Within 1km</SelectItem>
                    <SelectItem value="medium">Within 3km</SelectItem>
                    <SelectItem value="far">Beyond 3km</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="response">Response Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Guardians List */}
            <div className="space-y-4">
              {filteredGuardians.map((guardian) => (
                <Card key={guardian.id} data-testid={`guardian-card-${guardian.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {guardian.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                            guardian.isActive ? 'bg-safety-safe guardian-online' : 'bg-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{guardian.name}</h3>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            <span>{guardian.distance}km away</span>
                            <span>•</span>
                            <Clock size={12} />
                            <span>{guardian.responseTime}s avg</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="text-accent fill-current" size={14} />
                          <span className="text-sm font-semibold">{guardian.rating}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{guardian.totalResponses} responses</p>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {guardian.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {guardian.verificationStatus === "verified" && (
                        <Badge className="text-xs bg-safety-safe text-white">
                          <Shield size={10} className="mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        disabled={!guardian.isActive}
                        onClick={() => handleContactGuardian(guardian.id)}
                        data-testid={`button-contact-${guardian.id}`}
                      >
                        <Phone size={14} className="mr-1" />
                        Contact
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={!guardian.isActive}
                        data-testid={`button-message-${guardian.id}`}
                      >
                        <MessageCircle size={14} />
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Last seen: {guardian.lastSeen}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card data-testid="card-active-alerts">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <span>Active Emergency Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No active emergency alerts in your area</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      You'll be notified when someone needs help nearby
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentAlerts.map((alert: EmergencyAlert) => (
                      <div key={alert.id} className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg" data-testid={`alert-${alert.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-destructive">{alert.type} Emergency</h4>
                            <p className="text-sm text-muted-foreground">{alert.location}</p>
                          </div>
                          <Badge className={`${alert.priority === 'critical' ? 'bg-destructive' : 'bg-accent'} text-white`}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{alert.timestamp}</span>
                            <span>{alert.guardiansResponded} guardians responding</span>
                          </div>
                          <Button size="sm" variant="destructive" data-testid={`button-respond-${alert.id}`}>
                            Respond
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
