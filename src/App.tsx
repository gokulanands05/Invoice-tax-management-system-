import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuditDataProvider } from "@/contexts/AuditDataContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Taxes from "./pages/Taxes";
import Reports from "./pages/Reports";
import AIAssistantPage from "./pages/AIAssistantPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuditDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard/auth" element={<AuthPage />} />
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/dashboard"
                  element={
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <MainLayout>
                      <Invoices />
                    </MainLayout>
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <MainLayout>
                      <Clients />
                    </MainLayout>
                  }
                />
                <Route
                  path="/taxes"
                  element={
                    <MainLayout>
                      <Taxes />
                    </MainLayout>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <MainLayout>
                      <Reports />
                    </MainLayout>
                  }
                />
                <Route
                  path="/ai-assistant"
                  element={
                    <MainLayout>
                      <AIAssistantPage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuditDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
