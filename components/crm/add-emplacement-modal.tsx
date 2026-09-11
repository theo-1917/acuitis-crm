"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { X } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  prospect: { id: number; prenom: string; nom: string } | null;
  onSuccess?: () => void;
};

export function AddEmplacementModal({ isOpen, onClose, prospect, onSuccess }: Props) {
  const [villes, setVilles] = useState("");
  const [typeZone, setTypeZone] = useState("tous");
  const [timing, setTiming] = useState("");
  const [surface, setSurface] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !prospect) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("emplacements").insert([
      {
        prospect_id: prospect.id,
        villes_recherchees: villes,
        type_zone: typeZone,
        timing_projet: timing,
        surface_souhaitee_m2: surface ? Number(surface) : null,
        commentaire_interne: commentaire,
        statut_recherche: "en_recherche",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      // Réinitialisation du formulaire
      setVilles("");
      setTiming("");
      setSurface("");
      setCommentaire("");
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-950 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <h2 className="text-lg font-semibold">Lancer une recherche de local</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Candidat : <span className="font-semibold text-white">{prospect.prenom} {prospect.nom}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Villes ou zones recherchées *
            </label>
            <input
              type="text"
              required
              placeholder="ex : Rennes, Vannes, Saint-Malo"
              value={villes}
              onChange={(e) => setVilles(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Type de zone
              </label>
              <select
                value={typeZone}
                onChange={(e) => setTypeZone(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
              >
                <option value="tous">Tous types</option>
                <option value="centre_ville">Centre-ville</option>
                <option value="centre_co">Centre commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Surface souhaitée (m²)
              </label>
              <input
                type="number"
                placeholder="ex : 80"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Timing / Horizon d'ouverture
            </label>
            <input
              type="text"
              placeholder="ex : Q1 2027, Immédiat…"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Commentaire interne
            </label>
            <textarea
              rows={2}
              placeholder="Remarques particulières…"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-white text-black rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Enregistrement…" : "Ajouter la recherche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}