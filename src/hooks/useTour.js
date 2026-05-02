/**
 * useTour — manages the driver.js onboarding walkthrough tour.
 * Checks localStorage 'tour_completed' to decide whether to auto-start.
 * Call startTour() to (re)start the tour at any time.
 */
import { useCallback, useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "tour_completed";

const TOUR_STEPS = [
  {
    element: ".erp-sidebar",
    popover: {
      title: "Navigation",
      description: "Navigate between modules here — Dashboard, Products, Orders, Users, and AI Insights.",
      side: "right", align: "start",
    },
  },
  {
    element: "[data-tour='kpi-cards']",
    popover: {
      title: "Live KPI Cards",
      description: "Live business metrics pulled from real API data — products, orders, users, and revenue.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='revenue-chart']",
    popover: {
      title: "Revenue Chart",
      description: "Click any data point to drill into orders for that period. Switch date ranges with the pills above.",
      side: "top", align: "start",
    },
  },
  {
    element: "[aria-label*='notification'], [title='Notifications']",
    popover: {
      title: "Smart Notifications",
      description: "Real-time alerts for low stock, out-of-stock products, pending and cancelled orders.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[aria-label='Toggle theme'], .theme-toggle[title*='theme'], .theme-toggle[title*='Theme']",
    popover: {
      title: "Dark Mode",
      description: "Switch between light and dark themes — your preference is saved automatically.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='search-btn'], [title*='Search']",
    popover: {
      title: "Global Search (Ctrl+K)",
      description: "Instantly search across all products, orders, and users. AI Search tab lets you query in natural language.",
      side: "bottom", align: "start",
    },
  },
  {
    element: "[data-tour='export-btn'], [title*='Export']",
    popover: {
      title: "Smart Export Center",
      description: "Export any dataset as CSV, JSON, or an HTML report. Choose your columns and format.",
      side: "bottom", align: "end",
    },
  },
  {
    element: "[data-tour='products-link'], .sidebar-link[href='/products']",
    popover: {
      title: "Products Page",
      description: "Full inventory management with inline editing, bulk actions, and restock alerts.",
      side: "right", align: "start",
    },
  },
  {
    element: "[data-tour='orders-link'], .sidebar-link[href='/orders']",
    popover: {
      title: "Orders Page",
      description: "Switch between List and Kanban views. Select multiple orders for bulk status changes.",
      side: "right", align: "start",
    },
  },
  {
    element: "[data-tour='ai-link'], .sidebar-link[href='/ai-insights']",
    popover: {
      title: "AI Insights",
      description: "Business intelligence powered by Gemini AI — anomaly detection, revenue forecasts, restock planner, and audit log.",
      side: "right", align: "start",
    },
  },
  {
    element: "[data-tour='ai-widget'], .ai-widget-btn",
    popover: {
      title: "AI Chat Assistant",
      description: "Ask anything about your business data — the floating assistant answers in real time using your ERP context.",
      side: "top", align: "end",
    },
  },
  {
    element: "[data-tour='settings-link'], .sidebar-link[href='/settings']",
    popover: {
      title: "Settings & Preferences",
      description: "Customize your app name, currency, date format, notifications, and more. Admin only.",
      side: "right", align: "start",
    },
  },
];

export function useTour(opts = {}) {
  const { autoStart = false } = opts;

  const startTour = useCallback(() => {
    const driverObj = driver({
      animate: true,
      smoothScroll: true,
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      popoverClass: "erp-tour-popover",
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, "true");
        driverObj.destroy();
      },
      steps: TOUR_STEPS,
    });
    driverObj.drive();
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    const completed = localStorage.getItem(TOUR_KEY);
    if (completed) return;
    const t = setTimeout(() => startTour(), 1200);
    return () => clearTimeout(t);
  }, [autoStart, startTour]);

  return { startTour };
}
