"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError("Identifiants incorrects.");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 bg-gray-900 border border-gray-800 rounded-xl w-96">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Acuitis CRM</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700"
          required
        />
        <button type="submit" className="p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 mt-2">
          Se connecter
        </button>
      </form>
    </div>
  );
}