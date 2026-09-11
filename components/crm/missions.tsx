"use client"

import { useState } from "react"
import { CalendarClock, Link2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  formatDateFr,
  missions as seedMissions,
  type Mission,
  prioriteMeta,
} from "@/lib/crm-data"

export function Missions() {
  const [items, setItems] = useState<Mission[]>(seedMissions)
  const [draft, setDraft] = useState("")

  function toggle(id: string) {
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, fait: !m.fait } : m)),
    )
  }

  function addMission(e: React.FormEvent) {
    e.preventDefault()
    const description = draft.trim()
    if (!description) return
    setItems((prev) => [
      {
        id: `m-${Date.now()}`,
        description,
        priorite: "Moyenne",
        liee: "Non assigné",
        echeance: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
        urgent: false,
        fait: false,
      },
      ...prev,
    ])
    setDraft("")
  }

  const restantes = items.filter((m) => !m.fait).length

  return (
    <Card className="overflow-hidden py-0">
      <form
        onSubmit={addMission}
        className="flex items-center gap-2 border-b border-border bg-muted/30 p-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nouvelle mission… (ex. Relancer le candidat pour le RIB)"
          aria-label="Nouvelle mission"
          className="h-9 bg-card"
        />
        <Button type="submit" disabled={!draft.trim()}>
          <Plus data-icon="inline-start" />
          Ajouter
        </Button>
      </form>

      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm font-medium text-foreground">
          {restantes} mission{restantes > 1 ? "s" : ""} en cours
        </span>
        <span className="text-xs text-muted-foreground">
          {items.length} au total
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Description</TableHead>
            <TableHead className="w-32">Priorité</TableHead>
            <TableHead className="w-64">Lié à</TableHead>
            <TableHead className="w-36 text-right">Échéance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m) => (
            <TableRow key={m.id} className={cn(m.fait && "opacity-55")}>
              <TableCell>
                <Checkbox
                  checked={m.fait}
                  onCheckedChange={() => toggle(m.id)}
                  aria-label={`Marquer « ${m.description} » comme fait`}
                />
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "font-medium text-foreground",
                    m.fait && "text-muted-foreground line-through",
                  )}
                >
                  {m.description}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={prioriteMeta[m.priorite].badgeClass}
                >
                  {m.priorite}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Link2 className="size-3.5 shrink-0" />
                  <span className="truncate">{m.liee}</span>
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center justify-end gap-1 text-sm tabular-nums",
                    m.urgent && !m.fait
                      ? "font-semibold text-score-low"
                      : "text-muted-foreground",
                  )}
                >
                  <CalendarClock className="size-3.5" />
                  {formatDateFr(m.echeance)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
