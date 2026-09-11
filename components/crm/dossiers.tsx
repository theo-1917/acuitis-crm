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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

type Prospect = {
  id: number
  name: string
  ville: string
  telephone: string
  email: string
  apport: number
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

export function Dossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [prospectsWithoutDossier, setProspectsWithoutDossier] = useState<Prospect[]>([])
  const [selectedDossierId, setSelectedDossierId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [currentDossier, setCurrentDossier] = useState<Partial<Dossier>>({})

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

  const handleToggleValidate = async () => {
    if (!selectedDossierId) return
    const newStatus = currentDossier.statut_dossier === "Validé" ? "En cours" : "Validé"

    const { error } = await supabase
      .from("dossiers")
      .update({ statut_dossier: newStatus })
      .eq("id", selectedDossierId)

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

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert("Erreur d'envoi du fichier : " + uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    const { error: updateError } = await supabase
      .from("dossiers")
      .update({ [fileKey]: publicUrl })
      .eq("id", selectedDossierId)

    if (!updateError) {
      setCurrentDossier((prev) => ({ ...prev, [fileKey]: publicUrl }))
      await loadData()
    } else {
      alert("Erreur lors de la mise à jour du lien document.")
    }
  }

  // 7 documents officiels obligatoires + 1 optionnel
  const mandatoryDocKeys: { key: keyof Dossier; label: string }[] = [
    { key: "dip_signe_url", label: "DIP signé" },
    { key: "roi_url", label: "ROI" },
    { key: "kbis_url", label: "Kbis" },
    { key: "rib_url", label: "RIB" },
    { key: "etude_zone_url", label: "Étude de zone" },
    { key: "devis_travaux_url", label: "Devis travaux" },
    { key: "bail_signe_url", label: "Bail signé" },
  ]
  const optionalDocKey = { key: "autres_documents_url" as keyof Dossier, label: "Autres documents (Optionnel)" }
  
  const allDocKeys = [...mandatoryDocKeys, optionalDocKey]
  const docsUploadedCount = mandatoryDocKeys.filter(({ key }) => !!currentDossier[key]).length
  const isFullyValidated = currentDossier.statut_dossier === "Validé"

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement des dossiers…</div>
  }

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
              <option value="" disabled>
                -- Sélectionner un candidat --
              </option>
              {prospectsWithoutDossier.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.ville || "Sans ville"})
                </option>
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

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteDossier}
                className="text-xs"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
              </Button>

              <Button
                variant={isFullyValidated ? "outline" : "default"}
                size="sm"
                onClick={handleToggleValidate}
                className={
                  isFullyValidated
                    ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/30"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {isFullyValidated ? "Rouvrir le dossier" : "Valider le dossier"}
              </Button>

              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Sauvegarder"}
              </Button>
            </div>
          </div>

          {/* BANDEAU DE CÉLÉBRATION EN CAS DE VALIDATION */}
          {isFullyValidated && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-950/10 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-emerald-300">Dossier complètement validé !</h4>
                  <p className="text-xs text-emerald-400/80">
                    Tous les prérequis financiers, juridiques et territoriaux sont validés. Prêt pour l'ouverture.
                  </p>
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
                  <Input
                    disabled
                    value={currentDossier.prospects?.telephone || "-"}
                    className="bg-muted/50 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                  <Input
                    disabled
                    value={currentDossier.prospects?.email || "-"}
                    className="bg-muted/50 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Agent / Broker</label>
                <Input
                  value={currentDossier.agent_broker || ""}
                  onChange={(e) =>
                    setCurrentDossier({ ...currentDossier, agent_broker: e.target.value })
                  }
                  placeholder="ex: Cushman & Wakefield"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Date de prise de bail
                  </label>
                  <Input
                    type="date"
                    value={currentDossier.date_prise_bail || ""}
                    onChange={(e) =>
                      setCurrentDossier({ ...currentDossier, date_prise_bail: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Date d'ouverture prévue
                  </label>
                  <Input
                    type="date"
                    value={currentDossier.date_ouverture_prevue || ""}
                    onChange={(e) =>
                      setCurrentDossier({
                        ...currentDossier,
                        date_ouverture_prevue: e.target.value,
                      })
                    }
                    className="text-xs"
                  />
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
                  <Input
                    disabled
                    value={currentDossier.prospects?.apport || 0}
                    className="bg-muted/50 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Honoraires d'entrée (€)
                  </label>
                  <Input
                    type="number"
                    value={currentDossier.honoraires_droit_entree || ""}
                    onChange={(e) =>
                      setCurrentDossier({
                        ...currentDossier,
                        honoraires_droit_entree: Number(e.target.value),
                      })
                    }
                    placeholder="45000"
                    className="text-xs"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Loyer (€/an)
                  </label>
                  <Input
                    type="number"
                    value={currentDossier.loyer || ""}
                    onChange={(e) =>
                      setCurrentDossier({
                        ...currentDossier,
                        loyer: Number(e.target.value),
                      })
                    }
                    placeholder="35000"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Charges (€/an)
                  </label>
                  <Input
                    type="number"
                    value={currentDossier.charges || ""}
                    onChange={(e) =>
                      setCurrentDossier({
                        ...currentDossier,
                        charges: Number(e.target.value),
                      })
                    }
                    placeholder="3000"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Nom de la banque
                  </label>
                  <Input
                    value={currentDossier.nom_banque || ""}
                    onChange={(e) =>
                      setCurrentDossier({ ...currentDossier, nom_banque: e.target.value })
                    }
                    placeholder="ex: BNP Paribas"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Statut Financement
                  </label>
                  <select
                    value={currentDossier.statut_financement || "En cours"}
                    onChange={(e) =>
                      setCurrentDossier({ ...currentDossier, statut_financement: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="Oui">Oui (Accordé)</option>
                    <option value="Non">Non (Refusé)</option>
                    <option value="En cours">En cours de montage</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BLOC 3 : Local, Territoire & Commentaires */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Map className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Local & Territoire</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Adresse complète du local
                  </label>
                  <Input
                    value={currentDossier.adresse_local || ""}
                    onChange={(e) =>
                      setCurrentDossier({ ...currentDossier, adresse_local: e.target.value })
                    }
                    placeholder="ex: 14 Rue de la République..."
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Surface (m²)
                  </label>
                  <Input
                    type="number"
                    value={currentDossier.surface_local || ""}
                    onChange={(e) =>
                      setCurrentDossier({ ...currentDossier, surface_local: Number(e.target.value) })
                    }
                    placeholder="85"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Zone d'exclusivité
                </label>
                <Input
                  value={currentDossier.zone_exclusivite || ""}
                  onChange={(e) =>
                    setCurrentDossier({ ...currentDossier, zone_exclusivite: e.target.value })
                  }
                  placeholder="ex: Lyon 6e — 2,5 km autour de la Place Bellecour"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Zone de 1er refus
                </label>
                <Input
                  value={currentDossier.zone_premier_refus || ""}
                  onChange={(e) =>
                    setCurrentDossier({ ...currentDossier, zone_premier_refus: e.target.value })
                  }
                  placeholder="ex: Lyon 3e et Villeurbanne centre"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Commentaires & Remarques
                </label>
                <textarea
                  rows={3}
                  value={currentDossier.commentaire || ""}
                  onChange={(e) =>
                    setCurrentDossier({ ...currentDossier, commentaire: e.target.value })
                  }
                  placeholder="Ajouter des précisions sur le projet, travaux, échanges..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* BLOC 4 : Coffre-fort Documentaire */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Coffre-fort Documentaire</h3>
                </div>
                <Badge variant={docsUploadedCount === 7 ? "default" : "secondary"}>
                  {docsUploadedCount}/7
                </Badge>
              </div>

              <div className="space-y-2">
                {allDocKeys.map(({ key, label }) => {
                  const url = currentDossier[key]
                  const isOptional = key === "autres_documents_url"
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                        isOptional ? "border-dashed border-border/60 bg-muted/20" : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            url ? "text-emerald-500" : "text-muted-foreground/30"
                          }`}
                        />
                        <span className={`font-medium ${isOptional ? "text-muted-foreground italic" : "text-foreground"}`}>
                          {label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {url ? (
                          <>
                            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                              Validé
                            </Badge>
                            <a
                              href={String(url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-[11px]"
                            >
                              Voir
                            </a>
                          </>
                        ) : (
                          <label className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium">
                            <Upload className="h-3 w-3" />
                            <span>Ajouter</span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(key, file)
                              }}
                            />
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
          <p className="text-sm text-muted-foreground">
            Sélectionne ou crée un dossier dans la colonne de gauche pour afficher les détails.
          </p>
        </div>
      )}
    </div>
  )
}