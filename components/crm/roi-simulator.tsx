"use client"

import { useState } from "react"
import { Footprints, Store, TrendingUp, Users2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { formatEuro, formatNombre } from "@/lib/crm-data"

function toNumber(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number)
}

export function RoiSimulator() {
  const [passage, setPassage] = useState(6000)
  const [concurrents, setConcurrents] = useState(2)
  const [caLocomotive, setCaLocomotive] = useState(2_000_000)
  const [investissement, setInvestissement] = useState(320_000)

  const brut = passage * 55 + caLocomotive * 0.04
  const facteurConcurrence = 1 - Math.min(concurrents, 10) * 0.055
  const caPotentiel = Math.round(brut * facteurConcurrence)
  const margeNette = caPotentiel * 0.18
  const roiPourcent = (margeNette / investissement) * 100
  const retour = investissement / margeNette

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de l'emplacement</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-7 pt-2">
          <SliderRow
            icon={Footprints}
            label="Passage piéton"
            value={`${formatNombre(passage)} / jour`}
            min={500}
            max={15000}
            step={100}
            current={passage}
            onChange={setPassage}
          />
          <SliderRow
            icon={Users2}
            label="Nombre de concurrents"
            value={`${concurrents}`}
            min={0}
            max={10}
            step={1}
            current={concurrents}
            onChange={setConcurrents}
          />
          <SliderRow
            icon={Store}
            label="CA locomotive voisine"
            value={formatEuro(caLocomotive)}
            min={0}
            max={5_000_000}
            step={100_000}
            current={caLocomotive}
            onChange={setCaLocomotive}
          />
          <SliderRow
            icon={TrendingUp}
            label="Investissement initial"
            value={formatEuro(investissement)}
            min={150_000}
            max={800_000}
            step={10_000}
            current={investissement}
            onChange={setInvestissement}
          />
        </CardContent>
      </Card>

      <Card className="bg-sidebar text-sidebar-foreground">
        <CardHeader>
          <CardTitle className="text-sidebar-accent-foreground">
            Projection financière
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-sidebar-foreground/60">
              CA Potentiel Estimé (annuel)
            </span>
            <span className="text-4xl font-semibold tracking-tight text-sidebar-accent-foreground tabular-nums">
              {formatEuro(caPotentiel)}
            </span>
          </div>

          <Separator className="bg-sidebar-border" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-sidebar-foreground/60">
                ROI annuel
              </span>
              <span className="text-3xl font-semibold text-primary tabular-nums">
                {roiPourcent.toFixed(1)} %
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-sidebar-foreground/60">
                Retour sur investissement
              </span>
              <span className="text-3xl font-semibold text-sidebar-accent-foreground tabular-nums">
                {retour.toFixed(1)} ans
              </span>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-sidebar-foreground/60">Marge nette estimée</span>
              <span className="font-medium text-sidebar-accent-foreground tabular-nums">
                {formatEuro(Math.round(margeNette))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sidebar-foreground/60">
                Impact concurrence
              </span>
              <span className="font-medium text-sidebar-accent-foreground tabular-nums">
                −{((1 - facteurConcurrence) * 100).toFixed(0)} %
              </span>
            </div>
          </div>

          <p className="text-pretty text-xs leading-relaxed text-sidebar-foreground/50">
            Estimation indicative basée sur le flux piéton, l'environnement
            concurrentiel et l'effet locomotive. À affiner lors de l'étude de
            marché terrain.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SliderRow({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  min: number
  max: number
  step: number
  current: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </span>
        <span className="text-sm font-semibold text-primary tabular-nums">
          {value}
        </span>
      </div>
      <Slider
        value={current}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(toNumber(v))}
        aria-label={label}
      />
    </div>
  )
}
