"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, Plus, LogOut, Users, Loader2, X, Building2, DownloadCloud } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import JSZip from "jszip"

const COLUMNS = ["Nouveau", "Contacté", "RDV", "Validé", "Non qualifié", "Perdu"]
const PROVENANCES = ["Prospection téléphonique", "Site internet", "Contact SILMO", "Cooptation", "Bouche à oreille", "L'express franchise", "Recruteur", "Prospection linkedin", "Mailing", "Autre"]

export function Header() {
  const router = useRouter()
  
  // États utilisateur
  const [userInitials, setUserInitials] = useState("..")
  const [userEmail, setUserEmail] = useState("")

  // États recherche
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // États Cloche
  const [urgentCount, setUrgentCount] = useState(0)

  // États Menus & Backup
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)

  // Modal d'ajout rapide
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "", telephone: "", email: "", ville: "", apport: "", statut: "Nouveau", provenance: "Site internet", actif: true
  })

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
        setUserInitials(session.user.email.substring(0, 2).toUpperCase())
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchUrgentMissions = async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const inThreeDays = new Date(today)
        inThreeDays.setDate(today.getDate() + 3)

        const { data, error } = await supabase.from("missions").select("echeance").eq('terminee', false)
        if (!error && data) {
          const count = data.filter((m) => {
            if (!m.echeance) return false
            const dueDate = new Date(m.echeance)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate <= inThreeDays
          }).length
          setUrgentCount(count)
        }
      } catch (err) {
        console.error("Erreur missions :", err)
      }
    }
    fetchUrgentMissions()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }
      setIsSearching(true)
      try {
        const [{ data: prospects }, { data: locaux }] = await Promise.all([
          supabase.from('prospects').select('id, name, ville, email, statut').or(`name.ilike.%${searchQuery}%,ville.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(3),
          supabase.from('locaux_disponibles').select('id, ville, adresse, statut').or(`ville.ilike.%${searchQuery}%,adresse.ilike.%${searchQuery}%`).limit(3)
        ])
        const results = []
        if (prospects) prospects.forEach(p => results.push({ type: 'prospect', id: p.id, title: p.name, subtitle: p.ville || p.email, badge: p.statut }))
        if (locaux) locaux.forEach(l => results.push({ type: 'local', id: l.id, title: l.ville, subtitle: l.adresse, badge: l.statut }))
        
        setSearchResults(results)
        setShowSearchDropdown(true)
      } catch (err) { console.error("Erreur recherche :", err) }
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearchDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  // === FONCTION DE BACKUP COMPLET (Dossier ZIP) ===
  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      // 1. Aspiration de TOUTES les tables de la base de données
      const [prospectsReq, dossiersReq, locauxReq, missionsReq, emplacementsReq] = await Promise.all([
        supabase.from('prospects').select('*'),
        supabase.from('dossiers').select('*'),
        supabase.from('locaux_disponibles').select('*'),
        supabase.from('missions').select('*'),
        supabase.from('emplacements').select('*'),
      ])

      const zip = new JSZip()

      // Convertisseur en format Excel CSV
      const toCSV = (data: any[]) => {
        if (!data || data.length === 0) return ""
        const headers = Object.keys(data[0])
        const rows = data.map(row => headers.map(h => {
          const val = row[h]
          if (val === null || val === undefined) return '""'
          return `"${val.toString().replace(/"/g, '""')}"`
        }).join(";"))
        return [headers.join(";"), ...rows].join("\n")
      }

      // 2. Structuration du dossier compressé
      const f1 = zip.folder("1_Prospects_et_Candidats")
      f1?.file("tous_les_prospects.csv", "\uFEFF" + toCSV(prospectsReq.data || []))

      const f2 = zip.folder("2_Dossiers_et_Projets")
      f2?.file("dossiers_franchises.csv", "\uFEFF" + toCSV(dossiersReq.data || []))
      f2?.file("recherches_emplacements.csv", "\uFEFF" + toCSV(emplacementsReq.data || []))

      const f3 = zip.folder("3_Locaux_Disponibles")
      f3?.file("locaux_commerciaux.csv", "\uFEFF" + toCSV(locauxReq.data || []))

      const f4 = zip.folder("4_Missions")
      f4?.file("missions_et_rappels.csv", "\uFEFF" + toCSV(missionsReq.data || []))

      // 3. Ajout de la sauvegarde "Developpeur" (JSON pur)
      zip.file("sauvegarde_integrale_bdd.json", JSON.stringify({
        prospects: prospectsReq.data,
        dossiers: dossiersReq.data,
        locaux: locauxReq.data,
        missions: missionsReq.data,
        emplacements: emplacementsReq.data
      }, null, 2))

      // 4. Génération et téléchargement
      const content = await zip.generateAsync({ type: "blob" })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `Backup_Acuitis_CRM_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (e) {
      console.error("Erreur backup:", e)
      alert("Une erreur est survenue lors de la création de la sauvegarde.")
    }
    setIsBackingUp(false)
  }

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await supabase.from("prospects").insert([{
        ...formData,
        apport: formData.apport ? Number(formData.apport) : 0
    }])
    setIsSubmitting(false)

    if (!error) {
      alert(`Le prospect ${formData.name} a été ajouté avec succès !`)
      setShowAddModal(false)
      setFormData({ name: "", telephone: "", email: "", ville: "", apport: "", statut: "Nouveau", provenance: "Site internet", actif: true })
    } else { alert("Erreur lors de l'ajout : " + error.message) }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 relative z-40">
      
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-lg">A</div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold leading-tight text-foreground">Acuitis CRM</h1>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Développement Réseau</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6" ref={searchRef}>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un prospect, une ville, un local..." 
            className="w-full bg-muted/50 pl-10 border-border focus-visible:ring-primary h-10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true) }}
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />}

          {showSearchDropdown && (
            <div className="absolute top-12 left-0 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
              {searchResults.length === 0 && !isSearching ? (
                <div className="p-4 text-sm text-center text-muted-foreground">Aucun résultat trouvé.</div>
              ) : (
                <div className="flex flex-col py-2">
                  {searchResults.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer transition"
                      onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
                    >
                      <div className="flex items-center gap-3">
                        {item.type === 'prospect' ? <Users className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-emerald-500" />}
                        <div>
                          <div className="text-sm font-semibold text-foreground">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <Bell className="h-5 w-5" />
          {urgentCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-card">{urgentCount}</span>}
        </button>

        <Button size="sm" onClick={() => setShowAddModal(true)} className="hidden md:flex">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un Prospect
        </Button>

        <div className="relative">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-sm font-bold text-primary transition hover:border-primary uppercase"
          >
            {userInitials}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-64 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <p className="text-sm font-semibold text-foreground truncate" title={userEmail}>{userEmail || "Mon Compte"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Admin Réseau Acuitis</p>
              </div>
              
              <div className="flex flex-col p-1">
                <button 
                  type="button"
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="w-full flex items-center px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 rounded-md transition text-left cursor-pointer disabled:opacity-50"
                >
                  {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> : <DownloadCloud className="mr-2 h-4 w-4 text-primary" />}
                  {isBackingUp ? "Création du dossier ZIP..." : "Sauvegarder tout le CRM"}
                </button>
                
                <div className="h-px bg-border my-1 mx-2"></div>
                
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-md transition text-left cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-md font-semibold text-foreground">Ajout rapide de candidat</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleAddProspect} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nom complet *</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Téléphone</label>
                  <Input value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Ville souhaitée</label>
                  <Input value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Apport (€)</label>
                  <Input type="number" value={formData.apport} onChange={e => setFormData({...formData, apport: e.target.value})} className="text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-muted-foreground block mb-1">Statut</label>
                   <select 
                      value={formData.statut}
                      onChange={(e) => setFormData({...formData, statut: e.target.value})}
                      className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground"
                    >
                      {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                   <label className="text-xs text-muted-foreground block mb-1">Provenance (Source)</label>
                   <select 
                      value={formData.provenance}
                      onChange={(e) => setFormData({...formData, provenance: e.target.value})}
                      className="w-full text-xs bg-background border border-input rounded-md p-2 outline-none text-foreground"
                    >
                      {PROVENANCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="header-actif"
                    checked={formData.actif}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    className="rounded border-border accent-primary"
                  />
                  <label htmlFor="header-actif" className="text-xs text-foreground cursor-pointer">Prospect Actif</label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Ajout..." : "Créer le prospect"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}