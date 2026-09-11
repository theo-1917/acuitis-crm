"use client"

import { Bell, Plus, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          A
        </div>
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-semibold text-foreground">
            Acuitis CRM
          </span>
          <span className="text-[11px] text-muted-foreground">
            Développement Réseau
          </span>
        </div>
      </div>

      <div className="relative ml-4 hidden w-full max-w-sm md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un prospect, une ville, un local…"
          aria-label="Recherche globale"
          className="h-9 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
        </Button>
        <Button>
          <Plus data-icon="inline-start" />
          Ajouter un Prospect
        </Button>
        <Avatar className="ml-1 size-9">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            MD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
