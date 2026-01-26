import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Settings() {
  const navigate = useNavigate();
  const mobileNumber = "1234567890"; // Default/Fallback
  const [emergencyContact, setEmergencyContact] = useState("9999999999"); // Default/Fallback

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await api.getUser(mobileNumber);
        if (user && user.emergencyContact) {
          setEmergencyContact(user.emergencyContact);
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    };
    fetchUserDetails();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto mb-6">
        <Button
          variant="ghost"
          className="mb-4 pl-0 hover:bg-transparent hover:text-gray-900"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
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
                  <p className="font-semibold text-sm">Profile Information</p>
                  <p className="text-xs text-gray-600">
                    Update your personal details
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>

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
                  <p className="font-semibold text-sm">SOS Settings</p>
                  <p className="text-xs text-gray-600">
                    Configure emergency alert behavior
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Notifications</p>
                  <p className="text-xs text-gray-600">
                    Manage notification preferences
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Settings
                </Button>
              </div>

              <div className="pt-3 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/login");
                  }}
                >
                  Log Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
