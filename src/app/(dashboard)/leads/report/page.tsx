"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Layers
} from "lucide-react";
import { leads } from "@/lib/api";
import ReportFilter from "./ReportFilter";
import ExportDropdown from "./ExportDropdown";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

// Modern colors matching CRM theme
const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export default function LeadsReportPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("this_month");
  const [companyId, setCompanyId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [salesKpi, setSalesKpi] = useState<any[]>([]);

  // Generic report state
  const [summary, setSummary] = useState({
    totalLeads: 0,
    winRate: 0,
    totalRevenue: 0,
    activePipelines: 0
  });

  const [charts, setCharts] = useState<{ byStatus: any[]; bySource: any[]; trend: any[] }>({
    byStatus: [],
    bySource: [],
    trend: []
  });

  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // From API to fetch
        const params: Record<string, string> = { range: dateRange };
        if (companyId) params.company_id = companyId;
        if (outletId) params.outlet_id = outletId;

        const res = await leads.report(params);

        if (res.success && res.data && res.data.summary && res.data.charts) {
          setSummary(res.data.summary);
          setCharts(res.data.charts);
          setTableData(res.data.table || []);
          setSalesKpi(res.data.sales_kpi || []);
        } else {
          generateMockData();
        }
      } catch (err) {
        // Fallback if endpoint fails
        generateMockData();
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [dateRange, companyId, outletId]);

  const generateMockData = () => {
    // HARDCODE DATA PRESERVED FOR REVIEW:
    // setSummary({
    //   totalLeads: 1248,
    //   winRate: 32.5,
    //   totalRevenue: 4500000000,
    //   activePipelines: 12
    // });
    //
    // setCharts({
    //   byStatus: [
    //     { name: "New", count: 450 },
    //     { name: "Qualified", count: 320 },
    //     { name: "Proposal", count: 210 },
    //     { name: "Negotiation", count: 140 },
    //     { name: "Won", count: 405 },
    //     { name: "Lost", count: 128 },
    //   ],
    //   bySource: [
    //     { name: "Instagram", value: 400 },
    //     { name: "Website", value: 300 },
    //     { name: "Referral", value: 200 },
    //     { name: "Walk-in", value: 150 },
    //     { name: "Other", value: 198 },
    //   ],
    //   trend: [
    //     { month: "Jan", revenue: 400, leads: 120 },
    //     { month: "Feb", revenue: 300, leads: 98 },
    //     { month: "Mar", revenue: 550, leads: 160 },
    //     { month: "Apr", revenue: 450, leads: 140 },
    //     { month: "May", revenue: 700, leads: 210 },
    //     { month: "Jun", revenue: 850, leads: 260 },
    //   ]
    // });
    //
    // setTableData([
    //   { source: "Instagram", leads: 400, won: 120, conversion: 30, revenue: 1500000000 },
    //   { source: "Website", leads: 300, won: 80, conversion: 26.6, revenue: 1100000000 },
    //   { source: "Referral", leads: 200, won: 95, conversion: 47.5, revenue: 1200000000 },
    //   { source: "Walk-in", leads: 150, won: 60, conversion: 40, revenue: 500000000 },
    //   { source: "Other", leads: 198, won: 50, conversion: 25.2, revenue: 200000000 },
    // ]);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-theme-text">Leads Report</h1>
            <p className="text-sm text-theme-text-muted">Analytics and performance tracking for your leads</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-text-muted" />
            <select
              title="Select Date Range"
              aria-label="Select Date Range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-10 pl-9 pr-8 rounded-xl border border-theme-border bg-theme-bg-card text-sm font-medium text-theme-text hover:bg-theme-bg-hover focus:outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          <ReportFilter
            selectedCompany={companyId}
            setSelectedCompany={setCompanyId}
            selectedOutlet={outletId}
            setSelectedOutlet={setOutletId}
          />
          <ExportDropdown salesKpiData={salesKpi} summaryData={summary} dateRange={dateRange} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-sm text-theme-text-muted animate-pulse">Generating Report...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-theme-border bg-theme-bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-theme-text-muted">Total Leads</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-theme-text">{summary.totalLeads.toLocaleString("id-ID")}</h3>
                <span className="text-xs font-medium text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5"/> 12%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-theme-text-muted">Total Revenue</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-theme-text">Rp {(summary.totalRevenue / 1000000000).toFixed(1)}B</h3>
                <span className="text-xs font-medium text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5"/> 8%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-theme-text-muted">Avg. Win Rate</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-theme-text">{summary.winRate}%</h3>
                <span className="text-xs font-medium text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5"/> 4%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-theme-text-muted">Active Pipelines</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-theme-text">{summary.activePipelines}</h3>
                <span className="text-xs font-medium text-theme-text-muted">Across all branches</span>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Leads by Status */}
            <div className="rounded-2xl border border-theme-border bg-theme-bg-card p-5 shadow-sm">
              <h3 className="mb-6 text-base font-semibold text-theme-text">Leads by Status</h3>
              <div className="h-75 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.byStatus} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leads by Source */}
            <div className="rounded-2xl border border-theme-border bg-theme-bg-card p-5 shadow-sm">
              <h3 className="mb-6 text-base font-semibold text-theme-text">Leads by Source</h3>
              <div className="h-75 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.bySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts.bySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-theme-text text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Revenue Trend Line Chart */}
          <div className="rounded-2xl border border-theme-border bg-theme-bg-card p-5 shadow-sm lg:col-span-2">
            <h3 className="mb-6 text-base font-semibold text-theme-text">Revenue & Lead Trend</h3>
            <div className="h-87.5 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `${val}M`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-theme-text text-sm">{value}</span>}/>
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (Millions)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="leads" name="New Leads" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm overflow-hidden">
            <div className="border-b border-theme-border p-5">
              <h3 className="text-base font-semibold text-theme-text">Source Performance Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-sm">
                <thead className="bg-theme-bg-secondary/50 border-b border-theme-border text-left font-semibold text-theme-text-muted">
                  <tr>
                    <th className="px-5 py-3">Source Name</th>
                    <th className="px-5 py-3 text-right">Total Leads</th>
                    <th className="px-5 py-3 text-right">Deals Won</th>
                    <th className="px-5 py-3 text-right">Conversion</th>
                    <th className="px-5 py-3 text-right">Generated Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {tableData.map((row: any, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-theme-bg-hover/50">
                      <td className="px-5 py-4 font-medium text-theme-text">{row.source}</td>
                      <td className="px-5 py-4 text-right text-theme-text-secondary">{row.leads.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-4 text-right text-theme-text-secondary">{row.won.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-4 text-right text-theme-text">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.conversion >= 30 ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {row.conversion}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-emerald-500">
                        {formatCurrency(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
