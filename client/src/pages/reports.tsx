import { useState } from "react";
import { BarChart3, TrendingUp, Shield, AlertTriangle, Clock, Calendar, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

interface SafetyMetric {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
}

interface EmergencyReport {
  id: string;
  type: string;
  date: string;
  location: string;
  responseTime: number;
  status: string;
  severity: string;
}

export default function Reports() {
  const [timeframe, setTimeframe] = useState("7d");
  const [reportType, setReportType] = useState("personal");

  // Fetch user's emergency history
  const { data: emergencyHistory = [] } = useQuery({
    queryKey: ["/api/emergency/alerts", "current-user-id"], // TODO: Get actual user ID
    enabled: false, // Disable for now since we don't have user auth
  });

  const safetyMetrics: SafetyMetric[] = [
    { label: "Safety Score", value: 85, change: 2.3, trend: "up" },
    { label: "Stress Level", value: 32, change: -5.1, trend: "down" },
    { label: "Safe Routes Used", value: 78, change: 8.2, trend: "up" },
    { label: "Guardian Response Rate", value: 96, change: 1.1, trend: "up" },
  ];

  const mockEmergencyReports: EmergencyReport[] = [
    {
      id: "1",
      type: "Voice Stress Detected",
      date: "2024-01-15",
      location: "Connaught Place, Delhi",
      responseTime: 45,
      status: "Resolved",
      severity: "Medium"
    },
    {
      id: "2", 
      type: "Biometric Alert",
      date: "2024-01-10",
      location: "Khan Market, Delhi",
      responseTime: 120,
      status: "Resolved",
      severity: "Low"
    },
    {
      id: "3",
      type: "Manual SOS",
      date: "2024-01-05",
      location: "Karol Bagh, Delhi",
      responseTime: 30,
      status: "Resolved", 
      severity: "High"
    }
  ];

  const handleExportReport = () => {
    console.log("Exporting safety report...");
    // TODO: Implement report export functionality
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": return "bg-safety-safe text-white";
      case "active": return "bg-primary text-primary-foreground";
      case "investigating": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "text-safety-danger";
      case "medium": return "text-safety-caution";
      case "low": return "text-safety-safe";
      default: return "text-muted-foreground";
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="text-safety-safe" size={16} />
    ) : trend === "down" ? (
      <TrendingUp className="text-safety-danger rotate-180" size={16} />
    ) : (
      <div className="w-4 h-4 bg-muted-foreground rounded-full" />
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground" data-testid="page-title">Safety Reports</h1>
              <p className="text-sm text-muted-foreground">Track your safety metrics and incidents</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportReport}
              data-testid="button-export-report"
            >
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Time Range and Filters */}
        <div className="flex space-x-3 mb-6">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32" data-testid="select-timeframe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-32" data-testid="select-report-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="city">City-wide</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Safety Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {safetyMetrics.map((metric) => (
            <Card key={metric.label} data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">{metric.value}%</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={metric.value} className="flex-1 h-2" />
                  </div>
                  <p className={`text-xs ${metric.trend === 'up' ? 'text-safety-safe' : metric.trend === 'down' ? 'text-safety-danger' : 'text-muted-foreground'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}% vs last period
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="incidents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-4">
            <Card data-testid="card-incident-history">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Incidents</span>
                  <Badge variant="outline" className="text-xs">
                    {mockEmergencyReports.length} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockEmergencyReports.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No incidents recorded</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Great! You've been staying safe
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockEmergencyReports.map((report) => (
                      <div key={report.id} className="p-4 border border-border rounded-lg" data-testid={`incident-${report.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <AlertTriangle className={getSeverityColor(report.severity)} size={20} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{report.type}</h4>
                              <p className="text-sm text-muted-foreground">{report.location}</p>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Calendar size={12} />
                                  <span>{report.date}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock size={12} />
                                  <span>{report.responseTime}s response</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            <p className={`text-xs mt-1 ${getSeverityColor(report.severity)}`}>
                              {report.severity} severity
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Safety Score Breakdown */}
              <Card data-testid="card-safety-breakdown">
                <CardHeader>
                  <CardTitle>Safety Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Location Safety</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Time of Travel</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Guardian Availability</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Communication</span>
                        <span>95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time Analytics */}
              <Card data-testid="card-response-analytics">
                <CardHeader>
                  <CardTitle>Response Time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">65s</p>
                      <p className="text-sm text-muted-foreground">Average Response Time</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Family Contacts</span>
                        <span className="text-sm font-semibold">15s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Nearby Guardians</span>
                        <span className="text-sm font-semibold">45s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Emergency Services</span>
                        <span className="text-sm font-semibold">120s</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card data-testid="card-safety-trends">
              <CardHeader>
                <CardTitle>Safety Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Mock trend chart area */}
                  <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed border-muted">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Safety trends chart will be displayed here</p>
                    </div>
                  </div>

                  {/* Trend insights */}
                  <div className="space-y-3">
                    <div className="p-3 bg-safety-safe/10 rounded-lg border border-safety-safe/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp className="text-safety-safe" size={16} />
                        <span className="text-sm font-semibold text-safety-safe">Improvement</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your safety score has improved by 15% this month due to better route choices.
                      </p>
                    </div>

                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-4 h-4 bg-accent rounded-full" />
                        <span className="text-sm font-semibold text-accent">Recommendation</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Consider avoiding travel during 9-11 PM when incident rates are higher in your area.
                      </p>
                    </div>

                    <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <Shield className="text-secondary" size={16} />
                        <span className="text-sm font-semibold text-secondary">Achievement</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        30 days without any safety incidents! Keep up the great work.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
