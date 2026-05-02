export function generateInsights({ products, orders, users }) {
  const insights = [];

  // Top revenue category
  const categoryRevenue = {};
  orders
    .filter((o) => o.status === "Completed")
    .forEach((o) => {
      const product = products.find((p) => p.name === o.productName);
      if (product) {
        categoryRevenue[product.category] =
          (categoryRevenue[product.category] || 0) + o.totalAmount;
      }
    });
  const topCategory = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    insights.push({
      id: 1,
      type: "success",
      icon: "bi-trophy",
      title: "Top Revenue Category",
      message: `${topCategory[0]} leads with $${topCategory[1].toLocaleString("en-US", { maximumFractionDigits: 0 })} in completed sales.`,
      priority: "high",
    });
  }

  // Low stock warning
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
  if (lowStock.length > 0) {
    insights.push({
      id: 2,
      type: "warning",
      icon: "bi-exclamation-triangle",
      title: "Low Stock Alert",
      message: `${lowStock.length} product(s) are critically low on stock: ${lowStock.map((p) => p.name).join(", ")}.`,
      priority: "high",
    });
  }

  // Out of stock
  const outOfStock = products.filter((p) => p.stock === 0);
  if (outOfStock.length > 0) {
    insights.push({
      id: 3,
      type: "danger",
      icon: "bi-x-circle",
      title: "Out of Stock Products",
      message: `${outOfStock.length} product(s) are completely out of stock and need restocking immediately.`,
      priority: "critical",
    });
  }

  // Pending orders
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  if (pendingOrders.length > 0) {
    insights.push({
      id: 4,
      type: "warning",
      icon: "bi-clock-history",
      title: "Pending Orders Need Attention",
      message: `${pendingOrders.length} order(s) are still pending and require processing to maintain SLA.`,
      priority: "medium",
    });
  }

  // Inactive users
  const inactiveUsers = users.filter((u) => u.status === "Inactive");
  if (inactiveUsers.length > 0) {
    insights.push({
      id: 5,
      type: "info",
      icon: "bi-person-dash",
      title: "Inactive User Accounts",
      message: `${inactiveUsers.length} user account(s) are inactive. Review and deactivate or reactivate as needed.`,
      priority: "low",
    });
  }

  // Best-selling product
  const productSales = {};
  orders
    .filter((o) => o.status === "Completed")
    .forEach((o) => {
      productSales[o.productName] = (productSales[o.productName] || 0) + o.quantity;
    });
  const bestSeller = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
  if (bestSeller) {
    insights.push({
      id: 6,
      type: "success",
      icon: "bi-star",
      title: "Best-Selling Product",
      message: `"${bestSeller[0]}" is the top-selling item with ${bestSeller[1]} unit(s) sold in completed orders.`,
      priority: "medium",
    });
  }

  // Cancelled order analysis
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled");
  if (cancelledOrders.length > 0) {
    const cancelRate = ((cancelledOrders.length / orders.length) * 100).toFixed(1);
    insights.push({
      id: 7,
      type: cancelRate > 20 ? "danger" : "info",
      icon: "bi-graph-down-arrow",
      title: "Cancellation Rate",
      message: `Order cancellation rate is ${cancelRate}%. ${cancelRate > 20 ? "This is above the 20% threshold — investigate causes." : "This is within acceptable range."}`,
      priority: cancelRate > 20 ? "high" : "low",
    });
  }

  // Revenue growth estimate
  const completedRevenue = orders
    .filter((o) => o.status === "Completed")
    .reduce((s, o) => s + o.totalAmount, 0);
  const processingRevenue = orders
    .filter((o) => o.status === "Processing")
    .reduce((s, o) => s + o.totalAmount, 0);
  if (processingRevenue > 0) {
    insights.push({
      id: 8,
      type: "primary",
      icon: "bi-graph-up-arrow",
      title: "Pipeline Revenue",
      message: `$${processingRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })} in revenue is currently being processed and expected to convert.`,
      priority: "medium",
    });
  }

  return insights;
}

export function getInsightSummary(insights) {
  const critical = insights.filter((i) => i.priority === "critical").length;
  const high = insights.filter((i) => i.priority === "high").length;
  const medium = insights.filter((i) => i.priority === "medium").length;
  const low = insights.filter((i) => i.priority === "low").length;
  return { critical, high, medium, low, total: insights.length };
}

