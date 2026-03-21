// src/components/WasteTracking.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Truck, MapPin, Clock, Navigation, Phone,
  BarChart3, Recycle, Weight, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { EmployeeMapDashboard } from "@/components/EmployeeMapDashboard";

interface WasteTrackingProps {
  isOpen: boolean;
  onClose: () => void;
}

const WasteTracking = ({ isOpen, onClose }: WasteTrackingProps) => {
  const [activeVehicles, setActiveVehicles] = useState([
    { id: "WM001", type: "Collection Truck",  driver: "Rajesh Kumar",  area: "Sector 15-18",   status: "En Route",   eta: "10", currentLocation: "Park Street",       phone: "+91 98765 43210", capacity: 90, nextStop: "Community Center", collected: 420 },
    { id: "WM002", type: "Recycling Van",     driver: "Priya Sharma",  area: "Sector 12-14",   status: "Collecting", eta: "20", currentLocation: "Mall Road",          phone: "+91 98765 43211", capacity: 54, nextStop: "Metro Station",    collected: 210 },
    { id: "WM003", type: "Hazardous Waste",   driver: "Vikram Singh",  area: "Industrial Zone", status: "Available",  eta: "35", currentLocation: "Processing Center",  phone: "+91 98765 43212", capacity: 28, nextStop: "Office Complex",   collected: 95  },
    { id: "WM004", type: "Dry Waste Van",     driver: "Amit Patel",    area: "North Delhi",     status: "Collecting", eta: "12", currentLocation: "Rohini Sector 5",    phone: "+91 98765 43213", capacity: 71, nextStop: "Recycling MRF",    collected: 310 },
  ]);

  // Simulated live ETA countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveVehicles(prev => prev.map(v => ({
        ...v,
        eta: String(Math.max(2, parseInt(v.eta) - 1)),
        capacity: Math.min(98, v.capacity + Math.floor(Math.random() * 3)),
        collected: v.collected + Math.floor(Math.random() * 5),
      })));
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const totalCollected   = activeVehicles.reduce((a, v) => a + v.collected, 0);
  const avgCapacity      = Math.round(activeVehicles.reduce((a, v) => a + v.capacity, 0) / activeVehicles.length);
  const vehiclesActive   = activeVehicles.filter(v => v.status !== "Available").length;
  const criticalVehicles = activeVehicles.filter(v => v.capacity >= 85).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En Route":   return "bg-blue-500 text-white";
      case "Collecting": return "bg-yellow-500 text-white";
      case "Available":  return "bg-green-500 text-white";
      default:           return "bg-muted text-muted-foreground";
    }
  };

  const capacityColor = (cap: number) =>
    cap >= 85 ? "text-red-600" : cap >= 60 ? "text-yellow-600" : "text-green-600";

  const capacityBarColor = (cap: number) =>
    cap >= 85 ? "bg-red-500" : cap >= 60 ? "bg-yellow-500" : "bg-green-500";

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">

        {/* Header */}
        <AlertDialogHeader className="p-4 md:p-5 pb-3 border-b">
          <AlertDialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Truck className="h-5 w-5 text-primary" />
            Live Waste Collection Tracking
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs md:text-sm">
            Real-time tracking of waste collection vehicles and zone-wise waste data
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">

          {/* ── Live Waste Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-0 bg-green-50 dark:bg-green-950">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0"><Weight className="h-4 w-4 text-green-600" /></div>
                <div><p className="text-xs text-muted-foreground">Collected Today</p><p className="text-lg font-bold text-green-700">{totalCollected} kg</p></div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-blue-50 dark:bg-blue-950">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0"><Truck className="h-4 w-4 text-blue-600" /></div>
                <div><p className="text-xs text-muted-foreground">Active Vehicles</p><p className="text-lg font-bold text-blue-700">{vehiclesActive} / {activeVehicles.length}</p></div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex-shrink-0"><BarChart3 className="h-4 w-4 text-yellow-600" /></div>
                <div><p className="text-xs text-muted-foreground">Avg Capacity</p><p className="text-lg font-bold text-yellow-700">{avgCapacity}%</p></div>
              </CardContent>
            </Card>
            <Card className={`border-0 ${criticalVehicles > 0 ? 'bg-red-50 dark:bg-red-950 ring-2 ring-red-300' : 'bg-gray-50 dark:bg-gray-900'}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${criticalVehicles > 0 ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <AlertTriangle className={`h-4 w-4 ${criticalVehicles > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Near Full</p>
                  <p className={`text-lg font-bold ${criticalVehicles > 0 ? 'text-red-600' : 'text-gray-500'}`}>{criticalVehicles} vehicle{criticalVehicles !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Zone Summary ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Recycle className="h-4 w-4 text-primary" /> Zone-wise Collection Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { zone: 'North Delhi',     collected: 850,  target: 1200, color: 'bg-blue-500' },
                { zone: 'South Delhi',     collected: 620,  target: 900,  color: 'bg-green-500' },
                { zone: 'East Delhi',      collected: 430,  target: 700,  color: 'bg-yellow-500' },
                { zone: 'West Delhi',      collected: 310,  target: 600,  color: 'bg-purple-500' },
                { zone: 'Industrial Zone', collected: 1100, target: 1500, color: 'bg-orange-500' },
              ].map(z => (
                <div key={z.zone}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{z.zone}</span>
                    <span className="text-xs text-muted-foreground">{z.collected} / {z.target} kg</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${z.color} rounded-full transition-all`} style={{ width: `${Math.round((z.collected / z.target) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Active Vehicles ── */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Active Vehicles in Your Area
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm">{vehicle.id}</span>
                        <span className="text-xs text-muted-foreground ml-2">{vehicle.type}</span>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(vehicle.status)}`}>{vehicle.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Navigation className="h-3 w-3" />{vehicle.currentLocation}</div>
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" />ETA: {vehicle.eta} mins</div>
                      <div className="flex items-center gap-1"><Truck className="h-3 w-3" />Driver: {vehicle.driver}</div>
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{vehicle.area}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Capacity</span>
                        <span className={`font-bold ${capacityColor(vehicle.capacity)}`}>{vehicle.capacity}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${capacityBarColor(vehicle.capacity)} rounded-full transition-all`} style={{ width: `${vehicle.capacity}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Collected: <span className="font-semibold text-foreground">{vehicle.collected} kg</span></span>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                          <Phone className="h-3 w-3 mr-1" /> Call
                        </Button>
                        {vehicle.capacity >= 85 && (
                          <Badge className="bg-red-500 text-white text-xs animate-pulse">Near Full!</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ── Live Map ── */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Live Location Map
            </h3>
            <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: 420 }}>
              <EmployeeMapDashboard />
            </div>
          </div>

        </div>

        <AlertDialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Close</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WasteTracking;
