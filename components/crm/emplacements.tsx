"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Map, Download, Pencil, Trash2, CheckCircle, Search, Clock, Home, Building2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Prospect = { name: string; telephone: string; email: string; apport: number; developpeur_assigne?: string }
type Emplacement = {
  id: number
  prospect_id: number
  villes_recherchees: string
  type_zone: string
  surface_souhaitee_m2: number
  statut_recherche: string
  notes_recherche: string
  prospects?: Prospect
}

export function Emplacements() {
  const [emplacements, setEmplacements] = useState<Emplacement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEmplacements = async () => {
    setLoading(true)
    const { data } = await supabase.from("emplacements").select("*, prospects(*)")
    if (data) setEmplacements(data as Emplacement[])
    setLoading(false)
  }

  useEffect(() => { fetchEmplacements() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette recherche d'emplacement ?")) return
    await supabase.from("emplacements").delete().eq("id", id)
    fetchEmplacements()
  }

  const exportCSV = () => {
    const headers = ["Candidat", "Villes", "Type de zone", "Surface", "Apport", "Statut", "Développeur"]
    const rows = emplacements.map(e => [
      `"${e.prospects?.name || ''}"`,
      `"${e.villes_recherchees || ''}"`,
      `"${e.type_zone || ''}"`,
      `"${e.surface_souhaitee_m2 || ''}"`,
      `"${e.prospects?.apport || ''}"`,
      `"${e.statut_recherche || ''}"`,
      `"${e.prospects?.developpeur_assigne || ''}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n")
    const link = document.createElement("a")
    link.href = encodeURI(csvContent)
    link.download = `recherche_locaux_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement des recherches...</div>

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER IDENTIQUE AUX AUTRES ONGLETS */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Recherche d'emplacements</h2>
        </div>
        <Button onClick={exportCSV} variant="outline" className="text-xs">
          <Download className="mr-2 h-4 w-4" /> Export Agents Immo
        </Button>
      </div>

      {/* TABLEAU MODERNE */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <th className="p-4 w-1/4">Candidat & Contact</th>
              <th className="p-4">Recherche</th>
              <th className="p-4 w-32">Surface</th>
              <th className="p-4 w-40">Statut</th>
              <th className="p-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {emplacements.map((emp) => (
              <tr key={emp.id} className="transition hover:bg-muted/20">
                
                {/* COLONNE CANDIDAT */}
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-foreground">{emp.prospects?.name || "Inconnu"}</span>
                    <span className="text-[11px] text-muted-foreground">{emp.prospects?.email}</span>
                    <span className="text-[11px] text-muted-foreground">{emp.prospects?.telephone}</span>
                    {emp.prospects?.developpeur_assigne && (
                      <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-none text-[9px] px-1.5 py-0 w-fit">
                         👤 {emp.prospects.developpeur_assigne}
                      </Badge>
                    )}
                  </div>
                </td>

                {/* COLONNE RECHERCHE */}
                <td className="p-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                      <Search className="h-3.5 w-3.5 text-primary" /> {emp.villes_recherchees || "-"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Building2 className="h-3 w-3" /> {emp.type_zone || "Zone non définie"}
                    </span>
                    {emp.notes_recherche && (
                      <p className="text-[10px] text-muted-foreground italic line-clamp-2 mt-1 border-l-2 border-primary/20 pl-2">
                        {emp.notes_recherche}
                      </p>
                    )}
                  </div>
                </td>

                {/* COLONNE SURFACE & APPORT */}
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium">{emp.surface_souhaitee_m2 || 0} m² min.</span>
                    <span className="text-[10px] text-muted-foreground">Apport: {emp.prospects?.apport || 0}€</span>
                  </div>
                </td>

                {/* COLONNE STATUT */}
                <td className="p-4">
                  <Badge variant="outline" className={
                    emp.statut_recherche === "en_recherche" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    emp.statut_recherche === "trouve" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    "bg-muted text-muted-foreground"
                  }>
                    {emp.statut_recherche === "en_recherche" ? "En recherche" : emp.statut_recherche === "trouve" ? "Trouvé" : emp.statut_recherche}
                  </Badge>
                </td>

                {/* COLONNE ACTIONS */}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(emp.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {emplacements.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">Aucune recherche d'emplacement en cours.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}