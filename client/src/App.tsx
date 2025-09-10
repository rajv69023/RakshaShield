import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Map from "@/pages/map";
import Guardians from "@/pages/guardians";
import AiCrowd from "@/pages/ai-crowd";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";
import EmergencyButton from "@/components/emergency-button";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/map" component={Map} />
          <Route path="/guardians" component={Guardians} />
          <Route path="/ai-crowd" component={AiCrowd} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      {/* Emergency SOS Button - Always visible */}
      <EmergencyButton />
      
      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