// ─── Mock AI Response Generator ───────────────────────────────────────────────
// Produces a data-driven { summary, recommendations, actionPlan } object.
// Used by aiApi.js when VITE_AI_PROVIDER=mock (the default).

export function generateMockAIResponse({ products, orders, users }) {
  const completedOrders  = orders.filter((o) => o.status === "Completed");
  const pendingOrders    = orders.filter((o) => o.status === "Pending");
  const cancelledOrders  = orders.filter((o) => o.status === "Cancelled");
  const outOfStock       = products.filter((p) => p.stock === 0);
  const lowStock         = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const inactiveUsers    = users.filter((u) => u.status === "Inactive");

  const totalRevenue  = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
  const cancelRate    = orders.length
    ? ((cancelledOrders.length / orders.length) * 100).toFixed(1)
    : "0.0";

  const categoryRevenue = {};
  completedOrders.forEach((o) => {
    const prod = products.find((p) => p.name === o.productName);
    if (prod) categoryRevenue[prod.category] = (categoryRevenue[prod.category] || 0) + o.totalAmount;
  });
  const topCategory = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0];

  const productSales = {};
  completedOrders.forEach((o) => {
    productSales[o.productName] = (productSales[o.productName] || 0) + o.quantity;
  });
  const bestSeller = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];

  const urgentParts = [];
  if (outOfStock.length > 0) urgentParts.push(`${outOfStock.length} out-of-stock product(s)`);
  if (pendingOrders.length > 0) urgentParts.push(`${pendingOrders.length} pending order(s)`);

  // ── Executive Summary ──────────────────────────────────────────────────────
  const summary =
    `SmartERP Lite is generating $${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })} in completed revenue` +
    (topCategory ? `, led by the ${topCategory[0]} category ($${topCategory[1].toLocaleString("en-US", { maximumFractionDigits: 0 })})` : "") +
    `. ` +
    (urgentParts.length > 0
      ? `Immediate attention is required for ${urgentParts.join(" and ")} to prevent revenue loss and maintain fulfillment SLAs.`
      : `Fulfillment operations are on track with no critical stockouts or pending backlogs.`) +
    (inactiveUsers.length > 0
      ? ` ${inactiveUsers.length} inactive user account(s) should be reviewed for access hygiene.`
      : ` User access management is healthy.`);

  // ── Recommendations ────────────────────────────────────────────────────────
  const recommendations = [];

  if (outOfStock.length > 0) {
    recommendations.push({
      id: "rec-oos",
      priority: "critical",
      icon: "bi-exclamation-octagon",
      title: "Restock Out-of-Stock Products Immediately",
      description: `${outOfStock.map((p) => p.name).join(", ")} ${outOfStock.length === 1 ? "is" : "are"} completely out of stock, creating direct revenue loss on every customer visit.`,
      action: "Create purchase orders and update stock within 24 hours",
    });
  }

  if (pendingOrders.length >= 3) {
    recommendations.push({
      id: "rec-pending-high",
      priority: "high",
      icon: "bi-clock-history",
      title: `Process ${pendingOrders.length} Overdue Pending Orders`,
      description: `${pendingOrders.length} orders remain in Pending status. Extended delays increase cancellation risk and damage customer trust scores.`,
      action: "Review each pending order and move to Processing or contact customers",
    });
  } else if (pendingOrders.length > 0) {
    recommendations.push({
      id: "rec-pending-med",
      priority: "medium",
      icon: "bi-clock-history",
      title: "Clear Pending Order Backlog",
      description: `${pendingOrders.length} order(s) are awaiting action. Timely processing maintains SLA compliance and customer satisfaction.`,
      action: "Move pending orders to Processing status today",
    });
  }

  if (topCategory) {
    recommendations.push({
      id: "rec-top-cat",
      priority: "high",
      icon: "bi-graph-up-arrow",
      title: `Expand ${topCategory[0]} Inventory`,
      description: `${topCategory[0]} is your highest-revenue category at $${topCategory[1].toLocaleString("en-US", { maximumFractionDigits: 0 })}. Growing this segment will compound revenue fastest.`,
      action: `Add 2–3 new ${topCategory[0]} products and run a targeted promotion`,
    });
  }

  if (lowStock.length > 0) {
    recommendations.push({
      id: "rec-lowstock",
      priority: "medium",
      icon: "bi-exclamation-triangle",
      title: "Top Up Low-Inventory Products",
      description: `${lowStock.length} product(s) — ${lowStock.map((p) => p.name).join(", ")} — are running critically low (≤10 units). Stockouts are imminent without action.`,
      action: "Initiate restock orders before inventory hits zero",
    });
  }

  if (bestSeller) {
    recommendations.push({
      id: "rec-bestseller",
      priority: "medium",
      icon: "bi-star",
      title: `Leverage Best-Seller: ${bestSeller[0]}`,
      description: `"${bestSeller[0]}" leads all products with ${bestSeller[1]} unit(s) sold. Featuring it in marketing and keeping stock high will maximize returns.`,
      action: "Ensure 50+ units in stock and highlight in promotions",
    });
  }

  if (Number(cancelRate) > 15) {
    recommendations.push({
      id: "rec-cancel",
      priority: "high",
      icon: "bi-graph-down-arrow",
      title: `Investigate ${cancelRate}% Cancellation Rate`,
      description: `Cancellation rate is above the 15% threshold. This signals pricing mismatches, stock inaccuracies, or fulfilment delays that erode revenue.`,
      action: "Audit cancelled orders — identify top 3 cancellation reasons",
    });
  }

  if (inactiveUsers.length > 0) {
    recommendations.push({
      id: "rec-users",
      priority: "low",
      icon: "bi-person-dash",
      title: "Audit Inactive User Accounts",
      description: `${inactiveUsers.length} account(s) are inactive but may still hold system access. Unused admin accounts are a security liability.`,
      action: "Review inactive accounts and revoke unnecessary permissions",
    });
  }

  // ── Action Plan ────────────────────────────────────────────────────────────
  const actionPlan = [];
  let step = 1;

  if (outOfStock.length > 0) {
    actionPlan.push({
      step: step++,
      title: "Emergency Restock Out-of-Stock Items",
      description: `Raise immediate purchase orders for: ${outOfStock.map((p) => p.name).join(", ")}. Target same-day or next-day fulfilment.`,
      owner: "Admin",
    });
  }

  if (pendingOrders.length > 0) {
    actionPlan.push({
      step: step++,
      title: "Process All Pending Orders",
      description: `Review and advance ${pendingOrders.length} pending order(s) to Processing within 24 hours to maintain SLA compliance.`,
      owner: "Admin",
    });
  }

  if (lowStock.length > 0) {
    actionPlan.push({
      step: step++,
      title: "Schedule Low-Stock Replenishment",
      description: `Initiate planned restock for ${lowStock.length} low-stock product(s) before they hit zero. Set reorder alerts at 15-unit threshold.`,
      owner: "Admin",
    });
  }

  if (topCategory) {
    actionPlan.push({
      step: step++,
      title: `Grow the ${topCategory[0]} Category`,
      description: `Plan 2–3 new ${topCategory[0]} product additions and schedule a promotional campaign to amplify the category's revenue leadership.`,
      owner: "Admin",
    });
  }

  if (inactiveUsers.length > 0) {
    actionPlan.push({
      step: step++,
      title: "Conduct User Access Audit",
      description: `Review ${inactiveUsers.length} inactive account(s). Deactivate stale users and remove admin rights from accounts that no longer need them.`,
      owner: "Admin",
    });
  }

  actionPlan.push({
    step: step++,
    title: "Set Up Weekly Performance Review",
    description: "Establish a recurring weekly review of revenue by category, order completion rate, and inventory health to catch issues early.",
    owner: "Admin",
  });

  return { summary, recommendations, actionPlan };
}

