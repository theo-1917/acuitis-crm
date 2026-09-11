"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, Archive, ArchiveRestore, Mail, Phone, MapPin, Pencil, Trash2, Plus, X, Map, Download, BarChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { formatEuro } from "@/lib/crm-data"

type Prospect = {
  id: number
  name: string
  ville: string
  telephone: string
  email: string
  apport: number
  statut: string
  actif: boolean
  provenance: string
  created_at: string
}

const COLUMNS = ["Nouveau", "Contacté", "RDV", "Non qualifié", "Perdu"]

const PROVENANCES = [
  "Prospection téléphonique", "Site internet", "Contact SILMO", 
  "Coptation", "Bouche à oreille", "L'express franchise", 
  "Recruteur", "Prospection linkedin", "Mailing", "Autre"
]

export function ProspectsPipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Prospect>>({
    statut: "Nouveau",
    actif: true,
    provenance: "Site internet"
  })

  const fetchProspects = async () => {
    setLoading(true)
    const { data } = await supabase.from("prospects").select("*").order("id", { ascending: false })
    if (data) setProspects(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  const handleToggleActif = async (p: Prospect) => {
    const { error } = await supabase.from("prospects").update({ actif: !p.actif }).eq("id", p.id)
    if (!error) {
      setProspects(prospects.map(prov => prov.id === p.id ? { ...prov, actif: !p.actif } : prov))
    }
  }

  const handleChangeStatus = async (id: number, newStatus: string) => {
    const isInactive = newStatus === "Non qualifié" || newStatus === "Perdu"
    const payload = { statut: newStatus, actif: !isInactive }

    const { error } = await supabase.from("prospects").update(payload).eq("id", id)
    if (!error) {
      setProspects(prospects.map(p => p.id === id ? { ...p, ...payload } : p))
    }
  }

  // Correction de la création d'emplacement (type_zone à null)
  const handlePasserEnRecherche = async (p: Prospect) => {
    const villes = prompt(`Dans quelle(s) ville(s) ${p.name} recherche-t-il un local ?`, p.ville || "")
    if (villes === null) return 

    const { error } = await supabase.from("emplacements").insert([{
      prospect_id: p.id,
      villes_recherchees: villes,
      statut_recherche: "en_recherche",
      type_zone: null,
      surface_souhaitee_m2: 0
    }])

    if (!error) alert(`La recherche d'emplacement pour ${p.name} a été créée avec succès !`)
    else alert("Erreur lors de la création de la recherche : " + error.message)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement ce prospect ?")) return
    const { error } = await supabase.from("prospects").delete().eq("id", id)
    if (!error) fetchProspects()
  }

  const handleEdit = (p: Prospect) => {
    setFormData(p)
    setEditingId(p.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const { id, created_at, ...updateData } = formData as any
      await supabase.from("prospects").update(updateData).eq("id", editingId)
    } else {
      await supabase.from("prospects").insert([formData])
    }
    setShowModal(false)
    setEditingId(null)
    setFormData({ statut: "Nouveau", actif: true, provenance: "Site internet" })
    fetchProspects()
  }

  const handleExportData = () => {
    const headers = ["ID", "Nom", "Ville", "Téléphone", "Email", "Apport", "Statut", "Provenance", "Actif", "Date de création"]
    const rows = prospects.map(p => [
      p.id,
      `"${p.name || ""}"`,
      `"${p.ville || ""}"`,
      `"${p.telephone || ""}"`,
      `"${p.email || ""}"`,
      p.apport || 0,
      `"${p.statut || ""}"`,
      `"${p.provenance || ""}"`,
      p.actif ? "Oui" : "Non",
      new Date(p.created_at).toLocaleDateString("fr-FR")
    ])

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.href = encodedUri
    link.download = `candidats_data_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportKPI = () => {
    const total = prospects.length
    const actifs = prospects.filter(p => p.actif).length
    const inactifs = total - actifs

    const prospectsByMonthYear: Record<string, Prospect[]> = {}
    prospects.forEach(p => {
      const d = new Date(p.created_at)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!prospectsByMonthYear[key]) prospectsByMonthYear[key] = []
      prospectsByMonthYear[key].push(p)
    })

    const sortedMonthKeys = Object.keys(prospectsByMonthYear).sort()

    const statusByMonthHeader = `Période (Mois/Année);${COLUMNS.join(";")};Total`
    const statusByMonthLines = sortedMonthKeys.map(key => {
      const list = prospectsByMonthYear[key]
      const [year, month] = key.split('-')
      const monthLabel = new Date(Number(year), Number(month) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      const counts = COLUMNS.map(col => list.filter(p => (p.statut || "Nouveau") === col).length)
      return `"${monthLabel}";${counts.join(';')};${list.length}`
    })

    const provenanceByMonthHeader = `Période (Mois/Année);${PROVENANCES.join(";")};Total`
    const provenanceByMonthLines = sortedMonthKeys.map(key => {
      const list = prospectsByMonthYear[key]
      const [year, month] = key.split('-')
      const monthLabel = new Date(Number(year), Number(month) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      const counts = PROVENANCES.map(prov => list.filter(p => (p.provenance || "Autre") === prov).length)
      return `"${monthLabel}";${counts.join(';')};${list.length}`
    })

    const csvLines = [
      "RAPPORT ANALYTIQUE ET KPI - DÉVELOPPEMENT RÉSEAU ACUITIS",
      `Date de l'export;${new Date().toLocaleDateString("fr-FR")}`,
      "",
      "--- 1. INDICATEURS CLÉS GLOBAUX ---",
      `Total des candidatures enregistrées;${total}`,
      `Candidats actifs en cours de suivi;${actifs}`,
      `Candidats inactifs (Non qualifiés / Perdus / Archivés);${inactifs}`,
      "",
      "--- 2. RÉPARTITION DES STATUTS PAR MOIS ET ANNÉE ---",
      statusByMonthHeader,
      ...statusByMonthLines,
      "",
      "--- 3. PERFORMANCE DES SOURCES (PROVENANCE) PAR MOIS ET ANNÉE ---",
      provenanceByMonthHeader,
      ...provenanceByMonthLines,
    ]

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvLines.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.href = encodedUri
    link.download = `rapport_kpi_mensuel_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="p-4 text-muted-foreground">Chargement du pipeline...</div>

  const displayedProspects = showInactive ? prospects : prospects.filter(p => p.actif !== false)

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pipeline Prospects</h2>
          <p className="text-sm text-muted-foreground">Suivi des candidatures à la franchise.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          <Button variant="outline" size="sm" onClick={handleExportData} className="border-border bg-muted/20 text-xs">
            <Download className="mr-2 h-3.5 w-3.5" /> Données (Excel)
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportKPI} className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs">
            <BarChart className="mr-2 h-3.5 w-3.5" /> Rapport KPI Mensuel
          </Button>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

          <Button variant="outline" size="sm" onClick={() => setShowInactive(!showInactive)} className="text-xs">
            {showInactive ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
            {showInactive ? "Masquer Inactifs" : "Voir Inactifs"}
          </Button>
          
          <Button size="sm" onClick={() => { setEditingId(null); setFormData({ statut: "Nouveau", actif: true, provenance: "Site internet" }); setShowModal(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {COLUMNS.map(column => {
          const columnProspects = displayedProspects.filter(p => (p.statut || "Nouveau") === column)
          
          return (
            <div key={column} className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-xl bg-muted/20 p-3 border border-border">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-foreground text-sm">{column}</h3>
                <Badge variant="secondary">{columnProspects.length}</Badge>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                {columnProspects.map(p => (
                  <div key={p.id} className={`bg-card rounded-lg p-3 border shadow-sm flex flex-col gap-2 transition ${p.actif === false ? 'border-dashed border-muted-foreground/30 opacity-70' : 'border-border'}`}>
                    
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm text-foreground leading-tight">{p.name}</div>
                      <div className="flex items-center gap-1">
                        <button 
                          title={p.actif === false ? "Réactiver le prospect" : "Archiver le prospect"} 
                          onClick={() => handleToggleActif(p)} 
                          className={`p-1 rounded transition ${p.actif === false ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/20'}`}
                        >
                          {p.actif === false ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1">
                      {p.provenance || "Autre"}
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-0.5">
                      {p.ville && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {p.ville}</div>}
                      {p.telephone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {p.telephone}</div>}
                      {p.email && <div className="flex items-center gap-1.5 truncate" title={p.email}><Mail className="h-3 w-3 shrink-0" /> {p.email}</div>}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-xs font-semibold text-emerald-400 truncate pr-2">
                        {p.apport ? formatEuro(p.apport) : "-"}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" 
                          title="Lancer une recherche d'emplacement"
                          onClick={() => handlePasserEnRecherche(p)}
                        >
                          <Map className="h-3.5 w-3.5" />
                        </Button>
                        
                        <select 
                          className="text-[10px] bg-muted/50 border border-border rounded p-1 outline-none text-muted-foreground w-16"
                          value={p.statut || "Nouveau"}
                          onChange={(e) => handleChangeStatus(p.id, e.target.value)}
                        >
                          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(p)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {p.actif === false && (
                      <div className="mt-1 bg-muted/50 text-[10px] text-center p-1 rounded text-muted-foreground">
                        Prospect archivé (Inactif)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-semibold text-foreground">{editingId ? "Modifier le candidat" : "Nouveau candidat"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nom complet *</label>
                <Input required value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="text-xs" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Téléphone</label>
                  <Input value={formData.telephone || ""} onChange={e => setFormData({...formData, telephone: e.target.value})} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email</label>
                  <Input type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="text-xs" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Ville souhaitée</label>
                  <Input value={formData.ville || ""} onChange={e => setFormData({...formData, ville: e.target.value})} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Apport (€)</label>
                  <Input type="number" value={formData.apport || ""} onChange={e => setFormData({...formData, apport: Number(e.target.value)})} className="text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-muted-foreground block mb-1">Statut</label>
                   <select 
                      value={formData.statut || "Nouveau"}
                      onChange={(e) => setFormData({...formData, statut: e.target.value})}
                      className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground"
                    >
                      {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                   <label className="text-xs text-muted-foreground block mb-1">Provenance (Source)</label>
                   <select 
                      value={formData.provenance || "Site internet"}
                      onChange={(e) => setFormData({...formData, provenance: e.target.value})}
                      className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground"
                    >
                      {PROVENANCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="actif-checkbox"
                    checked={formData.actif !== false}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    className="rounded border-border accent-primary"
                  />
                  <label htmlFor="actif-checkbox" className="text-xs text-foreground cursor-pointer">Prospect Actif (Visible dans les statistiques)</label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit">Sauvegarder</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}