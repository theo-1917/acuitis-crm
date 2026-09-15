"use client"

import React, { useEffect, useState } from "react"
import { Eye, EyeOff, Archive, ArchiveRestore, Mail, Phone, MapPin, Pencil, Trash2, Plus, X, Map, Download, BarChart, CalendarPlus, ClipboardList, CheckCircle, Circle, ExternalLink, Send, Users, UserCircle, FileSpreadsheet, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { formatEuro } from "@/lib/crm-data"

const EQUIPE = ["Kevin Lachant", "Theo Evenor", "Arthur Fougeris", "Stéphane CEZAR"]

type Prospect = { id: number; name: string; ville: string; telephone: string; email: string; apport: number; statut: string; actif: boolean; provenance: string; created_at: string; est_franchise?: boolean; developpeur_assigne?: string; raison_statut?: string }
type Mission = { id: number; title: string; description: string; echeance: string; terminee: boolean; prospect_id: number; assignes: string[] }
type DocumentModel = { id: number; titre: string; url_fichier: string; modele_email: string }

const COLUMNS = ["Nouveau", "Contacté", "RDV", "Validé", "Non qualifié", "Perdu"]
const PROVENANCES = ["Prospection téléphonique", "Site internet", "Contact SILMO", "Cooptation", "Bouche à oreille", "L'express franchise", "Recruteur", "Prospection linkedin", "Mailing", "Autre"]

export function ProspectsPipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Prospect>>({ statut: "Nouveau", actif: true, provenance: "Site internet", est_franchise: false, developpeur_assigne: "" })

  const [showMissionModal, setShowMissionModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [missionData, setMissionData] = useState({ titre: "", echeance: "", heure: "10:00", duree: "30", lieu: "", inviterCandidat: false, description: "", type: "Appel téléphonique", assignes: [] as string[] })

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyProspect, setHistoryProspect] = useState<Prospect | null>(null)
  const [prospectMissions, setProspectMissions] = useState<Mission[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [showDocModal, setShowDocModal] = useState(false)
  const [availableDocs, setAvailableDocs] = useState<DocumentModel[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string>("")

  const fetchProspects = async () => {
    setLoading(true)
    const { data } = await supabase.from("prospects").select("*").order("id", { ascending: false })
    if (data) setProspects(data)
    setLoading(false)
  }

  useEffect(() => { fetchProspects() }, [])

  const handleToggleActif = async (p: Prospect) => {
    const { error } = await supabase.from("prospects").update({ actif: !p.actif }).eq("id", p.id)
    if (!error) setProspects(prospects.map(prov => prov.id === p.id ? { ...prov, actif: !p.actif } : prov))
  }

  const handleChangeStatus = async (id: number, newStatus: string) => {
    let raison = null;
    
    // Demander la raison si passage en Perdu ou Non qualifié
    if (newStatus === "Non qualifié" || newStatus === "Perdu") {
      raison = prompt(`Quelle est la raison pour le passage en statut "${newStatus}" ? (Optionnel)`)
    }

    const isInactive = newStatus === "Non qualifié" || newStatus === "Perdu"
    const payload: any = { statut: newStatus, actif: !isInactive }
    
    if (raison !== null) {
      payload.raison_statut = raison
    }

    const { error } = await supabase.from("prospects").update(payload).eq("id", id)
    
    if (!error) {
      setProspects(prospects.map(p => p.id === id ? { ...p, ...payload } : p))
    } else {
      alert("Erreur de mise à jour. Avez-vous bien créé la colonne raison_statut dans Supabase ?")
    }
  }

  const handleAssignDev = async (id: number, devName: string) => {
    const { error } = await supabase.from("prospects").update({ developpeur_assigne: devName }).eq("id", id)
    if (!error) setProspects(prospects.map(p => p.id === id ? { ...p, developpeur_assigne: devName } : p))
  }

  const handlePasserEnRecherche = async (p: Prospect) => {
    const villes = prompt(`Dans quelle(s) ville(s) ${p.name} recherche-t-il un local ?`, p.ville || "")
    if (villes === null) return 
    
    const { error: emplError } = await supabase.from("emplacements").insert([{ prospect_id: p.id, villes_recherchees: villes, statut_recherche: "en_recherche", type_zone: null, surface_souhaitee_m2: 0 }])
    
    if (emplError) { 
      alert("Erreur lors du transfert : " + emplError.message); 
      return 
    }
    
    // Mettre à jour le statut en validé
    await supabase.from("prospects").update({ statut: "Validé", actif: true }).eq("id", p.id)
    fetchProspects()
    alert(`La recherche d'emplacement pour ${p.name} a bien été créée dans l'onglet Emplacements !`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement ce prospect ? (Cela supprimera aussi son historique, ses missions et ses dossiers)")) return
    
    await supabase.from("missions").delete().eq("prospect_id", id)
    await supabase.from("emplacements").delete().eq("prospect_id", id)
    await supabase.from("dossiers").delete().eq("prospect_id", id)
    
    const { error } = await supabase.from("prospects").delete().eq("id", id)
    
    if (error) alert("Erreur lors de la suppression : " + error.message)
    else fetchProspects()
  }

  const handleEdit = (p: Prospect) => { setFormData(p); setEditingId(p.id); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const { id, created_at, ...updateData } = formData as any
      await supabase.from("prospects").update(updateData).eq("id", editingId)
    } else await supabase.from("prospects").insert([formData])
    setShowModal(false); setEditingId(null); setFormData({ statut: "Nouveau", actif: true, provenance: "Site internet", est_franchise: false, developpeur_assigne: "" }); fetchProspects()
  }

  const handleOpenMission = (p: Prospect) => {
    setSelectedProspect(p)
    const defaultAssignes = p.developpeur_assigne ? [p.developpeur_assigne] : []
    setMissionData({ titre: `Échange franchise`, type: "Appel téléphonique", echeance: new Date().toISOString().split('T')[0], heure: "10:00", duree: "30", lieu: p.ville || "", inviterCandidat: false, description: `Téléphone : ${p.telephone || '-'}\nEmail : ${p.email || '-'}`, assignes: defaultAssignes })
    setShowMissionModal(true)
  }

  const toggleAssignee = (name: string) => {
    setMissionData(prev => ({
      ...prev,
      assignes: prev.assignes.includes(name) 
        ? prev.assignes.filter(n => n !== name) 
        : [...prev.assignes, name]
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

  const handleSubmitMission = async (e: React.FormEvent, openGoogleCal: boolean = false) => {
    e.preventDefault(); 
    if (!selectedProspect) return

    if (openGoogleCal) {
      window.open(getGoogleCalendarUrl(), '_blank')
    }

    const { error } = await supabase.from('missions').insert([{ 
      title: `[${missionData.type}] ${missionData.titre} (${selectedProspect.name})`, 
      description: `${missionData.description}\nHeure : ${missionData.heure} (${missionData.duree} min) | Lieu : ${missionData.lieu || '-'}`, 
      echeance: missionData.echeance, 
      prospect_id: selectedProspect.id, 
      terminee: false,
      assignes: missionData.assignes
    }])
    
    if (!error) setShowMissionModal(false)
    else alert("La mission n'a pas pu être sauvegardée : " + error.message)
  }

  const handleOpenHistory = async (p: Prospect) => {
    setHistoryProspect(p); setShowHistoryModal(true); setLoadingHistory(true)
    const { data } = await supabase.from('missions').select('*').eq('prospect_id', p.id).order('echeance', { ascending: false })
    if (data) setProspectMissions(data)
    setLoadingHistory(false)
  }

  const handleToggleMission = async (missionId: number, currentStatus: boolean) => {
    await supabase.from('missions').update({ terminee: !currentStatus }).eq('id', missionId)
    setProspectMissions(prev => prev.map(m => m.id === missionId ? { ...m, terminee: !currentStatus } : m))
  }

  const handleOpenDocModal = async (p: Prospect) => {
    setSelectedProspect(p)
    setShowDocModal(true)
    const { data } = await supabase.from('modeles_documents').select('*').order('titre')
    if (data && data.length > 0) {
      setAvailableDocs(data)
      setSelectedDocId(data[0].id.toString())
    } else {
      setAvailableDocs([])
    }
  }

  const handleSendDocument = async () => {
    if (!selectedProspect || !selectedDocId) return
    const doc = availableDocs.find(d => d.id.toString() === selectedDocId)
    if (!doc) return

    const prenom = selectedProspect.name.split(' ')[0]
    const corpsEmail = doc.modele_email.replace(/\[Prénom\]/gi, prenom).replace(/\[Lien\]/gi, doc.url_fichier)
    const subject = `Document Acuitis : ${doc.titre}`

    // UTILISATION DE GMAIL WEB PAR DÉFAUT
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedProspect.email || "")}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(corpsEmail)}`
    window.open(gmailUrl, '_blank')

    await supabase.from('missions').insert([{ 
      title: `[Document envoyé] ${doc.titre}`, 
      description: `Généré automatiquement par le CRM vers l'adresse ${selectedProspect.email || "non renseignée"}.`,
      echeance: new Date().toISOString().split('T')[0], 
      prospect_id: selectedProspect.id, 
      terminee: true,
      assignes: [selectedProspect.developpeur_assigne || ""]
    }])
    setShowDocModal(false)
  }

  const handleExportData = () => { /* Optionnel */ }
  const handleExportKPI = () => { /* Optionnel */ }

  const handleExportReunion = async () => {
    const { data: dossiers } = await supabase.from("dossiers").select("*")
    const prospectsReunion = prospects.filter(p => p.statut === "RDV" || p.statut === "Validé" || p.est_franchise === true)

    const headers = ["Porteur de projet", "Ville cherchée / Local", "Développeur", "Statut actuel", "Timing (Date prévue)", "Commentaires"]
    
    const rows = prospectsReunion.map(p => {
      const dossier = dossiers?.find(d => d.prospect_id === p.id)
      const nom = p.name || ""
      const ville = dossier?.adresse_local || p.ville || "Recherche en cours"
      const dev = p.developpeur_assigne || "Non assigné"
      
      let statut = p.statut
      if (dossier?.statut_dossier === "Validé") statut = "Projet Validé & Finalisé"
      else if (dossier) statut = "Dossier en montage"
      else if (p.est_franchise) statut = "Multi-franchise (Recherche)"

      const timing = dossier?.date_ouverture_prevue ? new Date(dossier.date_ouverture_prevue).toLocaleDateString("fr-FR") : "À définir"
      const commentaires = dossier?.commentaire || ""

      return [`"${nom}"`, `"${ville}"`, `"${dev}"`, `"${statut}"`, `"${timing}"`, `"${commentaires.replace(/"/g, '""').replace(/\n/g, ' ')}"`]
    })

    const csvLines = ["TABLEAU QUALITATIF - RÉUNION DÉVELOPPEMENT", `Édité le;${new Date().toLocaleDateString("fr-FR")}`, "", headers.join(";"), ...rows.map(r => r.join(";"))]
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvLines.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a"); link.href = encodedUri; link.download = `tableau_reunion_dev_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
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
          
          <Button variant="outline" size="sm" onClick={handleExportData} className="border-border bg-muted/20 text-xs hidden md:flex">
            <Download className="mr-2 h-3.5 w-3.5" /> Données Brutes
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportKPI} className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold hidden md:flex">
            <BarChart className="mr-2 h-3.5 w-3.5" /> Rapport KPI
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReunion} className="border-blue-500/30 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold">
            <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Tableau Réunion Dév.
          </Button>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

          <Button variant="outline" size="sm" onClick={() => setShowInactive(!showInactive)} className="text-xs">
            {showInactive ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />} {showInactive ? "Masquer Perdus" : "Voir Perdus"}
          </Button>
          <Button size="sm" onClick={() => { setEditingId(null); setFormData({ statut: "Nouveau", actif: true, provenance: "Site internet", est_franchise: false, developpeur_assigne: "" }); setShowModal(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {/* TABLEAU VERTICAL TYPE EXCEL */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm h-full pb-10">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="p-4 font-semibold">Candidat</th>
              <th className="p-4 font-semibold">Contact</th>
              <th className="p-4 font-semibold">Projet</th>
              <th className="p-4 font-semibold w-36">Développeur</th>
              <th className="p-4 font-semibold w-40">Statut</th>
              <th className="p-4 font-semibold text-right w-56">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {COLUMNS.map(column => {
              const columnProspects = displayedProspects.filter(p => (p.statut || "Nouveau") === column)
              if (columnProspects.length === 0) return null

              // Couleurs selon le statut pour imiter Excel
              let bgHeaderClass = "bg-muted/30 text-foreground"
              if (column === "Nouveau") bgHeaderClass = "bg-blue-500/10 text-blue-500"
              if (column === "Contacté") bgHeaderClass = "bg-amber-500/10 text-amber-500"
              if (column === "RDV") bgHeaderClass = "bg-purple-500/10 text-purple-500"
              if (column === "Validé") bgHeaderClass = "bg-emerald-500/10 text-emerald-500"
              if (column === "Non qualifié" || column === "Perdu") bgHeaderClass = "bg-red-500/10 text-red-500"

              return (
                <React.Fragment key={column}>
                  {/* EN-TÊTE DE SECTION */}
                  <tr className={`border-b border-border ${bgHeaderClass}`}>
                    <td colSpan={6} className="p-2 px-4 font-bold text-xs uppercase tracking-wider">
                      {column} <Badge variant="secondary" className="ml-2 bg-background/50">{columnProspects.length}</Badge>
                    </td>
                  </tr>

                  {/* LIGNES DES PROSPECTS */}
                  {columnProspects.map(p => (
                    <tr key={p.id} className={`transition-colors hover:bg-muted/10 ${p.actif === false ? 'opacity-70 bg-muted/5' : ''}`}>
                      
                      {/* COL 1: Candidat */}
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-foreground hover:text-primary hover:underline cursor-pointer" onClick={() => handleOpenHistory(p)}>
                            {p.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.provenance || "Autre"}</span>
                          {p.est_franchise && (
                            <Badge variant="outline" className="w-fit bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] px-1.5 mt-1">👑 Franchisé</Badge>
                          )}
                        </div>
                      </td>

                      {/* COL 2: Contact */}
                      <td className="p-4 align-top text-xs text-muted-foreground">
                        <div className="flex flex-col gap-1.5">
                          {p.email && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /> {p.email}</span>}
                          {p.telephone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /> {p.telephone}</span>}
                        </div>
                      </td>

                      {/* COL 3: Projet */}
                      <td className="p-4 align-top text-xs">
                        <div className="flex flex-col gap-1.5">
                          {p.ville ? <span className="flex items-center gap-1.5 font-medium"><MapPin className="h-3.5 w-3.5 text-primary" /> {p.ville}</span> : <span className="text-muted-foreground italic">Non défini</span>}
                          <span className="text-muted-foreground ml-5">Apport : <b className="text-foreground">{p.apport ? formatEuro(p.apport) : "-"}</b></span>
                        </div>
                      </td>

                      {/* COL 4: Développeur */}
                      <td className="p-4 align-top">
                        <select 
                          className="w-full text-xs bg-background border border-border rounded p-1.5 outline-none text-muted-foreground hover:border-primary transition" 
                          value={p.developpeur_assigne || ""} 
                          onChange={(e) => handleAssignDev(p.id, e.target.value)}
                        >
                          <option value="">👤 Assigner...</option>
                          {EQUIPE.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </td>

                      {/* COL 5: Statut */}
                      <td className="p-4 align-top">
                        <select 
                          className={`w-full text-xs border rounded p-1.5 outline-none transition font-medium ${
                            p.statut === "Validé" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                            p.statut === "Perdu" || p.statut === "Non qualifié" ? "bg-red-500/10 text-red-500 border-red-500/30" :
                            "bg-muted/50 border-border text-foreground hover:border-primary"
                          }`}
                          value={p.statut || "Nouveau"} 
                          onChange={(e) => handleChangeStatus(p.id, e.target.value)}
                        >
                          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* AFFICHAGE DU MOTIF DE PERTE */}
                        {(p.statut === "Perdu" || p.statut === "Non qualifié") && p.raison_statut && (
                          <div className="mt-2 text-[10px] text-red-400 border-l-2 border-red-500/30 pl-2 italic leading-tight">
                            Motif : {p.raison_statut}
                          </div>
                        )}
                      </td>

                      {/* COL 6: Actions */}
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {p.actif !== false && (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10" title="Envoyer email (Gmail)" onClick={() => handleOpenDocModal(p)}>
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10" title="Créer un rappel" onClick={() => handleOpenMission(p)}>
                                <CalendarPlus className="h-4 w-4" />
                              </Button>
                              {/* BOUTON PASSER EN RECHERCHE EMPLACEMENT */}
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" title="Transférer en Recherche d'Emplacement" onClick={() => handlePasserEnRecherche(p)}>
                                <Building2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" title="Historique" onClick={() => handleOpenHistory(p)}>
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* --- RESTE DES MODALES IDENTIQUES (AJOUT/EDITION, MISSIONS, DOCS, HISTORIQUE) --- */}

      {showDocModal && selectedProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl border-t-4 border-t-violet-500">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-md font-bold text-foreground">Envoyer un document (Gmail)</h3>
                <p className="text-xs text-muted-foreground">À : {selectedProspect.email || "Aucune adresse e-mail renseignée"}</p>
              </div>
              <button onClick={() => setShowDocModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            {!selectedProspect.email ? (
              <div className="text-sm text-amber-500 p-4 bg-amber-500/10 rounded-lg text-center font-semibold">Ce candidat n'a pas d'adresse e-mail renseignée. Veuillez modifier sa fiche.</div>
            ) : availableDocs.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center p-4">Aucun document disponible. Ajoutez-en d'abord dans l'onglet "Mes Documents".</div>
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
                    <Send className="mr-2 h-3.5 w-3.5" /> Ouvrir Gmail & Tracer l'envoi
                  </Button>
                  <Button variant="outline" onClick={() => setShowDocModal(false)} className="w-full text-xs">Annuler</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showHistoryModal && historyProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
              <div>
                <h3 className="text-md font-bold text-foreground">Dossier : {historyProspect.name}</h3>
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

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-semibold text-foreground">{editingId ? "Modifier le profil" : "Nouveau contact"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nom complet *</label>
                <Input required value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-muted-foreground block mb-1">Téléphone</label><Input value={formData.telephone || ""} onChange={e => setFormData({...formData, telephone: e.target.value})} className="text-xs" /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Email</label><Input type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-muted-foreground block mb-1">Ville souhaitée</label><Input value={formData.ville || ""} onChange={e => setFormData({...formData, ville: e.target.value})} className="text-xs" /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Apport (€)</label><Input type="number" value={formData.apport || ""} onChange={e => setFormData({...formData, apport: Number(e.target.value)})} className="text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-muted-foreground block mb-1">Statut</label>
                   <select value={formData.statut || "Nouveau"} onChange={(e) => setFormData({...formData, statut: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground">
                      {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                   <label className="text-xs text-muted-foreground block mb-1">Provenance (Source)</label>
                   <select value={formData.provenance || "Site internet"} onChange={(e) => setFormData({...formData, provenance: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground">
                      {PROVENANCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                  <input type="checkbox" id="franchise-checkbox" checked={formData.est_franchise || false} onChange={(e) => {
                    const isFranchise = e.target.checked
                    setFormData({ ...formData, est_franchise: isFranchise, statut: isFranchise ? "Validé" : (formData.statut || "Nouveau") })
                  }} className="rounded border-border accent-blue-500" />
                  <label htmlFor="franchise-checkbox" className="text-xs text-blue-500 font-semibold cursor-pointer">👑 C'est un franchisé existant (Multi-franchise)</label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="actif-checkbox" checked={formData.actif !== false} onChange={(e) => setFormData({...formData, actif: e.target.checked})} className="rounded border-border accent-primary" />
                  <label htmlFor="actif-checkbox" className="text-xs text-foreground cursor-pointer">Actif (Visible dans le pipeline)</label>
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