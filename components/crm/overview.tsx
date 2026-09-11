"use client"

import { useState } from "react"
import { ArrowUpRight, CalendarClock, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  dossiersValides,
  formatDateFr,
  kpis,
  missions,
  prioriteMeta,
} from "@/lib/crm-data"

export function Overview() {
  const topMissions = missions.slice(0, 5)
  const [done, setDone] = useState<Record<string, boolean>>(
    () => Object.fromEntries(topMissions.map((m) => [m.id, m.fait])),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex flex-col gap-1.5 py-5">
              <span className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </span>
              <div className="flex items-end justify-between gap-2">
                <span className="font-mono text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                  {kpi.value}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "gap-1",
                    kpi.trend === "up" && "text-score-high",
                  )}
                >
                  {kpi.trend === "up" && <ArrowUpRight className="size-3" />}
                  {kpi.delta}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top 5 Missions Prioritaires</CardTitle>
            <Badge variant="outline">
              {topMissions.filter((m) => !done[m.id]).length} à traiter
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {topMissions.map((m) => {
              const isDone = done[m.id]
              return (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={(checked) =>
                      setDone((prev) => ({ ...prev, [m.id]: checked === true }))
                    }
                    aria-label={`Marquer « ${m.description} » comme fait`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        "truncate text-sm font-medium text-foreground",
                        isDone && "text-muted-foreground line-through",
                      )}
                    >
                      {m.description}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {m.liee}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("shrink-0", prioriteMeta[m.priorite].badgeClass)}
                  >
                    {m.priorite}
                  </Badge>
                  <span
                    className={cn(
                      "flex w-24 shrink-0 items-center justify-end gap-1 text-xs tabular-nums",
                      m.urgent && !isDone
                        ? "font-semibold text-score-low"
                        : "text-muted-foreground",
                    )}
                  >
                    <CalendarClock className="size-3.5" />
                    {formatDateFr(m.echeance)}
                  </span>
                </label>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derniers Dossiers Validés</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {dossiersValides.map((d) => (
              <div
                key={d.candidat}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-score-high/15 text-score-high">
                    <CheckCircle2 className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {d.candidat}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {d.ville} · {d.metier}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {d.date}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
