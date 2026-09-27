/* eslint-disable react-refresh/only-export-components */
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

  // Sign in with email or phone, password, and requested role
  async function login(identifier, password, role) {
    const isEmail = identifier.includes("@");
    const payload = isEmail ? { email: identifier, password, role } : { phone: identifier, password, role };
    const response = await api.post("/auth/login", payload);
    
    // Store JWT token
    if (response.token) {
      localStorage.setItem("hms_token", response.token);
    }

    const resolvedUser = { ...response, uid: response._id };
    setCurrentUser(resolvedUser);
    setUserRole(response.role ? response.role.toLowerCase() : null);
    setUserData(resolvedUser);

    return resolvedUser;
  }

  // Register new user
  async function register(userDataPayload) {
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
  }

  // Sign in with phone only
  async function loginWithPhone(phone) {
    const response = await api.post("/auth/login", { phone, role: "patient" });
    
    // Store JWT token
    if (response.token) {
      localStorage.setItem("hms_token", response.token);
    }

    const resolvedUser = { ...response, uid: response._id };
    setCurrentUser(resolvedUser);
    setUserRole(response.role ? response.role.toLowerCase() : null);
    setUserData(resolvedUser);

    return resolvedUser;
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
    loginWithPhone,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
