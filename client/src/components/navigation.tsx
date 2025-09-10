import { Link, useLocation } from "wouter";
import { Home, Map, Users, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home", testId: "nav-home" },
    { path: "/map", icon: Map, label: "Map", testId: "nav-map" },
    { path: "/guardians", icon: Users, label: "Guardians", testId: "nav-guardians" },
    { path: "/reports", icon: BarChart3, label: "Reports", testId: "nav-reports" },
    { path: "/settings", icon: Settings, label: "Settings", testId: "nav-settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40" data-testid="bottom-navigation">
      <div className="flex items-center justify-around py-3">
        {navItems.map(({ path, icon: Icon, label, testId }) => {
          const isActive = location === path || (path !== "/" && location.startsWith(path));
          
          return (
            <Link key={path} href={path}>
              <button 
                className={cn(
                  "flex flex-col items-center space-y-1 px-3 py-1 rounded-lg transition-colors",
                  isActive 
                    ? "text-secondary bg-secondary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={testId}
              >
                <Icon size={20} />
                <span className="text-xs">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
