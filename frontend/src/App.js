import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthCallback from "./pages/AuthCallback";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import TalentDashboard from "./pages/TalentDashboard";
import HirerDashboard from "./pages/HirerDashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import PricingPage from "./pages/PricingPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Protected Route Component
const ProtectedRoute = ({ children, allowedTypes }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-concrete-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedTypes && !allowedTypes.includes(user?.user_type)) {
    return <Navigate to={user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard'} replace />;
  }

  return children;
};

// App Router with session_id detection
function AppRouter() {
  const location = useLocation();
  
  // CRITICAL: Check URL fragment for session_id SYNCHRONOUSLY during render
  // This prevents race conditions with ProtectedRoute
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:jobId" element={<JobDetailPage />} />
      <Route 
        path="/talent/dashboard" 
        element={
          <ProtectedRoute allowedTypes={['talent']}>
            <TalentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/talent/resume-builder" 
        element={
          <ProtectedRoute allowedTypes={['talent']}>
            <ResumeBuilder />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/hirer/dashboard" 
        element={
          <ProtectedRoute allowedTypes={['hirer']}>
            <HirerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
