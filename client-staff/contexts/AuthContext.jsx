import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("hms_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await api.get("/auth/me");
        if (user) {
          // Keep a 'uid' alias pointing to user._id to match original codebase usage
          const resolvedUser = { ...user, uid: user._id };
          setCurrentUser(resolvedUser);
          setUserRole(user.role ? user.role.toLowerCase() : null);
          setUserData(resolvedUser);
        } else {
          // Token invalid or user not found
          logout();
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Sign in with email, password, and requested role
  async function login(email, password, role) {
    try {
      const response = await api.post("/auth/login", { email, password, role });
      
      // Store JWT token
      if (response.token) {
        localStorage.setItem("hms_token", response.token);
      }

      const resolvedUser = { ...response, uid: response._id };
      setCurrentUser(resolvedUser);
      setUserRole(response.role ? response.role.toLowerCase() : null);
      setUserData(resolvedUser);

      return resolvedUser;
    } catch (error) {
      // Propagate error to login page
      throw error;
    }
  }

  // Register new user
  async function register(userDataPayload) {
    try {
      const response = await api.post("/auth/register", userDataPayload);
      
      // Store JWT token
      if (response.token) {
        localStorage.setItem("hms_token", response.token);
      }

      const resolvedUser = { ...response, uid: response._id };
      setCurrentUser(resolvedUser);
      setUserRole(response.role ? response.role.toLowerCase() : null);
      setUserData(resolvedUser);

      return resolvedUser;
    } catch (error) {
      throw error;
    }
  }

  // Sign out
  function logout() {
    localStorage.removeItem("hms_token");
    setCurrentUser(null);
    setUserRole(null);
    setUserData(null);
  }

  const value = {
    currentUser,
    userRole,
    userData,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
