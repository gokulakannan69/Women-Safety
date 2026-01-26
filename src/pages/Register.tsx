import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { UserPlus, Shield } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { api } from "../services/api";

export function Register() {
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.sendRegistrationOtp(contactNumber);
      if (response.success) {
        setOtpSent(true);
      } else {
        setError(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Invalid number");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const otpResponse = await api.verifyOtp(contactNumber, otp);
      if (otpResponse.success) {
        const registerResponse = await api.register(
          fullName,
          contactNumber,
          emergencyContact,
        );
        if (registerResponse.success) {
          navigate("/dashboard");
        } else {
          setError(
            registerResponse.message ||
            "Registration failed. Please try again.",
          );
        }
      } else {
        setError(
          otpResponse.message || "OTP verification failed. Please try again.",
        );
      }
    } catch (err) {
      setError("Invalid number");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl relative">
      <div className="grid md:grid-cols-2 gap-0 bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Image Section */}
        <div className="relative hidden md:block">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1633355130553-2d90ad3507d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGJsYWNrJTIwd2hpdGUlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjQzMzkyMjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Women Safety"
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 flex items-center justify-center">
            <div className="text-white text-center px-8">
              <Shield className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl mb-2">Women Safety</h2>
              <p className="text-sm opacity-90">
                Join us in creating a safer community for women.
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <div className="mb-6 md:hidden text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h1 className="text-2xl">Create an account</h1>
            <p className="text-sm text-gray-600">
              {otpSent
                ? "Enter the OTP sent to your mobile"
                : "Enter your information to get started"}
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center animate-bounce font-medium">{error}</p>
          )}

          {!otpSent ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="Enter your contact number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                    pattern="[0-9]{10}"
                  />
                  <p className="text-xs text-gray-500">
                    Enter 10-digit mobile number
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    type="tel"
                    placeholder="Enter emergency contact number"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    required
                    pattern="[0-9]{10}"
                  />
                  <p className="text-xs text-gray-500">
                    Enter 10-digit mobile number
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending OTP..." : "Submit"}
                </Button>

                <div className="text-center text-sm pt-2">
                  Already have an account?{" "}
                  <Link to="/login" className="text-black hover:underline">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-sm text-black hover:underline"
                      disabled={isLoading}
                    >
                      Change details
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="text-sm text-black hover:underline"
                      disabled={isLoading}
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800"
                  disabled={isLoading || otp.length !== 4}
                >
                  {isLoading ? "Verifying..." : "Verify & Create account"}
                </Button>

                <div className="text-center text-sm pt-2">
                  Already have an account?{" "}
                  <Link to="/login" className="text-black hover:underline">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
