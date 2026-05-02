/**
 * AuthContext — manages authentication state across the app.
 *
 * Reads the current user from localStorage on mount via getCurrentUser().
 * Provides login/logout functions that call the auth API and update state.
 *
 * @returns {{
 *   currentUser: object|null,
 *   isAuthenticated: boolean,
 *   isAdmin: boolean,
 *   role: 'Admin'|'Viewer'|null,
 *   login: (email: string, password: string) => Promise<object>,
 *   logout: () => Promise<void>
 * }}
 */
import { createContext, useCallback, useContext, useState } from "react";
import { loginUser, logoutUser, getCurrentUser } from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  const login = useCallback(async (email, password) => {
    const user = await loginUser(email, password);
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setCurrentUser(null);
  }, []);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === "Admin";
  const role = currentUser?.role ?? null;

  return (
    <AuthContext.Provider
      value={{ currentUser, isAuthenticated, isAdmin, role, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
