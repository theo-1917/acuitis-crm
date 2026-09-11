"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDownWideNarrow, MoreHorizontal, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatEuro } from "@/lib/crm-data"
import { ScoreRing } from "./score-indicator"
import { supabase } from "@/lib/supabase"

const statutStyles: Record<string, string> = {
  "Premier contact": "bg-muted text-muted-foreground",
  "Qualifié": "bg-chart-2/10 text-chart-2",
  "DIP envoyé": "bg-primary/10 text-primary",
  "Négociation": "bg-score-mid/15 text-score-mid-foreground",
  "Signé": "bg-score-high/12 text-score-high",
  "Nouveau": "bg-blue-100 text-blue-700",
}

const metierStyles: Record<string, string> = {
  "Opticien": "border-chart-2/30 text-chart-2",
  "Audio": "border-chart-4/30 text-chart-4",
  "Investisseur": "border-primary/30 text-primary",
}

export function ProspectsPipeline() {
  const [sortByScore, setSortByScore] = useState(false)
  const [prospects, setProspects] = useState<any[]>([])
  
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const initialFormState = {
    name: "", ville: "", metier: "Opticien", apport: "", statut: "Nouveau", score: "50",
    email: "", telephone: "", commentaire: ""
  }
  const [formData, setFormData] = useState(initialFormState)

  async function loadProspects() {
    const { data } = await supabase.from('prospects').select('*')
    if (data) setProspects(data)
  }

  useEffect(() => {
    loadProspects()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const newProspect = {
      name: formData.name,
      ville: formData.ville,
      metier: formData.metier,
      apport: parseInt(formData.apport) || 0,
      statut: formData.statut,
      score: parseInt(formData.score) || 0,
      email: formData.email,
      telephone: formData.telephone,
      commentaire: formData.commentaire
    }

    const { error } = await supabase.from('prospects').insert([newProspect])

    if (!error) {
      await loadProspects()
      setFormData(initialFormState)
      setShowForm(false)
    } else {
      alert("Erreur de Supabase : " + error.message)
    }
    setIsSubmitting(false)
  }

  async function handleDelete(id: number) {
    if (!confirm("Voulez-vous vraiment archiver ce candidat ? Cette action est irréversible.")) return
    
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    
    if (!error) {
      await loadProspects()
    } else {
      alert("Erreur lors de la suppression : " + error.message)
    }
  }

  const rows = useMemo(() => {
    const mappedData = prospects.map((p) => ({
      id: p.id,
      nom: p.name,
      initiales: p.name ? p.name.substring(0, 2).toUpperCase() : "??",
      ville: p.ville || "À définir",
      score: p.score || 0,
      statut: p.statut || "Nouveau",
      apport: p.apport || 0,
      metier: p.metier || "Opticien",
      email: p.email || "",
      telephone: p.telephone || "",
      commentaire: p.commentaire || ""
    }))

    if (!sortByScore) return mappedData
    return mappedData.sort((a, b) => b.score - a.score)
  }, [prospects, sortByScore])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pipeline Prospects</h2>
          <p className="text-sm text-muted-foreground">{prospects.length} candidats en cours de qualification</p>
        </div>
        <div className="flex gap-2">
          <Button variant={sortByScore ? "default" : "outline"} onClick={() => setSortByScore((v) => !v)}>
            <ArrowDownWideNarrow className="mr-2 h-4 w-4" /> Trier par Score
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau Candidat
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-md font-semibold">Ajouter un nouveau prospect</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Nom complet *</label>
              <input required type="text" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" 
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Email</label>
              <input type="email" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Téléphone</label>
              <input type="tel" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Ville</label>
              <input type="text" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.ville} onChange={(e) => setFormData({...formData, ville: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Métier</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.metier} onChange={(e) => setFormData({...formData, metier: e.target.value})}>
                <option value="Opticien">Opticien</option>
                <option value="Audio">Audio</option>
                <option value="Investisseur">Investisseur</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Apport personnel (€)</label>
              <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.apport} onChange={(e) => setFormData({...formData, apport: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-muted-foreground">Commentaire</label>
              <input type="text" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.commentaire} onChange={(e) => setFormData({...formData, commentaire: e.target.value})} placeholder="Notes sur le candidat..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Score estimé (0-100)</label>
              <input type="number" min="0" max="100" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.score} onChange={(e) => setFormData({...formData, score: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-3 items-end mt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer le candidat"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Le tableau avec toutes les vraies colonnes ! */}
      <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-card">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Candidat</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead className="w-[100px]">Score</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Apport</TableHead>
              <TableHead>Métier</TableHead>
              <TableHead className="w-[200px]">Commentaire</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                        {p.initiales}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-foreground">{p.nom}</span>
                      <span className="text-xs text-muted-foreground">{p.ville}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.telephone}</TableCell>
                <TableCell><ScoreRing score={p.score} /></TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statutStyles[p.statut])}>
                    {p.statut}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">
                  {formatEuro(p.apport)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", metierStyles[p.metier] || metierStyles["Opticien"])}>
                    {p.metier}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={p.commentaire}>
                  {p.commentaire}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>} />
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem>Voir la fiche complète</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => handleDelete(p.id)}>
                          Archiver
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Aucun prospect trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}