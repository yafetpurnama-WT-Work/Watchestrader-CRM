"use client"

import {
  MessageSquare,
  UserPlus,
  DollarSign,
  Send,
} from 'lucide-react'

import { MetricCard } from '@/components/dashboard/metric-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { DashboardBanner } from '@/components/dashboard/banner'

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <div className="px-4">
        <h1 className="text-2xl font-bold text-theme-text">Dashboard</h1>
        <p className="mt-1 text-sm text-theme-text-muted">
          Live analytics across conversations, contacts, deals, broadcasts, and automations.
        </p>
      </div>

      <DashboardBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Conversations" value="0" icon={MessageSquare} />
        <MetricCard title="New Contacts Today" value="0" icon={UserPlus} />
        <MetricCard title="Open Deals Value" value="$0" icon={DollarSign} subtitle="0 open deals" />
        <MetricCard title="Messages Sent Today" value="0" icon={Send} />
      </div>

      {/* SEMENTARA COMMAND SESUAI PERMINTAAN BAPAK RUDY */}
      {/* <QuickActions /> */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="h-full lg:col-span-3 rounded-xl border border-theme-border bg-theme-bg-card px-4 py-6">
          <h3 className="text-sm font-medium text-theme-text-secondary">Conversations Chart</h3>
          <p className="mt-2 text-xs text-theme-text-muted">Data will populate once backend analytics endpoints are connected.</p>
        </div>
        <div className="h-full lg:col-span-2 rounded-xl border border-theme-border bg-theme-bg-card px-4 py-6">
          <h3 className="text-sm font-medium text-theme-text-secondary">Pipeline Overview</h3>
          <p className="mt-2 text-xs text-theme-text-muted">Data will populate once backend analytics endpoints are connected.</p>
        </div>
      </div>
    </div>
  )
}
