"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Eye,
  EyeOff,
  Link2,
  Pencil,
  Plus,
  Trash2,
  X,
  Users,
  ExternalLink
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

const EQUIPE = ["Kevin Lachant", "Theo Evenor", "Arthur Fougeris"]

type Mission = {
  id: number
  title: string
  priorite: "Haute" | "Moyenne" | "Basse"
  lie_a: string
  echeance: string
  terminee: boolean
  created_at: string
  assignes?: string[]
  description?: string
}

export function Missions() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortBy, setSortBy] = useState<"echeance" | "priorite">("echeance")

  // Modal création / édition enrichie
  const [showModal, setShowModal] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [formData, setFormData] = useState<Partial<Mission> & { heure?: string, duree?: string, lieu?: string }>({
    priorite: "Moyenne",
    terminee: false,
    assignes: [],
    heure: "10:00",
    duree: "30",
    lieu: "",
    description: ""
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchMissions = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("missions").select("*")
    if (!error && data) {
      setMissions(data as Mission[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  const handleToggleComplete = async (mission: Mission) => {
    const updatedStatus = !mission.terminee
    const { error } = await supabase.from("missions").update({ terminee: updatedStatus }).eq("id", mission.id)
    if (!error) {
      setMissions((prev) => prev.map((m) => (m.id === mission.id ? { ...m, terminee: updatedStatus } : m)))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous supprimer cette mission ?")) return
    const { error } = await supabase.from("missions").delete().eq("id", id)
    if (!error) setMissions((prev) => prev.filter((m) => m.id !== id))
  }

  const handleOpenCreateModal = () => {
    setEditingMission(null)
    setFormData({ priorite: "Moyenne", terminee: false, assignes: [], heure: "10:00", duree: "30", lieu: "", description: "" })
    setShowModal(true)
  }

  const handleOpenEditModal = (mission: Mission) => {
    setEditingMission(mission)
    setFormData({ ...mission, assignes: mission.assignes || [], heure: "10:00", duree: "30", lieu: "" })
    setShowModal(true)
  }

  const toggleAssignee = (name: string) => {
    setFormData(prev => {
      const currentAssignes = prev.assignes || []
      return {
        ...prev,
        assignes: currentAssignes.includes(name) ? currentAssignes.filter(n => n !== name) : [...currentAssignes, name]
      }
    })
  }

  // === GENERATION URL GOOGLE CALENDAR ===
  const getGoogleCalendarUrl = () => {
    if (!formData.echeance) return "#"
    const [year, month, day] = formData.echeance.split('-')
    const [hours, minutes] = (formData.heure || "10:00").split(':')
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
    const end = new Date(start.getTime() + Number(formData.duree || 30) * 60000)
    const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "")
    
    const fullTitle = formData.title || "Nouvelle mission CRM"
    
    let details = ""
    if (formData.lie_a) details += `Lié à : ${formData.lie_a}\n`
    if (formData.assignes && formData.assignes.length > 0) details += `Assigné à : ${formData.assignes.join(', ')}\n`
    details += `\nNotes :\n${formData.description || ""}`

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(fullTitle)}&dates=${formatGCalDate(start)}/${formatGCalDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(formData.lieu || "")}`
  }

  const handleSubmit = async (e: React.FormEvent, openGoogleCal: boolean = false) => {
    e.preventDefault()
    if (!formData.title) return
    setSubmitting(true)

    // Ouverture immédiate pour les mobiles
    if (openGoogleCal && formData.echeance) {
      window.open(getGoogleCalendarUrl(), '_blank')
    }

    // Formatage de la description pour garder les infos heure/lieu dans le CRM
    const finalDescription = `${formData.description || ""}\nHeure : ${formData.heure || "10:00"} (${formData.duree || "30"} min) | Lieu : ${formData.lieu || '-'}`

    if (editingMission) {
      const { id, created_at, heure, duree, lieu, ...updateData } = formData as any
      updateData.description = finalDescription
      const { error } = await supabase.from("missions").update(updateData).eq("id", editingMission.id)
      if (!error) await fetchMissions()
    } else {
      const { error } = await supabase.from("missions").insert([
        {
          title: formData.title,
          priorite: formData.priorite || "Moyenne",
          lie_a: formData.lie_a || "",
          echeance: formData.echeance || null,
          terminee: false,
          assignes: formData.assignes || [],
          description: finalDescription
        },
      ])
      if (!error) await fetchMissions()
    }

    setSubmitting(false)
    setShowModal(false)
  }

  const priorityWeight = { Haute: 1, Moyenne: 2, Basse: 3 }

  const sortedMissions = [...missions].sort((a, b) => {
    if (sortBy === "priorite") {
      return (priorityWeight[a.priorite] || 2) - (priorityWeight[b.priorite] || 2)
    } else {
      if (!a.echeance) return 1
      if (!b.echeance) return -1
      return new Date(a.echeance).getTime() - new Date(b.echeance).getTime()
    }
  })

  const activeMissions = sortedMissions.filter((m) => !m.terminee)
  const completedMissions = sortedMissions.filter((m) => m.terminee)
  const displayedMissions = showCompleted ? sortedMissions : activeMissions

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Haute": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Haute</Badge>
      case "Moyenne": return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Moyenne</Badge>
      default: return <Badge variant="secondary" className="text-muted-foreground">Basse</Badge>
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement des missions…</div>

  return (
    <div className="flex flex-col gap-6">
      {/* Barre d'action supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Gestion des Missions</h2>
        </div>
        <Button onClick={handleOpenCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
        </Button>
      </div>

      {/* Barre de filtre & sous-titre */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            {activeMissions.length} mission{activeMissions.length > 1 ? "s" : ""} en cours
          </span>
          <span className="text-xs text-muted-foreground">({missions.length} au total)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "echeance" | "priorite")}
              className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="echeance">Date d'échéance</option>
              <option value="priorite">Priorité</option>
            </select>
          </div>

          {completedMissions.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowCompleted(!showCompleted)} className="text-xs">
              {showCompleted ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
              {showCompleted ? "Masquer les terminées" : `Voir les ${completedMissions.length} terminée${completedMissions.length > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </div>

      {/* Tableau des missions */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <th className="p-4 w-12 text-center">État</th>
              <th className="p-4">Description</th>
              <th className="p-4 w-32">Priorité</th>
              <th className="p-4">Lié à / Assigné à</th>
              <th className="p-4 w-40">Échéance</th>
              <th className="p-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedMissions.map((mission) => (
              <tr key={mission.id} className={`transition hover:bg-muted/20 ${mission.terminee ? "opacity-50 bg-muted/10" : ""}`}>
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={mission.terminee}
                    onChange={() => handleToggleComplete(mission)}
                    className="h-4 w-4 rounded border-border bg-background accent-primary cursor-pointer"
                  />
                </td>
                <td className="p-4 font-medium text-foreground">
                  <div className="flex flex-col gap-1">
                    <span className={mission.terminee ? "line-through text-muted-foreground" : ""}>
                      {mission.title}
                    </span>
                    {/* Affichage des notes de la mission */}
                    {mission.description && (
                      <span className="text-[10px] text-muted-foreground whitespace-pre-wrap line-clamp-2">
                        {mission.description}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">{getPriorityBadge(mission.priorite)}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-1.5">
                    {mission.lie_a ? (
                      <span className="flex items-center gap-1.5 text-xs text-foreground/80">
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {mission.lie_a}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}

                    {mission.assignes && mission.assignes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mission.assignes.map(assigne => (
                          <Badge key={assigne} variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none px-1.5 py-0 rounded-sm">
                            <Users className="h-2.5 w-2.5 mr-1" /> {assigne}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 text-xs">
                  {mission.echeance ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {new Date(mission.echeance).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  ) : "-"}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(mission)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(mission.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {displayedMissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">Aucune mission à afficher.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Création / Édition Enrichie */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl my-4">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-semibold text-foreground">
                {editingMission ? "Modifier la mission" : "Créer une nouvelle mission"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Titre de la mission *</label>
                <Input required placeholder="ex : Relancer le candidat pour le RIB" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="text-xs" />
              </div>

              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                <label className="text-xs text-foreground font-semibold flex items-center gap-1 mb-2">
                  <Users className="h-3.5 w-3.5" /> Assigner à :
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPE.map(membre => {
                    const isChecked = (formData.assignes || []).includes(membre)
                    return (
                      <label key={membre} className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer text-[10px] transition-colors ${isChecked ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleAssignee(membre)} />
                        {membre}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Lié à (Candidat / Dossier / Projet)</label>
                <Input placeholder="ex : Julien Moreau ou Paris 1er — 112 rue de Rivoli" value={formData.lie_a || ""} onChange={(e) => setFormData({ ...formData, lie_a: e.target.value })} className="text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Priorité</label>
                  <select value={formData.priorite || "Moyenne"} onChange={(e) => setFormData({ ...formData, priorite: e.target.value as "Haute" | "Moyenne" | "Basse" })} className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none">
                    <option value="Haute">Haute</option><option value="Moyenne">Moyenne</option><option value="Basse">Basse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date d'échéance *</label>
                  <Input type="date" required value={formData.echeance || ""} onChange={(e) => setFormData({ ...formData, echeance: e.target.value })} className="text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Heure de début</label>
                  <Input type="time" value={formData.heure || "10:00"} onChange={e => setFormData({...formData, heure: e.target.value})} className="text-xs w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Durée prévisionnelle</label>
                  <select value={formData.duree || "30"} onChange={(e) => setFormData({...formData, duree: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground">
                    <option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 heure</option><option value="120">2 heures</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Lieu / Lien visio</label>
                <Input placeholder="Ville, Adresse ou Lien" value={formData.lieu || ""} onChange={e => setFormData({...formData, lieu: e.target.value})} className="text-xs" />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes / Description</label>
                <textarea rows={2} value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground resize-none" placeholder="Préparation du RDV, détails..." />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                <Button type="button" onClick={(e) => handleSubmit(e, true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> Enregistrer + Synchroniser Google Calendar
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="w-1/2 text-xs">Annuler</Button>
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