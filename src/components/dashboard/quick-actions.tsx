"use client"

import Link from 'next/link'
import { UserPlus, Briefcase, Radio, Zap } from 'lucide-react'
import type { ComponentType } from 'react'

interface Action {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  tint: string
}

const ACTIONS: Action[] = [
  { label: 'New Contact', href: '/contacts', icon: UserPlus, tint: 'text-violet-400' },
  { label: 'New Deal', href: '/pipelines', icon: Briefcase, tint: 'text-blue-400' },
  { label: 'New Broadcast', href: '/broadcasts/new', icon: Radio, tint: 'text-amber-400' },
  { label: 'New Automation', href: '/automations/new', icon: Zap, tint: 'text-violet-400' },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-theme-border bg-theme-bg-card px-4 py-3 transition-colors hover:bg-theme-bg-hover"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-theme-bg-secondary ${a.tint}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-theme-text">{a.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
