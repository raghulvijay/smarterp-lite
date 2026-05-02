import { delay } from "./mockApi";

const DEMO_USERS = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@smarterp.com",
    password: "admin123",
    role: "Admin",
    initials: "AU",
  },
  {
    id: 2,
    name: "Viewer User",
    email: "viewer@smarterp.com",
    password: "viewer123",
    role: "Viewer",
    initials: "VU",
  },
];

const USER_KEY = "erp_current_user";

export const loginUser = async (email, password) => {
  await delay(600);
  const user = DEMO_USERS.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase().trim() &&
      u.password === password
  );
  if (!user) throw new Error("Invalid email or password. Please try again.");
  const { password: _pw, ...safeUser } = user;
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  return safeUser;
};

export const logoutUser = async () => {
  await delay(150);
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const registerUser = ({ name, email, password, role }) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 2);
  DEMO_USERS.push({
    id: Date.now(),
    name,
    email,
    password,
    role,
    initials,
  });
};

export const deregisterUser = (email) => {
  const idx = DEMO_USERS.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (idx !== -1) DEMO_USERS.splice(idx, 1);
};
