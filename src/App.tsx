import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";
import { TrackingPixels } from "@/components/TrackingPixels";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { SplashScreen } from "@/components/SplashScreen";
import { NativePaywall } from "@/components/NativePaywall";
import { isNativePlatform } from "@/lib/native";
import Index from "./pages/Index";


const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Trends = lazy(() => import("./pages/Trends"));
const VideoAnalysis = lazy(() => import("./pages/VideoAnalysis"));
const AccountAnalysis = lazy(() => import("./pages/AccountAnalysis"));
const Journal = lazy(() => import("./pages/Journal"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Razvedka = lazy(() => import("./pages/Razvedka"));
const Library = lazy(() => import("./pages/Library"));
const Analytics = lazy(() => import("./pages/Analytics"));

const Pricing = lazy(() => import("./pages/Pricing"));
const Admin = lazy(() => import("./pages/Admin"));
const ScriptFromVideo = lazy(() => import("./pages/ScriptFromVideo"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Payment = lazy(() => import("./pages/Payment"));
const Contacts = lazy(() => import("./pages/Contacts"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));
const StyleGuide = lazy(() => import("./pages/StyleGuide"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      if (isNativePlatform) {
        setOnboardingDone(true);
      }
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          await supabase.from("profiles").insert({ user_id: user.id, onboarding_completed: true });
          setOnboardingDone(true);
        } else {
          setOnboardingDone(data.onboarding_completed ?? false);
        }
      });
  }, [user]);

  if (loading || (user && onboardingDone === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && isNativePlatform) return <Navigate to="/auth" replace />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!onboardingDone && !isNativePlatform) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/trends" replace />;
  return <>{children}</>;
}

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route element={<PageTransition />}>
          <Route path="/auth" element={isNativePlatform ? <Navigate to="/trends" replace /> : <Auth />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Navigate to="/trends" replace />} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
          <Route path="/video-analysis" element={<ProtectedRoute><VideoAnalysis /></ProtectedRoute>} />
          <Route path="/ai-script" element={<ProtectedRoute><ScriptFromVideo /></ProtectedRoute>} />
          <Route path="/account-analysis" element={<ProtectedRoute><AccountAnalysis /></ProtectedRoute>} />
          <Route path="/favorites" element={<Navigate to="/library" replace />} />
          <Route path="/journal" element={<Navigate to="/trends" replace />} />
          <Route path="/razvedka" element={<ProtectedRoute><Razvedka /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
           <Route path="/tokens" element={<Navigate to="/subscription" replace />} />
           <Route path="/pricing" element={<Navigate to="/subscription" replace />} />
           <Route path="/subscription" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failure" element={<PaymentFailure />} />
          <Route path="/style-guide" element={<StyleGuide />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (!isNativePlatform) return false;
    return true;
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("splash_shown", "1");
    if (isNativePlatform) setShowPaywall(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        {showPaywall && <NativePaywall onDismiss={() => setShowPaywall(false)} />}
        <BrowserRouter>
          <AuthProvider>
            <TrackingPixels />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
