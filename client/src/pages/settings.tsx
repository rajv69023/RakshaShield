import { useState } from "react";
import { User, Shield, Bell, MapPin, Phone, Heart, Mic, Moon, Languages, Download, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Mother", phone: "+91 98765 43210", relationship: "Family", priority: 1 },
    { id: "2", name: "Sister", phone: "+91 87654 32109", relationship: "Family", priority: 2 },
    { id: "3", name: "Best Friend", phone: "+91 76543 21098", relationship: "Friend", priority: 3 },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    { id: "emergency", label: "Emergency Alerts", description: "Critical safety notifications", enabled: true },
    { id: "guardian", label: "Guardian Updates", description: "When guardians respond to alerts", enabled: true },
    { id: "biometric", label: "Biometric Warnings", description: "Unusual health patterns", enabled: true },
    { id: "location", label: "Location Reminders", description: "Entering unsafe areas", enabled: true },
    { id: "daily", label: "Daily Safety Tips", description: "Helpful safety advice", enabled: false },
  ]);

  const [profile, setProfile] = useState({
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "+91 98765 43210",
    age: "25",
    bloodGroup: "O+",
    medicalConditions: "None",
    preferredLanguage: "English",
  });

  const handleNotificationToggle = (id: string) => {
    setNotificationSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleAddContact = (newContact: Omit<EmergencyContact, "id">) => {
    const id = Date.now().toString();
    setEmergencyContacts(prev => [...prev, { ...newContact, id }]);
  };

  const handleDeleteContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const handleExportData = () => {
    console.log("Exporting user data...");
    // TODO: Implement data export functionality
  };

  const handleDeleteAccount = () => {
    console.log("Account deletion requested...");
    // TODO: Implement account deletion with confirmation
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-foreground" data-testid="page-title">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your safety preferences</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="safety" data-testid="tab-safety">Safety</TabsTrigger>
            <TabsTrigger value="privacy" data-testid="tab-privacy">Privacy</TabsTrigger>
            <TabsTrigger value="app" data-testid="tab-app">App</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Information */}
            <Card data-testid="card-profile-info">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User size={20} />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <Button variant="outline" size="sm" className="mt-2" data-testid="button-change-photo">
                      Change Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input 
                      id="age" 
                      value={profile.age}
                      onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                      data-testid="input-age"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card data-testid="card-medical-info">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart size={20} />
                  <span>Medical Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select value={profile.bloodGroup} onValueChange={(value) => setProfile(prev => ({ ...prev, bloodGroup: value }))}>
                      <SelectTrigger data-testid="select-blood-group">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="medical">Medical Conditions & Allergies</Label>
                  <Textarea 
                    id="medical"
                    placeholder="List any medical conditions, allergies, or medications..."
                    value={profile.medicalConditions}
                    onChange={(e) => setProfile(prev => ({ ...prev, medicalConditions: e.target.value }))}
                    data-testid="textarea-medical"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This information will be shared with emergency responders if needed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card data-testid="card-emergency-contacts">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone size={20} />
                    <span>Emergency Contacts</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-contact">Add Contact</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Emergency Contact</DialogTitle>
                      </DialogHeader>
                      <AddContactForm onAdd={handleAddContact} />
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 border border-border rounded-lg" data-testid={`contact-${contact.id}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {contact.priority}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                          <Badge variant="outline" className="text-xs">{contact.relationship}</Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${contact.id}`}>
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                          data-testid={`button-delete-${contact.id}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            {/* Safety Features */}
            <Card data-testid="card-safety-features">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield size={20} />
                  <span>Safety Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Voice Stress Monitoring</p>
                      <p className="text-sm text-muted-foreground">AI analyzes voice for distress signals</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-voice-monitoring" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Biometric Alerts</p>
                      <p className="text-sm text-muted-foreground">Monitor heart rate and stress levels</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-biometric-alerts" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Location Tracking</p>
                      <p className="text-sm text-muted-foreground">Share location with emergency contacts</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-location-tracking" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Emergency Mode</p>
                      <p className="text-sm text-muted-foreground">Automatically trigger SOS when threats detected</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-auto-emergency" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guardian Preferences */}
            <Card data-testid="card-guardian-preferences">
              <CardHeader>
                <CardTitle>Guardian Network Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="response-radius">Response Radius (km)</Label>
                  <Select defaultValue="5">
                    <SelectTrigger data-testid="select-response-radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 km</SelectItem>
                      <SelectItem value="3">3 km</SelectItem>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Male Guardians</p>
                    <p className="text-sm text-muted-foreground">Include verified male responders</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-male-guardians" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            {/* Notification Settings */}
            <Card data-testid="card-notifications">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell size={20} />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notificationSettings.map((setting) => (
                    <div key={setting.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{setting.label}</p>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                        <Switch 
                          checked={setting.enabled}
                          onCheckedChange={() => handleNotificationToggle(setting.id)}
                          data-testid={`switch-notification-${setting.id}`}
                        />
                      </div>
                      {setting.id !== notificationSettings[notificationSettings.length - 1].id && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Privacy */}
            <Card data-testid="card-data-privacy">
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Sharing</p>
                    <p className="text-sm text-muted-foreground">Share anonymized data to improve safety</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-data-sharing" />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={handleExportData}
                    className="w-full justify-start"
                    data-testid="button-export-data"
                  >
                    <Download size={16} className="mr-2" />
                    Export My Data
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="w-full justify-start"
                    data-testid="button-delete-account"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="app" className="space-y-6">
            {/* App Preferences */}
            <Card data-testid="card-app-preferences">
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={profile.preferredLanguage} onValueChange={(value) => setProfile(prev => ({ ...prev, preferredLanguage: value }))}>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">हिन्दी (Hindi)</SelectItem>
                      <SelectItem value="Bengali">বাংলা (Bengali)</SelectItem>
                      <SelectItem value="Tamil">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="Telugu">తెలుగు (Telugu)</SelectItem>
                      <SelectItem value="Marathi">मराठी (Marathi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Moon size={20} />
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Easier on the eyes in low light</p>
                    </div>
                  </div>
                  <Switch 
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    data-testid="switch-dark-mode"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">High Contrast Mode</p>
                    <p className="text-sm text-muted-foreground">Better visibility in emergencies</p>
                  </div>
                  <Switch data-testid="switch-high-contrast" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Large Touch Targets</p>
                    <p className="text-sm text-muted-foreground">Easier to use during stress</p>
                  </div>
                  <Switch data-testid="switch-large-targets" />
                </div>
              </CardContent>
            </Card>

            {/* App Information */}
            <Card data-testid="card-app-info">
              <CardHeader>
                <CardTitle>About Raksha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>January 15, 2024</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-help">
                    Help & Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-privacy-policy">
                    Privacy Policy
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-terms">
                    Terms of Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Helper component for adding contacts
function AddContactForm({ onAdd }: { onAdd: (contact: Omit<EmergencyContact, "id">) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Family");
  const [priority, setPriority] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onAdd({ name, phone, relationship, priority });
      setName("");
      setPhone("");
      setRelationship("Family");
      setPriority(1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="contact-name">Name</Label>
        <Input 
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="input-contact-name"
        />
      </div>
      <div>
        <Label htmlFor="contact-phone">Phone Number</Label>
        <Input 
          id="contact-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          data-testid="input-contact-phone"
        />
      </div>
      <div>
        <Label htmlFor="contact-relationship">Relationship</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger data-testid="select-contact-relationship">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Friend">Friend</SelectItem>
            <SelectItem value="Colleague">Colleague</SelectItem>
            <SelectItem value="Neighbor">Neighbor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="contact-priority">Priority</Label>
        <Select value={priority.toString()} onValueChange={(value) => setPriority(parseInt(value))}>
          <SelectTrigger data-testid="select-contact-priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 (Highest)</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5 (Lowest)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" data-testid="button-submit-contact">
        Add Contact
      </Button>
    </form>
  );
}
