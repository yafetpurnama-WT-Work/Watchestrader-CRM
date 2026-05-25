"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import {
  AutomationBuilder,
  fromServerSteps,
  type BuilderInitial,
  type ServerStepNode,
} from "@/components/automations/automation-builder"
import type { AutomationTriggerType } from "@/types"
import { automations as automationsApi, ApiError } from "@/lib/api"

export default function EditAutomationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [initial, setInitial] = useState<BuilderInitial | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // 1) Load automation metadata
        const res = await automationsApi.get(id)
        if (cancelled) return
        console.log("[EditAutomation] GET /automations/" + id + " response:", JSON.stringify(res, null, 2))

        const automation = res.data?.automation || res.data

        // 2) Load steps — try multiple sources
        let steps: ServerStepNode[] = []

        // Source A: dedicated /steps endpoint
        try {
          const stepsRes = await automationsApi.getSteps(id)
          if (!cancelled) {
            console.log("[EditAutomation] GET /automations/" + id + "/steps response:", JSON.stringify(stepsRes, null, 2))
            const rawSteps = stepsRes.data?.steps || stepsRes.data
            if (Array.isArray(rawSteps) && rawSteps.length > 0) {
              steps = rawSteps
              console.log("[EditAutomation] Steps loaded from /steps endpoint:", steps.length, "steps")
            }
          }
        } catch (stepsErr) {
          console.warn("[EditAutomation] /steps endpoint failed:", stepsErr)
        }

        // Source B: steps embedded in the main automation response
        if (steps.length === 0) {
          const embedded = res.data?.steps || automation?.steps
          if (Array.isArray(embedded) && embedded.length > 0) {
            steps = embedded
            console.log("[EditAutomation] Steps loaded from main response:", steps.length, "steps")
          }
        }

        // Source C: automation_steps relation (Laravel eager-loaded)
        if (steps.length === 0) {
          const relation = automation?.automation_steps
          if (Array.isArray(relation) && relation.length > 0) {
            steps = relation
            console.log("[EditAutomation] Steps loaded from automation_steps relation:", steps.length, "steps")
          }
        }

        console.log("[EditAutomation] Final steps to load:", JSON.stringify(steps, null, 2))

        // Parse trigger_config if it's a string (Laravel may JSON-encode it)
        let triggerConfig = automation.trigger_config ?? {}
        if (typeof triggerConfig === "string") {
          try {
            triggerConfig = JSON.parse(triggerConfig)
          } catch {
            triggerConfig = {}
          }
        }

        // Parse step_config if it's a string for each step
        steps = steps.map((s: any) => ({
          ...s,
          step_config: typeof s.step_config === "string"
            ? (() => { try { return JSON.parse(s.step_config) } catch { return {} } })()
            : s.step_config ?? {},
        }))

        if (cancelled) return

        setInitial({
          id: automation.id,
          name: automation.name ?? "",
          description: automation.description ?? "",
          trigger_type: automation.trigger_type as AutomationTriggerType,
          trigger_config: triggerConfig,
          is_active: !!automation.is_active,
          steps: fromServerSteps(steps as ServerStepNode[]),
        })
      } catch (err) {
        console.error("[EditAutomation] Load failed:", err)
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? `Failed to load (${err.status})`
              : "Failed to load automation"
          )
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => router.push("/automations")}
          className="text-sm text-violet-400 hover:text-violet-300"
        >
          Back to Automations
        </button>
      </div>
    )
  }

  if (!initial) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    )
  }

  return <AutomationBuilder initial={initial} />
}

