/*
 * aiApi.js
 *
 * Three-tier AI provider system:
 *
 * Tier 1 — Gemini Direct (set VITE_GEMINI_API_KEY in .env)
 *   → Calls Google Gemini API directly from the browser.
 *   → Free tier available at https://aistudio.google.com/
 *   → Note: for production apps, proxy through a backend to protect the key.
 *
 * Tier 2 — Backend Proxy (set VITE_AI_PROVIDER + VITE_AI_API_URL)
 *   → Routes through your own serverless function (Vercel, AWS Lambda, etc.)
 *     that holds the secret key server-side.
 *
 * Tier 3 — Mock (default, no config needed)
 *   → Rule-based offline AI. Works with zero setup.
 */

import { delay } from "./mockApi";
import { buildERPInsightPrompt } from "../utils/aiPromptBuilder";
import { generateMockAIResponse, generateMockAIAnswer } from "../utils/aiInsights";

// ─── Environment config ────────────────────────────────────────────────────
const GEMINI_KEY    = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const GEMINI_MODEL  = import.meta.env.VITE_GEMINI_MODEL   ?? "gemini-2.0-flash";
const AI_PROVIDER   = import.meta.env.VITE_AI_PROVIDER    ?? "mock";
const AI_API_URL    = import.meta.env.VITE_AI_API_URL     ?? "";

// ─── Resolve active mode at module load ────────────────────────────────────
export const IS_GEMINI  = GEMINI_KEY.trim().length > 10;
export const IS_BACKEND = !IS_GEMINI && AI_PROVIDER !== "mock" && AI_API_URL.startsWith("http");

export const AI_MODE_LABEL = IS_GEMINI
  ? `Gemini · ${GEMINI_MODEL}`
  : IS_BACKEND
    ? `Real AI · ${AI_PROVIDER}`
    : "Mock AI · Local";

