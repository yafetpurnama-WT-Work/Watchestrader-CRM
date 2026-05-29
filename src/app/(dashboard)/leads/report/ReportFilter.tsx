"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { companies, outlets } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function ReportFilter({
  selectedCompany,
  setSelectedCompany,
  selectedOutlet,
  setSelectedOutlet
}: {
  selectedCompany: string;
  setSelectedCompany: (id: string) => void;
  selectedOutlet: string;
  setSelectedOutlet: (id: string) => void;
}) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const [companyList, setCompanyList] = useState<any[]>([]);
  const [outletList, setOutletList] = useState<any[]>([]);
  
  // RBAC checks
  const roleLevel = profile?.role_relation?.level || 0;
  const isRestricted = roleLevel < 60; // < 60 means restricted to own company/outlet
  
  useEffect(() => {
    // If restricted, force their own company and outlet and disable fetch
    if (isRestricted && profile?.company?.id) {
      setSelectedCompany(profile.company.id);
      if (profile?.outlet?.id) {
        setSelectedOutlet(profile.outlet.id);
      }
    }
    
    // Fetch all companies if allowed
    if (!isRestricted) {
      companies.list().then((res) => {
        if (res.success) setCompanyList(res.data.data || res.data || []);
      }).catch(console.error);
    }
  }, [profile, isRestricted, setSelectedCompany, setSelectedOutlet]);
  
  useEffect(() => {
    // Fetch outlets when company changes or if restricted to own company
    const fetchOutlets = async () => {
      const compId = isRestricted ? profile?.company?.id : selectedCompany;
      if (compId) {
        try {
          const res = await outlets.list({ company_id: compId });
          if (res.success) setOutletList(res.data.data || res.data || []);
        } catch (e) {
          console.error(e);
        }
      } else {
        setOutletList([]);
      }
    };
    fetchOutlets();
  }, [selectedCompany, isRestricted, profile]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <Filter className="w-4 h-4 text-gray-500" />
        Filter
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 p-4 bg-white dark:bg-[#1a1c23] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Company</label>
            <select
              title="Select Company"
              aria-label="Select Company"
              disabled={isRestricted}
              value={isRestricted ? (profile?.company?.id || "") : selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setSelectedOutlet(""); // reset outlet on company change
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-[#8b5cf6] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">All Companies</option>
              {isRestricted && profile?.company ? (
                 <option value={profile.company.id}>{profile.company.name}</option>
              ) : (
                companyList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Outlet</label>
            <select
              title="Select Outlet"
              aria-label="Select Outlet"
              disabled={isRestricted}
              value={isRestricted ? (profile?.outlet?.id || "") : selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-[#8b5cf6] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">All Outlets</option>
              {isRestricted && profile?.outlet ? (
                 <option value={profile.outlet.id}>{profile.outlet.name}</option>
              ) : (
                outletList.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))
              )}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
