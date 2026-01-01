
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import StudentProfile from "./pages/StudentProfile";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import { AuthGuard } from "./components/auth/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                    <Route path="/grading" element={<AuthGuard><Profile /></AuthGuard>} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/student/:userId" element={<AuthGuard><StudentProfile /></AuthGuard>} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
            <Toaster />
        </AuthProvider>
    </QueryClientProvider>
);

export default App;
