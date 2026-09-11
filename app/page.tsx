"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/crm/dashboard";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login"); // Bloque et renvoie vers la connexion
      } else {
        setIsAuthorized(true); // Autorise l'affichage
      }
    };
    checkAuth();
  }, [router]);

  // Écran noir le temps de vérifier la sécurité (fraction de seconde)
  if (!isAuthorized) return <div className="min-h-screen bg-black"></div>;

  // Si l'utilisateur est connecté, on affiche le CRM
  return <Dashboard />;
}