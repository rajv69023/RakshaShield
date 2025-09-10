import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  AlertTriangle, 
  Shield, 
  Satellite, 
  Eye, 
  Brain,
  Users,
  MapPin,
  Clock,
  Zap,
  Smartphone,
  Layers,
  Target,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CrowdAnalysis {
  crowdDensity: string;
  crowdSize: number;
  movementPattern: string;
  aggressionLevel: string;
  emotionalState: string;
  riskScore: number;
  threatIndicators: string[];
  recommendations: string[];
  confidence: number;
  specificThreats: Array<{
    type: string;
    severity: string;
    confidence: number;
    description: string;
    isWomenTargeted: boolean;
  }>;
}

interface SafetyForecast {
  location: { lat: number; lng: number };
  timeframe: string;
  predictions: Array<{
    time: string;
    safety_score: number;
    risk_factors: string[];
    recommendations: string[];
  }>;
  alternativeRoutes: Array<{
    route: string;
    safety_score: number;
    estimated_time: string;
    guardian_coverage: boolean;
  }>;
}

interface ARSafetyData {
  location: { lat: number; lng: number };
  safetyFeatures: Array<{
    type: string;
    path?: Array<{ lat: number; lng: number }>;
    location?: { lat: number; lng: number };
    safety_score?: number;
    lighting?: string;
    crowd_density?: string;
    threat_level?: string;
    description?: string;
    guardian_id?: string;
    response_time?: string;
  }>;
  emergencyOptions: Array<{
    type: string;
    title: string;
  }>;
}

