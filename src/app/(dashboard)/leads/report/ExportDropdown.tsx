"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileText, Table } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface SalesKpi {
  rank: number;
  sales_name: string;
  sales_email: string;
  new_leads: number;
  in_work: number;
  won: number;
  lost: number;
  total: number;
  conversion: number;
  revenue: number;
}

interface SummaryData {
  totalLeads: number;
  winRate: number;
  totalRevenue: number;
  activePipelines: number;
}

const DATE_RANGE_LABELS: Record<string, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  this_year: "This Year",
  all_time: "All Time",
};

export default function ExportDropdown({
  salesKpiData,
  summaryData,
  dateRange,
}: {
  salesKpiData: SalesKpi[];
  summaryData: SummaryData;
  dateRange: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const fmtNumber = (val: number) => val.toLocaleString("id-ID");

  const periodLabel = DATE_RANGE_LABELS[dateRange] || dateRange;
  const timestamp = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ─── PDF EXPORT ──────────────────────────────────────────────────────────────
  const exportToPDF = () => {
    if (!salesKpiData || salesKpiData.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 12;

    // ── Header ──
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LEADS SUMMARY REPORT", pageW / 2, y + 4, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Watches Trader CRM", pageW / 2, y + 11, { align: "center" });
    y = 34;

    // ── Metadata ──
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const metaLeft = [
      `Period       : ${periodLabel}`,
      `Generated  : ${timestamp}`,
    ];
    const metaRight = [
      `Total Sales  : ${salesKpiData.length} user(s)`,
      `Total Leads  : ${fmtNumber(summaryData.totalLeads)}`,
    ];
    metaLeft.forEach((line, i) => doc.text(line, 14, y + i * 5));
    metaRight.forEach((line, i) => doc.text(line, pageW / 2 + 10, y + i * 5));
    y += 14;

    // ── Executive Summary Box ──
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y, pageW - 28, 18, 2, 2, "S");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 92, 246);
    doc.text("EXECUTIVE SUMMARY", 18, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const summaryItems = [
      `Total Leads: ${fmtNumber(summaryData.totalLeads)}`,
      `Win Rate: ${summaryData.winRate}%`,
      `Total Revenue: ${fmtCurrency(summaryData.totalRevenue)}`,
      `Active Pipelines: ${summaryData.activePipelines}`,
    ];
    const colW = (pageW - 36) / summaryItems.length;
    summaryItems.forEach((text, i) => {
      doc.text(text, 18 + i * colW, y + 13);
    });
    y += 24;

    // ── Performance Table ──
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("SALES PERFORMANCE RANKING", 14, y);
    y += 3;

    const tableHead = [
      [
        { content: "Rank", styles: { halign: "center" as const } },
        "Sales Name",
        { content: "New Leads", styles: { halign: "center" as const } },
        { content: "In Work", styles: { halign: "center" as const } },
        { content: "Deal Won", styles: { halign: "center" as const } },
        { content: "Lost/Junk", styles: { halign: "center" as const } },
        { content: "Total", styles: { halign: "center" as const, fontStyle: "bold" as const } },
        { content: "Conv. %", styles: { halign: "center" as const } },
        { content: "Revenue (IDR)", styles: { halign: "right" as const } },
      ],
    ];

    // Calculate totals
    const totals = salesKpiData.reduce(
      (acc, kpi) => ({
        new_leads: acc.new_leads + kpi.new_leads,
        in_work: acc.in_work + kpi.in_work,
        won: acc.won + kpi.won,
        lost: acc.lost + kpi.lost,
        total: acc.total + kpi.total,
        revenue: acc.revenue + kpi.revenue,
      }),
      { new_leads: 0, in_work: 0, won: 0, lost: 0, total: 0, revenue: 0 }
    );
    const totalConv = totals.total > 0 ? ((totals.won / totals.total) * 100).toFixed(1) : "0";

    const tableBody = salesKpiData.map((kpi) => {
      // Performance tier coloring
      let rankLabel = `#${kpi.rank}`;
      if (kpi.rank === 1) rankLabel = "🥇 #1";
      else if (kpi.rank === 2) rankLabel = "🥈 #2";
      else if (kpi.rank === 3) rankLabel = "🥉 #3";

      return [
        { content: rankLabel, styles: { halign: "center" as const, fontStyle: "bold" as const } },
        kpi.sales_name,
        { content: String(kpi.new_leads), styles: { halign: "center" as const } },
        { content: String(kpi.in_work), styles: { halign: "center" as const } },
        {
          content: String(kpi.won),
          styles: {
            halign: "center" as const,
            fontStyle: "bold" as const,
            textColor: kpi.won > 0 ? [22, 163, 74] as [number, number, number] : [107, 114, 128] as [number, number, number],
          },
        },
        {
          content: String(kpi.lost),
          styles: {
            halign: "center" as const,
            textColor: kpi.lost > 0 ? [220, 38, 38] as [number, number, number] : [107, 114, 128] as [number, number, number],
          },
        },
        { content: String(kpi.total), styles: { halign: "center" as const, fontStyle: "bold" as const } },
        {
          content: kpi.conversion + "%",
          styles: {
            halign: "center" as const,
            textColor: kpi.conversion >= 30 ? [22, 163, 74] as [number, number, number] : kpi.conversion >= 10 ? [234, 179, 8] as [number, number, number] : [107, 114, 128] as [number, number, number],
          },
        },
        { content: fmtCurrency(kpi.revenue), styles: { halign: "right" as const } },
      ];
    });

    // Totals row
    const totalsRow = [
      { content: "", styles: { halign: "center" as const } },
      { content: "TOTAL", styles: { fontStyle: "bold" as const } },
      { content: String(totals.new_leads), styles: { halign: "center" as const, fontStyle: "bold" as const } },
      { content: String(totals.in_work), styles: { halign: "center" as const, fontStyle: "bold" as const } },
      { content: String(totals.won), styles: { halign: "center" as const, fontStyle: "bold" as const } },
      { content: String(totals.lost), styles: { halign: "center" as const, fontStyle: "bold" as const } },
      { content: String(totals.total), styles: { halign: "center" as const, fontStyle: "bold" as const } },
      { content: totalConv + "%", styles: { halign: "center" as const, fontStyle: "bold" as const } },
      { content: fmtCurrency(totals.revenue), styles: { halign: "right" as const, fontStyle: "bold" as const } },
    ];
    tableBody.push(totalsRow as any);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      // Style the totals row (last row)
      didParseCell: (data: any) => {
        if (data.section === "body" && data.row.index === salesKpiData.length) {
          data.cell.styles.fillColor = [235, 230, 255];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ── Footer ──
    const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by Watches Trader CRM — ${timestamp}  |  This document is confidential.`,
      pageW / 2,
      finalY + 10,
      { align: "center" }
    );

    doc.save(`Sales_KPI_Report_${dateRange}.pdf`);
    setIsOpen(false);
  };

  // ─── EXCEL EXPORT ────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!salesKpiData || salesKpiData.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["LEADS SUMMARY REPORT"],
      ["Watches Trader CRM"],
      [],
      ["Period", periodLabel],
      ["Generated", timestamp],
      [],
      ["EXECUTIVE SUMMARY"],
      ["Total Leads", summaryData.totalLeads],
      ["Win Rate", summaryData.winRate + "%"],
      ["Total Revenue", summaryData.totalRevenue],
      ["Active Pipelines", summaryData.activePipelines],
    ]);
    // Merge title cell
    summarySheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    // Column widths
    summarySheet["!cols"] = [{ wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Sheet 2: Sales KPI Detail
    const headers = [
      "Rank",
      "Sales Name",
      "Email",
      "New Leads",
      "In Work",
      "Deal Won",
      "Lost/Junk",
      "Total Leads",
      "Conversion (%)",
      "Revenue (IDR)",
    ];

    const rows = salesKpiData.map((kpi) => [
      kpi.rank,
      kpi.sales_name,
      kpi.sales_email,
      kpi.new_leads,
      kpi.in_work,
      kpi.won,
      kpi.lost,
      kpi.total,
      kpi.conversion,
      kpi.revenue,
    ]);

    // Calculate totals
    const totals = salesKpiData.reduce(
      (acc, kpi) => ({
        new_leads: acc.new_leads + kpi.new_leads,
        in_work: acc.in_work + kpi.in_work,
        won: acc.won + kpi.won,
        lost: acc.lost + kpi.lost,
        total: acc.total + kpi.total,
        revenue: acc.revenue + kpi.revenue,
      }),
      { new_leads: 0, in_work: 0, won: 0, lost: 0, total: 0, revenue: 0 }
    );
    const totalConv = totals.total > 0 ? +((totals.won / totals.total) * 100).toFixed(1) : 0;

    rows.push([
      "",
      "TOTAL",
      "",
      totals.new_leads,
      totals.in_work,
      totals.won,
      totals.lost,
      totals.total,
      totalConv,
      totals.revenue,
    ]);

    const detailSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    detailSheet["!cols"] = [
      { wch: 6 },   // Rank
      { wch: 28 },  // Name
      { wch: 30 },  // Email
      { wch: 12 },  // New Leads
      { wch: 10 },  // In Work
      { wch: 10 },  // Deal Won
      { wch: 10 },  // Lost
      { wch: 12 },  // Total
      { wch: 15 },  // Conversion
      { wch: 20 },  // Revenue
    ];
    XLSX.utils.book_append_sheet(wb, detailSheet, "Sales KPI");

    XLSX.writeFile(wb, `Sales_KPI_Report_${dateRange}.xlsx`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1a1c23] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Export Report</p>
          </div>
          <button
            onClick={exportToPDF}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
              <FileText className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-sm">PDF Report</p>
              <p className="text-[11px] text-gray-400">Full summary + table</p>
            </div>
          </button>
          <button
            onClick={exportToExcel}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-t border-gray-50 dark:border-gray-800/50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
              <Table className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Excel Spreadsheet</p>
              <p className="text-[11px] text-gray-400">Multi-sheet workbook</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