// ─── Gemini direct call ────────────────────────────────────────────────────
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(prompt, maxTokens = 1200) {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.65 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API returned ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Backend proxy call ────────────────────────────────────────────────────
async function callBackend(payload) {
  const res = await fetch(AI_API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Backend AI error: ${res.status}`);
  return res.json();
}

// ─── Gemini response JSON parser ───────────────────────────────────────────
// Gemini may wrap JSON in a ```json ... ``` code block.
function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error("No JSON object found in Gemini response");
  try {
    return JSON.parse(objMatch[0]);
  } catch {
    throw new Error("Gemini response JSON is malformed");
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function generateAIInsights({ products, orders, users }) {
  if (IS_GEMINI) {
    const prompt = buildERPInsightPrompt({ products, orders, users });
    const text = await callGemini(prompt, 2500);
    return extractJSON(text);
  }
  if (IS_BACKEND) {
    const prompt = buildERPInsightPrompt({ products, orders, users });
    return callBackend({ prompt });
  }
  await delay(700);
  return generateMockAIResponse({ products, orders, users });
}

export async function generateExecutiveSummary({ products, orders, users }) {
  if (IS_GEMINI) {
    const prompt = buildERPInsightPrompt({ products, orders, users });
    const text   = await callGemini(prompt);
    const parsed = extractJSON(text);
    return { summary: parsed.summary };
  }
  if (IS_BACKEND) {
    const prompt = buildERPInsightPrompt({ products, orders, users });
    const data   = await callBackend({ prompt, type: "executive_summary" });
    return { summary: data.summary };
  }
  await delay(700);
  const { summary } = generateMockAIResponse({ products, orders, users });
  return { summary };
}

export async function generateActionPlan({ products, orders, users }) {
  if (IS_GEMINI) {
    const prompt = buildERPInsightPrompt({ products, orders, users });
    const text   = await callGemini(prompt);
    const parsed = extractJSON(text);
    return { actionPlan: parsed.actionPlan };
  }
  if (IS_BACKEND) {
    const prompt = buildERPInsightPrompt({ products, orders, users });
    const data   = await callBackend({ prompt, type: "action_plan" });
    return { actionPlan: data.actionPlan };
  }
  await delay(700);
  const { actionPlan } = generateMockAIResponse({ products, orders, users });
  return { actionPlan };
}

export async function aiSearchQuery({ query, products }) {
  if (IS_GEMINI) {
    const productList = products.slice(0, 80).map((p) =>
      `id:${p.id} name:"${p.name || p.title}" category:"${p.category}" price:${p.price} stock:${p.stock}`
    ).join("\n");
    const prompt = `You are a product search assistant for an ERP system.
Given this natural-language query from the user: "${query}"
And these products:
${productList}

Return a JSON filter object with these optional keys:
{ "category": string|null, "maxPrice": number|null, "minPrice": number|null, "stockStatus": "instock"|"outofstock"|null, "searchTerm": string|null }

Only set keys relevant to the query. Return ONLY valid JSON, no explanation.`;
    const text = await callGemini(prompt);
    return extractJSON(text);
  }
  await delay(300);
  const q = query.toLowerCase();
  const filter = { category: null, maxPrice: null, minPrice: null, stockStatus: null, searchTerm: null };
  if (q.includes("out of stock") || q.includes("no stock")) filter.stockStatus = "outofstock";
  else if (q.includes("in stock")) filter.stockStatus = "instock";
  const priceMatch = q.match(/under\s+\$?(\d+)/);
  if (priceMatch) filter.maxPrice = Number(priceMatch[1]);
  const aboveMatch = q.match(/above\s+\$?(\d+)/);
  if (aboveMatch) filter.minPrice = Number(aboveMatch[1]);
  const cats = ["electronics", "furniture", "accessories", "stationery"];
  for (const c of cats) {
    if (q.includes(c)) { filter.category = c; break; }
  }
  // Only use the full query as a text search when no structured filter was detected,
  // otherwise the searchTerm check would over-filter and return zero results.
  if (!filter.category && filter.maxPrice == null && filter.minPrice == null && !filter.stockStatus) {
    filter.searchTerm = query;
  }
  return filter;
}

export async function getRevenueForecastInsight({ revenueData, projected }) {
  if (IS_GEMINI) {
    const dataStr = revenueData.map((d) => `${d.month}: $${d.revenue ?? 0}`).join(", ");
    const prompt = `You are a financial analyst. Given this monthly revenue data: ${dataStr}
The linear regression forecasts $${projected?.toLocaleString()} for next month.
In 2-3 sentences, explain what the trend suggests, any risks, and one action recommendation. Plain text only, no markdown.`;
    return { insight: (await callGemini(prompt)).trim() };
  }
  await delay(400);
  const trend = projected > (revenueData[revenueData.length - 1]?.revenue ?? 0) ? "upward" : "downward";
  return {
    insight: `Revenue is on an ${trend} trend with a projected $${projected?.toLocaleString()} next month based on historical patterns. ${trend === "upward" ? "Consider scaling inventory to meet growing demand." : "Review pricing strategy and marketing spend to reverse the decline."}`,
  };
}

export async function generatePurchaseDraft({ restockItems }) {
  if (IS_GEMINI) {
    const itemList = restockItems.map((r) =>
      `- ${r.name} (current stock: ${r.stock}, suggested order: ${r.suggestedOrder} units)`
    ).join("\n");
    const prompt = `Write a professional purchase order email draft for the following items:
${itemList}

Format it as a ready-to-send email to a supplier. Include: subject line, greeting, itemised order table, payment terms (Net-30), and a professional sign-off. Plain text only, use line breaks.`;
    return { draft: (await callGemini(prompt)).trim() };
  }
  await delay(600);
  const lines = restockItems.map((r) =>
    `  • ${r.name} — qty: ${r.suggestedOrder} units`
  ).join("\n");
  return {
    draft: `Subject: Purchase Order Request — Inventory Replenishment

Dear Supplier,

I hope this message finds you well. We would like to place a purchase order for the following items:

${lines}

Please confirm availability and estimated delivery timeline at your earliest convenience. Payment terms: Net-30 days upon receipt of invoice.

Best regards,
SmartERP Procurement Team`,
  };
}

export async function askAIQuestion({ question, products, orders, users }) {
  if (IS_GEMINI) {
    const completedOrders  = orders.filter((o) => o.status === "Completed");
    const pendingOrders    = orders.filter((o) => o.status === "Pending");
    const cancelledOrders  = orders.filter((o) => o.status === "Cancelled");
    const lowStock         = products.filter((p) => p.stock > 0 && p.stock <= 10);
    const totalRevenue     = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
    const productSales     = {};
    completedOrders.forEach((o) => {
      productSales[o.productName] = (productSales[o.productName] || 0) + o.quantity;
    });
    const bestSeller = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
    const categoryRevenue  = {};
    completedOrders.forEach((o) => {
      const prod = products.find((p) => p.name === o.productName);
      if (prod) categoryRevenue[prod.category] = (categoryRevenue[prod.category] || 0) + o.totalAmount;
    });
    const topCategory = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0];

    const context = `Products: ${products.length} total, ${lowStock.length} low stock. Orders: ${orders.length} total (${pendingOrders.length} pending, ${completedOrders.length} completed, ${cancelledOrders.length} cancelled). Revenue: $${totalRevenue.toLocaleString()} completed. Best-seller: ${bestSeller ? `${bestSeller[0]} (${bestSeller[1]} units)` : "N/A"}. Top category: ${topCategory ? `${topCategory[0]} ($${topCategory[1].toLocaleString()})` : "N/A"}. Users: ${users.length} total.`;

    const fullPrompt = `You are a helpful ERP business assistant. Current business data: ${context}

User question: "${question}"

Answer in 2-4 helpful sentences using specific numbers from the data. Plain text only — no JSON, no markdown, no bullet points.`;
    const answer = await callGemini(fullPrompt, 400);
    return { answer: answer.trim() };
  }
  if (IS_BACKEND) {
    const prompt = buildERPInsightPrompt({ products, orders, users });
    return callBackend({ prompt, question, type: "question" });
  }
  await delay(800);
  return generateMockAIAnswer({ question, products, orders, users });
}
