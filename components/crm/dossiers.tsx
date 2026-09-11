"use client"

import { useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  Landmark,
  MapPinned,
  Phone,
  Upload,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { dossiers, dossierStatutMeta, formatEuro } from "@/lib/crm-data"

export function Dossiers() {
  const [selectedId, setSelectedId] = useState(dossiers[0].id)
  const dossier = dossiers.find((d) => d.id === selectedId) ?? dossiers[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,30%)_1fr]">
      {/* Master list */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Dossiers en cours</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {dossiers.map((d) => {
            const meta = dossierStatutMeta[d.statut]
            const active = d.id === selectedId
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-accent"
                    : "border-transparent hover:bg-muted/60",
                )}
              >
                <Avatar className="size-9">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {d.initiales}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {d.candidat}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {d.ville}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={cn("shrink-0", meta.badgeClass)}
                >
                  {meta.label}
                </Badge>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Detail */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {dossier.initiales}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {dossier.candidat}
              </h2>
              <p className="text-sm text-muted-foreground">
                {dossier.ville} · {dossier.metier}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5",
              dossierStatutMeta[dossier.statut].badgeClass,
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                dossierStatutMeta[dossier.statut].dot,
              )}
            />
            {dossierStatutMeta[dossier.statut].label}
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Bloc 1 — Infos & Calendrier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-muted-foreground" />
                Infos & Calendrier
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FieldItem label="Téléphone" defaultValue={dossier.telephone} />
              <FieldItem label="Email" defaultValue={dossier.email} />
              <FieldItem label="Agent / Broker" defaultValue={dossier.agent} />
              <FieldItem
                label="Date de prise de bail"
                type="date"
                defaultValue={dossier.dateBail}
              />
              <FieldItem
                label="Date d'ouverture prévue"
                type="date"
                defaultValue={dossier.dateOuverture}
              />
            </CardContent>
          </Card>

          {/* Bloc 2 — Finance & Contrat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="size-4 text-muted-foreground" />
                Finance & Contrat
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FieldItem
                label="Apport (€)"
                defaultValue={String(dossier.apport)}
              />
              <FieldItem
                label="Honoraires / Droit d'entrée"
                defaultValue={String(dossier.honoraires)}
              />
              <FieldItem label="Nom de la banque" defaultValue={dossier.banque} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fin">Statut Financement</Label>
                <Select defaultValue={dossier.financement}>
                  <SelectTrigger id="fin" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="En cours">En cours</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bloc 3 — Territoire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned className="size-4 text-muted-foreground" />
                Territoire
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FieldItem
                label="Zone d'exclusivité"
                defaultValue={dossier.zoneExclusivite}
              />
              <FieldItem
                label="Zone de 1er refus"
                defaultValue={dossier.zonePremierRefus}
              />
            </CardContent>
          </Card>

          {/* Bloc 4 — Coffre-fort documentaire */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-muted-foreground" />
                Coffre-fort Documentaire
              </CardTitle>
              <span className="text-xs text-muted-foreground tabular-nums">
                {dossier.documents.filter((d) => d.statut === "valide").length}/
                {dossier.documents.length}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {dossier.documents.map((doc) => {
                const ok = doc.statut === "valide"
                return (
                  <div
                    key={doc.nom}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2",
                      ok
                        ? "border-score-high/25 bg-score-high/5"
                        : "border-dashed border-border",
                    )}
                  >
                    {ok ? (
                      <CheckCircle2 className="size-4 shrink-0 text-score-high" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                    )}
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        ok
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {doc.nom}
                    </span>
                    {ok ? (
                      <Badge variant="secondary" className="bg-score-high/15 text-score-high">
                        Validé
                      </Badge>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7">
                        <Upload data-icon="inline-start" />
                        Déposer
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FieldItem({
  label,
  defaultValue,
  type = "text",
}: {
  label: string
  defaultValue: string
  type?: string
}) {
  const id = label.replace(/[^a-z0-9]/gi, "-").toLowerCase()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} className="h-9" />
    </div>
  )
}
