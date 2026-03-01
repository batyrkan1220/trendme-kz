import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import Trends from "./pages/Trends";
import VideoAnalysis from "./pages/VideoAnalysis";
import AccountAnalysis from "./pages/AccountAnalysis";
import Favorites from "./pages/Favorites";
import Journal from "./pages/Journal";
import Auth from "./pages/Auth";
import Razvedka from "./pages/Razvedka";
import Library from "./pages/Library";
import Analytics from "./pages/Analytics";
import Tokens from "./pages/Tokens";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/video-analysis" element={<VideoAnalysis />} />
          <Route path="/account-analysis" element={<AccountAnalysis />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/razvedka" element={<Razvedka />} />
          <Route path="/library" element={<Library />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
