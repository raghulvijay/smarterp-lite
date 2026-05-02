import { useState, useMemo, useCallback } from "react";
import Breadcrumb    from "../../components/common/Breadcrumb";
import PageHeader    from "../../components/common/PageHeader";
import DataTable     from "../../components/common/DataTable";
import ModalForm     from "../../components/common/ModalForm";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SkeletonTable from "../../components/common/SkeletonTable";
import ErrorMessage  from "../../components/common/ErrorMessage";
import { useApp }    from "../../context/AppContext";
import { useAuth }   from "../../context/AuthContext";
import { useToast }  from "../../context/ToastContext";
import { registerUser, deregisterUser } from "../../api/authApi";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts";

const COLUMNS = [
  { dataField: "id",    caption: "User ID", width: 110 },
  { dataField: "name",  caption: "Name",    width: 160 },
  { dataField: "email", caption: "Email" },
  { dataField: "role",  caption: "Role",    width: 110,
    cellRender: ({ value }) => (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 100, fontSize: "0.78125rem", fontWeight: 600,
        background: value === "Admin" ? "rgba(79,70,229,0.1)" : "rgba(107,114,128,0.1)",
        color: value === "Admin" ? "#4f46e5" : "#6b7280",
      }}>
        <i className={`bi bi-${value === "Admin" ? "shield-check" : "eye"}`} />
        {value}
      </span>
    )},
  { dataField: "status", caption: "Status", width: 110 },
];

const ROLE_FIELD = { name: "role", label: "Role", required: true, col: 6,
  type: "select", options: [
    { value: "Admin",  label: "Admin"  },
    { value: "Viewer", label: "Viewer" },
  ]};
const STATUS_FIELD = { name: "status", label: "Status", required: true, col: 6,
  type: "select", options: [
    { value: "Active",   label: "Active"   },
    { value: "Inactive", label: "Inactive" },
  ]};

const ADD_FIELDS = [
  { name: "name",     label: "Full Name", required: true, col: 12 },
  { name: "email",    label: "Email",     required: true, type: "email",    col: 12 },
  { name: "password", label: "Password",  required: true, type: "password", col: 12,
    placeholder: "Set a login password" },
  ROLE_FIELD,
  STATUS_FIELD,
];

const EDIT_FIELDS = [
  { name: "name",  label: "Full Name", required: true, col: 12 },
  { name: "email", label: "Email",     required: true, type: "email", col: 12 },
  ROLE_FIELD,
  STATUS_FIELD,
];

export default function Users() {
  const { users, loading, error, refetch, addUser, editUser, removeUser, inactiveUsers } = useApp();
  const { isAdmin }   = useAuth();
  const { showToast } = useToast();

  const [modal,    setModal]    = useState({ show: false, item: null });
  const [confirm,  setConfirm]  = useState({ show: false, item: null });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openAdd    = useCallback(() => setModal({ show: true, item: null }), []);
  const openEdit   = useCallback((item) => setModal({ show: true, item }), []);
  const closeModal = useCallback(() => setModal({ show: false, item: null }), []);

  const shortcuts = useMemo(() => ({
    "ctrl+n": () => { if (isAdmin) openAdd(); },
  }), [isAdmin, openAdd]);

  useKeyboardShortcuts(shortcuts);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (modal.item) {
        await editUser(modal.item.id, values);
        showToast(`"${values.name}" updated`, "success");
      } else {
        await addUser(values);
        registerUser(values);
        showToast(`"${values.name}" added as ${values.role}`, "success");
      }
      closeModal();
    } catch {
      showToast("Save failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { name, email } = confirm.item;
      await removeUser(confirm.item.id);
      deregisterUser(email);
      showToast(`"${name}" removed`, "info");
      setConfirm({ show: false, item: null });
    } catch {
      showToast("Delete failed. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const adminCount  = users.filter((u) => u.role === "Admin").length;
  const activeCount = users.filter((u) => u.status === "Active").length;

  if (loading) return <SkeletonTable preset="users" rows={8} />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div>
      <Breadcrumb items={[{ label: "Users" }]} />

      <PageHeader
        title="Users"
        subtitle={`${users.length} accounts · ${adminCount} admins · ${inactiveUsers} inactive`}
      >
        {isAdmin && (
          <button className="btn btn-brand" onClick={openAdd} title="Add User (Ctrl+N)">
            <i className="bi bi-person-plus me-1" /> Add User
          </button>
        )}
      </PageHeader>

      {/* Role Info Banner for Viewer */}
      {!isAdmin && (
        <div className="d-flex align-items-center gap-2 mb-4 p-3" style={{
          background: "rgba(2,132,199,0.08)", border: "1px solid rgba(2,132,199,0.25)", borderRadius: 10, fontSize: "0.875rem",
        }}>
          <i className="bi bi-info-circle" style={{ color: "#0284c7" }} />
          <span style={{ color: "var(--text-primary)" }}>
            You have <strong>Viewer</strong> access. Switch to <strong>Admin</strong> role in the header to manage users.
          </span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        {[
          { label: "Total",    value: users.length,  color: "#4f46e5", bg: "rgba(79,70,229,0.1)"  },
          { label: "Admins",   value: adminCount,    color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
          { label: "Active",   value: activeCount,   color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
          { label: "Inactive", value: inactiveUsers, color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
        ].map((s) => (
          <div key={s.label} className="d-flex align-items-center gap-2 px-3 py-2" style={{
            background: s.bg, borderRadius: 8, fontSize: "0.875rem",
          }}>
            <span style={{ fontWeight: 700, color: s.color, fontSize: "1rem" }}>{s.value}</span>
            <span style={{ color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <DataTable
        data={users}
        columns={COLUMNS}
        onEdit={isAdmin ? openEdit : null}
        onDelete={isAdmin ? (item) => setConfirm({ show: true, item }) : null}
        isAdmin={isAdmin}
        keyField="id"
        storageKey="erp-users-grid"
      />

      <ModalForm
        show={modal.show}
        onHide={closeModal}
        onSubmit={handleSubmit}
        title={modal.item ? "Edit User" : "Add New User"}
        fields={modal.item ? EDIT_FIELDS : ADD_FIELDS}
        initialValues={modal.item}
        loading={saving}
      />

      <ConfirmDialog
        show={confirm.show}
        onHide={() => setConfirm({ show: false, item: null })}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${confirm.item?.name}" (${confirm.item?.email})? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
