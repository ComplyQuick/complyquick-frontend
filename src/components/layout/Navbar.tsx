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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

interface NavbarProps {
  userRole?: UserRole;
  onLogin?: (role: UserRole) => void;
}

const Navbar = ({ userRole, onLogin }: NavbarProps) => {
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
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (token && tenantId) {
      setAuth(token, tenantId);
      // Remove token and tenantId from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [token, tenantId, setAuth]);

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
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
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
                      <span>Employee Login</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openLoginDialog("admin")}
                      className="flex items-center space-x-1 hover:scale-105 transition-transform"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Admin Login</span>
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
                    Employee Login
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openLoginDialog("admin");
                    }}
                  >
                    Admin Login
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

      {/* Admin/Superuser Login Dialog */}
      <Dialog
        open={loginDialogOpen && loginType === "admin"}
        onOpenChange={(open) => {
          setLoginDialogOpen(open);
          if (!open) setLoginType("employee");
        }}
      >
        <DialogContent className="sm:max-w-[425px] animate-scale-in">
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription>
              Enter your admin credentials to access dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@yourorg.com"
                value={credentials.email}
                onChange={handleCredentialChange}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                  <AtSign className="h-4 w-4" />
                </span>
                <Input
                  id="domain"
                  name="domain"
                  type="text"
                  placeholder="yourorg.com"
                  value={credentials.domain}
                  onChange={handleCredentialChange}
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleCredentialChange}
                autoComplete="current-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleLogin()}
              className="bg-complybrand-700 hover:bg-complybrand-800 text-white"
            >
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Login Dialog - Domain Step */}
      <Dialog
        open={
          loginDialogOpen &&
          loginType === "employee" &&
          domainLoginStep === "domain"
        }
        onOpenChange={(open) => {
          setLoginDialogOpen(open);
          if (!open) {
            setLoginType("employee");
            setDomainLoginStep("domain");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] animate-scale-in">
          <DialogHeader>
            <DialogTitle>Company Domain</DialogTitle>
            <DialogDescription>
              Enter your company domain to continue
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domain">Company Domain</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                  <AtSign className="h-4 w-4" />
                </span>
                <Input
                  id="domain"
                  name="domain"
                  type="text"
                  placeholder="company.com"
                  value={credentials.domain}
                  onChange={handleCredentialChange}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Example: company.com, organization.org
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setLoginDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDomainSubmit}
                className="bg-complybrand-700 hover:bg-complybrand-800"
              >
                Continue
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;
