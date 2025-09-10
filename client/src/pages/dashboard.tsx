import { useState } from "react";
import { Shield, Phone, Video, Globe, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SafetyStatus from "@/components/safety-status";
import BiometricMonitor from "@/components/biometric-monitor";
import SafetyMap from "@/components/safety-map";

export default function Dashboard() {
  const [isVoiceMonitoring, setIsVoiceMonitoring] = useState(true);

  const handleEmergencyCall = () => {
    window.open("tel:100");
  };

  const handleFakeCall = () => {
    // TODO: Implement fake call feature
    console.log("Fake call initiated");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="app-title">Raksha</h1>
                <p className="text-xs text-muted-foreground">रक्षा - Women's Guardian</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" data-testid="button-language">
                <Globe size={20} />
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-profile">
                <User size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* Hero Section with Safety Status */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
          <div className="container mx-auto px-4">
            {/* Safety Status Card */}
            <SafetyStatus />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button 
                onClick={handleEmergencyCall}
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-4 h-auto flex-col gap-2"
                data-testid="button-emergency-call"
              >
                <Phone size={24} />
                <div className="text-center">
                  <p className="text-sm font-semibold">Emergency Call</p>
                  <p className="text-xs opacity-90">Instant 100/108/181</p>
                </div>
              </Button>
              
              <Button 
                onClick={handleFakeCall}
                variant="secondary"
                className="p-4 h-auto flex-col gap-2"
                data-testid="button-fake-call"
              >
                <Video size={24} />
                <div className="text-center">
                  <p className="text-sm font-semibold">Fake Call</p>
                  <p className="text-xs opacity-90">Escape scenario</p>
                </div>
              </Button>
            </div>
          </div>
        </section>

        {/* Biometric Monitoring */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <BiometricMonitor />
          </div>
        </section>

        {/* Advanced Features Grid */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-foreground mb-6" data-testid="text-advanced-features">
              Advanced Safety Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* AI Voice Stress Analysis */}
              <Card data-testid="card-voice-analysis">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center mb-4">
                    <div className={`w-6 h-6 rounded-full bg-primary-foreground ${isVoiceMonitoring ? 'voice-analysis-active' : ''}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">AI Voice Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time detection of fear, panic, and distress in voice calls with automatic SOS triggering.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-chart-2 rounded-full" />
                    <span className="text-xs text-chart-2">Active Monitoring</span>
                  </div>
                </CardContent>
              </Card>

              {/* Guardian Angel Network */}
              <Card data-testid="card-guardian-network">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/70 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-secondary-foreground rounded-full guardian-online" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Guardian Network</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verified community responders, police integration, and family alerts within 30 seconds.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                      247 Guardians Nearby
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Safety AI */}
              <Card data-testid="card-predictive-ai">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/70 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-accent-foreground rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Predictive AI</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Machine learning to predict unsafe situations before they occur using behavioral patterns.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <span className="text-xs text-accent">Analyzing Environment</span>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence Vault */}
              <Card data-testid="card-evidence-vault">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Blockchain Evidence</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quantum-resistant blockchain storage for tamper-proof evidence collection and legal support.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Shield size={12} className="text-chart-2" />
                    <span className="text-xs text-chart-2">Secured & Encrypted</span>
                  </div>
                </CardContent>
              </Card>

              {/* Smart Location Intelligence */}
              <Card data-testid="card-smart-routes">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-white rounded-full" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Smart Routes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-powered safe route suggestions with real-time danger zone alerts and crowd monitoring.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                      Safest Route Active
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Integration */}
              <Card data-testid="card-medical-alert">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-white rounded-full heart-rate-indicator" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Medical Alert</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Auto-share medical information with emergency responders for faster and better care.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-xs text-blue-600">Profile Updated</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Live Safety Map */}
        <section className="py-8 bg-muted/50">
          <div className="container mx-auto px-4">
            <SafetyMap />
          </div>
        </section>

        {/* Testimonials & Impact */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-foreground mb-6" data-testid="text-making-india-safer">
              Making India Safer
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Success Story */}
              <Card data-testid="card-success-story">
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-4 flex items-center justify-center">
                    <Phone size={48} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Real-Time Response</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    "Raksha's AI detected distress in my voice and alerted my family within 30 seconds. I felt truly protected."
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-muted rounded-full" />
                    <span className="text-xs text-muted-foreground">Priya S., Mumbai</span>
                  </div>
                </CardContent>
              </Card>

              {/* Technology Impact */}
              <Card data-testid="card-technology-impact">
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-lg mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 bg-accent rounded-full heart-rate-indicator" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Advanced Monitoring</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Biometric sensors detect stress levels and automatically trigger safety protocols before incidents occur.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full heart-rate-indicator" />
                    <span className="text-xs text-muted-foreground">97% Accuracy Rate</span>
                  </div>
                </CardContent>
              </Card>

              {/* Community Network */}
              <Card data-testid="card-community-network">
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-secondary/10 to-chart-2/10 rounded-lg mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 bg-secondary rounded-full guardian-online" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Guardian Network</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    50,000+ verified guardians across India ready to respond within minutes of an emergency alert.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-secondary rounded-full" />
                    <span className="text-xs text-muted-foreground">50K+ Active Guardians</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* App Features Demo */}
        <section className="py-8 bg-gradient-to-br from-secondary/5 to-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-how-raksha-works">
                How Raksha Works
              </h2>
              <p className="text-muted-foreground">Advanced AI-powered safety in your pocket</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center" data-testid="section-step-1">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground text-2xl font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Quick Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Download, add emergency contacts, enable biometric monitoring, and you're protected.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center" data-testid="section-step-2">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-secondary-foreground text-2xl font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">24/7 Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  AI continuously monitors your voice, heart rate, location, and behavior patterns.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center" data-testid="section-step-3">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-foreground text-2xl font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Instant Response</h3>
                <p className="text-sm text-muted-foreground">
                  Emergency detected? Automatic alerts to guardians, police, and family within 30 seconds.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
