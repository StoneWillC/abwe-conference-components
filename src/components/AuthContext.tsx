import { Box, CircularProgress } from "@mui/material";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { User, LoginResult } from "../types/user";
import { getSessionToken, setSessionToken, clearSessionToken } from "../utils/sessionUtils";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const sessionToken = getSessionToken();
      
      if (!sessionToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await apiService.getCurrentUser(sessionToken);

      if (data.success) {
        setUser(data.data.user);
      } else {
        setUser(null);
        clearSessionToken();
      }
    } catch (err) {
      // Network errors or other issues - just set user to null
      setUser(null);
      clearSessionToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    // Use apiService for centralized API calls
    const result = await apiService.loginUser(email, password);

    if (result.success && result.data) {
      // Store session token in cookies
      if (result.data.session_token) {
        setSessionToken(result.data.session_token, 24);
      }

      // Check if password change is required
      if (result.data.requires_password_change) {
        return {
          success: true,
          requiresPasswordChange: true,
          userId: result.data.user?.id,
        };
      }

      setUser(result.data.user);
      return { success: true };
    } else {
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      const sessionToken = getSessionToken();
      if (sessionToken) {
        await apiService.logoutUser(sessionToken);
      }
    } finally {
      clearSessionToken();
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useOptionalAuth = () => {
  return useContext(AuthContext);
};

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Immediately redirect if no user and not loading
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: location }, replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    // Redirect to login with the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed to access this route
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleLower = user.role.toLowerCase();
    const isAllowed = allowedRoles.some(
      (role) => role.toLowerCase() === userRoleLower,
    );

    if (!isAllowed) {
      // Redirect to login if user doesn't have permission
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};
