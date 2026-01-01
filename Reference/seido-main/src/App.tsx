import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import UpdatedApplyGrading from "./pages/UpdatedApplyGrading";
import Results from "./pages/Results";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDetail from "./pages/StudentDetail";
import NotFound from "./pages/NotFound";
import RefereeHub from "./pages/RefereeHub";
import RefereeRules from "./pages/RefereeRules";
import RefereeLearn from "./pages/RefereeLearn";
import RefereeQuiz from "./pages/RefereeQuiz";
import RefereeProgress from "./pages/RefereeProgress";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/apply-grading" element={<UpdatedApplyGrading />} />
            <Route path="/results" element={<Results />} />
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/student/:userId" element={<StudentDetail />} />
            <Route path="/referee" element={<RefereeHub />} />
            <Route path="/referee/rules" element={<RefereeRules />} />
            <Route path="/referee/learn" element={<RefereeLearn />} />
            <Route path="/referee/quiz" element={<RefereeQuiz />} />
            <Route path="/referee/progress" element={<RefereeProgress />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
