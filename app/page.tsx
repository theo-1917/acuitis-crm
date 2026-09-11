"use client"

import { useRouter } from "next/navigation"
import { LogOut, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          A
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Acuitis CRM</h1>
          <p className="text-xs text-muted-foreground">Développement Réseau</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un prospect, une ville..."
            className="pl-8 text-xs bg-background"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </header>
  )
}