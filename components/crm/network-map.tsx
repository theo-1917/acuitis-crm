"use client"

import { useState } from "react"
import { Layers, Maximize2, Ruler, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { type ZoneType, formatEuro, locaux, zoneMeta } from "@/lib/crm-data"

type FilterKey = "exclusivite" | "premier-refus" | "cible"

const filters: {
  key: FilterKey
  label: string
  dot: string
}[] = [
  {
    key: "exclusivite",
    label: "Zones d'exclusivité (Polygones rouges)",
    dot: "bg-score-low",
  },
  {
    key: "premier-refus",
    label: "Droits de 1er refus (Polygones oranges)",
    dot: "bg-score-mid",
  },
  { key: "cible", label: "Emplacements cibles", dot: "bg-chart-2" },
]

export function NetworkMap() {
  const [active, setActive] = useState<Record<FilterKey, boolean>>({
    exclusivite: true,
    "premier-refus": true,
    cible: true,
  })

  const visibleLocaux = locaux.filter((l) => active[l.type as FilterKey])

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Layers className="size-4 text-muted-foreground" />
              Calques de la carte
            </div>
            <div className="flex flex-col gap-3">
              {filters.map((f) => (
                <label
                  key={f.key}
                  className="flex cursor-pointer items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <span className={cn("size-2.5 rounded-full", f.dot)} />
                    {f.label}
                  </span>
                  <Switch
                    checked={active[f.key]}
                    onCheckedChange={(checked) =>
                      setActive((prev) => ({ ...prev, [f.key]: checked }))
                    }
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-foreground">
            Locaux disponibles
          </h3>
          <span className="text-xs text-muted-foreground">
            {visibleLocaux.length} résultat{visibleLocaux.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {visibleLocaux.map((l) => (
            <LocalCard key={l.id} type={l.type} local={l} />
          ))}
          {visibleLocaux.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun local ne correspond aux calques activés.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="relative min-h-[520px] overflow-hidden rounded-xl border border-border bg-secondary">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden="true"
        />
        <div className="relative flex h-full min-h-[520px] flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-card shadow-sm">
            <Maximize2 className="size-6 text-primary" />
          </div>
          <p className="max-w-xs text-balance text-sm font-medium text-foreground">
            Mapbox GL : Carte interactive + Calques des Zones Géographiques
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {(Object.keys(zoneMeta) as ZoneType[])
              .filter((k) => active[k as FilterKey])
              .map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm"
                >
                  <span className={cn("size-2 rounded-full", zoneMeta[k].dot)} />
                  {zoneMeta[k].label}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LocalCard({
  local,
  type,
}: {
  local: (typeof locaux)[number]
  type: ZoneType
}) {
  const meta = zoneMeta[type]
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-foreground">{local.adresse}</span>
            <span className="text-xs text-muted-foreground">{local.ville}</span>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
              meta.badgeClass,
            )}
          >
            <span className={cn("size-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Ruler className="size-3.5" />
            <span className="font-medium text-foreground">{local.surface} m²</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="size-3.5" />
            <span className="font-medium text-foreground">
              {formatEuro(local.loyer)}
            </span>
            /mois
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {local.disponibilite}
        </span>
      </CardContent>
    </Card>
  )
}
