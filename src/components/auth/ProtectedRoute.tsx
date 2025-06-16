import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "SUPER_ADMIN" | "ADMIN";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect to login page if no token is found
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    // Decode the token to check the role
    const tokenPayload = JSON.parse(atob(token.split(".")[1]));

    // Check if the user has the required role
    if (requiredRole && tokenPayload.role !== requiredRole) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error("Error decoding token:", error);
    return <Navigate to="/" state={{ from: location }} replace />;
  }
};

export default ProtectedRoute;
