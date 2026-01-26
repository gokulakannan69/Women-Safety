import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { SafeZones } from "./pages/SafeZones";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/safe-zones" element={<SafeZones />} />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}
