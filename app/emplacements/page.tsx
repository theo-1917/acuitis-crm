"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { FolderPlus, Trash2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmplacementWithProspect = {
  id: number;
  prospect_id: number;
  villes_recherchees: string;
  type_zone: string;
  timing_projet: string;
  surface_souhaitee_m2: number;
  statut_recherche: string;
  prospects: {
    id: number;
    name?: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    metier?: string;
    apport?: number;
  } | null;
};

export default function EmplacementsPage() {
  const router = useRouter();
  const [data, setData] = useState<EmplacementWithProspect[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmplacements = async () => {
    const { data: emplacementsData, error } = await supabase
      .from("emplacements")
      .select("*, prospects(*)");

    if (error) {
      console.error("Erreur de récupération :", error);
    } else {
      setData(emplacementsData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      await fetchEmplacements();
    };

    checkAuthAndFetch();
  }, [router]);

  // Action : Supprimer une recherche d'emplacement
  const handleSupprimer = async (id: number) => {
    if (!confirm("Voulez-vous vraiment retirer cette recherche d'emplacement ?")) return;

    const { error } = await supabase.from("emplacements").delete().eq("id", id);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      setData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Action : Basculer vers Dossiers & Projets (et supprimer des emplacements)
  const handlePasserEnDossier = async (item: EmplacementWithProspect) => {
    const nomCandidat =
      item.prospects?.name ||
      `${item.prospects?.prenom || ""} ${item.prospects?.nom || ""}`.trim() ||
      "ce candidat";

    const adresseExacte = prompt(
      `Saisissez l'adresse du local trouvé pour ${nomCandidat} :`,
      item.villes_recherchees
    );

    if (adresseExacte === null) return; // Annulation par l'utilisateur

    // 1. Création du dossier dans la table dossiers
    const { error: dossierError } = await supabase.from("dossiers").insert([
      {
        prospect_id: item.prospect_id,
        adresse_local: adresseExacte,
        surface_local: item.surface_souhaitee_m2 || 0,
        statut_dossier: "En cours",
        statut_financement: "En cours",
      },
    ]);

    if (dossierError) {
      alert("Erreur lors de la création du dossier projet : " + dossierError.message);
      return;
    }

    // 2. Suppression de l'emplacement
    const { error: deleteError } = await supabase
      .from("emplacements")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      alert("Le dossier a été créé mais une erreur est survenue lors du retrait de l'emplacement.");
    } else {
      alert(`Dossier créé avec succès pour ${nomCandidat} ! La recherche a été retirée.`);
      setData((prev) => prev.filter((emp) => emp.id !== item.id));
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const headers = [
      "Villes recherchees",
      "Type de zone",
      "Timing projet",
      "Surface souhaitee (m2)",
    ];

    const rows = data.map((item) => [
      `"${item.villes_recherchees || ""}"`,
      `"${item.type_zone || ""}"`,
      `"${item.timing_projet || ""}"`,
      `"${item.surface_souhaitee_m2 || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `export_agents_acuitis_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-400 hover:text-white mb-2 inline-block transition"
            >
              ← Retour au Tableau de bord
            </button>
            <h1 className="text-3xl font-bold">Recherche d'emplacements</h1>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            📄 Export Agents Immobiliers (CSV)
          </button>
        </div>

        <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950 text-gray-400">
                <th className="p-4">Candidat</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Métier / Apport</th>
                <th className="p-4">Villes recherchées</th>
                <th className="p-4">Zone</th>
                <th className="p-4">Timing</th>
                <th className="p-4">Surface</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    Aucune recherche d'emplacement en cours.
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const prospect = item.prospects;
                  const nomAffiche = prospect
                    ? prospect.name ||
                      `${prospect.prenom || ""} ${prospect.nom || ""}`.trim() ||
                      "Candidat sans nom"
                    : "Candidat inconnu";

                  return (
                    <tr key={item.id} className="hover:bg-gray-800/50">
                      <td className="p-4 font-medium">{nomAffiche}</td>
                      <td className="p-4 text-gray-300">
                        <div>{prospect?.telephone || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {prospect?.email || "-"}
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">
                        <div>{prospect?.metier || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {prospect?.apport
                            ? `${prospect.apport.toLocaleString()} €`
                            : "-"}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-white">
                        {item.villes_recherchees}
                      </td>
                      <td className="p-4 text-gray-300 uppercase text-xs font-mono">
                        {item.type_zone || "Tous"}
                      </td>
                      <td className="p-4 text-gray-300">
                        {item.timing_projet || "-"}
                      </td>
                      <td className="p-4 text-gray-300">
                        {item.surface_souhaitee_m2
                          ? `${item.surface_souhaitee_m2} m²`
                          : "-"}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-300 border border-blue-800">
                          {item.statut_recherche || "en_recherche"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePasserEnDossier(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
                            title="Créer le dossier et retirer de la recherche"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            Passer en Projet
                          </button>
                          <button
                            onClick={() => handleSupprimer(item.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition"
                            title="Retirer la recherche"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}