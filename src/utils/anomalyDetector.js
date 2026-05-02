function avgOf(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function detectAnomalies(orders, products) {
  const alerts = [];

  // 1. Revenue spike > 50% above rolling average
  const monthly = {};
  orders
    .filter((o) => o.status === "Completed")
    .forEach((o) => {
      const key = new Date(o.orderDate).toISOString().slice(0, 7);
      monthly[key] = (monthly[key] ?? 0) + (o.totalAmount ?? 0);
    });
  const monthKeys = Object.keys(monthly).sort();
  if (monthKeys.length >= 3) {
    const recentKey = monthKeys[monthKeys.length - 1];
    const prior = monthKeys.slice(-4, -1).map((k) => monthly[k]);
    const priorAvg = avgOf(prior);
    const recentRev = monthly[recentKey];
    if (priorAvg > 0 && recentRev > priorAvg * 1.5) {
      alerts.push({
        id: "rev-spike",
        priority: "high",
        title: "Revenue Spike Detected",
        description: `${recentKey} revenue ($${recentRev.toLocaleString()}) is ${Math.round((recentRev / priorAvg - 1) * 100)}% above the 3-month average ($${Math.round(priorAvg).toLocaleString()}).`,
        why: "Sudden spikes may indicate data entry errors, unusual bulk orders, or a new high-value customer. Verifying the source helps forecast accurately.",
        icon: "bi-graph-up-arrow",
        metric: `+${Math.round((recentRev / priorAvg - 1) * 100)}%`,
      });
    }
  }

  // 2. Cancellation rate > 15%
  const total = orders.length;
  const cancelled = orders.filter((o) => o.status === "Cancelled").length;
  const cancelRate = total > 0 ? cancelled / total : 0;
  if (cancelRate > 0.15) {
    alerts.push({
      id: "cancel-rate",
      priority: "critical",
      title: "High Cancellation Rate",
      description: `${(cancelRate * 100).toFixed(1)}% of orders have been cancelled (${cancelled}/${total}). This is above the 15% alert threshold.`,
      why: "High cancellation rates can signal payment issues, poor product descriptions, fulfilment delays, or pricing mismatches — all of which directly impact revenue.",
      icon: "bi-x-circle",
      metric: `${(cancelRate * 100).toFixed(1)}%`,
    });
  }

  // 3. Out-of-stock products that had recent orders
  const recentProductNames = new Set(
    orders
      .filter((o) => {
        const d = new Date(o.orderDate);
        return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
      })
      .map((o) => o.productName)
  );
  const outStockActive = products.filter(
    (p) => p.stock === 0 && recentProductNames.has(p.name || p.title)
  );
  if (outStockActive.length > 0) {
    alerts.push({
      id: "oos-active",
      priority: "critical",
      title: "Out-of-Stock Products with Recent Demand",
      description: `${outStockActive.length} product(s) are out of stock but had orders in the last 30 days: ${outStockActive.map((p) => p.name || p.title).slice(0, 3).join(", ")}${outStockActive.length > 3 ? " …" : ""}.`,
      why: "Zero inventory on actively ordered products means lost sales and potential customer churn. Immediate reorder is recommended.",
      icon: "bi-box-seam",
      metric: `${outStockActive.length} items`,
    });
  }

  // 4. Order volume spike > 2x daily average
  const dailyCounts = {};
  orders.forEach((o) => {
    const day = new Date(o.orderDate).toISOString().slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
  });
  const dailyValues = Object.values(dailyCounts);
  if (dailyValues.length >= 7) {
    const sorted = [...dailyValues].sort((a, b) => b - a);
    const peak = sorted[0];
    const avg = avgOf(dailyValues);
    if (avg > 0 && peak > avg * 2) {
      alerts.push({
        id: "volume-spike",
        priority: "medium",
        title: "Order Volume Spike",
        description: `Peak daily orders (${peak}) exceeded 2× the daily average (${avg.toFixed(1)}). This could indicate a promotional surge or data import.`,
        why: "Volume spikes stress fulfilment operations. Knowing whether it was organic or promotional helps plan staffing and inventory.",
        icon: "bi-lightning-charge",
        metric: `${peak} orders/day`,
      });
    }
  }

  return alerts;
}
