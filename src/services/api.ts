// A mock API service to simulate backend communication

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export const api = {
  login: async (mobileNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mobileNumber }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }
    return data;
  },

  getUser: async (mobileNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/users?mobileNumber=${mobileNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Failed to fetch user details");
    }
    // json-server returns an array for queries
    return data.length > 0 ? data[0] : null;
  },

  sendRegistrationOtp: async (contactNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contactNumber }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to send registration OTP");
    }
    return data;
  },

  verifyOtp: async (mobileNumber: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mobileNumber, otp }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "OTP verification failed");
    }
    return data;
  },

  register: async (
    fullName: string,
    contactNumber: string,
    emergencyContact: string,
  ) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName, contactNumber, emergencyContact }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }
    return data;
  },

  sendSOS: async (mobileNumber: string, location: { latitude: number; longitude: number }, address?: string | null, videoLink?: string) => {
    const response = await fetch(`${API_BASE_URL}/send-sos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mobileNumber, location, address, videoLink }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to send SOS");
    }
    return data;
  },

  updateEmergencyContact: async (
    mobileNumber: string,
    emergencyContact: string,
  ) => {
    const response = await fetch(`${API_BASE_URL}/users/${mobileNumber}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emergencyContact }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update emergency contact");
    }
    return data;
  },

  getSafeZones: async (mobileNumber: string) => {
    const response = await fetch(
      `${API_BASE_URL}/safezones?mobileNumber=${mobileNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Failed to fetch safe zones");
    }
    return data;
  },

  addSafeZone: async (zone: {
    mobileNumber: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/safezones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zone),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to add safe zone");
    }
    return data;
  },

  deleteSafeZone: async (zoneId: number) => {
    const response = await fetch(`${API_BASE_URL}/safezones/${zoneId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete safe zone");
    }
    return response.json();
  },

  uploadVideo: async (videoBlob: Blob) => {
    const formData = new FormData();
    // Append the blob with a filename (e.g., 'recording.webm')
    formData.append("video", videoBlob, "recording.webm");

    const response = await fetch(`${API_BASE_URL}/upload-video`, {
      method: "POST",
      body: formData,
      // Note: Content-Type header is not set manually for FormData, browser sets it with boundary
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to upload video");
    }
    return data;
  },
};