export function AiCrowdMonitor() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'realtime' | 'upload' | 'forecast'>('realtime');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [crowdAnalysis, setCrowdAnalysis] = useState<CrowdAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => console.error('Location access denied:', error)
    );
  }, []);

  // Fetch real-time crowd analysis for current location
  const { data: locationAnalysis } = useQuery({
    queryKey: ['/api/ai/crowd-analysis/location', currentLocation?.lat, currentLocation?.lng],
    queryFn: () => {
      if (!currentLocation) return null;
      return fetch(`/api/ai/crowd-analysis/location?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=0.5`)
        .then(res => res.json());
    },
    enabled: !!currentLocation && analysisMode === 'realtime',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch safety forecast
  const { data: safetyForecast } = useQuery<SafetyForecast>({
    queryKey: ['/api/predictive/safety-forecast', currentLocation?.lat, currentLocation?.lng],
    queryFn: () => {
      if (!currentLocation) return null;
      return fetch(`/api/predictive/safety-forecast/${currentLocation.lat}/${currentLocation.lng}?timeframe=next_hour`)
        .then(res => res.json());
    },
    enabled: !!currentLocation,
  });

  // Fetch AR safety overlay
  const { data: arSafetyData } = useQuery<ARSafetyData>({
    queryKey: ['/api/ar/safety-overlay', currentLocation?.lat, currentLocation?.lng],
    queryFn: () => {
      if (!currentLocation) return null;
      return fetch(`/api/ar/safety-overlay/${currentLocation.lat}/${currentLocation.lng}?radius=200`)
        .then(res => res.json());
    },
    enabled: !!currentLocation,
  });

  const handleImageAnalysis = async (imageData: string) => {
    if (!currentLocation) return;

    setIsAnalyzing(true);
    try {
      const response = await apiRequest('POST', '/api/ai/crowd-analysis', {
        location: currentLocation,
        imageData: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
        timeOfDay: new Date().toISOString(),
        weatherConditions: 'Clear',
        eventType: 'normal'
      });

      const analysis = await response.json();
      setCrowdAnalysis(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setSelectedImage(imageData);
      handleImageAnalysis(imageData);
    };
    reader.readAsDataURL(file);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    if (score < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6" data-testid="ai-crowd-monitor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Crowd Intelligence</h2>
            <p className="text-gray-600">Advanced crowd behavior monitoring for women's safety</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Live AI Active
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => setAnalysisMode(analysisMode === 'realtime' ? 'upload' : 'realtime')}
            data-testid="toggle-analysis-mode"
          >
            <Camera className="h-4 w-4 mr-2" />
            {analysisMode === 'realtime' ? 'Upload Image' : 'Live Mode'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="crowd-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="crowd-analysis" data-testid="tab-crowd-analysis">
            <Users className="h-4 w-4 mr-2" />
            Crowd Analysis
          </TabsTrigger>
          <TabsTrigger value="ar-safety" data-testid="tab-ar-safety">
            <Layers className="h-4 w-4 mr-2" />
            AR Safety
          </TabsTrigger>
          <TabsTrigger value="predictive" data-testid="tab-predictive">
            <Target className="h-4 w-4 mr-2" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="satellite" data-testid="tab-satellite">
            <Satellite className="h-4 w-4 mr-2" />
            Satellite
          </TabsTrigger>
          <TabsTrigger value="quantum" data-testid="tab-quantum">
            <Shield className="h-4 w-4 mr-2" />
            Quantum Vault
          </TabsTrigger>
        </TabsList>

        {/* Crowd Analysis Tab */}
        <TabsContent value="crowd-analysis" className="space-y-6">
          {analysisMode === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Upload Image for Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    data-testid="upload-image-button"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Select Image'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload a photo of the crowd for AI safety analysis
                  </p>
                </div>
                
                {selectedImage && (
                  <div className="mt-4">
                    <img 
                      src={selectedImage} 
                      alt="Selected for analysis" 
                      className="max-w-full h-48 object-cover rounded-lg mx-auto"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {(crowdAnalysis || locationAnalysis) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Crowd Behavior Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const analysis = crowdAnalysis || (locationAnalysis?.[0] || {});
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Risk Score</span>
                          <span className={`text-2xl font-bold ${getRiskColor(analysis.riskScore || 0)}`}>
                            {analysis.riskScore || 0}/100
                          </span>
                        </div>
                        <Progress 
                          value={analysis.riskScore || 0} 
                          className="w-full"
                          data-testid="risk-score-progress"
                        />
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Crowd Size:</span>
                            <p className="text-gray-600">{analysis.crowdSize || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Density:</span>
                            <Badge variant="outline" className="ml-1">
                              {analysis.crowdDensity || 'Unknown'}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Movement:</span>
                            <p className="text-gray-600">{analysis.movementPattern || 'Normal'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Aggression:</span>
                            <Badge 
                              variant="outline" 
                              className={`ml-1 ${getSeverityBadge(analysis.aggressionLevel || 'none')}`}
                            >
                              {analysis.aggressionLevel || 'None'}
                            </Badge>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Threat Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const threats = crowdAnalysis?.specificThreats || [];
                    const womenTargetedThreats = threats.filter(t => t.isWomenTargeted);
                    
                    return womenTargetedThreats.length > 0 ? (
                      <div className="space-y-3">
                        {womenTargetedThreats.map((threat, index) => (
                          <Alert key={index} className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{threat.type}</p>
                                  <p className="text-sm">{threat.description}</p>
                                </div>
                                <Badge className={getSeverityBadge(threat.severity)}>
                                  {threat.severity}
                                </Badge>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p>No women-specific threats detected</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* AR Safety Tab */}
        <TabsContent value="ar-safety" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                AR Safety Companion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {arSafetyData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {arSafetyData.safetyFeatures.map((feature, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start space-x-3">
                          {feature.type === 'safe_path' && <MapPin className="h-5 w-5 text-green-600 mt-0.5" />}
                          {feature.type === 'threat_warning' && <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />}
                          {feature.type === 'guardian_nearby' && <Shield className="h-5 w-5 text-blue-600 mt-0.5" />}
                          
                          <div className="flex-1">
                            <h4 className="font-medium capitalize">{feature.type.replace('_', ' ')}</h4>
                            {feature.description && (
                              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                            )}
                            {feature.safety_score && (
                              <div className="flex items-center mt-2">
                                <span className="text-xs font-medium mr-2">Safety Score:</span>
                                <Badge variant="outline">{feature.safety_score}/100</Badge>
                              </div>
                            )}
                            {feature.response_time && (
                              <div className="flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="text-xs text-gray-600">{feature.response_time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Emergency AR Options</h4>
                    <div className="flex flex-wrap gap-2">
                      {arSafetyData.emergencyOptions.map((option, index) => (
                        <Button 
                          key={index} 
                          variant="outline" 
                          size="sm"
                          data-testid={`ar-emergency-${option.type}`}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {option.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-12 w-12 mx-auto mb-3" />
                  <p>Enable location services to activate AR safety features</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Predictive Safety Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safetyForecast ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Safety Predictions</h4>
                    <div className="space-y-3">
                      {safetyForecast.predictions.map((prediction, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium capitalize">{prediction.time}</h5>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">Safety Score:</span>
                              <Badge 
                                variant="outline" 
                                className={getRiskColor(100 - prediction.safety_score)}
                              >
                                {prediction.safety_score}/100
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Risk Factors:</span>
                              <ul className="mt-1 space-y-1">
                                {prediction.risk_factors.map((factor, i) => (
                                  <li key={i} className="text-gray-600">• {factor}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium">Recommendations:</span>
                              <ul className="mt-1 space-y-1">
                                {prediction.recommendations.map((rec, i) => (
                                  <li key={i} className="text-gray-600">• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Alternative Safe Routes</h4>
                    <div className="space-y-2">
                      {safetyForecast.alternativeRoutes.map((route, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">{route.route}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>⏱️ {route.estimated_time}</span>
                                <span>🛡️ Safety: {route.safety_score}/100</span>
                                {route.guardian_coverage && (
                                  <Badge variant="outline" className="text-xs">
                                    Guardian Coverage
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`select-route-${index}`}
                            >
                              Select Route
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3" />
                  <p>Predictive analytics loading...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Satellite Communication Tab */}
        <TabsContent value="satellite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Satellite className="h-5 w-5 mr-2" />
                Satellite Emergency Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Satellite className="h-4 w-4" />
                <AlertDescription>
                  Satellite communication provides emergency backup when cellular networks are unavailable.
                  Powered by Starlink for global coverage.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">99.7%</div>
                  <div className="text-sm text-gray-600">Network Coverage</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">2-5min</div>
                  <div className="text-sm text-gray-600">Emergency Response</div>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                data-testid="test-satellite-connection"
              >
                <Satellite className="h-4 w-4 mr-2" />
                Test Satellite Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quantum Blockchain Tab */}
        <TabsContent value="quantum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Quantum-Safe Evidence Vault
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Advanced quantum-resistant encryption protects evidence from future quantum computing threats.
                  All evidence is immutably stored and legally verifiable.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 border rounded-lg">
                  <div className="text-lg font-bold text-purple-600">256-bit</div>
                  <div className="text-xs text-gray-600">Quantum Encryption</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">Immutable</div>
                  <div className="text-xs text-gray-600">Blockchain Records</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">Legal</div>
                  <div className="text-xs text-gray-600">Court Admissible</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium">Recent Evidence Blocks</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between p-2 border rounded">
                    <span>Block #latest</span>
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>Block #previous</span>
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Smart Wearables Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Smart Wearable Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-bold text-green-600">Connected</div>
              <div className="text-sm text-gray-600">Smart Fabric Jewelry</div>
              <div className="text-xs text-gray-500 mt-1">Battery: 87%</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-bold text-blue-600">Ready</div>
              <div className="text-sm text-gray-600">Panic Button Ring</div>
              <div className="text-xs text-gray-500 mt-1">Signal: Strong</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-bold text-orange-600">Inactive</div>
              <div className="text-sm text-gray-600">Smart Fitness Tracker</div>
              <div className="text-xs text-gray-500 mt-1">Not Paired</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}