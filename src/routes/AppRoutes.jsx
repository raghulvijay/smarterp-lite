import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout    from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute    from "./AdminRoute";
import ErrorBoundary from "../components/common/ErrorBoundary";
import PageSkeleton  from "../components/common/PageSkeleton";

// Lazy-loaded page components
const Login      = lazy(() => import("../pages/Login/Login"));
const Dashboard  = lazy(() => import("../pages/Dashboard/Dashboard"));
const Products   = lazy(() => import("../pages/Products/Products"));
const Orders     = lazy(() => import("../pages/Orders/Orders"));
const Users      = lazy(() => import("../pages/Users/Users"));
const AIInsights = lazy(() => import("../pages/AIInsights/AIInsights"));
const Settings   = lazy(() => import("../pages/Settings/Settings"));

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Page><Login /></Page>} />

      {/* Protected — logged-in users only */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Page><Dashboard /></Page>} />
          <Route path="products"    element={<Page><Products /></Page>} />
          <Route path="orders"      element={<Page><Orders /></Page>} />
          <Route path="ai-insights" element={<Page><AIInsights /></Page>} />

          {/* Admin-only */}
          <Route
            path="users"
            element={
              <AdminRoute>
                <Page><Users /></Page>
              </AdminRoute>
            }
          />
          <Route
            path="settings"
            element={
              <AdminRoute>
                <Page><Settings /></Page>
              </AdminRoute>
            }
          />

          {/* Catch-all inside app */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
