import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils"; // Assuming utils has cn or is similar to shadcn's lib/utils

interface SOSButtonProps {
  onArmSOS: (location: { latitude: number; longitude: number }) => void;
}

export function SOSButton({ onArmSOS }: SOSButtonProps) {
  const [isArming, setIsArming] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSOSClick = async () => {
    if (isArming) return;

    setError(null);
    setIsArming(true);
    setLocation(null); // Clear previous location

    try {
      // 1. Request Geolocation and get current position
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            return reject(
              new Error("Geolocation is not supported by your browser."),
            );
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
          });
        },
      );

      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(newLocation);
      console.log("Location fetched by SOSButton:", newLocation);

      // 2. Call the onArmSOS callback in the parent component
      onArmSOS(newLocation);
    } catch (err: any) {
      console.error("Failed to arm SOS system:", err);
      if (err.code === err.PERMISSION_DENIED) {
        setError(
          "Location access denied. Please enable location services for this site.",
        );
      } else {
        setError(err.message || "Failed to arm SOS system. Please try again.");
      }
      setLocation(null); // Clear location on error
    } finally {
      setIsArming(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Button
        variant="destructive"
        size="lg"
        className={cn(
          "h-20 w-40 rounded-full text-lg font-bold",
          isArming && "animate-pulse",
        )}
        onClick={handleSOSClick}
        disabled={isArming}
      >
        {isArming ? "Arming..." : "ARM SOS"}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
      {location && (
        <p className="text-sm text-gray-600">
          Location: {location.latitude}, {location.longitude}
        </p>
      )}
    </div>
  );
}
