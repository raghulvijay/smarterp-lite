import { useState, useEffect, useMemo } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header  from "./Header";
import AIAssistantWidget     from "../common/AIAssistantWidget";
import GlobalSearchModal     from "../common/GlobalSearchModal";
import KeyboardShortcutsModal from "../common/KeyboardShortcutsModal";
import ExportCenterModal      from "../common/ExportCenterModal";
import useKeyboardShortcuts  from "../../hooks/useKeyboardShortcuts";
import { useTour }           from "../../hooks/useTour";

export default function MainLayout() {
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen,    setExportOpen]    = useState(false);
  const location     = useLocation();

  // Auto-start tour on first visit
  const { startTour } = useTour({ autoStart: true });

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const shortcuts = useMemo(() => ({
    "ctrl+k": () => setSearchOpen(true),
    "?":      () => setShortcutsOpen(true),
    "escape": () => {
      if (searchOpen)    { setSearchOpen(false);    return; }
      if (shortcutsOpen) { setShortcutsOpen(false); return; }
      setSidebarOpen(false);
    },
  }), [searchOpen, shortcutsOpen]);

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="erp-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="erp-content">
        <Header
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          onStartTour={startTour}
        />
        <main className="erp-main">
          <Outlet />
        </main>
      </div>

      <AIAssistantWidget />

      <GlobalSearchModal     show={searchOpen}    onHide={() => setSearchOpen(false)} />
      <KeyboardShortcutsModal show={shortcutsOpen} onHide={() => setShortcutsOpen(false)} />
      <ExportCenterModal     show={exportOpen}    onHide={() => setExportOpen(false)} />
    </div>
  );
}
