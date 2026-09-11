"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  FileText,
  FolderKanban,
  Landmark,
  Map,
  Plus,
  Upload,
  User,
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
  dip_signe_url: string
  roi_url: string
  kbis_url: string
  rib_url: string
  etude_zone_url: string
  devis_travaux_url: string
  prospects?: Prospect
}

export function Dossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [prospectsWithoutDossier, setProspectsWithoutDossier] = useState<Prospect[]>([])
  const [selectedDossierId, setSelectedDossierId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Données du dossier sélectionné
  const [currentDossier, setCurrentDossier] = useState<Partial<Dossier>>({})

  const loadData = async () => {
    setLoading(true)
    const { data: dossiersData } = await supabase
      .from("dossiers")
      .select("*, prospects(*)")

    const { data: prospectsData } = await supabase
      .from("prospects")
      .select("*")

    if (dossiersData && dossiersData.length > 0) {
      setDossiers(dossiersData)
      if (!selectedDossierId) {
        setSelectedDossierId(dossiersData[0].id)
        setCurrentDossier(dossiersData[0])
      } else {
        const found = dossiersData.find((d) => d.id === selectedDossierId)
        if (found) setCurrentDossier(found)
      }
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
      .insert([{ prospect_id: prospectId, statut_financement: "En cours" }])
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
      })
      .eq("id", selectedDossierId)

    setSaving(false)
    if (!error) {
      await loadData()
      alert("Modifications enregistrées avec succès !")
    } else {
      alert("Erreur lors de la sauvegarde : " + error.message)
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
      alert("Erreur lors de la mise à jour du lien du document.")
    }
  }

  // Calcul du nombre de documents validés (x/6)
  const docKeys: (keyof Dossier)[] = [
    "dip_signe_url",
    "roi_url",
    "kbis_url",
    "rib_url",
    "etude_zone_url",
    "devis_travaux_url",
  ]
  const docsUploadedCount = docKeys.filter((k) => !!currentDossier[k]).length

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement des dossiers…</div>
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Sidebar gauche : Liste des candidats */}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                    {d.prospects?.name?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {d.prospects?.name || "Candidat sans nom"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.prospects?.ville || "Ville non précisée"}
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

        {/* Option pour rattacher un candidat sans dossier */}
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

      {/* Zone principale : Les 4 blocs de la maquette */}
      {selectedDossierId && currentDossier ? (
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Dossier de {currentDossier.prospects?.name}
            </h2>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Sauvegarder les modifications"}
            </Button>
          </div>

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
                    Honoraires / Droit d'entrée (€)
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

            {/* BLOC 3 : Territoire */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Map className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Territoire</h3>
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
            </div>

            {/* BLOC 4 : Coffre-fort Documentaire */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Coffre-fort Documentaire</h3>
                </div>
                <Badge variant={docsUploadedCount === 6 ? "default" : "secondary"}>
                  {docsUploadedCount}/6
                </Badge>
              </div>

              <div className="space-y-2">
                {[
                  { key: "dip_signe_url", label: "DIP signé" },
                  { key: "roi_url", label: "ROI" },
                  { key: "kbis_url", label: "Kbis" },
                  { key: "rib_url", label: "RIB" },
                  { key: "etude_zone_url", label: "Étude de zone" },
                  { key: "devis_travaux_url", label: "Devis travaux" },
                ].map(({ key, label }) => {
                  const url = currentDossier[key as keyof Dossier]
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-lg border border-border bg-background text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            url ? "text-emerald-500" : "text-muted-foreground/30"
                          }`}
                        />
                        <span className="font-medium text-foreground">{label}</span>
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
                                if (file) handleFileUpload(key as keyof Dossier, file)
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