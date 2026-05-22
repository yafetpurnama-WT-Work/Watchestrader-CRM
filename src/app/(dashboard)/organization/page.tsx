"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Plus, Edit2, Trash2, Users, ChevronDown, ChevronRight, Store } from "lucide-react";
import { companies as companiesApi, outlets as outletsApi } from "@/lib/api";
import type { Company, Outlet } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";

export default function OrganizationPage() {
  const { can } = usePermissions();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [outletMap, setOutletMap] = useState<Record<string, Outlet[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      companiesApi.list().then((r) => setCompanies(r.data || [])),
      outletsApi.list().then((r) => {
        const map: Record<string, Outlet[]> = {};
        (r.data || []).forEach((o: Outlet) => {
          if (!map[o.company_id]) map[o.company_id] = [];
          map[o.company_id].push(o);
        });
        setOutletMap(map);
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedCompany((prev) => (prev === id ? null : id));
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
            <Building2 className="h-7 w-7 text-violet-500" /> Organization
          </h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            Manage companies and their branch outlets
          </p>
        </div>
        <div className="flex gap-2">
          {can("outlets.create") && (
            <button className="inline-flex items-center gap-2 rounded-xl border border-theme-border bg-theme-bg-card px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-bg-hover transition-colors">
              <Store className="h-4 w-4" /> Add Outlet
            </button>
          )}
          {can("companies.create") && (
            <button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors">
              <Plus className="h-4 w-4" /> Add Company
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {companies.map((company) => {
          const outlets = outletMap[company.id] || [];
          const isExpanded = expandedCompany === company.id;

          return (
            <div
              key={company.id}
              className="overflow-hidden rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm transition-all"
            >
              {/* Company Row */}
              <button
                onClick={() => toggleExpand(company.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-theme-bg-hover/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                  <Building2 className="h-6 w-6 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-theme-text">{company.name}</h3>
                    <span className="rounded bg-theme-bg-secondary px-2 py-0.5 text-[10px] font-semibold text-theme-text-muted">
                      {company.code}
                    </span>
                    {company.is_active ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">Active</span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">Inactive</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-theme-text-muted">
                    {company.email && <span>{company.email}</span>}
                    {company.phone && <span>{company.phone}</span>}
                    <span className="flex items-center gap-1">
                      <Store className="h-3 w-3" /> {outlets.length} outlets
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {company.users_count ?? 0} users
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {can("companies.update") && (
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-theme-text-muted" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-theme-text-muted" />
                  )}
                </div>
              </button>

              {/* Outlets */}
              {isExpanded && outlets.length > 0 && (
                <div className="border-t border-theme-border bg-theme-bg-secondary/30">
                  <div className="divide-y divide-theme-border">
                    {outlets.map((outlet) => (
                      <div key={outlet.id} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-theme-bg-hover/30">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                          <MapPin className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-theme-text">{outlet.name}</p>
                            <span className="rounded bg-theme-bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-theme-text-muted">
                              {outlet.code}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-theme-text-muted">
                            <span>{outlet.city}</span>
                            {outlet.phone && <span>{outlet.phone}</span>}
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {outlet.users_count ?? 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {outlet.is_active ? (
                            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">Active</span>
                          ) : (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">Inactive</span>
                          )}
                          {can("outlets.update") && (
                            <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {can("outlets.delete") && (
                            <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && outlets.length === 0 && (
                <div className="border-t border-theme-border px-6 py-8 text-center text-sm text-theme-text-muted">
                  No outlets found for this company.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
