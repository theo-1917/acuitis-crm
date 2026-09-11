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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

type Mission = {
  id: number
  title: string
  priorite: "Haute" | "Moyenne" | "Basse"
  lie_a: string
  echeance: string
  terminee: boolean
  created_at: string
}

export function Missions() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortBy, setSortBy] = useState<"echeance" | "priorite">("echeance")

  // Modal création / édition
  const [showModal, setShowModal] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [formData, setFormData] = useState<Partial<Mission>>({
    priorite: "Moyenne",
    terminee: false,
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
    const { error } = await supabase
      .from("missions")
      .update({ terminee: updatedStatus })
      .eq("id", mission.id)

    if (!error) {
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, terminee: updatedStatus } : m))
      )
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous supprimer cette mission ?")) return
    const { error } = await supabase.from("missions").delete().eq("id", id)
    if (!error) {
      setMissions((prev) => prev.filter((m) => m.id !== id))
    }
  }

  const handleOpenCreateModal = () => {
    setEditingMission(null)
    setFormData({ priorite: "Moyenne", terminee: false })
    setShowModal(true)
  }

  const handleOpenEditModal = (mission: Mission) => {
    setEditingMission(mission)
    setFormData(mission)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return
    setSubmitting(true)

    if (editingMission) {
      const { id, created_at, ...updateData } = formData as any
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
        },
      ])
      if (!error) await fetchMissions()
    }

    setSubmitting(false)
    setShowModal(false)
  }

  // Tri et Filtrage
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
      case "Haute":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Haute</Badge>
      case "Moyenne":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Moyenne</Badge>
      default:
        return <Badge variant="secondary" className="text-muted-foreground">Basse</Badge>
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement des missions…</div>
  }

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
          {/* Sélection du tri */}
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

          {/* Bouton Afficher / Masquer archivées */}
          {completedMissions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs"
            >
              {showCompleted ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
              {showCompleted
                ? "Masquer les terminées"
                : `Voir les ${completedMissions.length} terminée${completedMissions.length > 1 ? "s" : ""}`}
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
              <th className="p-4">Lié à</th>
              <th className="p-4 w-40">Échéance</th>
              <th className="p-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedMissions.map((mission) => (
              <tr
                key={mission.id}
                className={`transition hover:bg-muted/20 ${
                  mission.terminee ? "opacity-50 bg-muted/10" : ""
                }`}
              >
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={mission.terminee}
                    onChange={() => handleToggleComplete(mission)}
                    className="h-4 w-4 rounded border-border bg-background accent-primary cursor-pointer"
                  />
                </td>
                <td className="p-4 font-medium text-foreground">
                  <span className={mission.terminee ? "line-through text-muted-foreground" : ""}>
                    {mission.title}
                  </span>
                </td>
                <td className="p-4">{getPriorityBadge(mission.priorite)}</td>
                <td className="p-4 text-xs text-muted-foreground">
                  {mission.lie_a ? (
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {mission.lie_a}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-4 text-xs">
                  {mission.echeance ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {new Date(mission.echeance).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(mission)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mission.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {displayedMissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                  Aucune mission à afficher.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Création / Édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-semibold text-foreground">
                {editingMission ? "Modifier la mission" : "Créer une nouvelle mission"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description de la mission *
                </label>
                <Input
                  required
                  placeholder="ex : Relancer le candidat pour le RIB"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Priorité
                  </label>
                  <select
                    value={formData.priorite || "Moyenne"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priorite: e.target.value as "Haute" | "Moyenne" | "Basse",
                      })
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="Haute">Haute</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Basse">Basse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Date d'échéance
                  </label>
                  <Input
                    type="date"
                    value={formData.echeance || ""}
                    onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Lié à (Candidat / Dossier / Projet)
                </label>
                <Input
                  placeholder="ex : Julien Moreau ou Paris 1er — 112 rue de Rivoli"
                  value={formData.lie_a || ""}
                  onChange={(e) => setFormData({ ...formData, lie_a: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Enregistrement…"
                    : editingMission
                    ? "Sauvegarder"
                    : "Créer la mission"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}