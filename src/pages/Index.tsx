import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isNativePlatform } from "@/lib/native";
import { lazy } from "react";

const Landing = lazy(() => import("./Landing"));

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isNativePlatform) {
    return user ? <Navigate to="/trends" replace /> : <Navigate to="/auth" replace />;
  }

  if (user) return <Navigate to="/trends" replace />;
  return <Landing />;
};

export default Index;