// ─── Mock AI Q&A ──────────────────────────────────────────────────────────────
// Generates a contextual answer to a freeform business question.

export function generateMockAIAnswer({ question, products, orders, users }) {
  const q = (question || "").toLowerCase();

  const outOfStock      = products.filter((p) => p.stock === 0);
  const lowStock        = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const pendingOrders   = orders.filter((o) => o.status === "Pending");
  const inactiveUsers   = users.filter((u) => u.status === "Inactive");
  const completedRev    = orders
    .filter((o) => o.status === "Completed")
    .reduce((s, o) => s + o.totalAmount, 0);

  const urgentParts = [];
  if (outOfStock.length > 0) urgentParts.push(`restock ${outOfStock.length} out-of-stock product(s)`);
  if (pendingOrders.length > 0) urgentParts.push(`process ${pendingOrders.length} pending order(s)`);

  const categoryRevenue = {};
  orders.filter((o) => o.status === "Completed").forEach((o) => {
    const prod = products.find((p) => p.name === o.productName);
    if (prod) categoryRevenue[prod.category] = (categoryRevenue[prod.category] || 0) + o.totalAmount;
  });
  const topCat = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0];

  if (q.includes("today") || q.includes("focus") || q.includes("priority") || q.includes("start") || q.includes("should i")) {
    return urgentParts.length > 0
      ? { answer: `Your top priorities today are to ${urgentParts.join(" and ")}. These are the highest-impact items for revenue protection. After that, review low-stock products to prevent the next stockout.` }
      : { answer: `All critical operations are healthy today. Focus on strategic growth — consider expanding your ${topCat?.[0] ?? "top-performing"} category and setting up performance review cadence.` };
  }

  if (q.includes("stock") || q.includes("inventory") || q.includes("restock") || q.includes("product")) {
    const items = [...outOfStock, ...lowStock].map((p) => p.name).slice(0, 4).join(", ");
    return { answer: `Currently ${outOfStock.length} product(s) are out of stock and ${lowStock.length} are running low (≤10 units). Most urgent items: ${items || "none — inventory looks healthy"}. Restock these before they impact order fulfilment.` };
  }

  if (q.includes("revenue") || q.includes("money") || q.includes("sales") || q.includes("earn") || q.includes("profit")) {
    return { answer: `Completed revenue stands at $${completedRev.toLocaleString("en-US", { maximumFractionDigits: 0 })}${topCat ? `, with ${topCat[0]} leading at $${topCat[1].toLocaleString("en-US", { maximumFractionDigits: 0 })}` : ""}. To grow revenue faster: clear pending orders, eliminate stockouts, and expand your best-performing category.` };
  }

  if (q.includes("order") || q.includes("pending") || q.includes("process") || q.includes("fulfilment") || q.includes("fulfillment")) {
    return { answer: pendingOrders.length > 0
      ? `You have ${pendingOrders.length} pending order(s) that need action. Move them to Processing status and assign fulfilment immediately to avoid SLA breaches and potential cancellations.`
      : `Your order pipeline is clear — no pending backlog. Monitor the Processing queue to ensure orders convert to Completed smoothly.` };
  }

  if (q.includes("user") || q.includes("team") || q.includes("account") || q.includes("access") || q.includes("permission")) {
    return { answer: `You have ${users.length} total users — ${users.filter((u) => u.status === "Active").length} active and ${inactiveUsers.length} inactive. ${inactiveUsers.length > 0 ? `Review the ${inactiveUsers.length} inactive account(s): ${inactiveUsers.map((u) => u.name).join(", ")}. Unused accounts with system access are a security risk.` : "User access looks well-managed."}` };
  }

  if (q.includes("improve") || q.includes("better") || q.includes("grow") || q.includes("optim") || q.includes("recommend")) {
    return { answer: `Top 3 improvements by business impact: (1) ${outOfStock.length > 0 ? `Restock ${outOfStock.length} out-of-stock product(s) to recover lost sales` : "Maintain inventory health to prevent future stockouts"}, (2) ${pendingOrders.length > 0 ? `Process ${pendingOrders.length} pending order(s) to unlock revenue` : "Keep the order pipeline moving efficiently"}, (3) ${topCat ? `Expand the ${topCat[0]} category — it already leads revenue` : "Diversify your product catalog"}.` };
  }

  if (q.includes("risk") || q.includes("problem") || q.includes("issue") || q.includes("concern") || q.includes("warn")) {
    const risks = [];
    if (outOfStock.length > 0) risks.push(`${outOfStock.length} out-of-stock product(s) causing direct sales loss`);
    if (pendingOrders.length > 3) risks.push(`${pendingOrders.length} pending orders at risk of cancellation`);
    if (inactiveUsers.length > 0) risks.push(`${inactiveUsers.length} inactive user account(s) with potential access`);
    return { answer: risks.length > 0
      ? `Current business risks: ${risks.join("; ")}. Address these in priority order to protect revenue and security.`
      : `No major risks detected in current data. Business operations appear healthy across inventory, orders, and user management.` };
  }

  return { answer: `Based on current ERP data: $${completedRev.toLocaleString("en-US", { maximumFractionDigits: 0 })} completed revenue, ${outOfStock.length} stockouts, ${pendingOrders.length} pending orders, and ${inactiveUsers.length} inactive users. The highest-impact next step is ${urgentParts.length > 0 ? urgentParts[0] : `expanding the ${topCat?.[0] ?? "top-performing"} category`}.` };
}
