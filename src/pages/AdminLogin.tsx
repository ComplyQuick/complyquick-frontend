import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AtSign } from "lucide-react";

const AdminLogin: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    domain: "",
  });
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    if (credentials.email && credentials.password && credentials.domain) {
      setIsLoading(true);
      try {
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
        localStorage.setItem("token", responseData.token);
        const tokenParts = responseData.token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }
        const payload = JSON.parse(atob(tokenParts[1]));
        const tenantId = payload.tenantId;
        if (!tenantId) {
          throw new Error("No tenant ID found in token");
        }
        localStorage.setItem("tenantId", tenantId);
        // Redirect based on role
        if (payload.role === "SUPER_ADMIN") {
          navigate("/superuser/dashboard");
        } else if (payload.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          setErrorMessage("Unauthorized role");
          setErrorDialogOpen(true);
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message || "Login failed. Please try again.");
        } else {
          setErrorMessage("Login failed. Please try again.");
        }
        setErrorDialogOpen(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage("Please fill in all fields");
      setErrorDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-complybrand-50 to-complybrand-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 relative z-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-complybrand-800 dark:text-complybrand-200">
          Admin Login
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-6"
        >
          <div className="grid gap-4">
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
                required
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
                  required
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
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-complybrand-700 hover:bg-complybrand-800 text-white mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-[500px] error-dialog-entrance border-0 shadow-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-400/10 rounded-lg"></div>
            <DialogHeader className="relative z-10 text-center pb-4">
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
    </div>
  );
};

export default AdminLogin;
 