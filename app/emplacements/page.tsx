"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmplacementWithProspect = {
  id: number;
  villes_recherchees: string;
  type_zone: string;
  timing_projet: string;
  surface_souhaitee_m2: number;
  statut_recherche: string;
  prospects: {
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

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

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

    checkAuthAndFetch();
  }, [router]);

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const headers = ["Villes recherchees", "Type de zone", "Timing projet", "Surface souhaitee (m2)"];
    
    const rows = data.map((item) => [
      `"${item.villes_recherchees || ""}"`,
      `"${item.type_zone || ""}"`,
      `"${item.timing_projet || ""}"`,
      `"${item.surface_souhaitee_m2 || ""}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_agents_acuitis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">Chargement…</div>;
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    Aucun emplacement en cours de recherche.
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const prospect = item.prospects;
                  const nomAffiche = prospect
                    ? prospect.name || `${prospect.prenom || ""} ${prospect.nom || ""}`.trim() || "Candidat sans nom"
                    : "Candidat inconnu";

                  return (
                    <tr key={item.id} className="hover:bg-gray-800/50">
                      <td className="p-4 font-medium">{nomAffiche}</td>
                      <td className="p-4 text-gray-300">
                        <div>{prospect?.telephone || "-"}</div>
                        <div className="text-xs text-gray-500">{prospect?.email || "-"}</div>
                      </td>
                      <td className="p-4 text-gray-300">
                        <div>{prospect?.metier || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {prospect?.apport ? `${prospect.apport.toLocaleString()} €` : "-"}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-white">{item.villes_recherchees}</td>
                      <td className="p-4 text-gray-300 uppercase text-xs font-mono">{item.type_zone || "Tous"}</td>
                      <td className="p-4 text-gray-300">{item.timing_projet || "-"}</td>
                      <td className="p-4 text-gray-300">
                        {item.surface_souhaitee_m2 ? `${item.surface_souhaitee_m2} m²` : "-"}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-300 border border-blue-800">
                          {item.statut_recherche || "en_recherche"}
                        </span>
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