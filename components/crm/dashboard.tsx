"use client"

import { useRouter } from "next/navigation"
import {
  Building2,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Table2,
  TrendingUp,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dossiers } from "./dossiers"
import { Header } from "./header"
import { Missions } from "./missions"
import { NetworkMap } from "./network-map"
import { Overview } from "./overview"
import { ProspectsPipeline } from "./prospects-pipeline"
import { RoiSimulator } from "./roi-simulator"

export function Dashboard() {
  const router = useRouter()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Tabs
          defaultValue="overview"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 overflow-x-auto border-b border-border bg-card px-6">
            <TabsList variant="line" className="h-11">
              <TabsTrigger value="overview">
                <LayoutDashboard data-icon="inline-start" />
                Tableau de bord
              </TabsTrigger>
              <TabsTrigger value="pipeline">
                <Table2 data-icon="inline-start" />
                Pipeline Prospects
              </TabsTrigger>
              <TabsTrigger
                value="emplacements"
                onClick={() => router.push("/emplacements")}
              >
                <MapPin data-icon="inline-start" />
                Recherche d'emplacements
              </TabsTrigger>
              <TabsTrigger value="dossiers">
                <FolderKanban data-icon="inline-start" />
                Dossiers & Projets
              </TabsTrigger>
              <TabsTrigger value="carte">
                <Building2 data-icon="inline-start" />
                Recherche de candidat
              </TabsTrigger>
              <TabsTrigger value="missions">
                <CheckSquare data-icon="inline-start" />
                Missions
              </TabsTrigger>
              <TabsTrigger value="roi">
                <TrendingUp data-icon="inline-start" />
                Simulateur ROI
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <TabsContent value="overview" className="mt-0">
              <Overview />
            </TabsContent>
            <TabsContent value="pipeline" className="mt-0">
              <ProspectsPipeline />
            </TabsContent>
            <TabsContent value="dossiers" className="mt-0">
              <Dossiers />
            </TabsContent>
            <TabsContent value="carte" className="mt-0">
              <NetworkMap />
            </TabsContent>
            <TabsContent value="missions" className="mt-0">
              <Missions />
            </TabsContent>
            <TabsContent value="roi" className="mt-0">
              <RoiSimulator />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}