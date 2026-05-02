/**
 * Compute revenue chart data from orders for a given date range.
 * Returns array of { month: label, revenue: number, key: string }
 * key is either "YYYY-MM-DD" (daily) or "YYYY-MM" (monthly).
 */
export function computeRevenue(orders, range = "6m") {
  const now = new Date();
  let cutoff;

  if (range === "7d") {
    cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 7);
  } else if (range === "30d") {
    cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);
  } else if (range === "3m") {
    cutoff = new Date(now);
    cutoff.setMonth(now.getMonth() - 3);
  } else if (range === "6m") {
    cutoff = new Date(now);
    cutoff.setMonth(now.getMonth() - 6);
  } else if (range === "ytd") {
    cutoff = new Date(now.getFullYear(), 0, 1);
  } else {
    cutoff = new Date(now);
    cutoff.setMonth(now.getMonth() - 6);
  }

  const completed = orders.filter(
    (o) => o.status === "Completed" && new Date(o.orderDate) >= cutoff,
  );

  // Daily grouping for short ranges
  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key   = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const revenue = completed
        .filter((o) => o.orderDate === key)
        .reduce((s, o) => s + o.totalAmount, 0);
      result.push({ month: label, revenue: Math.round(revenue), key });
    }
    return result;
  }

  // Monthly grouping for longer ranges
  const monthMap = {};
  completed.forEach((o) => {
    const d   = new Date(o.orderDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    if (!monthMap[key]) monthMap[key] = { month: label, revenue: 0, key };
    monthMap[key].revenue += o.totalAmount;
  });

  const sorted = Object.values(monthMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ month, revenue, key }) => ({ month, revenue: Math.round(revenue), key }));

  return sorted.length >= 2 ? sorted : [{ month: "—", revenue: 0, key: "" }];
}

/** Daily counts/amounts for last N days — used for KPI sparklines */
export function getDailySparkline(orders, type, days = 7) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (days - 1 - i));
    const dayStr = d.toISOString().split("T")[0];

    if (type === "revenue") {
      return orders
        .filter((o) => o.status === "Completed" && o.orderDate === dayStr)
        .reduce((s, o) => s + o.totalAmount, 0);
    }
    if (type === "orders") {
      return orders.filter((o) => o.orderDate === dayStr).length;
    }
    if (type === "pending") {
      return orders.filter((o) => o.status === "Pending" && o.orderDate === dayStr).length;
    }
    return 0;
  });
}

/** Percentage change between first and last value in an array */
export function pctChange(arr) {
  if (!arr || arr.length < 2) return 0;
  const first = arr[0];
  const last  = arr[arr.length - 1];
  if (first === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 100);
}
