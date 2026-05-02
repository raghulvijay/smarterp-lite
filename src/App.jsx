import { AuthProvider }     from "./context/AuthContext";
import { AuditLogProvider } from "./context/AuditLogContext";
import { AppProvider }      from "./context/AppContext";
import { ToastProvider }    from "./context/ToastContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import AppRoutes            from "./routes/AppRoutes";

export default function App() {
  return (
    <AuthProvider>
      <AuditLogProvider>
        <AppProvider>
          <CurrencyProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </CurrencyProvider>
        </AppProvider>
      </AuditLogProvider>
    </AuthProvider>
  );
}
