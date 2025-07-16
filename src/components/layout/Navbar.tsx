import React from "react";
import { useState, useEffect } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, AtSign, Mail, ArrowLeft, LogOut } from "lucide-react";
import { UserRole } from "../../App";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { NavbarProps } from "@/types/Navbar";

const Navbar = ({
  userRole,
  onLogin,
  showBackButton,
  onBackClick,
}: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "employee">("employee");
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    domain: "",
  });
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [domainLoginStep, setDomainLoginStep] = useState<
    "domain" | "credentials"
  >("domain");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const tenantId = searchParams.get("tenantId");
  const error = searchParams.get("error");
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (token && tenantId) {
      setAuth(token, tenantId);
      // Remove token and tenantId from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    // Handle error from Google OAuth callback
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      setErrorDialogOpen(true);
      // Remove error from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    // Handle other potential error parameters
    const errorDescription = searchParams.get("error_description");
    if (errorDescription) {
      setErrorMessage(decodeURIComponent(errorDescription));
      setErrorDialogOpen(true);
      // Remove error parameters from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [token, tenantId, error, searchParams, setAuth]);

  const openLoginDialog = (type: "admin" | "employee") => {
    setLoginType(type);
    setLoginDialogOpen(true);
    setCredentials({ email: "", password: "", domain: "" });
    if (type === "employee") {
      setDomainLoginStep("domain");
    }
  };

  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleDomainSubmit = async () => {
    if (!credentials.domain) {
      setErrorMessage("Please enter your company domain");
      setErrorDialogOpen(true);
      return;
    }

    // Validate domain format
    if (
      !credentials.domain.match(
        /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
      )
    ) {
      setErrorMessage("Please enter a valid domain (e.g., company.com)");
      setErrorDialogOpen(true);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`
      );

      if (!response.ok) {
        throw new Error("Failed to verify domain");
      }

      setDomainLoginStep("credentials");
    } catch (error) {
      setErrorMessage("Failed to verify domain. Please try again.");
      setErrorDialogOpen(true);
    }
  };

  const handleLogin = async (type: "sso" | "credentials" = "credentials") => {
    if (
      loginType === "admin" &&
      credentials.email &&
      credentials.password &&
      credentials.domain
    ) {
      try {
        // Clean up domain input - remove any whitespace and convert to lowercase
        const cleanDomain = credentials.domain.trim().toLowerCase();

        const requestBody = {
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
          domain: cleanDomain,
        };

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Login failed");
        }

        // Store the token in localStorage
        localStorage.setItem("token", responseData.token);

        // Decode the JWT token to get the tenant ID
        const tokenParts = responseData.token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        const tenantId = payload.tenantId;

        if (!tenantId) {
          throw new Error("No tenant ID found in token");
        }

        // Store the tenant ID
        localStorage.setItem("tenantId", tenantId);

        // Call the onLogin callback with the user role
        if (onLogin) {
          onLogin(payload.role.toLowerCase());

          // Redirect based on role
          if (payload.role === "SUPER_ADMIN") {
            window.location.href = "/superuser/dashboard";
          } else if (payload.role === "ADMIN") {
            window.location.href = "/admin/dashboard";
          }
        }

        setLoginDialogOpen(false);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message || "Login failed. Please try again.");
        } else {
          setErrorMessage("Login failed. Please try again.");
        }
        setErrorDialogOpen(true);
      }
    } else {
      setErrorMessage("Please fill in all fields");
      setErrorDialogOpen(true);
    }
  };

  const handleEmployeeLogin = () => {
    window.location.href =
      "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=988869669667-f62g9dtlmcmt1t5unl7cl9ni8edd0cup.apps.googleusercontent.com&redirect_uri=http://localhost:5000/api/auth/google/callback&scope=https://www.googleapis.com/auth/userinfo.email&access_type=offline&prompt=consent";
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm fixed w-full top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 relative">
          {showBackButton && onBackClick && (
            <button
              onClick={onBackClick}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex-shrink-0 flex items-center"
              style={{ marginLeft: showBackButton ? "60px" : "0" }}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold text-complybrand-800 dark:text-complybrand-300 transition-colors"
              >
                ComplyQuick
              </motion.span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isHomePage ? (
              <>
                <motion.a
                  href="#features"
                  className="text-gray-700 dark:text-gray-300 hover:text-complybrand-600 dark:hover:text-complybrand-400 px-3 py-2"
                  whileHover={{ scale: 1.05, x: 3 }}
                >
                  Features
                </motion.a>
                <motion.a
                  href="#contact"
                  className="text-gray-700 dark:text-gray-300 hover:text-complybrand-600 dark:hover:text-complybrand-400 px-3 py-2"
                  whileHover={{ scale: 1.05, x: 3 }}
                >
                  Contact
                </motion.a>
                <ThemeToggle />
                {!userRole && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleEmployeeLogin}
                      className="flex items-center space-x-1 hover:scale-105 transition-transform"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              userRole && (
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="hover:scale-105 transition-transform"
                  >
                    Logout
                  </Button>
                </div>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-complybrand-600 dark:hover:text-complybrand-400 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 pt-2 pb-3 space-y-1 shadow-lg animate-slide-up">
          {isHomePage ? (
            <>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-complybrand-600 dark:hover:text-complybrand-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Features
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-complybrand-600 dark:hover:text-complybrand-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Contact
              </a>
              {!userRole && (
                <div className="px-3 py-2 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleEmployeeLogin();
                    }}
                  >
                    Login
                  </Button>
                </div>
              )}
            </>
          ) : (
            userRole && (
              <div className="px-3 py-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-[500px] error-dialog-entrance border-0 shadow-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 backdrop-blur-sm">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-400/10 rounded-lg"></div>

            <DialogHeader className="relative z-10 text-center pb-4">
              {/* Animated error icon */}
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-icon-bounce hover:animate-error-shake cursor-pointer transition-all duration-300 hover:scale-110">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <DialogTitle className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2 animate-slide-in-error">
                Access Denied
              </DialogTitle>

              <DialogDescription
                className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-md mx-auto animate-slide-in-error"
                style={{ animationDelay: "0.1s" }}
              >
                {errorMessage}
              </DialogDescription>
            </DialogHeader>

            {/* Additional info section */}
            <div
              className="relative z-10 bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-700/30 animate-slide-in-error hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse-soft">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Need Help?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact your organization's administrator or reach out to
                    our support team for assistance.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter
              className="relative z-10 flex flex-col sm:flex-row gap-3 animate-slide-in-error"
              style={{ animationDelay: "0.3s" }}
            >
              <Button
                variant="outline"
                onClick={() => setErrorDialogOpen(false)}
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;
