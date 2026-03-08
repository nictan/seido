
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
import { MyGrading } from "./pages/MyGrading";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RankManagement from "./pages/RankManagement";
import { AuthGuard, FeatureGuard } from "./components/auth/AuthGuard";
import RefereePrepHub from "./features/referee/pages/RefereePrepHub";
import RefereeAdmin from "./features/referee/pages/RefereeAdmin";
import WaiverPage from "./pages/WaiverPage";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                    <Route path="/waiver" element={<AuthGuard><WaiverPage /></AuthGuard>} />
                    <Route path="/grading" element={<AuthGuard><FeatureGuard feature="grading"><MyGrading /></FeatureGuard></AuthGuard>} />
                    <Route path="/instructor" element={<AuthGuard><InstructorDashboard /></AuthGuard>} />
                    <Route path="/admin" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
                    <Route path="/admin/ranks" element={<AuthGuard><RankManagement /></AuthGuard>} />
                    <Route path="/admin/referee" element={<AuthGuard><RefereeAdmin /></AuthGuard>} />
                    <Route path="/referee" element={<AuthGuard><FeatureGuard feature="referee_prep"><RefereePrepHub /></FeatureGuard></AuthGuard>} />
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
