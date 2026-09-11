"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, Archive, ArchiveRestore, Mail, Phone, MapPin, Pencil, Trash2, Plus, X } from "lucide-react"
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
}

const COLUMNS = ["Nouveau", "Contacté", "RDV", "Négociation", "Signé", "Perdu"]

export function ProspectsPipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Prospect>>({
    statut: "Nouveau",
    actif: true
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
    const { error } = await supabase.from("prospects").update({ statut: newStatus }).eq("id", id)
    if (!error) {
      setProspects(prospects.map(p => p.id === id ? { ...p, statut: newStatus } : p))
    }
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
      const { id, ...updateData } = formData as any
      await supabase.from("prospects").update(updateData).eq("id", editingId)
    } else {
      await supabase.from("prospects").insert([formData])
    }
    setShowModal(false)
    setEditingId(null)
    setFormData({ statut: "Nouveau", actif: true })
    fetchProspects()
  }

  if (loading) return <div className="p-4 text-muted-foreground">Chargement du pipeline...</div>

  // Filtrage selon le bouton "Afficher les inactifs"
  const displayedProspects = showInactive ? prospects : prospects.filter(p => p.actif !== false)

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      
      {/* En-tête */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pipeline Prospects</h2>
          <p className="text-sm text-muted-foreground">Suivi des candidatures à la franchise.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showInactive ? "Masquer les inactifs" : "Afficher les inactifs"}
          </Button>
          <Button onClick={() => { setEditingId(null); setFormData({ statut: "Nouveau", actif: true }); setShowModal(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un candidat
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
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

                    <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-1">
                      {p.ville && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {p.ville}</div>}
                      {p.telephone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {p.telephone}</div>}
                      {p.email && <div className="flex items-center gap-1.5 truncate" title={p.email}><Mail className="h-3 w-3 shrink-0" /> {p.email}</div>}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-xs font-semibold text-emerald-400">
                        {p.apport ? formatEuro(p.apport) : "-"}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <select 
                          className="text-[10px] bg-muted/50 border border-border rounded p-1 outline-none text-muted-foreground"
                          value={p.statut || "Nouveau"}
                          onChange={(e) => handleChangeStatus(p.id, e.target.value)}
                        >
                          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(p)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400" onClick={() => handleDelete(p.id)}>
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

      {/* Modal Ajout/Edit */}
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
              <div>
                 <label className="text-xs text-muted-foreground block mb-1">Statut d'avancement</label>
                 <select 
                    value={formData.statut || "Nouveau"}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground"
                  >
                    {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="actif-checkbox"
                    checked={formData.actif !== false}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    className="rounded border-border"
                  />
                  <label htmlFor="actif-checkbox" className="text-xs text-foreground cursor-pointer">Prospect Actif (Visible dans les stats)</label>
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