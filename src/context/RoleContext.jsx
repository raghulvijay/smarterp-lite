import { createContext, useContext, useState } from "react";

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [role, setRole] = useState("Admin");

  const isAdmin = role === "Admin";

  return (
    <RoleContext.Provider value={{ role, setRole, isAdmin }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
