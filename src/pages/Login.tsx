import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Shield } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { api } from "../services/api";

export function Login() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.login(mobileNumber);
      if (response.success) {
        setOtpSent(true);
      } else {
        setError(response.message || "Failed to send OTP");
        if (response.message && response.message.includes("not registered")) {
          // Optional: You could auto-redirect to register or show a link
          // For now, the error message is sufficient as per request
        }
      }
    } catch (err) {
      setError("Invalid number");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.verifyOtp(mobileNumber, otp);
      if (response.success) {
        // Store the token in localStorage or context
        localStorage.setItem("token", response.token);
        navigate("/dashboard");
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Invalid number");
    } finally {
      setLoading(false);
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
                Your safety is our priority. Stay protected, stay connected.
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <div className="mb-6 md:hidden text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h1 className="text-2xl">Welcome back</h1>
            <p className="text-sm text-gray-600">
              {otpSent
                ? "Enter the OTP sent to your mobile"
                : "Enter your mobile number to continue"}
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4 animate-bounce font-medium">{error}</p>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                      pattern="[0-9]{10}"
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      className="bg-black hover:bg-gray-800"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter 10-digit mobile number
                  </p>
                </div>

                <div className="text-center text-sm pt-4">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-black hover:underline">
                    Sign up
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
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-sm text-black hover:underline"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800"
                  disabled={loading || otp.length !== 4}
                >
                  {loading ? "Verifying..." : "Verify & Sign in"}
                </Button>

                <div className="text-center text-sm pt-2">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-black hover:underline">
                    Sign up
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
