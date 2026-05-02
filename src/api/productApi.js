/*
 * productApi.js
 *
 * Fetches products from DummyJSON (https://dummyjson.com/products) on first load,
 * then manages an in-memory store for CRUD operations.
 *
 * DummyJSON is a free REST API — no auth required.
 * Configure the base URL via VITE_API_BASE_URL in your .env file.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://dummyjson.com";
const FETCH_LIMIT = 100;

// Map DummyJSON categories → ERP categories
const CATEGORY_MAP = {
  beauty:              "Accessories",
  fragrances:          "Accessories",
  furniture:           "Furniture",
  groceries:           "Stationery",
  "home-decoration":   "Furniture",
  "kitchen-accessories": "Stationery",
  laptops:             "Electronics",
  "mens-jewellery":    "Accessories",
  "mens-shirts":       "Accessories",
  "mens-shoes":        "Accessories",
  "mens-watches":      "Accessories",
  "mobile-accessories": "Accessories",
  motorcycle:          "Electronics",
  "skin-care":         "Accessories",
  smartphones:         "Electronics",
  "sports-accessories": "Accessories",
  sunglasses:          "Accessories",
  tablets:             "Electronics",
  tops:                "Accessories",
  vehicle:             "Electronics",
  "womens-bags":       "Accessories",
  "womens-dresses":    "Accessories",
  "womens-jewellery":  "Accessories",
  "womens-shoes":      "Accessories",
  "womens-watches":    "Accessories",
  "office-supplies":   "Stationery",
};

function mapProduct(p) {
  return {
    id: p.id,
    name: p.title,
    category: CATEGORY_MAP[p.category] || "Electronics",
    price: p.price,
    stock: p.stock,
    status: p.stock > 0 ? "Active" : "Inactive",
    minStock: p.minStock ?? 10,
  };
}

let _store  = null;
let _nextId = 10000;

async function ensureStore() {
  if (_store) return;
  const res = await fetch(
    `${BASE_URL}/products?limit=${FETCH_LIMIT}&select=id,title,price,stock,category`
  );
  if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
  const { products } = await res.json();
  _store  = products.map(mapProduct);
  _nextId = Math.max(..._store.map((p) => p.id)) + 1;
}

export async function getProducts() {
  await ensureStore();
  return [..._store];
}

export async function createProduct(product) {
  await ensureStore();
  const newProduct = { ...product, id: _nextId++ };
  _store.push(newProduct);
  return { ...newProduct };
}

export async function updateProduct(id, updates) {
  await ensureStore();
  _store = _store.map((p) => (p.id === id ? { ...p, ...updates } : p));
  return { ..._store.find((p) => p.id === id) };
}

export async function deleteProduct(id) {
  await ensureStore();
  _store = _store.filter((p) => p.id !== id);
  return { success: true };
}
