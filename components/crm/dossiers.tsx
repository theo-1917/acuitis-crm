"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  FileText,
  FolderKanban,
  Landmark,
  Map,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserCircle,
  Users,
  Send,
  CalendarPlus,
  ClipboardList,
  CheckCircle,
  Circle,
  ExternalLink,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

const EQUIPE = ["Kevin Lachant", "Theo Evenor", "Arthur Fougeris"]

type Prospect = {
  id: number
  name: string
  ville: string
  telephone: string
  email: string
  apport: number
  developpeur_assigne?: string
  est_franchise?: boolean
}

type Dossier = {
  id: number
  prospect_id: number
  agent_broker: string
  date_prise_bail: string
  date_ouverture_prevue: string
  honoraires_droit_entree: number
  nom_banque: string
  statut_financement: string
  zone_exclusivite: string
  zone_premier_refus: string
  commentaire: string
  statut_dossier: string
  adresse_local: string
  surface_local: number
  loyer: number
  charges: number
  dip_signe_url: string
  roi_url: string
  kbis_url: string
  rib_url: string
  etude_zone_url: string
  devis_travaux_url: string
  bail_signe_url: string
  autres_documents_url: string
  prospects?: Prospect
}

type Mission = { id: number; title: string; description: string; echeance: string; terminee: boolean; prospect_id: number; assignes: string[] }
type DocumentModel = { id: number; titre: string; url_fichier: string; modele_email: string }

