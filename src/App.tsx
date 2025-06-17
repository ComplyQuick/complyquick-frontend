import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
} from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SuperUserDashboard from "./pages/SuperUserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CoursePlayer from "./pages/CoursePlayer";
import AdminCoursePlayer from "./pages/AdminCoursePlayer";
import ResultPage from "./pages/ResultPage";
import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion } from "framer-motion";
import Quiz from "@/components/course/Quiz";
import QuizResults from "./pages/QuizResults";
import Certificate from "@/components/course/Certificate";
import Login from "./pages/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminCourseExplanations from "@/pages/AdminCourseExplanations";
export type UserRole = "superuser" | "admin" | "employee" | null;

const queryClient = new QueryClient();

// Create a wrapper component for CoursePlayer
const CoursePlayerWrapper = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  return (
    <ProtectedRoute>
      <CoursePlayer
        courseId={courseId || ""}
        tenantId={searchParams.get("tenantId") || ""}
        token={searchParams.get("token") || ""}
        progress={parseFloat(searchParams.get("progress") || "0")}
        properties={location.state?.properties}
      />
    </ProtectedRoute>
  );
};

const App = () => {
  // Mock auth state - in a real app, this would use proper auth context
  const [userRole, setUserRole] = useState<UserRole>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <div className="relative">
              {/* Global Theme Toggle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="fixed top-4 right-4 z-50"
              >
                <ThemeToggle />
              </motion.div>

              <Routes>
                <Route path="/" element={<Index setUserRole={setUserRole} />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/superuser/dashboard"
                  element={
                    <ProtectedRoute requiredRole="SUPER_ADMIN">
                      <SuperUserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/course/:courseId/play"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminCoursePlayer />
                    </ProtectedRoute>
                  }
                />
                <Route path="/dashboard" element={<UserDashboard />} />
                {/* <Route
                  path="/dashboard/course/:courseId"
                  element={<CourseDetails />}
                /> */}
                <Route
                  path="/dashboard/course/:courseId/play"
                  element={<CoursePlayerWrapper />}
                />
                <Route
                  path="/dashboard/course/:courseId/quiz"
                  element={<Quiz />}
                />
                <Route
                  path="/admin/course/:courseId/explanations"
                  element={<AdminCourseExplanations />}
                />
                <Route
                  path="/dashboard/course/:courseId/result"
                  element={<ResultPage />}
                />
                <Route
                  path="/admin/reports/user/:userId"
                  element={<UserDashboard />}
                />
                <Route path="/quiz-results" element={<QuizResults />} />
                <Route
                  path="/certificate"
                  element={
                    <div className="min-h-screen flex items-center justify-center p-4">
                      <Certificate
                        courseName="Sample Course"
                        completionDate={new Date().toLocaleDateString()}
                        score={95}
                      />
                    </div>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
