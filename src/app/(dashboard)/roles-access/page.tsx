"use client";

import { useEffect, useState } from "react";
import { Shield, Check, X, Users, ChevronRight, Edit2, Save } from "lucide-react";
import { roles as rolesApi, permissions as permsApi } from "@/lib/api";
import type { Role, Permission } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";

export default function RBACPage() {
  const { can } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      rolesApi.list().then((r) => setRoles(r.data || [])),
      permsApi.grouped().then((r) => setAllPermissions(r.data || {})),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectRole = async (role: Role) => {
    setSelectedRole(role);
    try {
      const res = await rolesApi.permissions(role.id);
      setRolePermissions((res.data || []).map((p: Permission) => p.id));
    } catch {
      setRolePermissions([]);
    }
  };

  const togglePermission = (permId: string) => {
    if (!can("roles.update")) return;
    setRolePermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleModule = (module: string) => {
    if (!can("roles.update")) return;
    const modulePerms = allPermissions[module] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => rolePermissions.includes(id));
    if (allSelected) {
      setRolePermissions((prev) => prev.filter((p) => !modulePermIds.includes(p)));
    } else {
      setRolePermissions((prev) => [...new Set([...prev, ...modulePermIds])]);
    }
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rolesApi.syncPermissions(selectedRole.id, { permission_ids: rolePermissions });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const levelColors: Record<string, string> = {
    super_admin: "#EF4444", admin: "#8B5CF6", manager: "#3B82F6", spv: "#F59E0B", staff: "#10B981",
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
          <Shield className="h-7 w-7 text-violet-500" /> Roles & Access Control
        </h1>
        <p className="mt-1 text-sm text-theme-text-muted">
          Configure role-based permissions for each user role
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Role List */}
        <div className="space-y-2">
          {roles.map((role) => {
            const c = levelColors[role.slug] || "#6B7280";
            const isSelected = selectedRole?.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-violet-500 bg-violet-500/5 shadow-sm"
                    : "border-theme-border bg-theme-bg-card hover:border-violet-500/30 hover:bg-theme-bg-hover"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${c}15` }}>
                  <Shield className="h-5 w-5" style={{ color: c }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-theme-text">{role.name}</p>
                  <p className="text-xs text-theme-text-muted truncate">{role.description || `Level ${role.level}`}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-xs text-theme-text-muted">
                    <Users className="h-3 w-3" /> {role.users_count ?? 0}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-theme-text-muted transition-transform ${isSelected ? "rotate-90" : ""}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Permission Matrix */}
        <div className="rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm">
          {!selectedRole ? (
            <div className="flex h-64 items-center justify-center text-theme-text-muted">
              Select a role to manage permissions
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between border-b border-theme-border p-4">
                <div>
                  <h2 className="text-lg font-semibold text-theme-text">
                    {selectedRole.name} Permissions
                  </h2>
                  <p className="text-xs text-theme-text-muted">
                    {rolePermissions.length} permissions granted · Level {selectedRole.level}
                  </p>
                </div>
                {can("roles.update") && (
                  <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>
              <div className="max-h-[600px] overflow-y-auto p-4 space-y-4">
                {Object.entries(allPermissions).map(([module, perms]) => {
                  const modulePermIds = perms.map((p) => p.id);
                  const allSelected = modulePermIds.every((id) => rolePermissions.includes(id));
                  const someSelected = modulePermIds.some((id) => rolePermissions.includes(id));

                  return (
                    <div key={module} className="rounded-xl border border-theme-border overflow-hidden">
                      <button
                        onClick={() => toggleModule(module)}
                        className="flex w-full items-center gap-3 bg-theme-bg-secondary/50 px-4 py-3 text-left hover:bg-theme-bg-hover transition-colors"
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                          allSelected ? "border-violet-500 bg-violet-500 text-white" : someSelected ? "border-violet-500 bg-violet-500/20" : "border-theme-border"
                        }`}>
                          {allSelected && <Check className="h-3 w-3" />}
                          {someSelected && !allSelected && <span className="block h-2 w-2 rounded-sm bg-violet-500" />}
                        </div>
                        <span className="font-medium text-theme-text capitalize">{module.replace(/_/g, " ")}</span>
                        <span className="ml-auto text-xs text-theme-text-muted">
                          {modulePermIds.filter((id) => rolePermissions.includes(id)).length}/{modulePermIds.length}
                        </span>
                      </button>
                      <div className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-3 md:grid-cols-4">
                        {perms.map((perm) => {
                          const isChecked = rolePermissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-theme-bg-hover"
                            >
                              <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                                isChecked ? "border-violet-500 bg-violet-500 text-white" : "border-theme-border"
                              } ${!can("roles.update") && "opacity-50"}`}>
                                {isChecked && <Check className="h-2.5 w-2.5" />}
                              </div>
                              <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => togglePermission(perm.id)} disabled={!can("roles.update")} />
                              <span className="text-theme-text-secondary capitalize">{perm.action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
