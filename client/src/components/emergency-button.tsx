import { useState } from "react";
import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useEmergency } from "@/lib/emergency";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function EmergencyButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { triggerEmergency, isTriggering } = useEmergency();
  const { location } = useGeolocation();

  const handleEmergencyPress = () => {
    setIsPressed(true);
    setShowConfirmation(true);
    
    // Start 3-second countdown
    let timeLeft = 3;
    setCountdown(timeLeft);
    
    const countdownInterval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      
      if (timeLeft === 0) {
        clearInterval(countdownInterval);
        handleConfirmEmergency();
      }
    }, 1000);

    // Auto-cancel if user doesn't confirm
    setTimeout(() => {
      if (showConfirmation) {
        handleCancelEmergency();
      }
    }, 3000);
  };

  const handleConfirmEmergency = async () => {
    setShowConfirmation(false);
    setIsPressed(false);
    
    if (!location) {
      console.error("Location not available for emergency");
      return;
    }

    try {
      await triggerEmergency({
        userId: "current-user-id", // TODO: Get actual user ID
        triggerType: "manual",
        location: {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
        },
        additionalData: {
          contextInfo: "Manual SOS button pressed"
        }
      });
    } catch (error) {
      console.error("Emergency trigger failed:", error);
    }
  };

  const handleCancelEmergency = () => {
    setShowConfirmation(false);
    setIsPressed(false);
    setCountdown(0);
  };

  const handleQuickCall = (service: string) => {
    const phoneNumbers = {
      police: "100",
      ambulance: "108", 
      women: "181"
    };
    
    window.open(`tel:${phoneNumbers[service as keyof typeof phoneNumbers]}`);
  };

  return (
    <>
      {/* Emergency SOS Button */}
      <div className="fixed bottom-20 right-4 z-50" data-testid="emergency-button-container">
        <div className="relative">
          <div className="absolute inset-0 bg-primary rounded-full pulse-ring"></div>
          <Button
            onClick={handleEmergencyPress}
            disabled={isTriggering}
            className="w-16 h-16 bg-primary hover:bg-primary/90 rounded-full emergency-glow flex items-center justify-center shadow-xl transition-all duration-200 relative z-10"
            data-testid="button-emergency-sos"
          >
            <AlertTriangle className="text-primary-foreground" size={24} />
          </Button>
        </div>
      </div>

      {/* Emergency Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-sm mx-auto" data-testid="dialog-emergency-confirmation">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">
              🚨 EMERGENCY ALERT
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            {countdown > 0 ? (
              <>
                <div className="text-6xl font-bold text-destructive animate-pulse">
                  {countdown}
                </div>
                <p className="text-sm text-muted-foreground">
                  Emergency will be triggered automatically
                </p>
                <Button 
                  onClick={handleCancelEmergency}
                  variant="outline"
                  className="w-full"
                  data-testid="button-cancel-emergency"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-destructive rounded-full mx-auto flex items-center justify-center emergency-glow">
                    <AlertTriangle className="text-destructive-foreground" size={32} />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Emergency Services</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        onClick={() => handleQuickCall("police")}
                        variant="destructive"
                        size="sm"
                        className="flex-col h-16"
                        data-testid="button-call-police"
                      >
                        <Phone size={16} />
                        <span className="text-xs">100</span>
                        <span className="text-xs">Police</span>
                      </Button>
                      
                      <Button 
                        onClick={() => handleQuickCall("ambulance")}
                        variant="destructive"
                        size="sm"
                        className="flex-col h-16"
                        data-testid="button-call-ambulance"
                      >
                        <Phone size={16} />
                        <span className="text-xs">108</span>
                        <span className="text-xs">Medical</span>
                      </Button>
                      
                      <Button 
                        onClick={() => handleQuickCall("women")}
                        variant="destructive"
                        size="sm"
                        className="flex-col h-16"
                        data-testid="button-call-women-helpline"
                      >
                        <Phone size={16} />
                        <span className="text-xs">181</span>
                        <span className="text-xs">Women</span>
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Family contacts:</span>
                      <Badge variant="outline" className="text-xs">Notified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Nearby guardians:</span>
                      <Badge variant="outline" className="text-xs">Alerted</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Location shared:</span>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Evidence recording:</span>
                      <Badge variant="outline" className="text-xs">Started</Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Status Indicator */}
      {isTriggering && (
        <div className="fixed top-4 left-4 right-4 z-50" data-testid="emergency-status-indicator">
          <div className="bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg emergency-alert">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={20} />
              <span className="font-semibold">Emergency Active</span>
            </div>
            <p className="text-sm opacity-90 mt-1">
              Help is on the way. Stay safe and keep this app open.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
