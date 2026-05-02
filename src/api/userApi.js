/*
 * userApi.js
 *
 * Fetches users from DummyJSON (/users) on first load.
 * Manages an in-memory store so Admin can add / edit / delete
 * within a session (DummyJSON writes don't persist server-side).
 *
 * Role assignment: first 2 fetched users become "Admin",
 * the rest become "Viewer" — mirroring a real org structure
 * where admins are rare.
 */

const BASE_URL  = import.meta.env.VITE_API_BASE_URL || "https://dummyjson.com";
const FETCH_LIMIT = 12;

function mapUser(u, index) {
  return {
    id:     `USR-${String(u.id).padStart(3, "0")}`,
    name:   `${u.firstName} ${u.lastName}`,
    email:  u.email,
    role:   index < 2 ? "Admin" : "Viewer",
    status: index % 6 === 5 ? "Inactive" : "Active",
  };
}

let _store   = null;
let _nextNum = 1000;

const genId = () => `USR-${String(_nextNum++).padStart(3, "0")}`;

async function ensureStore() {
  if (_store) return;
  const res = await fetch(
    `${BASE_URL}/users?limit=${FETCH_LIMIT}&select=id,firstName,lastName,email,role`
  );
  if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
  const { users } = await res.json();
  _store = users.map(mapUser);
}

export async function getUsers() {
  await ensureStore();
  return [..._store];
}

export async function createUser(user) {
  await ensureStore();
  const newUser = { ...user, id: genId() };
  _store.push(newUser);
  return { ...newUser };
}

export async function updateUser(id, updates) {
  await ensureStore();
  _store = _store.map((u) => (u.id === id ? { ...u, ...updates } : u));
  return { ..._store.find((u) => u.id === id) };
}

export async function deleteUser(id) {
  await ensureStore();
  _store = _store.filter((u) => u.id !== id);
  return { success: true };
}
