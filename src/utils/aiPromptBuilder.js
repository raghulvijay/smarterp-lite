/*
 * aiPromptBuilder.js
 *
 * Builds a structured natural-language prompt from live ERP data.
 * Used when VITE_AI_PROVIDER is set to "openai" or "gemini".
 * In mock mode this file is imported but the prompt is not sent anywhere.
 *
 * This file demonstrates that SmartERP Lite is architecturally ready
 * for real AI integration — the data analysis layer is already in place.
 */

export function buildERPInsightPrompt({ products, orders, users }) {
  const completedOrders   = orders.filter((o) => o.status === "Completed");
  const pendingOrders     = orders.filter((o) => o.status === "Pending");
  const processingOrders  = orders.filter((o) => o.status === "Processing");
  const cancelledOrders   = orders.filter((o) => o.status === "Cancelled");
  const outOfStock        = products.filter((p) => p.stock === 0);
  const lowStock          = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const inactiveUsers     = users.filter((u) => u.status === "Inactive");
  const activeUsers       = users.filter((u) => u.status === "Active");

  const totalRevenue    = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
  const pipelineRevenue = processingOrders.reduce((s, o) => s + o.totalAmount, 0);
  const cancelRate      = orders.length
    ? ((cancelledOrders.length / orders.length) * 100).toFixed(1)
    : "0.0";

  // Category revenue breakdown
  const categoryRevenue = {};
  completedOrders.forEach((o) => {
    const prod = products.find((p) => p.name === o.productName);
    if (prod) categoryRevenue[prod.category] = (categoryRevenue[prod.category] || 0) + o.totalAmount;
  });
  const sortedCategories = Object.entries(categoryRevenue)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, rev]) => `${cat}: $${rev.toLocaleString("en-US", { maximumFractionDigits: 0 })}`)
    .join(", ");
  const topCategory = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0];

  // Best seller by quantity
  const productSales = {};
  completedOrders.forEach((o) => {
    productSales[o.productName] = (productSales[o.productName] || 0) + o.quantity;
  });
  const bestSeller = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];

  return `You are a senior business intelligence analyst for SmartERP Lite, an enterprise resource planning system. Analyze the following real-time ERP data snapshot and provide professional, actionable insights.

═══════════════════════════════════════
 SMARTERP LITE — BUSINESS DATA SNAPSHOT
═══════════════════════════════════════

INVENTORY
─────────
Total Products: ${products.length}
Active Products: ${products.filter((p) => p.status === "Active").length}
Out of Stock: ${outOfStock.length} — ${outOfStock.map((p) => `${p.name}`).join(", ") || "none"}
Low Stock (≤10 units): ${lowStock.length} — ${lowStock.map((p) => `${p.name} (${p.stock})`).join(", ") || "none"}

ORDERS
──────
Total Orders: ${orders.length}
  · Pending:    ${pendingOrders.length}
  · Processing: ${processingOrders.length}
  · Completed:  ${completedOrders.length}
  · Cancelled:  ${cancelledOrders.length}
Cancellation Rate: ${cancelRate}%

REVENUE
───────
Completed Revenue:  $${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
Pipeline Revenue:   $${pipelineRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
Revenue by Category: ${sortedCategories || "N/A"}
Top Category: ${topCategory ? `${topCategory[0]} ($${topCategory[1].toLocaleString("en-US", { maximumFractionDigits: 0 })})` : "N/A"}
Best-Selling Product: ${bestSeller ? `${bestSeller[0]} (${bestSeller[1]} units sold)` : "N/A"}

USERS
─────
Total Users: ${users.length}
  · Active:   ${activeUsers.length}
  · Inactive: ${inactiveUsers.length}
Inactive Accounts: ${inactiveUsers.map((u) => `${u.name} (${u.role})`).join(", ") || "none"}

═══════════════════════════════════════
 INSTRUCTIONS
═══════════════════════════════════════

Based on this data, provide a JSON response with this exact structure:
{
  "summary": "<2-3 sentence executive summary of overall business health, key wins, and critical risks>",
  "recommendations": [
    {
      "id": "<unique-id>",
      "priority": "<critical|high|medium|low>",
      "icon": "<bootstrap-icon-class e.g. bi-exclamation-octagon>",
      "title": "<concise action title>",
      "description": "<1-2 sentence explanation with specific data references>",
      "action": "<concrete next step for the admin>"
    }
  ],
  "actionPlan": [
    {
      "step": <number>,
      "title": "<step title>",
      "description": "<what to do and why>",
      "owner": "Admin"
    }
  ]
}

Guidelines:
- Recommendations: 4–6 items, sorted Critical → High → Medium → Low
- Action plan: 4–6 sequential steps
- Be specific — reference actual product names, numbers, and dollar amounts from the data
- Tone: professional business analyst, not generic
`.trim();
}
