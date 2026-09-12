"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, Archive, ArchiveRestore, Mail, Phone, MapPin, Pencil, Trash2, Plus, X, Map, Download, BarChart, CalendarPlus, ClipboardList, CheckCircle, Circle, ExternalLink, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { formatEuro } from "@/lib/crm-data"

type Prospect = { id: number; name: string; ville: string; telephone: string; email: string; apport: number; statut: string; actif: boolean; provenance: string; created_at: string; est_franchise?: boolean }
type Mission = { id: number; title: string; description: string; echeance: string; terminee: boolean; prospect_id: number }
type DocumentModel = { id: number; titre: string; url_fichier: string; modele_email: string }

const COLUMNS = ["Nouveau", "Contacté", "RDV", "Validé", "Non qualifié", "Perdu"]
const PROVENANCES = ["Prospection téléphonique", "Site internet", "Contact SILMO", "Cooptation", "Bouche à oreille", "L'express franchise", "Recruteur", "Prospection linkedin", "Mailing", "Autre"]

export function ProspectsPipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Prospect>>({ statut: "Nouveau", actif: true, provenance: "Site internet", est_franchise: false })

  const [showMissionModal, setShowMissionModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [missionData, setMissionData] = useState({ titre: "", echeance: "", heure: "10:00", duree: "30", lieu: "", inviterCandidat: false, description: "", type: "Appel téléphonique" })

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
    const isInactive = newStatus === "Non qualifié" || newStatus === "Perdu"
    const payload = { statut: newStatus, actif: !isInactive }
    const { error } = await supabase.from("prospects").update(payload).eq("id", id)
    if (!error) setProspects(prospects.map(p => p.id === id ? { ...p, ...payload } : p))
  }

  const handlePasserEnRecherche = async (p: Prospect) => {
    const villes = prompt(`Dans quelle(s) ville(s) ${p.name} recherche-t-il un local ?`, p.ville || "")
    if (villes === null) return 
    setProspects(current => current.map(prov => prov.id === p.id ? { ...prov, statut: "Validé", actif: true } : prov))
    const { error: emplError } = await supabase.from("emplacements").insert([{ prospect_id: p.id, villes_recherchees: villes, statut_recherche: "en_recherche", type_zone: null, surface_souhaitee_m2: 0 }])
    if (emplError) { alert("Erreur : " + emplError.message); fetchProspects(); return }
    await supabase.from("prospects").update({ statut: "Validé", actif: true }).eq("id", p.id)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement ce prospect ?")) return
    await supabase.from("prospects").delete().eq("id", id)
    fetchProspects()
  }

  const handleEdit = (p: Prospect) => { setFormData(p); setEditingId(p.id); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const { id, created_at, ...updateData } = formData as any
      await supabase.from("prospects").update(updateData).eq("id", editingId)
    } else await supabase.from("prospects").insert([formData])
    setShowModal(false); setEditingId(null); setFormData({ statut: "Nouveau", actif: true, provenance: "Site internet", est_franchise: false }); fetchProspects()
  }

  const handleOpenMission = (p: Prospect) => {
    setSelectedProspect(p)
    setMissionData({ titre: `Échange franchise`, type: "Appel téléphonique", echeance: new Date().toISOString().split('T')[0], heure: "10:00", duree: "30", lieu: p.ville || "", inviterCandidat: false, description: `Téléphone : ${p.telephone || '-'}\nEmail : ${p.email || '-'}` })
    setShowMissionModal(true)
  }

  const getGoogleCalendarUrl = () => {
    if (!selectedProspect || !missionData.echeance) return "#"
    const [year, month, day] = missionData.echeance.split('-')
    const [hours, minutes] = (missionData.heure || "10:00").split(':')
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
    const end = new Date(start.getTime() + Number(missionData.duree || 30) * 60000)
    const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "")
    const fullTitle = `[${missionData.type}] ${missionData.titre} - ${selectedProspect.name}`
    const details = `Candidat : ${selectedProspect.name}\nTéléphone : ${selectedProspect.telephone || '-'}\nEmail : ${selectedProspect.email || '-'}\n\nNotes :\n${missionData.description}`
    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(fullTitle)}&dates=${formatGCalDate(start)}/${formatGCalDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(missionData.lieu || "")}`
    if (missionData.inviterCandidat && selectedProspect.email) url += `&add=${encodeURIComponent(selectedProspect.email)}`
    return url
  }

  const handleSubmitMission = async (e: React.FormEvent, openGoogleCal: boolean = false) => {
    e.preventDefault(); if (!selectedProspect) return
    const { error } = await supabase.from('missions').insert([{ title: `[${missionData.type}] ${missionData.titre} (${selectedProspect.name})`, description: `${missionData.description}\nHeure : ${missionData.heure} (${missionData.duree} min) | Lieu : ${missionData.lieu || '-'}`, echeance: missionData.echeance, prospect_id: selectedProspect.id, terminee: false }])
    if (!error) {
      if (openGoogleCal) window.open(getGoogleCalendarUrl(), '_blank')
      setShowMissionModal(false)
    }
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

    const subject = encodeURIComponent(`Document Acuitis : ${doc.titre}`)
    const mailtoLink = `mailto:${selectedProspect.email || ""}?subject=${subject}&body=${corpsEmail}`
    
    window.open(mailtoLink, '_blank')

    await supabase.from('missions').insert([{ 
      title: `[Document envoyé] ${doc.titre}`, 
      description: `Généré automatiquement par le CRM vers l'adresse ${selectedProspect.email || "non renseignée"}.`,
      echeance: new Date().toISOString().split('T')[0], 
      prospect_id: selectedProspect.id, 
      terminee: true 
    }])
    setShowDocModal(false)
  }

  const handleExportData = () => {
    const headers = ["ID", "Nom", "Ville", "Téléphone", "Email", "Apport", "Statut", "Provenance", "Actif", "Franchisé Existant", "Date de création"]
    const rows = prospects.map(p => [
      p.id, `"${p.name || ""}"`, `"${p.ville || ""}"`, `"${p.telephone || ""}"`, `"${p.email || ""}"`, p.apport || 0, `"${p.statut || ""}"`, `"${p.provenance || ""}"`, p.actif ? "Oui" : "Non", p.est_franchise ? "Oui" : "Non", new Date(p.created_at).toLocaleDateString("fr-FR")
    ])
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a"); link.href = encodedUri; link.download = `candidats_data_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const handleExportKPI = () => {
    // SÉPARATION DES KPI : EXTERNES (Acquisition) vs INTERNES (Franchisés existants)
    const prospectsExternes = prospects.filter(p => !p.est_franchise)
    const franchisesExistants = prospects.filter(p => p.est_franchise)

    const total = prospectsExternes.length
    const valides = prospectsExternes.filter(p => p.statut === "Validé").length
    const perdus = prospectsExternes.filter(p => p.statut === "Non qualifié" || p.statut === "Perdu").length
    const enCours = total - valides - perdus

    // Stats par mois (Uniquement sur l'externe pour garder la pureté de la donnée)
    const prospectsByMonthYear: Record<string, Prospect[]> = {}
    prospectsExternes.forEach(p => {
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

    const csvLines = [
      "RAPPORT ANALYTIQUE ET KPI - DÉVELOPPEMENT RÉSEAU ACUITIS",
      `Date de l'export;${new Date().toLocaleDateString("fr-FR")}`,
      "",
      "--- 1. INDICATEURS CLÉS (ACQUISITION EXTERNE UNIQUEMENT) ---",
      `Total des candidatures générées;${total}`,
      `Candidats en cours de traitement;${enCours}`,
      `CANDIDATS VALIDÉS (Recherche de locaux en cours);${valides}`,
      `Candidats non retenus (Non qualifiés / Perdus);${perdus}`,
      `Taux de transformation global;${total > 0 ? ((valides / total) * 100).toFixed(1) + "%" : "0%"}`,
      "",
      "--- 2. PERFORMANCE DU TUNNEL (STATUTS) PAR MOIS (EXTERNE) ---",
      statusByMonthHeader,
      ...statusByMonthLines,
      "",
      "--- 3. DÉVELOPPEMENT INTERNE (MULTI-FRANCHISE) ---",
      `Total de projets d'ouvertures internes (Franchisés existants);${franchisesExistants.length}`,
      `Projets internes Validés / En cours;${franchisesExistants.filter(p => p.statut === "Validé").length}`,
    ]

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvLines.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a"); link.href = encodedUri; link.download = `rapport_kpi_conversion_${new Date().toISOString().slice(0, 10)}.csv`
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
          
          <Button variant="outline" size="sm" onClick={handleExportData} className="border-border bg-muted/20 text-xs">
            <Download className="mr-2 h-3.5 w-3.5" /> Données Brutes
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportKPI} className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold">
            <BarChart className="mr-2 h-3.5 w-3.5" /> Rapport KPI
          </Button>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

          <Button variant="outline" size="sm" onClick={() => setShowInactive(!showInactive)} className="text-xs">
            {showInactive ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />} {showInactive ? "Masquer Perdus" : "Voir Perdus"}
          </Button>
          <Button size="sm" onClick={() => { setEditingId(null); setFormData({ statut: "Nouveau", actif: true, provenance: "Site internet", est_franchise: false }); setShowModal(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {COLUMNS.map(column => {
          const columnProspects = displayedProspects.filter(p => (p.statut || "Nouveau") === column)
          return (
            <div key={column} className={`flex-shrink-0 w-80 flex flex-col gap-3 rounded-xl p-3 border border-border ${column === 'Validé' ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-muted/20'}`}>
              <div className="flex items-center justify-between px-1">
                <h3 className={`font-semibold text-sm ${column === 'Validé' ? 'text-emerald-400' : 'text-foreground'}`}>{column}</h3>
                <Badge variant="secondary" className={column === 'Validé' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : ''}>{columnProspects.length}</Badge>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                {columnProspects.map(p => (
                  <div key={p.id} className={`bg-card rounded-lg p-3 border shadow-sm flex flex-col gap-2 transition hover:border-primary/50 ${p.actif === false ? 'border-dashed border-muted-foreground/30 opacity-70' : 'border-border'} ${p.statut === 'Validé' ? 'border-emerald-500/30' : ''}`}>
                    <div className="flex justify-between items-start">
                      
                      {/* NOM + BADGE FRANCHISÉ */}
                      <div className="flex flex-col items-start gap-1">
                        <div className="font-bold text-sm text-foreground leading-tight cursor-pointer hover:text-primary hover:underline transition-colors" onClick={() => handleOpenHistory(p)}>
                          {p.name}
                        </div>
                        {p.est_franchise && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] px-1.5 py-0 uppercase tracking-wider">
                            👑 Franchisé
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleActif(p)} className={`p-1 rounded transition ${p.actif === false ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/20'}`}>
                          {p.actif === false ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1 mt-1">{p.provenance || "Autre"}</div>
                    
                    <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-0.5">
                      {p.ville && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {p.ville}</div>}
                      {p.telephone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {p.telephone}</div>}
                      {p.email && <div className="flex items-center gap-1.5 truncate" title={p.email}><Mail className="h-3 w-3 shrink-0" /> {p.email}</div>}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-xs font-semibold text-emerald-400 truncate pr-2">{p.apport ? formatEuro(p.apport) : "-"}</span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {p.actif !== false && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10" title="Envoyer un document (DIP...)" onClick={() => handleOpenDocModal(p)}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {p.actif !== false && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10" title="Créer un rappel" onClick={() => handleOpenMission(p)}>
                            <CalendarPlus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10" title="Historique" onClick={() => handleOpenHistory(p)}>
                          <ClipboardList className="h-3.5 w-3.5" />
                        </Button>
                        
                        <select className="text-[10px] bg-muted/50 border border-border rounded p-1 outline-none text-muted-foreground w-16" value={p.statut || "Nouveau"} onChange={(e) => handleChangeStatus(p.id, e.target.value)}>
                          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(p)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

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
              <div className="text-sm text-amber-500 p-4 bg-amber-500/10 rounded-lg text-center font-semibold">
                Ce candidat n'a pas d'adresse e-mail renseignée. Veuillez modifier sa fiche pour ajouter un email.
              </div>
            ) : availableDocs.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center p-4">
                Aucun document disponible. Ajoutez-en d'abord dans l'onglet "Mes Documents".
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Choisir le document à envoyer</label>
                  <select 
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full text-sm bg-background border border-input rounded-md p-2 outline-none text-foreground"
                  >
                    {availableDocs.map(d => (
                      <option key={d.id} value={d.id}>{d.titre}</option>
                    ))}
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
                  <option>Appel téléphonique</option>
                  <option>Envoi d'email / de document</option>
                  <option>Rendez-vous physique</option>
                  <option>Visio / Teams</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Objet de l'action *</label>
                <Input required value={missionData.titre} onChange={e => setMissionData({...missionData, titre: e.target.value})} className="text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Date *</label>
                  <Input type="date" required value={missionData.echeance} onChange={e => setMissionData({...missionData, echeance: e.target.value})} className="text-xs w-full" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Heure de début</label>
                  <Input type="time" value={missionData.heure} onChange={e => setMissionData({...missionData, heure: e.target.value})} className="text-xs w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Durée prévisionnelle</label>
                  <select value={missionData.duree} onChange={(e) => setMissionData({...missionData, duree: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground">
                    <option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 heure</option><option value="120">2 heures</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Lieu / Lien visio</label>
                  <Input placeholder="Ville, Adresse ou Lien" value={missionData.lieu} onChange={e => setMissionData({...missionData, lieu: e.target.value})} className="text-xs" />
                </div>
              </div>
              {selectedProspect.email && (
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="invite-candidat" checked={missionData.inviterCandidat} onChange={(e) => setMissionData({...missionData, inviterCandidat: e.target.checked})} className="rounded border-border accent-primary" />
                  <label htmlFor="invite-candidat" className="text-xs text-foreground cursor-pointer truncate">Inviter le candidat ({selectedProspect.email})</label>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes / Préparation</label>
                <textarea rows={2} value={missionData.description} onChange={e => setMissionData({...missionData, description: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground resize-none" />
              </div>
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

      {/* MODAL : EDITER PROSPECT */}
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

              {/* NOUVEAU : CASE FRANCHISÉ EXISTANT */}
              <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                  <input type="checkbox" id="franchise-checkbox" checked={formData.est_franchise || false} onChange={(e) => {
                    const isFranchise = e.target.checked
                    setFormData({
                      ...formData, 
                      est_franchise: isFranchise, 
                      statut: isFranchise ? "Validé" : (formData.statut || "Nouveau") // Passe en Validé automatiquement
                    })
                  }} className="rounded border-border accent-blue-500" />
                  <label htmlFor="franchise-checkbox" className="text-xs text-blue-500 font-semibold cursor-pointer">
                    👑 C'est un franchisé existant (Multi-franchise)
                  </label>
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