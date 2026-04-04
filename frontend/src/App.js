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
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import CompaniesPage from "./pages/CompaniesPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import MessagesPage from "./pages/MessagesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ResumeTemplatesPage from "./pages/ResumeTemplatesPage";
import InterviewsPage from "./pages/InterviewsPage";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { OfflineIndicator } from "./components/OfflineIndicator";
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
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/companies" element={<CompaniesPage />} />
      <Route path="/companies/:userId" element={<CompanyDetailPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/resume-templates" element={<ResumeTemplatesPage />} />
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
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviews" 
        element={
          <ProtectedRoute>
            <InterviewsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
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
        <OfflineIndicator />
        <div className="pb-14 md:pb-0">
          <AppRouter />
        </div>
        <MobileBottomNav />
        <PWAInstallPrompt />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
