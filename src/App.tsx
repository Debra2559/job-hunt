import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Career from "./pages/Career";
import CareerMap from "./pages/CareerMap";
import CareerRecommend from "./pages/CareerRecommend";
import CareerJD from "./pages/CareerJD";
import CareerResume from "./pages/CareerResume";
import CareerTips from "./pages/CareerTips";
import CareerCompany from "./pages/CareerCompany";
import AssistantHub from "./pages/AssistantHub";
import FloatingAssistant from "./components/career/FloatingAssistant";
import NotFound from "./pages/NotFound";
import Fireworks from "./components/Fireworks";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Fireworks />
      <BrowserRouter>
        <FloatingAssistant />
        <Routes>
          <Route path="/" element={<CareerMap />} />
          <Route path="/map" element={<CareerMap />} />
          <Route path="/career" element={<Career />} />
          <Route path="/career/recommend" element={<CareerRecommend />} />
          <Route path="/career/jd" element={<CareerJD />} />
          <Route path="/career/resume" element={<CareerResume />} />
          <Route path="/career/tips" element={<CareerTips />} />
          <Route path="/career/company" element={<CareerCompany />} />
          <Route path="/career/assistants" element={<AssistantHub />} />
          <Route path="/career/agent" element={<AssistantHub />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
