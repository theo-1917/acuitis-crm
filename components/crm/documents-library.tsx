"use client"

import { useEffect, useState } from "react"
import { FileText, Upload, Trash2, Pencil, X, Plus, ExternalLink, MailTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

type DocumentModel = {
  id: number
  titre: string
  description: string
  nom_fichier: string
  url_fichier: string
  modele_email: string
}

export function DocumentsLibrary() {
  const [documents, setDocuments] = useState<DocumentModel[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    modele_email: "Bonjour [Prénom],%0D%0A%0D%0AVoici le document demandé :%0D%0A[Lien]%0D%0A%0D%0ABien à vous,"
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchDocuments = async () => {
    setLoading(true)
    const { data } = await supabase.from("modeles_documents").select("*").order("id", { ascending: true })
    if (data) setDocuments(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let nom_fichier = ""
      let url_fichier = ""

      // 1. Upload du fichier s'il y en a un nouveau
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}_${formData.titre.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('bibliotheque_documents')
          .upload(fileName, selectedFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('bibliotheque_documents')
          .getPublicUrl(fileName)

        nom_fichier = selectedFile.name
        url_fichier = publicUrlData.publicUrl
      }

      // 2. Enregistrement en base
      if (editingId) {
        const updatePayload: any = { ...formData }
        if (selectedFile) {
          updatePayload.nom_fichier = nom_fichier
          updatePayload.url_fichier = url_fichier
        }
        await supabase.from("modeles_documents").update(updatePayload).eq("id", editingId)
      } else {
        if (!selectedFile) {
          alert("Veuillez sélectionner un fichier (PDF, Excel, etc).")
          setIsSubmitting(false)
          return
        }
        await supabase.from("modeles_documents").insert([{ ...formData, nom_fichier, url_fichier }])
      }

      setShowModal(false)
      setEditingId(null)
      setSelectedFile(null)
      setFormData({ titre: "", description: "", modele_email: "" })
      fetchDocuments()
    } catch (error: any) {
      alert("Erreur : " + error.message)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce modèle ?")) return
    await supabase.from("modeles_documents").delete().eq("id", id)
    fetchDocuments()
  }

  const handleEdit = (doc: DocumentModel) => {
    setFormData({ titre: doc.titre, description: doc.description || "", modele_email: doc.modele_email || "" })
    setEditingId(doc.id)
    setSelectedFile(null)
    setShowModal(true)
  }

  if (loading) return <div className="p-4 text-muted-foreground">Chargement de la bibliothèque...</div>

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground">Bibliothèque de Documents</h2>
          <p className="text-sm text-muted-foreground">Gérez les documents types (DIP, Plaquettes) à envoyer aux candidats.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ titre: "", description: "", modele_email: "Bonjour [Prénom],%0D%0A%0D%0AVoici le document :%0D%0A[Lien]%0D%0A%0D%0ABien à vous," }); setSelectedFile(null); setShowModal(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{doc.titre}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{doc.nom_fichier}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">{doc.description}</p>
            
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
                <MailTemplate className="h-3.5 w-3.5" /> Modèle d'e-mail :
              </div>
              <p className="text-xs text-muted-foreground/80 whitespace-pre-wrap line-clamp-3">
                {decodeURIComponent(doc.modele_email || "").replace(/%0D%0A/g, '\n')}
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
              <a href={doc.url_fichier} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline flex items-center">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Consulter
              </a>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(doc)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-500/10" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-bold text-foreground">{editingId ? "Modifier le document" : "Ajouter un document"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Titre du document *</label>
                <Input required value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} className="text-sm" placeholder="Ex: DIP 2026" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="text-sm" placeholder="Ex: À envoyer après le premier RDV" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Fichier physique (PDF, Excel...) {editingId && "- Optionnel"}</label>
                <div className="border border-input border-dashed rounded-lg p-4 bg-muted/20 hover:bg-muted/50 transition relative">
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-foreground">
                      {selectedFile ? selectedFile.name : (editingId ? "Remplacer le fichier actuel" : "Cliquez pour uploader un document")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Texte de l'e-mail (Utilisez les balises [Prénom] et [Lien])</label>
                <textarea 
                  rows={6}
                  required
                  value={decodeURIComponent(formData.modele_email).replace(/%0D%0A/g, '\n')}
                  onChange={e => {
                    // Reconvertir les sauts de ligne pour l'URL mailto
                    const formatted = encodeURIComponent(e.target.value).replace(/%0A/g, '%0D%0A')
                    setFormData({...formData, modele_email: formatted})
                  }} 
                  className="w-full text-sm bg-background border border-input rounded-md p-2 outline-none text-foreground resize-none" 
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}