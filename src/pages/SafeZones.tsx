import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../services/api";
import { Trash2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


interface SafeZone {
  id: number;
  mobileNumber: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

const mobileNumber = "1234567890"; // Hardcoded for now, as in Dashboard

function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}


export function SafeZones() {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [newName, setNewName] = useState("");
  const [newRadius, setNewRadius] = useState(100); // Default radius in meters
  const [newLocation, setNewLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchSafeZones();
  }, []);

  const fetchSafeZones = async () => {
    try {
      const zones = await api.getSafeZones(mobileNumber);
      setSafeZones(zones);
    } catch (error) {
      console.error("Failed to fetch safe zones:", error);
    }
  };

  const handleAddSafeZone = async () => {
    if (!newName || !newLocation) {
      alert("Please provide a name and select a location on the map.");
      return;
    }

    try {
      await api.addSafeZone({
        mobileNumber,
        name: newName,
        latitude: newLocation.lat,
        longitude: newLocation.lng,
        radius: newRadius,
      });
      setNewName("");
      setNewRadius(100);
      setNewLocation(null);
      fetchSafeZones();
    } catch (error) {
      console.error("Failed to add safe zone:", error);
      alert("Failed to add safe zone.");
    }
  };

  const handleDeleteSafeZone = async (zoneId: number) => {
    try {
      await api.deleteSafeZone(zoneId);
      fetchSafeZones();
    } catch (error) {
      console.error("Failed to delete safe zone:", error);
      alert("Failed to delete safe zone.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Safe Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Safe Zone Name (e.g., Home, Office)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Radius in meters"
            value={newRadius}
            onChange={(e) => setNewRadius(parseInt(e.target.value, 10))}
          />
          <p className="text-sm text-gray-600">Click on the map to set the zone's center.</p>
          <div style={{ height: "300px", width: "100%" }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationPicker onLocationSelect={(lat, lng) => setNewLocation({ lat, lng })} />
            </MapContainer>
          </div>
          {newLocation && (
              <p className="text-sm">Selected Location: Lat: {newLocation.lat.toFixed(4)}, Lng: {newLocation.lng.toFixed(4)}</p>
          )}
          <Button onClick={handleAddSafeZone}>Add Safe Zone</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Safe Zones</CardTitle>
        </CardHeader>
        <CardContent>
          {safeZones.length === 0 ? (
            <p>You haven't added any safe zones yet.</p>
          ) : (
            <ul className="space-y-3">
              {safeZones.map((zone) => (
                <li key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{zone.name}</p>
                    <p className="text-sm text-gray-600">Radius: {zone.radius}m</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSafeZone(zone.id)} aria-label={`Delete ${zone.name}`}>
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
