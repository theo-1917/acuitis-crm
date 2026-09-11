"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Building2, Check, FileText, Image as ImageIcon, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { formatEuro } from "@/lib/crm-data"

const MapView = dynamic(() => import("./map-view"), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-muted/10 rounded-xl flex items-center justify-center animate-pulse border border-border">Chargement de la carte...</div>
})

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
  photo_url: string
  commentaire: string
  statut: string
  lat: number
  lng: number
  created_at: string
}

export function NetworkMap() {
  const [locaux, setLocaux] = useState<LocalDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [formData, setFormData] = useState<Partial<LocalDisponible>>({
    note: 3, visite_effectuee: false, statut: "Disponible"
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const fetchLocaux = async () => {
    setLoading(true)
    const { data } = await supabase.from("locaux_disponibles").select("*").order("created_at", { ascending: false })
    if (data) setLocaux(data)
    setLoading(false)
  }

  useEffect(() => { fetchLocaux() }, [])

  const geocodeAddress = async (adresse: string, ville: string) => {
    try {
      const query = encodeURIComponent(`${adresse ? adresse + ", " : ""}${ville}, France`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      const data = await res.json()
      if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch (e) { console.error("Erreur de géocodage", e) }
    return { lat: null, lng: null }
  }

  const handleEdit = (local: LocalDisponible) => {
    setFormData(local)
    setEditingId(local.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    let pdfUrl = formData.fiche_pdf_url
    let photoUrl = formData.photo_url

    // 1. Upload PDF
    if (pdfFile) {
      const fileExt = pdfFile.name.split(".").pop()
      const fileName = `pdf_${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from("fiches_locaux").upload(fileName, pdfFile)
      
      if (error) {
        alert("Erreur lors de l'envoi du PDF : " + error.message)
        setIsSubmitting(false)
        return
      }
      pdfUrl = supabase.storage.from("fiches_locaux").getPublicUrl(fileName).data.publicUrl
    }

    // 2. Upload Photo
    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop()
      const fileName = `photo_${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from("photos_locaux").upload(fileName, photoFile)
      
      if (error) {
        alert("Erreur lors de l'envoi de la photo : " + error.message)
        setIsSubmitting(false)
        return
      }
      photoUrl = supabase.storage.from("photos_locaux").getPublicUrl(fileName).data.publicUrl
    }

    // 3. Géocodage (Recherche GPS)
    let lat = formData.lat
    let lng = formData.lng
    if (formData.adresse || formData.ville) {
      const coords = await geocodeAddress(formData.adresse || "", formData.ville || "")
      if (coords.lat) { lat = coords.lat; lng = coords.lng }
    }

    // 4. Sauvegarde
    const payload = { ...formData, fiche_pdf_url: pdfUrl, photo_url: photoUrl, lat, lng }

    if (editingId) {
      await supabase.from("locaux_disponibles").update(payload).eq("id", editingId)
    } else {
      await supabase.from("locaux_disponibles").insert([payload])
    }

    setIsSubmitting(false)
    setShowModal(false)
    setEditingId(null)
    setFormData({ note: 3, visite_effectuee: false, statut: "Disponible" })
    setPdfFile(null)
    setPhotoFile(null)
    fetchLocaux()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce local ?")) return
    await supabase.from("locaux_disponibles").delete().eq("id", id)
    fetchLocaux()
  }

  const toggleVisite = async (id: number, currentStatus: boolean) => {
    await supabase.from("locaux_disponibles").update({ visite_effectuee: !currentStatus }).eq("id", id)
    fetchLocaux()
  }

  const renderStars = (note: number, interactive = false) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onClick={() => interactive && setFormData({ ...formData, note: star })}
          className={`h-4 w-4 ${interactive ? "cursor-pointer hover:scale-110" : ""} ${star <= note ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  )

  if (loading) return <div className="p-4 text-muted-foreground">Chargement des locaux...</div>

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Recherche de candidat & Carte Réseau
          </h2>
          <p className="text-sm text-muted-foreground">Locaux qualifiés en attente de franchisés.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ note: 3, visite_effectuee: false, statut: "Disponible" }); setShowModal(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un local
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">
        
        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          {locaux.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              Aucun emplacement disponible.
            </div>
          ) : (
            locaux.map((local) => (
              <div key={local.id} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 flex flex-col gap-3">
                <div className="flex gap-4">
                  {/* Miniature Photo */}
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    {local.photo_url ? (
                      <img src={local.photo_url} alt="Local" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-foreground text-base truncate pr-2">{local.ville}</h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0">{local.statut}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> {local.adresse || "Adresse non précisée"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                       <span className="font-semibold text-emerald-400 text-sm">{local.loyer ? `${formatEuro(local.loyer)}/an` : "-"}</span>
                       <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{local.surface} m²</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Potentiel</span>
                    {renderStars(local.note)}
                  </div>
                  <div className="text-right">
                    <button 
                      onClick={() => toggleVisite(local.id, local.visite_effectuee)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border transition ${local.visite_effectuee ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground border-border hover:bg-muted-foreground/20"}`}
                    >
                      {local.visite_effectuee && <Check className="h-3 w-3" />}
                      {local.visite_effectuee ? "Visité" : "À visiter"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => handleEdit(local)}>
                    <Pencil className="h-3 w-3 mr-1" /> Modifier
                  </Button>
                  {local.fiche_pdf_url && (
                    <a href={local.fiche_pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full text-xs h-8 bg-primary/20 hover:bg-primary/30 text-primary">
                        <FileText className="h-3 w-3 mr-1" /> Fiche
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(local.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLONNE DROITE : CARTE */}
        <div className="lg:col-span-7 h-full min-h-[400px] rounded-xl overflow-hidden border border-border shadow-lg">
           <MapView locaux={locaux} onSelect={() => {}} />
        </div>
      </div>

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-semibold text-foreground">
                {editingId ? "Modifier le local" : "Référencer un nouveau local"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ville *</label>
                  <Input required value={formData.ville || ""} onChange={e => setFormData({...formData, ville: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Adresse complète</label>
                  <Input value={formData.adresse || ""} placeholder="Pour le placement sur la carte" onChange={e => setFormData({...formData, adresse: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Surface (m²)</label>
                  <Input type="number" value={formData.surface || ""} onChange={e => setFormData({...formData, surface: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Loyer annuel (€)</label>
                  <Input type="number" value={formData.loyer || ""} onChange={e => setFormData({...formData, loyer: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cession / DAB (€)</label>
                  <Input type="number" value={formData.prix_cession || ""} onChange={e => setFormData({...formData, prix_cession: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Photo du local (JPG/PNG)</label>
                  <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="text-xs" />
                  {formData.photo_url && !photoFile && <span className="text-[10px] text-emerald-500 block mt-1">✓ Photo actuelle sauvegardée</span>}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fiche détaillée (PDF)</label>
                  <Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="text-xs" />
                  {formData.fiche_pdf_url && !pdfFile && <span className="text-[10px] text-emerald-500 block mt-1">✓ Fiche PDF actuelle sauvegardée</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 items-center">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Note de l'emplacement</label>
                  {renderStars(formData.note || 3, true)}
                </div>
                <div className="flex items-center gap-2 mt-2">
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

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Commentaires / Atouts</label>
                <textarea
                  rows={2}
                  value={formData.commentaire || ""}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  onChange={e => setFormData({...formData, commentaire: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : (editingId ? "Sauvegarder" : "Ajouter le local")}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}