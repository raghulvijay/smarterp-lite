import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";

const STATUSES = ["Pending", "Processing", "Completed", "Cancelled"];

const STATUS_STYLE = {
  Pending:    { headerBg: "#fff7ed", headerColor: "#9a3412", dot: "#f97316" },
  Processing: { headerBg: "#fefce8", headerColor: "#854d0e", dot: "#eab308" },
  Completed:  { headerBg: "#f0fdf4", headerColor: "#166534", dot: "#22c55e" },
  Cancelled:  { headerBg: "#fef2f2", headerColor: "#991b1b", dot: "#ef4444" },
};

function KanbanCard({ order, isDragging, isAdmin }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid var(--border)`,
      borderRadius: 10,
      padding: "12px 14px",
      boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.15)" : "none",
      opacity: isDragging ? 0.85 : 1,
      cursor: isAdmin ? "grab" : "default",
      userSelect: "none",
    }}>
      <div className="d-flex justify-content-between align-items-start mb-1">
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5" }}>{order.id}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {order.customerName}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 8 }}>
        {order.productName}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Qty: {order.quantity}</span>
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#16a34a" }}>
          ${Number(order.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ order, isAdmin, activeId }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    disabled: !isAdmin,
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: 10,
    position: "relative",
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...(isAdmin ? { ...attributes, ...listeners } : {})}>
      <KanbanCard order={order} isDragging={isDragging} isAdmin={isAdmin} />
    </div>
  );
}

function KanbanColumn({ status, orders, isAdmin, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = STATUS_STYLE[status];

  return (
    <div style={{
      flex: "1 1 220px", minWidth: 200, maxWidth: 300,
      display: "flex", flexDirection: "column",
      background: "var(--bg-page)",
      borderRadius: 12, overflow: "hidden",
      border: isOver ? "2px solid #4f46e5" : "2px solid transparent",
      transition: "border-color 0.15s",
    }}>
      {/* Column header */}
      <div style={{
        background: style.headerBg, padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: style.dot, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: style.headerColor, flex: 1 }}>{status}</span>
        <span style={{
          background: style.dot + "33", color: style.headerColor,
          borderRadius: 100, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700,
        }}>
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, overflowY: "auto", padding: "10px 10px 12px",
          display: "flex", flexDirection: "column", gap: 8,
          minHeight: 80,
          background: isOver ? "rgba(79,70,229,0.04)" : "transparent",
          transition: "background 0.15s",
        }}
      >
        {orders.map((o) => (
          <DraggableCard key={o.id} order={o} isAdmin={isAdmin} activeId={activeId} />
        ))}
        {orders.length === 0 && (
          <div style={{
            textAlign: "center", padding: "24px 8px",
            color: "var(--text-muted)", fontSize: "0.8rem",
            border: "1.5px dashed var(--border)", borderRadius: 8,
          }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ orders, isAdmin, onStatusChange }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s);
    return acc;
  }, {});

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || !isAdmin) return;
    const targetStatus = over.id;
    const order = orders.find((o) => o.id === active.id);
    if (order && order.status !== targetStatus && STATUSES.includes(targetStatus)) {
      onStatusChange(active.id, targetStatus);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{
        display: "flex", gap: 12, overflowX: "auto",
        paddingBottom: 8, alignItems: "flex-start",
      }}>
        {STATUSES.map((s) => (
          <KanbanColumn
            key={s}
            status={s}
            orders={byStatus[s]}
            isAdmin={isAdmin}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOrder && (
          <div style={{ width: 240, transform: "rotate(2deg)" }}>
            <KanbanCard order={activeOrder} isDragging isAdmin={isAdmin} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
