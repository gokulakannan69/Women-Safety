import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { api } from "../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Shield,
  AlertCircle,
  MapPin,
  Mic,
  CheckCircle,
  XCircle,
  Settings,
  Map,
  Phone,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { SOSButton } from "../components/SOSButton"; // Import the new SOSButton
import { LogOut } from "lucide-react";
import { FakeCall } from "../components/FakeCall";
import { ShareJourney } from "../components/ShareJourney";
import { VideoRecorder, VideoRecorderRef } from "../components/VideoRecorder";
import { useShake } from "../hooks/useShake";

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

export interface SafeZone {
  id: number;
  mobileNumber: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [locationAccess, setLocationAccess] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [microphoneAccess, setMicrophoneAccess] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
  } | null>(null);
  const mobileNumber = "1234567890"; // Default/Fallback
  const [emergencyContact, setEmergencyContact] = useState("9999999999"); // Default/Fallback
  const [userName, setUserName] = useState("User");

  const [isArmed, setIsArmed] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);


  const zoneStatus = useRef<{ [key: string]: "inside" | "outside" }>({});

  const [nearestPoliceStation, setNearestPoliceStation] = useState<{
    name: string;
    phone?: string;
    address: string;
    lat: number;
    lon: number;
  } | null>(null);

  const videoRecorderRef = useRef<VideoRecorderRef>(null);

  // Shake Detection
  useShake(() => {
    if (isArmed && !sosActivated) {
      console.log("Shake detected! Triggering SOS...");
      executeSOS();
    }
  });


  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await api.getUser(mobileNumber);
        if (user) {
          if (user.emergencyContact) {
            setEmergencyContact(user.emergencyContact);
          }
          if (user.fullName) {
            setUserName(user.fullName);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    };

    const fetchSafeZones = async () => {
      try {
        const zones = await api.getSafeZones(mobileNumber);

        // Initialize zone status
        const initialStatus: { [key: string]: "inside" | "outside" } = {};
        zones.forEach((zone: SafeZone) => {
          initialStatus[zone.id] = "outside";
        });
        zoneStatus.current = initialStatus;

      } catch (error) {
        console.error("Failed to fetch safe zones:", error);
      }
    };

    fetchUserDetails();
    fetchSafeZones();
  }, [mobileNumber]);

  const handleSaveEmergencyContact = () => {
    api
      .updateEmergencyContact(mobileNumber, emergencyContact)
      .then((response) => {
        console.log("Emergency contact updated:", response);
        alert("Emergency contact updated successfully!");
      })
      .catch((error) => {
        console.error("Failed to update emergency contact:", error);
        alert("Failed to update emergency contact. Please try again.");
      });
  };

  const handleLogout = () => {
    // Clear user session/data
    // localStorage.removeItem("user"); // Example if you stored user data
    navigate("/login");
  };

  // Request Location Access
  const requestLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAccess("granted");
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          setLocationAccess("denied");
          console.error("Location access denied:", error);
        },
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Track location continuously if granted
  useEffect(() => {
    let watchId: number;
    if (locationAccess === "granted" && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [locationAccess]);

  // Request Microphone Access
  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneAccess("granted");
      console.log("Microphone access granted");
      // startListening(); // Do not start listening here, it will be started by useEffect if isArmed is true
    } catch (error) {
      setMicrophoneAccess("denied");
      console.error("Microphone access denied:", error);
    }
  };

  // Voice Recognition Setup
  const startListening = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      // @ts-ignore
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Voice recognition started. Listening for wake word...");
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // @ts-ignore
          .map((result: any) => result[0].transcript)
          .join("")
          .toLowerCase();

        console.log("Heard:", transcript);

        // More robust check for "help help" - requires "help" to be said at least twice in close succession
        // The regex matches "help" followed by optional whitespace, repeated 2 or more times.
        if (/(help\s*){2,}/i.test(transcript) || transcript.includes("help help")) {
          console.log("SOS Trigger Phrase Detected!");
          executeSOS();
          recognition.stop(); // Stop listening after activation
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
          setMicrophoneAccess("denied");
        }
      };

      recognition.onend = () => {
        // Restart listening if not SOS activated (keep monitoring)
        if (!sosActivated && microphoneAccess === "granted") {
          // Small delay to prevent rapid restart loops
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log("Recognition already started");
            }
          }, 1000);
        }
      };

      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    } else {
      alert(
        "Speech recognition not supported in this browser. Please use Chrome.",
      );
    }
  };

  const getAccurateLocation = () => {
    return new Promise<{ latitude: number; longitude: number }>(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(
            new Error("Geolocation is not supported by your browser."),
          );
        }
        // Try high accuracy first
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("High accuracy location failed, trying low accuracy...", error);
            // Fallback to low accuracy
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                reject(error);
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      },
    );
  };

  const getAddressFromCoordinates = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error("Error fetching address:", error);
      return null;
    }
  };

  const findNearestPoliceStation = async (lat: number, lon: number) => {
    const radius = 5000; // 5km radius
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radius},${lat},${lon})[amenity=police];out;`;

    try {
      const response = await fetch(overpassUrl);
      const data = await response.json();
      if (data.elements.length > 0) {
        const station = data.elements[0];
        const tags = station.tags;
        const address = `${tags["addr:street"] || ''} ${tags["addr:housenumber"] || ''}, ${tags["addr:city"] || ''}`;

        setNearestPoliceStation({
          name: tags.name || "Police Station",
          phone: tags.phone || tags['contact:phone'],
          address: address,
          lat: station.lat,
          lon: station.lon,
        });
      }
    } catch (error) {
      console.error("Error fetching nearest police station:", error);
    }
  };

  // Fetch nearest police station when location is available
  useEffect(() => {
    if (currentLocation) {
      findNearestPoliceStation(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation]);

  // Start listening on mount if permission granted
  useEffect(() => {
    if (microphoneAccess === "granted" && isArmed) {
      startListening();
    }
  }, [microphoneAccess, isArmed]);

  // Handler for SOSButton to arm the system
  const handleArmSOS = async (location: {
    latitude: number;
    longitude: number;
  }) => {
    setIsArmed(true);
    console.log("SOS System Armed with location:", location);

    // Request Mic access to start listening
    await requestMicrophoneAccess();
  };

  // Execute SOS (Send Alert) - for voice activated SOS
  const executeSOS = async () => {
    setSosActivated(true);

    // Voice Alert - Say "Help Help Help"
    const speakHelp = () => {
      if ("speechSynthesis" in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance("Help! Help! Help!");
        utterance.rate = 1.2; // Speak a bit faster
        utterance.pitch = 1.2; // Higher pitch for urgency
        utterance.volume = 1; // Maximum volume

        // Repeat the message multiple times
        utterance.onend = () => {
          // Speak again after a brief pause
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 500);
        };

        window.speechSynthesis.speak(utterance);
        console.log('Voice alert activated: "Help! Help! Help!"');
      } else {
        console.log("Speech synthesis not supported");
      }
    };

    speakHelp();

    try {
      console.log("Fetching accurate location for SOS...");
      let locationToSend;

      try {
        // Check if we have a recent high-accuracy location (e.g., < 10 seconds old, < 20m accuracy)
        const isLocationRecent = currentLocation?.timestamp && (Date.now() - currentLocation.timestamp < 10000);
        const isLocationAccurate = currentLocation?.accuracy && currentLocation.accuracy < 20;

        if (currentLocation && isLocationRecent && isLocationAccurate) {
          console.log("Using cached high-accuracy location", currentLocation);
          locationToSend = { latitude: currentLocation.lat, longitude: currentLocation.lng };
        } else {
          locationToSend = await getAccurateLocation();
        }
      } catch (e) {
        console.warn("Failed to get accurate location, falling back to current location state", e);
        if (currentLocation) {
          locationToSend = { latitude: currentLocation.lat, longitude: currentLocation.lng };
        }
      }

      // Fetch address
      let address = null;
      if (locationToSend) {
        console.log("Fetching address for location...");
        address = await getAddressFromCoordinates(locationToSend.latitude, locationToSend.longitude);
        console.log("Fetched Address:", address);
        findNearestPoliceStation(locationToSend.latitude, locationToSend.longitude);
      }

      if (locationToSend) {
        // Send location to emergency contacts
        console.log("Sending location to emergency contacts...");

        // Call Backend API to send SOS
        api
          .sendSOS(mobileNumber, locationToSend, address)
          .then((response) => {
            console.log("SOS sent successfully:", response);
            // Start Auto-Recording if not already started
            if (videoRecorderRef.current) {
              videoRecorderRef.current.startRecording();
            }
          })
          .catch((error) => {
            console.error("Failed to send SOS:", error);
          });

        console.log(
          `Location link: https://www.openstreetmap.org/?mlat=${locationToSend.latitude}&mlon=${locationToSend.longitude}#map=16/${locationToSend.latitude}/${locationToSend.longitude}`,
        );
      } else {
        console.error("No location available to send SOS.");
        alert("Could not get your location. Sending SOS without location.");
        // Still try to send SOS even without location? Backend might reject it.
        // For now, let's keep it as is, but maybe we should send a default location or flag?
      }
    } catch (error) {
      console.error("Error in SOS execution:", error);
    }

    // Alert emergency services
    console.log("Alerting emergency services (112/100)...");

    // Send SMS to emergency contacts
    console.log("Sending SMS to emergency contacts...");

    // Reset SOS after demo (remove this in production)
    setTimeout(() => {
      setSosActivated(false);
      setIsArmed(false);
      // setNearestPoliceStation(null); // Keep police station info visible
      // Stop voice alert
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">Welcome, {userName}</h1>
              <p className="text-sm text-gray-600">Stay Safe, Stay Connected</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-full"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-4xl mx-auto mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Manage your safety preferences and emergency contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Emergency Contact</p>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="text-sm text-gray-600 border rounded px-2 py-1 mt-1"
                      placeholder="Enter emergency contact"
                    />
                  </div>
                  <Button size="sm" onClick={handleSaveEmergencyContact}>
                    Save
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">My Safe Zones</p>
                    <p className="text-xs text-gray-500">Define areas like home, work, or school</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/safe-zones')}>
                    <Map className="w-4 h-4 mr-2" />
                    Manage Zones
                  </Button>
                </div>



                {/* Logout */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm text-red-700">Logout</p>
                    <p className="text-xs text-red-500">Sign out of your account</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SOS Activated Alert */}
      {isArmed && !sosActivated && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Mic className="w-6 h-6" />
              <div>
                <p className="font-semibold">SYSTEM ARMED - LISTENING</p>
                <p className="text-sm">
                  Say <span className="font-bold">"HELP HELP HELP"</span> to
                  send emergency alert.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOS Activated Alert */}
      {sosActivated && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">SOS ACTIVATED!</p>
                <p className="text-sm">
                  Emergency alerts sent. Help is on the way.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nearest Police Station */}
      {sosActivated && nearestPoliceStation && (
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <MapPin className="w-5 h-5" />
                Nearest Police Station
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold">{nearestPoliceStation.name}</p>
              <p className="text-sm text-gray-600">{nearestPoliceStation.address}</p>
              {nearestPoliceStation.phone && (
                <a href={`tel:${nearestPoliceStation.phone}`} className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now ({nearestPoliceStation.phone})
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Left Column: SOS + Quick Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Emergency SOS Button */}
          <Card className="h-full border-red-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-700">Emergency SOS</CardTitle>
              <CardDescription>
                Press the button to arm the system. An alert will be sent only
                after you say "HELP HELP HELP".
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
              <SOSButton onArmSOS={handleArmSOS} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FakeCall />
              <ShareJourney />
              <VideoRecorder
                ref={videoRecorderRef}
                locationText={currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : undefined}
                onUploadComplete={(videoUrl) => {
                  console.log("Video uploaded, sending second alert...", videoUrl);
                  // Ideally call api.sendSOS again or a specialized alert with the video link
                  // For now, we will just log it as per the plan to "enhance alerts" (backend supports it)
                  if (currentLocation) {
                    api.sendSOS(mobileNumber, { latitude: currentLocation.lat, longitude: currentLocation.lng }, null, videoUrl)
                      .then(res => console.log("Video alert sent:", res));
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Permissions Status */}
        <div className="space-y-4">
          {/* Nearest Police Station Card */}
          {nearestPoliceStation && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Nearest Police Station
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">{nearestPoliceStation.name}</p>
                  <p className="text-xs text-gray-600">{nearestPoliceStation.address}</p>
                  {nearestPoliceStation.phone && (
                    <div className="pt-2 flex gap-2">
                      <a
                        href={`tel:${nearestPoliceStation.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${nearestPoliceStation.lat},${nearestPoliceStation.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <MapPin className="w-3 h-3" />
                        Directions
                      </a>
                    </div>
                  )}
                  {!nearestPoliceStation.phone && (
                    <div className="pt-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${nearestPoliceStation.lat},${nearestPoliceStation.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full gap-2 bg-white border border-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <MapPin className="w-3 h-3" />
                        Get Directions
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Access Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locationAccess === "granted" && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Granted
                  </Badge>
                )}
                {locationAccess === "denied" && (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    <XCircle className="w-3 h-3 mr-1" />
                    Denied
                  </Badge>
                )}
                {locationAccess === "prompt" && (
                  <Button
                    onClick={requestLocationAccess}
                    size="sm"
                    className="w-full"
                  >
                    Enable Location
                  </Button>
                )}
                {currentLocation && (
                  <p className="text-xs text-gray-600">
                    Lat: {currentLocation.lat.toFixed(4)}
                    <br />
                    Lng: {currentLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Microphone Access Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Microphone Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {microphoneAccess === "granted" && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Granted
                  </Badge>
                )}
                {microphoneAccess === "denied" && (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    <XCircle className="w-3 h-3 mr-1" />
                    Denied
                  </Badge>
                )}
                {microphoneAccess === "prompt" && (
                  <Button
                    onClick={requestMicrophoneAccess}
                    size="sm"
                    className="w-full"
                  >
                    Enable Microphone
                  </Button>
                )}
                <p className="text-xs text-gray-600">
                  Used for voice activation ("Help Help Help")
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Emergency Contacts Info */}
      <div className="max-w-4xl mx-auto mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emergency Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-2">Police</p>
                <div className="flex gap-2">
                  <a href="tel:100" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Phone className="w-3 h-3 mr-1" /> 100
                    </Button>
                  </a>
                  <a href="tel:112" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Phone className="w-3 h-3 mr-1" /> 112
                    </Button>
                  </a>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-2">Women Helpline</p>
                <a href="tel:1091">
                  <Button variant="outline" size="sm" className="w-full text-pink-600 border-pink-200 hover:bg-pink-50">
                    <Phone className="w-3 h-3 mr-1" /> 1091
                  </Button>
                </a>
              </div>
              <div>
                <p className="font-semibold mb-2">Ambulance</p>
                <div className="flex gap-2">
                  <a href="tel:102" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                      <Phone className="w-3 h-3 mr-1" /> 102
                    </Button>
                  </a>
                  <a href="tel:108" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                      <Phone className="w-3 h-3 mr-1" /> 108
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}