import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { TrackingPixels } from "@/components/TrackingPixels";
import { lazy, Suspense } from "react";
import { isNativePlatform } from "@/lib/native";
import { SplashScreen } from "@/components/SplashScreen";
import { useState, useCallback } from "react";

// Тек қажетті беттер
const Trends = lazy(() => import("./pages/Trends"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const Library = lazy(() => import("./pages/Library"));
const AccountAnalysis = lazy(() => import("./pages/AccountAnalysis"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Guest режімінде 10 видео көрсетеді, одан кейін auth-қа бағыттайды
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <SuspenseFallback />;
  // Native app-та тіркелусіз кіреді
  if (isNativePlatform) return <>{children}</>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function Index() {
  const { user, loading } = useAuth();
  if (loading) return <SuspenseFallback />;
  if (user) return <Navigate to="/trends" replace />;
  if (isNativePlatform) return <Navigate to="/trends" replace />;
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Landing />
    </Suspense>
  );
}

const AppRoutes = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <Routes>
      {/* Публичные */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-failure" element={<PaymentFailure />} />

      {/* Негізгі беттер */}
      <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
      <Route path="/account-analysis" element={<ProtectedRoute><AccountAnalysis /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />

      {/* Ескі роуттарды redirect */}
      <Route path="/dashboard" element={<Navigate to="/trends" replace />} />
      <Route path="/video-analysis" element={<Navigate to="/trends" replace />} />
      <Route path="/favorites" element={<Navigate to="/library" replace />} />
      <Route path="/journal" element={<Navigate to="/trends" replace />} />
      <Route path="/library" element={<Navigate to="/library" replace />} />
      <Route path="/razvedka" element={<Navigate to="/trends" replace />} />
      <Route path="/analytics" element={<Navigate to="/trends" replace />} />
      <Route path="/tokens" element={<Navigate to="/subscription" replace />} />
      <Route path="/pricing" element={<Navigate to="/subscription" replace />} />
      <Route path="/contacts" element={<Navigate to="/trends" replace />} />
      <Route path="/onboarding" element={<Navigate to="/trends" replace />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(() => isNativePlatform);
  const [splashJustFinished, setSplashJustFinished] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setSplashJustFinished(true);
    setTimeout(() => setSplashJustFinished(false), 700);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
          <AuthProvider>
            <TrackingPixels />
            <div className={splashJustFinished ? "animate-post-splash-reveal" : ""}>
              <AppRoutes />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
