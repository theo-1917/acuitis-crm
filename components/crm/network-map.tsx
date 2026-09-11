"use client"

import { useEffect, useState } from "react"
import { Building2, Check, FileText, MapPin, Plus, Star, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { formatEuro } from "@/lib/crm-data"

type LocalDisponible = {
  id: number
  ville: string
  adresse: string
  surface: number
  loyer: number
  charges: number
  prix_cession: number
  agent_telephone: string
  agent_email: string
  note: number
  visite_effectuee: boolean
  fiche_pdf_url: string
  commentaire: string
  statut: string
  created_at: string
}

export function NetworkMap() {
  const [locaux, setLocaux] = useState<LocalDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<LocalDisponible>>({
    note: 3,
    visite_effectuee: false,
    statut: "Disponible"
  })
  const [file, setFile] = useState<File | null>(null)

  const fetchLocaux = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("locaux_disponibles")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) setLocaux(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLocaux()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    let fileUrl = null

    if (file) {
      const fileExt = file.name.split(".").pop()
      const fileName = `local_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from("fiches_locaux")
        .upload(fileName, file)

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("fiches_locaux")
          .getPublicUrl(fileName)
        fileUrl = publicUrlData.publicUrl
      } else {
        alert("Erreur upload PDF : " + uploadError.message)
        setIsSubmitting(false)
        return
      }
    }

    const { error } = await supabase.from("locaux_disponibles").insert([
      {
        ...formData,
        fiche_pdf_url: fileUrl,
      }
    ])

    setIsSubmitting(false)

    if (!error) {
      setShowModal(false)
      setFormData({ note: 3, visite_effectuee: false, statut: "Disponible" })
      setFile(null)
      fetchLocaux()
    } else {
      alert("Erreur création : " + error.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce local de la base ?")) return
    const { error } = await supabase.from("locaux_disponibles").delete().eq("id", id)
    if (!error) fetchLocaux()
  }

  const toggleVisite = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from("locaux_disponibles")
      .update({ visite_effectuee: !currentStatus })
      .eq("id", id)
    if (!error) fetchLocaux()
  }

  const renderStars = (note: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => interactive && setFormData({ ...formData, note: star })}
            className={`h-4 w-4 ${interactive ? "cursor-pointer transition-transform hover:scale-110" : ""} ${
              star <= note ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) return <div className="p-4 text-muted-foreground">Chargement des locaux...</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Recherche de candidat (Locaux disponibles)
          </h2>
          <p className="text-sm text-muted-foreground">
            Base de données des emplacements qualifiés en attente d'un franchisé.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un local
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-semibold text-foreground">Référencer un nouveau local</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ville *</label>
                  <Input required placeholder="Ex: Bordeaux" onChange={e => setFormData({...formData, ville: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Adresse complète</label>
                  <Input placeholder="Ex: 45 rue Sainte-Catherine" onChange={e => setFormData({...formData, adresse: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Surface (m²)</label>
                  <Input type="number" placeholder="120" onChange={e => setFormData({...formData, surface: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Loyer annuel (€)</label>
                  <Input type="number" placeholder="45000" onChange={e => setFormData({...formData, loyer: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cession / DAB (€)</label>
                  <Input type="number" placeholder="150000" onChange={e => setFormData({...formData, prix_cession: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Téléphone Agent/Propriétaire</label>
                  <Input placeholder="06 12 34 56 78" onChange={e => setFormData({...formData, agent_telephone: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email Agent/Propriétaire</label>
                  <Input type="email" placeholder="agent@immo.fr" onChange={e => setFormData({...formData, agent_email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 items-center">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Note de l'emplacement</label>
                  {renderStars(formData.note || 3, true)}
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="visite" 
                    className="h-4 w-4 rounded border-border bg-background"
                    checked={formData.visite_effectuee}
                    onChange={(e) => setFormData({...formData, visite_effectuee: e.target.checked})}
                  />
                  <label htmlFor="visite" className="text-sm text-foreground cursor-pointer">Local déjà visité physiquement</label>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <label className="text-xs text-muted-foreground mb-1 block">Fiche du local (PDF / Présentation)</label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-xs" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Commentaires / Atouts</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="Flux piéton important, travaux à prévoir..."
                  onChange={e => setFormData({...formData, commentaire: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Ajout..." : "Ajouter le local"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau des locaux */}
      <div className="grid grid-cols-1 gap-4">
        {locaux.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Aucun emplacement disponible n'a été ajouté pour le moment.
          </div>
        ) : (
          locaux.map((local) => (
            <div key={local.id} className="rounded-xl border border-border bg-card p-4 transition hover:bg-muted/10 flex flex-col md:flex-row gap-6 md:items-center">
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-lg">{local.ville}</h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{local.statut}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {local.adresse || "Adresse non précisée"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block mb-1">Potentiel</span>
                    {renderStars(local.note)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/50 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Conditions</span>
                    <div className="font-medium text-foreground">{local.surface ? `${local.surface} m²` : "-"}</div>
                    <div className="text-xs">{local.loyer ? `${formatEuro(local.loyer)} /an` : "-"}</div>
                    {local.prix_cession > 0 && <div className="text-[10px] text-amber-500">Cession: {formatEuro(local.prix_cession)}</div>}
                  </div>
                  
                  <div>
                    <span className="text-xs text-muted-foreground block">Contact Agent</span>
                    <div className="text-foreground">{local.agent_telephone || "-"}</div>
                    <div className="text-xs text-muted-foreground truncate" title={local.agent_email}>{local.agent_email || "-"}</div>
                  </div>

                  <div>
                     <span className="text-xs text-muted-foreground block">Suivi</span>
                     <div className="mt-1 flex items-center gap-2">
                        <button 
                          onClick={() => toggleVisite(local.id, local.visite_effectuee)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition ${local.visite_effectuee ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-muted text-muted-foreground border-border hover:bg-muted-foreground/10"}`}
                        >
                          {local.visite_effectuee ? <Check className="h-3 w-3" /> : null}
                          {local.visite_effectuee ? "Visité" : "À visiter"}
                        </button>
                     </div>
                  </div>
                </div>

                {local.commentaire && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded mt-2">
                    {local.commentaire}
                  </div>
                )}
              </div>

              <div className="flex md:flex-col gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4 min-w-[120px] justify-center">
                {local.fiche_pdf_url && (
                  <a href={local.fiche_pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full text-xs h-8" size="sm">
                      <FileText className="mr-1 h-3 w-3" /> PDF
                    </Button>
                  </a>
                )}
                <Button variant="ghost" className="text-xs h-8 text-red-400 hover:text-red-500 hover:bg-red-500/10 flex-1 md:flex-none" onClick={() => handleDelete(local.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Retirer
                </Button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}