export function Dossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [prospectsWithoutDossier, setProspectsWithoutDossier] = useState<Prospect[]>([])
  const [selectedDossierId, setSelectedDossierId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [currentDossier, setCurrentDossier] = useState<Partial<Dossier>>({})

  // Nouveaux états pour Missions, Docs et Historique
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [showMissionModal, setShowMissionModal] = useState(false)
  const [missionData, setMissionData] = useState({ titre: "", echeance: "", heure: "10:00", duree: "30", lieu: "", inviterCandidat: false, description: "", type: "Appel téléphonique", assignes: [] as string[] })

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [prospectMissions, setProspectMissions] = useState<Mission[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [showDocModal, setShowDocModal] = useState(false)
  const [availableDocs, setAvailableDocs] = useState<DocumentModel[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string>("")

  const loadData = async () => {
    setLoading(true)
    const { data: dossiersData } = await supabase
      .from("dossiers")
      .select("*, prospects(*)")

    const { data: prospectsData } = await supabase.from("prospects").select("*")

    if (dossiersData && dossiersData.length > 0) {
      setDossiers(dossiersData)
      if (!selectedDossierId) {
        setSelectedDossierId(dossiersData[0].id)
        setCurrentDossier(dossiersData[0])
      } else {
        const found = dossiersData.find((d) => d.id === selectedDossierId)
        if (found) setCurrentDossier(found)
      }
    } else {
      setDossiers([])
      setSelectedDossierId(null)
      setCurrentDossier({})
    }

    if (prospectsData && dossiersData) {
      const existingIds = dossiersData.map((d) => d.prospect_id)
      setProspectsWithoutDossier(prospectsData.filter((p) => !existingIds.includes(p.id)))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectDossier = (dossier: Dossier) => {
    setSelectedDossierId(dossier.id)
    setCurrentDossier(dossier)
  }

  const handleCreateDossier = async (prospectId: number) => {
    const { data, error } = await supabase
      .from("dossiers")
      .insert([{ prospect_id: prospectId, statut_financement: "En cours", statut_dossier: "En cours" }])
      .select("*, prospects(*)")

    if (!error && data && data[0]) {
      await loadData()
      setSelectedDossierId(data[0].id)
      setCurrentDossier(data[0])
    } else if (error) {
      alert("Erreur lors de la création du dossier : " + error.message)
    }
  }

  const handleSave = async () => {
    if (!selectedDossierId) return
    setSaving(true)

    const { error } = await supabase
      .from("dossiers")
      .update({
        agent_broker: currentDossier.agent_broker || "",
        date_prise_bail: currentDossier.date_prise_bail || null,
        date_ouverture_prevue: currentDossier.date_ouverture_prevue || null,
        honoraires_droit_entree: currentDossier.honoraires_droit_entree || 0,
        nom_banque: currentDossier.nom_banque || "",
        statut_financement: currentDossier.statut_financement || "En cours",
        zone_exclusivite: currentDossier.zone_exclusivite || "",
        zone_premier_refus: currentDossier.zone_premier_refus || "",
        commentaire: currentDossier.commentaire || "",
        adresse_local: currentDossier.adresse_local || "",
        surface_local: currentDossier.surface_local || 0,
        loyer: currentDossier.loyer || 0,
        charges: currentDossier.charges || 0,
      })
      .eq("id", selectedDossierId)

    setSaving(false)
    if (!error) {
      await loadData()
      alert("Modifications enregistrées !")
    } else {
      alert("Erreur de sauvegarde : " + error.message)
    }
  }

  const handleAssignDev = async (prospectId: number, devName: string) => {
    const { error } = await supabase.from("prospects").update({ developpeur_assigne: devName }).eq("id", prospectId)
    if (!error) {
      setDossiers(prev => prev.map(d => d.prospect_id === prospectId ? { ...d, prospects: { ...d.prospects!, developpeur_assigne: devName } } : d))
      if (currentDossier.prospect_id === prospectId) {
        setCurrentDossier(prev => ({ ...prev, prospects: { ...prev.prospects!, developpeur_assigne: devName } }))
      }
    }
  }

  const handleToggleValidate = async () => {
    if (!selectedDossierId) return
    const newStatus = currentDossier.statut_dossier === "Validé" ? "En cours" : "Validé"

    const { error } = await supabase.from("dossiers").update({ statut_dossier: newStatus }).eq("id", selectedDossierId)

    if (!error) {
      setCurrentDossier((prev) => ({ ...prev, statut_dossier: newStatus }))
      await loadData()
    } else {
      alert("Erreur de validation : " + error.message)
    }
  }

  const handleDeleteDossier = async () => {
    if (!selectedDossierId) return
    if (!confirm("Voulez-vous vraiment supprimer ce dossier ?")) return

    const { error } = await supabase.from("dossiers").delete().eq("id", selectedDossierId)

    if (!error) {
      setSelectedDossierId(null)
      setCurrentDossier({})
      await loadData()
    } else {
      alert("Erreur de suppression : " + error.message)
    }
  }

  const handleFileUpload = async (fileKey: keyof Dossier, file: File) => {
    if (!selectedDossierId) return
    const fileExt = file.name.split(".").pop()
    const filePath = `dossier_${selectedDossierId}/${String(fileKey)}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, { upsert: true })
    if (uploadError) return alert("Erreur d'envoi du fichier : " + uploadError.message)

    const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(filePath)
    const { error: updateError } = await supabase.from("dossiers").update({ [fileKey]: publicUrlData.publicUrl }).eq("id", selectedDossierId)

    if (!updateError) {
      setCurrentDossier((prev) => ({ ...prev, [fileKey]: publicUrlData.publicUrl }))
      await loadData()
    }
  }

  // === FONCTIONS MODALES (Missions, Docs, Histo) ===
  const handleOpenMission = (p: Prospect) => {
    setSelectedProspect(p)
    const defaultAssignes = p.developpeur_assigne ? [p.developpeur_assigne] : []
    setMissionData({ titre: `RDV Dossier`, type: "Appel téléphonique", echeance: new Date().toISOString().split('T')[0], heure: "10:00", duree: "30", lieu: p.ville || "", inviterCandidat: false, description: `Téléphone : ${p.telephone || '-'}\nEmail : ${p.email || '-'}`, assignes: defaultAssignes })
    setShowMissionModal(true)
  }

  const toggleAssignee = (name: string) => {
    setMissionData(prev => ({
      ...prev, assignes: prev.assignes.includes(name) ? prev.assignes.filter(n => n !== name) : [...prev.assignes, name]
    }))
  }

  const getGoogleCalendarUrl = () => {
    if (!selectedProspect || !missionData.echeance) return "#"
    const [year, month, day] = missionData.echeance.split('-')
    const [hours, minutes] = (missionData.heure || "10:00").split(':')
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
    const end = new Date(start.getTime() + Number(missionData.duree || 30) * 60000)
    const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "")
    const fullTitle = `[${missionData.type}] ${missionData.titre} - ${selectedProspect.name}`
    
    let details = `Candidat : ${selectedProspect.name}\nTéléphone : ${selectedProspect.telephone || '-'}\nEmail : ${selectedProspect.email || '-'}\n\n`
    if (missionData.assignes.length > 0) details += `Assigné à : ${missionData.assignes.join(', ')}\n\n`
    details += `Notes :\n${missionData.description}`

    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(fullTitle)}&dates=${formatGCalDate(start)}/${formatGCalDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(missionData.lieu || "")}`
    if (missionData.inviterCandidat && selectedProspect.email) url += `&add=${encodeURIComponent(selectedProspect.email)}`
    return url
  }

  // CORRECTION : L'ouverture doit être instantanée pour mobile
  const handleSubmitMission = async (e: React.FormEvent, openGoogleCal: boolean = false) => {
    e.preventDefault(); 
    if (!selectedProspect) return

    // 1. Ouverture immédiate du calendrier Google pour contrer les pop-up blockers mobiles
    if (openGoogleCal) {
      window.open(getGoogleCalendarUrl(), '_blank')
    }

    // 2. Sauvegarde dans la base de données en arrière-plan
    const { error } = await supabase.from('missions').insert([{ 
      title: `[${missionData.type}] ${missionData.titre} (${selectedProspect.name})`, 
      description: `${missionData.description}\nHeure : ${missionData.heure} (${missionData.duree} min) | Lieu : ${missionData.lieu || '-'}`, 
      echeance: missionData.echeance, 
      prospect_id: selectedProspect.id, 
      terminee: false, 
      assignes: missionData.assignes
    }])
    
    if (!error) {
      setShowMissionModal(false)
    } else {
      alert("La mission n'a pas pu être sauvegardée dans le CRM : " + error.message)
    }
  }

  const handleOpenHistory = async (p: Prospect) => {
    setSelectedProspect(p); setShowHistoryModal(true); setLoadingHistory(true)
    const { data } = await supabase.from('missions').select('*').eq('prospect_id', p.id).order('echeance', { ascending: false })
    if (data) setProspectMissions(data)
    setLoadingHistory(false)
  }

  const handleToggleMission = async (missionId: number, currentStatus: boolean) => {
    await supabase.from('missions').update({ terminee: !currentStatus }).eq('id', missionId)
    setProspectMissions(prev => prev.map(m => m.id === missionId ? { ...m, terminee: !currentStatus } : m))
  }

  const handleOpenDocModal = async (p: Prospect) => {
    setSelectedProspect(p); setShowDocModal(true)
    const { data } = await supabase.from('modeles_documents').select('*').order('titre')
    if (data) { setAvailableDocs(data); if(data.length > 0) setSelectedDocId(data[0].id.toString()) }
  }

  const handleSendDocument = async () => {
    if (!selectedProspect || !selectedDocId) return
    const doc = availableDocs.find(d => d.id.toString() === selectedDocId)
    if (!doc) return

    const prenom = selectedProspect.name.split(' ')[0]
    const corpsEmail = doc.modele_email.replace(/\[Prénom\]/gi, prenom).replace(/\[Lien\]/gi, doc.url_fichier)
    const subject = encodeURIComponent(`Document Acuitis : ${doc.titre}`)
    const mailtoLink = `mailto:${selectedProspect.email || ""}?subject=${subject}&body=${corpsEmail}`
    
    window.open(mailtoLink, '_blank')
    await supabase.from('missions').insert([{ 
      title: `[Document envoyé] ${doc.titre}`, 
      description: `Envoyé depuis le dossier vers ${selectedProspect.email || "non renseignée"}.`,
      echeance: new Date().toISOString().split('T')[0], 
      prospect_id: selectedProspect.id, terminee: true, assignes: [selectedProspect.developpeur_assigne || ""]
    }])
    setShowDocModal(false)
  }

  const mandatoryDocKeys: { key: keyof Dossier; label: string }[] = [
    { key: "dip_signe_url", label: "DIP signé" }, { key: "roi_url", label: "ROI" }, { key: "kbis_url", label: "Kbis" },
    { key: "rib_url", label: "RIB" }, { key: "etude_zone_url", label: "Étude de zone" },
    { key: "devis_travaux_url", label: "Devis travaux" }, { key: "bail_signe_url", label: "Bail signé" },
  ]
  const optionalDocKey = { key: "autres_documents_url" as keyof Dossier, label: "Autres documents (Optionnel)" }
  const allDocKeys = [...mandatoryDocKeys, optionalDocKey]
  const docsUploadedCount = mandatoryDocKeys.filter(({ key }) => !!currentDossier[key]).length
  const isFullyValidated = currentDossier.statut_dossier === "Validé"

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement des dossiers…</div>

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Colonne Gauche : Liste des Projets */}
      <div className="lg:col-span-3 flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <FolderKanban className="h-4 w-4" /> Projets en cours
          </h3>
          <Badge variant="secondary">{dossiers.length}</Badge>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px]">
          {dossiers.map((d) => {
            const isSelected = d.id === selectedDossierId
            const isValidated = d.statut_dossier === "Validé"
            return (
              <button
                key={d.id}
                onClick={() => handleSelectDossier(d)}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground shrink-0">
                    {d.prospects?.name?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span>{d.prospects?.name || "Candidat"}</span>
                      {isValidated && <Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.prospects?.ville || "Sans ville"}
                    </div>
                    {/* Badge Assigné List */}
                    {d.prospects?.developpeur_assigne && (
                      <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-none text-[9px] px-1.5 py-0 flex items-center gap-1 w-fit">
                        <UserCircle className="h-2.5 w-2.5" /> {d.prospects.developpeur_assigne.split(' ')[0]}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            )
          })}

          {dossiers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Aucun dossier projet créé.
            </p>
          )}
        </div>

        {prospectsWithoutDossier.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Activer un dossier pour :
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) handleCreateDossier(Number(e.target.value))
              }}
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>-- Sélectionner un candidat --</option>
              {prospectsWithoutDossier.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.ville || "Sans ville"})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Zone Principale */}
      {selectedDossierId && currentDossier ? (
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* Entête & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">
                Dossier de {currentDossier.prospects?.name}
              </h2>
              {isFullyValidated ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Validé & Finalisé
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">En cours</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              
              <div className="flex items-center gap-1 mr-2 border-r border-border pr-3">
                <select 
                  className="text-xs font-semibold bg-muted/30 border border-border rounded-md px-2 py-1.5 outline-none text-muted-foreground hover:text-primary cursor-pointer" 
                  value={currentDossier.prospects?.developpeur_assigne || ""} 
                  onChange={(e) => handleAssignDev(currentDossier.prospect_id!, e.target.value)}
                  title="Assigner un développeur"
                >
                  <option value="">👤 Assigner à...</option>
                  {EQUIPE.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10" title="Envoyer un document (DIP...)" onClick={() => currentDossier.prospects && handleOpenDocModal(currentDossier.prospects)}>
                  <Send className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10" title="Créer un rappel" onClick={() => currentDossier.prospects && handleOpenMission(currentDossier.prospects)}>
                  <CalendarPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" title="Historique" onClick={() => currentDossier.prospects && handleOpenHistory(currentDossier.prospects)}>
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="destructive" size="sm" onClick={handleDeleteDossier} className="text-xs h-8">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
              </Button>
              <Button variant={isFullyValidated ? "outline" : "default"} size="sm" onClick={handleToggleValidate} className={`h-8 ${isFullyValidated ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/30" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> {isFullyValidated ? "Rouvrir le dossier" : "Valider le dossier"}
              </Button>
              <Button size="sm" className="h-8" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Sauvegarder"}
              </Button>
            </div>
          </div>

          {/* BANDEAU CÉLÉBRATION */}
          {isFullyValidated && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-950/10 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-emerald-300">Dossier complètement validé !</h4>
                  <p className="text-xs text-emerald-400/80">Tous les prérequis sont validés. Prêt pour l'ouverture.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BLOC 1 : Infos & Calendrier */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Infos & Calendrier</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Téléphone</label>
                  <Input disabled value={currentDossier.prospects?.telephone || "-"} className="bg-muted/50 text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                  <Input disabled value={currentDossier.prospects?.email || "-"} className="bg-muted/50 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Agent / Broker</label>
                <Input value={currentDossier.agent_broker || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, agent_broker: e.target.value })} placeholder="ex: Cushman & Wakefield" className="text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date de prise de bail</label>
                  <Input type="date" value={currentDossier.date_prise_bail || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, date_prise_bail: e.target.value })} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date d'ouverture prévue</label>
                  <Input type="date" value={currentDossier.date_ouverture_prevue || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, date_ouverture_prevue: e.target.value })} className="text-xs" />
                </div>
              </div>
            </div>

            {/* BLOC 2 : Finance & Contrat */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Landmark className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Finance & Contrat</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Apport (€)</label>
                  <Input disabled value={currentDossier.prospects?.apport || 0} className="bg-muted/50 text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Honoraires d'entrée (€)</label>
                  <Input type="number" value={currentDossier.honoraires_droit_entree || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, honoraires_droit_entree: Number(e.target.value) })} placeholder="45000" className="text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Loyer (€/an)</label>
                  <Input type="number" value={currentDossier.loyer || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, loyer: Number(e.target.value) })} placeholder="35000" className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Charges (€/an)</label>
                  <Input type="number" value={currentDossier.charges || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, charges: Number(e.target.value) })} placeholder="3000" className="text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nom de la banque</label>
                  <Input value={currentDossier.nom_banque || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, nom_banque: e.target.value })} placeholder="ex: BNP Paribas" className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Statut Financement</label>
                  <select value={currentDossier.statut_financement || "En cours"} onChange={(e) => setCurrentDossier({ ...currentDossier, statut_financement: e.target.value })} className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none">
                    <option value="Oui">Oui (Accordé)</option>
                    <option value="Non">Non (Refusé)</option>
                    <option value="En cours">En cours de montage</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BLOC 3 : Local & Territoire */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Map className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Local & Territoire</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Adresse complète du local</label>
                  <Input value={currentDossier.adresse_local || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, adresse_local: e.target.value })} placeholder="ex: 14 Rue de la République..." className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Surface (m²)</label>
                  <Input type="number" value={currentDossier.surface_local || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, surface_local: Number(e.target.value) })} placeholder="85" className="text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Zone d'exclusivité</label>
                <Input value={currentDossier.zone_exclusivite || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, zone_exclusivite: e.target.value })} placeholder="ex: Lyon 6e — 2,5 km autour" className="text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Zone de 1er refus</label>
                <Input value={currentDossier.zone_premier_refus || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, zone_premier_refus: e.target.value })} placeholder="ex: Lyon 3e et Villeurbanne" className="text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Commentaires & Remarques</label>
                <textarea rows={3} value={currentDossier.commentaire || ""} onChange={(e) => setCurrentDossier({ ...currentDossier, commentaire: e.target.value })} placeholder="Ajouter des précisions..." className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>

            {/* BLOC 4 : Coffre-fort Documentaire */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Coffre-fort Documentaire</h3>
                </div>
                <Badge variant={docsUploadedCount === 7 ? "default" : "secondary"}>{docsUploadedCount}/7</Badge>
              </div>
              <div className="space-y-2">
                {allDocKeys.map(({ key, label }) => {
                  const url = currentDossier[key]
                  const isOptional = key === "autres_documents_url"
                  return (
                    <div key={key} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${isOptional ? "border-dashed border-border/60 bg-muted/20" : "border-border bg-background"}`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${url ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                        <span className={`font-medium ${isOptional ? "text-muted-foreground italic" : "text-foreground"}`}>{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {url ? (
                          <><Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">Validé</Badge><a href={String(url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[11px]">Voir</a></>
                        ) : (
                          <label className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium">
                            <Upload className="h-3 w-3" /><span>Ajouter</span>
                            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(key, file) }} />
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="lg:col-span-9 flex items-center justify-center p-12 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Sélectionne ou crée un dossier dans la colonne de gauche pour afficher les détails.</p>
        </div>
      )}

      {/* === MODALES === */}
      {/* MODAL : ENVOI DE DOCUMENT */}
      {showDocModal && selectedProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl border-t-4 border-t-violet-500">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-md font-bold text-foreground">Envoyer un document</h3>
                <p className="text-xs text-muted-foreground">À : {selectedProspect.email || "Aucune adresse e-mail renseignée"}</p>
              </div>
              <button onClick={() => setShowDocModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {!selectedProspect.email ? (
              <div className="text-sm text-amber-500 p-4 bg-amber-500/10 rounded-lg text-center font-semibold">Ce candidat n'a pas d'adresse e-mail renseignée.</div>
            ) : availableDocs.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center p-4">Aucun document disponible.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Choisir le document à envoyer</label>
                  <select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)} className="w-full text-sm bg-background border border-input rounded-md p-2 outline-none text-foreground">
                    {availableDocs.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button onClick={handleSendDocument} className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold">
                    <Send className="mr-2 h-3.5 w-3.5" /> Ouvrir la messagerie & Tracer l'envoi
                  </Button>
                  <Button variant="outline" onClick={() => setShowDocModal(false)} className="w-full text-xs">Annuler</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL : HISTORIQUE */}
      {showHistoryModal && selectedProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
              <div>
                <h3 className="text-md font-bold text-foreground">Dossier : {selectedProspect.name}</h3>
                <p className="text-xs text-muted-foreground">Historique et actions associées</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto pr-2 flex-1">
              {loadingHistory ? (
                <div className="text-center text-sm text-muted-foreground py-8">Chargement de l'historique...</div>
              ) : prospectMissions.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">Aucune action trouvée.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {prospectMissions.map(mission => (
                    <div key={mission.id} className={`p-3 rounded-lg border ${mission.terminee ? 'bg-muted/30 border-dashed border-border' : 'bg-background border-border shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <button onClick={() => handleToggleMission(mission.id, mission.terminee)} className={`mt-0.5 shrink-0 transition-colors ${mission.terminee ? 'text-emerald-500' : 'text-muted-foreground hover:text-primary'}`}>
                            {mission.terminee ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          </button>
                          <div>
                            <p className={`text-sm font-semibold ${mission.terminee ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{mission.title}</p>
                            {mission.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{mission.description}</p>}
                            {mission.assignes && mission.assignes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {mission.assignes.map(assigne => (
                                  <Badge key={assigne} variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none px-1.5 py-0 rounded-sm">
                                    <Users className="h-2.5 w-2.5 mr-1" /> {assigne}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${mission.terminee ? 'text-muted-foreground border-transparent' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'}`}>
                          {new Date(mission.echeance).toLocaleDateString('fr-FR')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL : CREATION MISSION / RDV */}
      {showMissionModal && selectedProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-md font-bold text-foreground">Créer une action / RDV</h3>
                <p className="text-xs text-muted-foreground">Pour : {selectedProspect.name}</p>
              </div>
              <button onClick={() => setShowMissionModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={(e) => handleSubmitMission(e, false)} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Type d'action</label>
                <select value={missionData.type} onChange={(e) => setMissionData({...missionData, type: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground">
                  <option>Appel téléphonique</option><option>Envoi d'email / de document</option><option>Rendez-vous physique</option><option>Visio / Teams</option><option>Autre</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Objet de l'action *</label>
                <Input required value={missionData.titre} onChange={e => setMissionData({...missionData, titre: e.target.value})} className="text-xs" />
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                <label className="text-xs text-foreground font-semibold flex items-center gap-1 mb-2"><Users className="h-3.5 w-3.5" /> Assigner à :</label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPE.map(membre => {
                    const isChecked = (missionData.assignes || []).includes(membre)
                    return (
                      <label key={membre} className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer text-[10px] transition-colors ${isChecked ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleAssignee(membre)} />
                        {membre}
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground block mb-1">Date *</label><Input type="date" required value={missionData.echeance} onChange={e => setMissionData({...missionData, echeance: e.target.value})} className="text-xs w-full" /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Heure de début</label><Input type="time" value={missionData.heure} onChange={e => setMissionData({...missionData, heure: e.target.value})} className="text-xs w-full" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Durée prévisionnelle</label>
                  <select value={missionData.duree} onChange={(e) => setMissionData({...missionData, duree: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground">
                    <option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 heure</option><option value="120">2 heures</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">Lieu / Lien visio</label><Input placeholder="Ville, Adresse ou Lien" value={missionData.lieu} onChange={e => setMissionData({...missionData, lieu: e.target.value})} className="text-xs" /></div>
              </div>
              {selectedProspect.email && (
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="invite-candidat" checked={missionData.inviterCandidat} onChange={(e) => setMissionData({...missionData, inviterCandidat: e.target.checked})} className="rounded border-border accent-primary" />
                  <label htmlFor="invite-candidat" className="text-xs text-foreground cursor-pointer truncate">Inviter le candidat ({selectedProspect.email})</label>
                </div>
              )}
              <div><label className="text-xs text-muted-foreground block mb-1">Notes / Préparation</label><textarea rows={2} value={missionData.description} onChange={e => setMissionData({...missionData, description: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground resize-none" /></div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <Button type="button" onClick={(e) => handleSubmitMission(e, true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> Enregistrer + Synchroniser Google Calendar
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowMissionModal(false)} className="w-1/2 text-xs">Annuler</Button>
                  <Button type="submit" variant="secondary" className="w-1/2 text-xs">CRM uniquement</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}