import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/productApi";
import { getOrders, updateOrderStatus, bulkUpdateOrderStatus } from "../api/orderApi";
import { getUsers, createUser, updateUser, deleteUser } from "../api/userApi";
import { useAuth } from "./AuthContext";
import { useAuditLog } from "./AuditLogContext";

const AppContext = createContext();

export function AppProvider({ children }) {
  const { isAuthenticated, currentUser } = useAuth();
  const { addEntry } = useAuditLog();

  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [p, o, u] = await Promise.all([getProducts(), getOrders(), getUsers()]);
      setProducts(p);
      setOrders(o);
      setUsers(u);
    } catch (err) {
      setError(err.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
    else { setProducts([]); setOrders([]); setUsers([]); }
  }, [isAuthenticated, fetchAll]);

  // ─── Products CRUD ──────────────────────────────────────────────────────
  const addProduct = async (data) => {
    const p = await createProduct(data);
    setProducts((prev) => [...prev, p]);
    addEntry({
      action: "CREATE", entity: "Product", entityId: p.id,
      details: `Added ${p.name} · $${p.price} · ${p.category}`,
      user: currentUser?.name,
    });
  };

  const editProduct = async (id, data) => {
    const p = await updateProduct(id, data);
    setProducts((prev) => prev.map((x) => (x.id === id ? p : x)));
    addEntry({
      action: "UPDATE", entity: "Product", entityId: id,
      details: `Updated ${data.name || String(id)}`,
      user: currentUser?.name,
    });
  };

  const removeProduct = async (id) => {
    const target = products.find((p) => p.id === id);
    await deleteProduct(id);
    setProducts((prev) => prev.filter((x) => x.id !== id));
    addEntry({
      action: "DELETE", entity: "Product", entityId: id,
      details: `Removed ${target?.name || String(id)}`,
      user: currentUser?.name,
    });
  };

  // ─── Users CRUD ─────────────────────────────────────────────────────────
  const addUser = async (data) => {
    const u = await createUser(data);
    setUsers((prev) => [...prev, u]);
    addEntry({
      action: "CREATE", entity: "User", entityId: u.id,
      details: `Added ${u.name || u.email}`,
      user: currentUser?.name,
    });
  };

  const editUser = async (id, data) => {
    const u = await updateUser(id, data);
    setUsers((prev) => prev.map((x) => (x.id === id ? u : x)));
    addEntry({
      action: "UPDATE", entity: "User", entityId: id,
      details: `Updated ${data.name || String(id)}`,
      user: currentUser?.name,
    });
  };

  const removeUser = async (id) => {
    const target = users.find((u) => u.id === id);
    await deleteUser(id);
    setUsers((prev) => prev.filter((x) => x.id !== id));
    addEntry({
      action: "DELETE", entity: "User", entityId: id,
      details: `Removed user ${target?.name || target?.email || String(id)}`,
      user: currentUser?.name,
    });
  };

  // ─── Orders ─────────────────────────────────────────────────────────────
  const updateOrder = async (id, status) => {
    const prevOrder = orders.find((o) => o.id === id);
    const updated   = await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    addEntry({
      action: "UPDATE", entity: "Order", entityId: id,
      details: `Order ${id} status: ${prevOrder?.status ?? "?"} → ${status}`,
      user: currentUser?.name,
    });
    return updated;
  };

  const bulkUpdateOrders = async (ids, status) => {
    await bulkUpdateOrderStatus(ids, status);
    setOrders((prev) => prev.map((o) => ids.includes(o.id) ? { ...o, status } : o));
    addEntry({
      action: "UPDATE", entity: "Order", entityId: null,
      details: `${ids.length} orders marked as ${status}`,
      user: currentUser?.name,
    });
  };

  // ─── Derived metrics ────────────────────────────────────────────────────
  const totalRevenue     = orders.filter((o) => o.status === "Completed").reduce((s, o) => s + o.totalAmount, 0);
  const pendingOrders    = orders.filter((o) => o.status === "Pending").length;
  const inactiveUsers    = users.filter((u) => u.status === "Inactive").length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const restockProducts  = products.filter((p) => p.stock <= (p.minStock ?? 10));

  // ─── Revenue trend chart data (last 7 months of completed orders) ───────
  const revenueData = useMemo(() => {
    const monthMap = {};
    orders
      .filter((o) => o.status === "Completed")
      .forEach((o) => {
        const d     = new Date(o.orderDate);
        const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString("en-US", { month: "short" });
        if (!monthMap[key]) monthMap[key] = { month: label, revenue: 0, _key: key };
        monthMap[key].revenue += o.totalAmount;
      });

    const sorted = Object.values(monthMap)
      .sort((a, b) => a._key.localeCompare(b._key))
      .slice(-7)
      .map(({ month, revenue, _key }) => ({ month, revenue: Math.round(revenue), key: _key }));

    if (sorted.length < 2) {
      return [{ month: "Jan", revenue: 0 }, { month: "Feb", revenue: 0 }, { month: "Mar", revenue: 0 }];
    }
    return sorted;
  }, [orders]);

  return (
    <AppContext.Provider value={{
      products, orders, users,
      loading, error,
      addProduct, editProduct, removeProduct,
      addUser, editUser, removeUser,
      updateOrder, bulkUpdateOrders,
      totalRevenue, pendingOrders, inactiveUsers, lowStockProducts, restockProducts,
      revenueData,
      refetch: fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
