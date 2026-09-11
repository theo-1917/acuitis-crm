"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckSquare,
  Clock,
  FolderKanban,
  ArrowRight,
  Users,
  MapPin,
  TrendingUp
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type KpiData = {
  prospectsCount: number
  emplacementsCount: number
  dossiersCount: number
  locauxCount: number
  missionsCount: number
}

type Mission = {
  id: number
  title: string
  priorite: string
  lie_a: string
  echeance: string
  terminee: boolean
}

type OverviewProps = {
  onNavigate?: (tab: string) => void
}

export function Overview({ onNavigate }: OverviewProps) {
  const router = useRouter()
  const [kpis, setKpis] = useState<KpiData>({ 
    prospectsCount: 0, 
    emplacementsCount: 0, 
    dossiersCount: 0, 
    locauxCount: 0, 
    missionsCount: 0 
  })
  const [urgentMissions, setUrgentMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)

    const [
      { count: prospectsCount },
      { count: emplacementsCount },
      { count: dossiersCount },
      { count: locauxCount },
      { data: missionsData }
    ] = await Promise.all([
      // ICI : on ne compte QUE les prospects où actif est true
      supabase.from("prospects").select("*", { count: "exact", head: true }).eq('actif', true),
      supabase.from("emplacements").select("*", { count: "exact", head: true }),
      supabase.from("dossiers").select("*", { count: "exact", head: true }).eq('statut_dossier', 'En cours'),
      supabase.from("locaux_disponibles").select("*", { count: "exact", head: true }).eq('statut', 'Disponible'),
      supabase.from("missions").select("*").eq('terminee', false)
    ])

    setKpis({
      prospectsCount: prospectsCount || 0,
      emplacementsCount: emplacementsCount || 0,
      dossiersCount: dossiersCount || 0,
      locauxCount: locauxCount || 0,
      missionsCount: missionsData ? missionsData.length : 0
    })

    if (missionsData) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const inThreeDays = new Date(today)
      inThreeDays.setDate(today.getDate() + 3)

      const urgent = missionsData.filter((m: Mission) => {
        if (!m.echeance) return false
        const dueDate = new Date(m.echeance)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate <= inThreeDays
      }).sort((a, b) => new Date(a.echeance).getTime() - new Date(b.echeance).getTime())

      setUrgentMissions(urgent)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getDaysRemainingInfo = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(dateStr)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: "En retard", color: "text-red-400 bg-red-500/10 border-red-500/20" }
    if (diffDays === 0) return { label: "Aujourd'hui", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
    if (diffDays === 1) return { label: "Demain", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
    return { label: `J-${diffDays}`, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
  }

  const goToTab = (tabValue: string) => {
    if (onNavigate) {
      onNavigate(tabValue)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement du tableau de bord…</div>
  }

  return (
    <div className="flex flex-col gap-6">
      
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vue d'ensemble</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenue sur ton espace. Voici le résumé de ton activité réseau.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold truncate">Prospects Actifs</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">{kpis.prospectsCount}</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold truncate">Recherches Locaux</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">{kpis.emplacementsCount}</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold truncate">Projets en cours</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">{kpis.dossiersCount}</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold truncate">Locaux Disponibles</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">{kpis.locauxCount}</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold truncate">Missions ouvertes</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">{kpis.missionsCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BLOC MISSIONS URGENTES */}
        <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-5 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 border-b border-red-500/10 pb-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-red-100 text-base">Missions urgentes (J-3)</h3>
            <Badge className="ml-auto bg-red-500 text-white hover:bg-red-600">
              {urgentMissions.length}
            </Badge>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[400px] pr-2">
            {urgentMissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                <CheckSquare className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Aucune mission urgente pour le moment.</p>
              </div>
            ) : (
              urgentMissions.map((mission) => {
                const info = getDaysRemainingInfo(mission.echeance)
                return (
                  <div key={mission.id} className="rounded-lg border border-border bg-background p-3 flex flex-col gap-2 transition hover:border-red-500/30">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-sm text-foreground leading-tight">
                        {mission.title}
                      </h4>
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${info.color}`}>
                        {info.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                       <span className="flex items-center gap-1">
                         <CalendarClock className="h-3.5 w-3.5" />
                         {new Date(mission.echeance).toLocaleDateString("fr-FR")}
                       </span>
                       <span className="truncate ml-4 max-w-[150px]" title={mission.lie_a}>
                         {mission.lie_a}
                       </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* BLOC RACCOURCIS & ACTIVITÉS */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-base">Raccourcis & Actions</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              onClick={() => goToTab('pipeline')}
              className="justify-start h-12 border-border bg-muted/20 hover:bg-muted/50"
            >
              <Users className="mr-3 h-4 w-4 text-primary" />
              Gérer les candidats (Pipeline)
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => goToTab('carte')}
              className="justify-start h-12 border-border bg-muted/20 hover:bg-muted/50"
            >
              <Building2 className="mr-3 h-4 w-4 text-primary" />
              Référencer un nouveau local
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => goToTab('missions')}
              className="justify-start h-12 border-border bg-muted/20 hover:bg-muted/50"
            >
              <CheckSquare className="mr-3 h-4 w-4 text-primary" />
              Créer une nouvelle mission
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="mt-8 rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
            <p className="text-sm font-medium text-primary mb-1">Simulateur de rentabilité</p>
            <p className="text-xs text-muted-foreground mb-3">Estimez la viabilité financière d'un projet pour un candidat franchisé.</p>
            <Button size="sm" className="w-full" onClick={() => goToTab('roi')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Ouvrir le simulateur ROI
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}