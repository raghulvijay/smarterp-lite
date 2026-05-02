const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://dummyjson.com";
const CART_LIMIT = 15;
const USER_LIMIT = 20;

const STATUS_POOL = [
  "Completed", "Completed", "Completed",
  "Processing", "Processing",
  "Pending", "Pending",
  "Cancelled",
  "Completed", "Processing",
  "Pending", "Completed",
  "Cancelled", "Processing", "Completed",
];

function getStatus(id) {
  return STATUS_POOL[id % STATUS_POOL.length];
}

function getOrderDate(id) {
  const date = new Date();
  date.setDate(date.getDate() - ((id * 13) % 180));
  return date.toISOString().split("T")[0];
}

let _orders = null;

async function ensureOrders() {
  if (_orders) return;

  const [cartsRes, usersRes] = await Promise.all([
    fetch(`${BASE_URL}/carts?limit=${CART_LIMIT}`),
    fetch(`${BASE_URL}/users?limit=${USER_LIMIT}&select=id,firstName,lastName,email,phone`),
  ]);

  if (!cartsRes.ok || !usersRes.ok) {
    throw new Error("Failed to fetch orders data");
  }

  const { carts } = await cartsRes.json();
  const { users } = await usersRes.json();

  const userMap = {};
  users.forEach((u) => {
    userMap[u.id] = {
      name:  `${u.firstName} ${u.lastName}`,
      email: u.email  || "",
      phone: u.phone  || "",
    };
  });

  _orders = carts.map((cart) => {
    const firstProduct = cart.products[0];
    const user = userMap[cart.userId];
    return {
      id:           `ORD-${String(cart.id).padStart(3, "0")}`,
      customerId:   cart.userId,
      customerName: user?.name  || `Customer ${cart.userId}`,
      customerEmail:user?.email || "",
      customerPhone:user?.phone || "",
      productId:    firstProduct?.id    || null,
      productName:  firstProduct?.title || "Mixed Items",
      unitPrice:    firstProduct?.price || parseFloat((cart.discountedTotal / Math.max(cart.totalQuantity, 1)).toFixed(2)),
      quantity:     cart.totalQuantity,
      totalAmount:  parseFloat(cart.discountedTotal.toFixed(2)),
      orderDate:    getOrderDate(cart.id),
      status:       getStatus(cart.id),
    };
  });
}

export async function getOrders() {
  await ensureOrders();
  return [..._orders];
}

export async function updateOrderStatus(id, status) {
  await ensureOrders();
  const order = _orders.find((o) => o.id === id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = status;
  return { ...order };
}

export async function bulkUpdateOrderStatus(ids, status) {
  await ensureOrders();
  ids.forEach((id) => {
    const order = _orders.find((o) => o.id === id);
    if (order) order.status = status;
  });
  return ids.length;
}
