import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Landing from "./Landing";
import { isNativePlatform } from "@/lib/native";

const Index = () => {
  const { user, loading } = useAuth();
  const isNative = isNativePlatform;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/trends" replace />;

  // Мобильді қосымшада лендинг көрсетпей, тікелей авторизацияға бағыттау
  if (isNative) return <Navigate to="/auth" replace />;

  return <Landing />;
};

export default Index;
