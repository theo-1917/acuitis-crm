"use client"

import { useState } from "react"
import { Calculator, Euro, TrendingUp, Building, Users, FileText, Plus, Trash2, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Employee = { id: number; role: string; netMonthly: number; type: "1.44" | "1.33"; isARE: boolean }

export function RoiSimulator() {
  // === ÉTATS : HYPOTHÈSES GÉNÉRALES ===
  const [caOptiqueY1, setCaOptiqueY1] = useState(300000)
  const [caAudioY1, setCaAudioY1] = useState(150000)
  
  const [growthY2, setGrowthY2] = useState(20)
  const [growthY3, setGrowthY3] = useState(15)
  const [growthY4, setGrowthY4] = useState(10)
  const [growthY5, setGrowthY5] = useState(5)
  
  const [marge, setMarge] = useState(64) // Curseur 62-70%

  // === ÉTATS : INVESTISSEMENTS ===
  const [travaux, setTravaux] = useState(250000)
  const [fraisArchi, setFraisArchi] = useState(28000)
  const [brokers, setBrokers] = useState(10000)
  const [debours, setDebours] = useState(3000)
  const [materielHorsLeasing, setMaterielHorsLeasing] = useState(10000)
  const [cautionMois, setCautionMois] = useState(3)
  const [fraisPreouv, setFraisPreouv] = useState(15000)
  const [bfr, setBfr] = useState(20000)
  const [droitEntree, setDroitEntree] = useState(30000)
  const [stockDemarrage, setStockDemarrage] = useState(50000)

  // === ÉTATS : FRAIS FIXES & LEASING ===
  const [loyerAnnuel, setLoyerAnnuel] = useState(36000)
  const [abattementY1, setAbattementY1] = useState(0)
  const [abattementY2, setAbattementY2] = useState(0)
  const [chargesLocal, setChargesLocal] = useState(3000)
  const [materielLeasing, setMaterielLeasing] = useState(100000)

  // === ÉTATS : FINANCEMENT ===
  const [apport, setApport] = useState(80000)
  const [tauxEmprunt, setTauxEmprunt] = useState(3.5)
  const [dureeEmprunt, setDureeEmprunt] = useState(7)
  const [decalageMois, setDecalageMois] = useState(6) // Franchise en capital

  // === ÉTATS : RH (SALAIRES) ===
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, role: "Opticien / Directeur", netMonthly: 2500, type: "1.33", isARE: true },
    { id: 2, role: "Audioprothésiste", netMonthly: 3000, type: "1.44", isARE: false }
  ])

  const addEmployee = () => setEmployees([...employees, { id: Date.now(), role: "Opticien", netMonthly: 2000, type: "1.44", isARE: false }])
  const removeEmployee = (id: number) => setEmployees(employees.filter(e => e.id !== id))
  const updateEmployee = (id: number, field: string, value: any) => setEmployees(employees.map(e => e.id === id ? { ...e, [field]: value } : e))

  // ==========================================
  // MOTEUR DE CALCUL MATHÉMATIQUE
  // ==========================================

  // 1. PROJECTION DU CA
  const caY1 = caOptiqueY1 + caAudioY1
  const caY2 = caY1 * (1 + growthY2 / 100)
  const caY3 = caY2 * (1 + growthY3 / 100)
  const caY4 = caY3 * (1 + growthY4 / 100)
  const caY5 = caY4 * (1 + growthY5 / 100)

  // 2. INVESTISSEMENT & EMPRUNT (Avec différé d'amortissement)
  const loyerMensuel = loyerAnnuel / 12
  const caution = loyerMensuel * cautionMois
  const totalInvestissement = travaux + fraisArchi + brokers + debours + materielHorsLeasing + caution + fraisPreouv + bfr + droitEntree + stockDemarrage
  const montantEmprunt = Math.max(0, totalInvestissement - apport)
  
  const tauxMensuel = (tauxEmprunt / 100) / 12
  const nbMoisAmortissementPlein = (dureeEmprunt * 12) - decalageMois // ex: 78 mois
  
  // Mensualité pleine (Capital + Intérêts) sur la durée restante
  const mensualitePleine = tauxMensuel === 0 ? montantEmprunt / nbMoisAmortissementPlein : (montantEmprunt * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -nbMoisAmortissementPlein))
  
  // Pendant les 6 mois de décalage, on ne paie que les intérêts
  const interetSeulMensuel = montantEmprunt * tauxMensuel
  
  // Annuité Cash (Ce qui sort de la tréso)
  const annuiteCashY1 = (decalageMois * interetSeulMensuel) + ((12 - decalageMois) * mensualitePleine)
  const annuiteCashPleine = 12 * mensualitePleine

  // 3. FRAIS ACUITIS (Variables)
  // Royalties 1% (min 5k) + Com Nat 3% + Com Loc 3% + Frais Gen 3% + Autres Frais Gen 5%
  // Total Variable : 14% + le 1% (soumis au min 5000€)
  const calcFraisVariables = (ca: number) => Math.max(5000, ca * 0.01) + (ca * 0.14)

  // 4. LEASING & SALAIRES
  const leasingAnnuel = materielLeasing / 5
  const calcSalaires = (isY1: boolean) => employees.reduce((tot, emp) => tot + ((isY1 && emp.isARE) ? 0 : (emp.netMonthly * 12) * parseFloat(emp.type)), 0)

  // 5. P&L (COMPTE DE RÉSULTAT)
  const generatePnL = (ca: number, yearIdx: number) => {
    const isY1 = yearIdx === 1
    const isY2 = yearIdx === 2
    
    const margeBrute = ca * (marge / 100)
    
    let loyerEffectif = loyerAnnuel
    if (isY1) loyerEffectif -= abattementY1
    if (isY2) loyerEffectif -= abattementY2

    const salaires = calcSalaires(isY1)
    const fraisVariables = calcFraisVariables(ca)
    const totalFraisFixesEtVariables = loyerEffectif + chargesLocal + fraisVariables + leasingAnnuel + salaires

    const ebitda = margeBrute - totalFraisFixesEtVariables

    // Amortissements linéaires simplifiés sur 7 ans (Capex pur)
    const dotationsAmortissements = (travaux + fraisArchi + materielHorsLeasing + droitEntree) / 7
    // Intérêts bancaires (simplifié P&L)
    const interets = montantEmprunt * (tauxEmprunt / 100) * (1 - ((yearIdx-1)/dureeEmprunt)) 
    
    const rai = ebitda - dotationsAmortissements - interets
    const impot = isY1 ? 0 : (rai > 0 ? rai * 0.25 : 0) // Pas d'IS en Y1, 25% ensuite
    
    return { margeBrute, totalFraisFixesEtVariables, ebitda, resultatNet: rai - impot, annuiteCash: isY1 ? annuiteCashY1 : annuiteCashPleine }
  }

  const pnlY1 = generatePnL(caY1, 1)
  const pnlY2 = generatePnL(caY2, 2)
  const pnlY3 = generatePnL(caY3, 3)
  const pnlY4 = generatePnL(caY4, 4)
  const pnlY5 = generatePnL(caY5, 5)

  // 6. SEUIL DE RENTABILITÉ CASH (Point mort de trésorerie)
  // SR = Frais Fixes Cash / Taux de Marge Contributive (Marge - Frais Variables %)
  const calcSeuilRentabilite = (ca: number, pnl: any, isY1: boolean, isY2: boolean) => {
    const variableCosts = calcFraisVariables(ca)
    const tmcDecimal = (pnl.margeBrute - variableCosts) / ca // Ex: 64% - 15% = 49%
    
    let loyerEffectif = loyerAnnuel
    if (isY1) loyerEffectif -= abattementY1
    if (isY2) loyerEffectif -= abattementY2

    const fraisFixesCash = loyerEffectif + chargesLocal + calcSalaires(isY1) + leasingAnnuel + pnl.annuiteCash
    return fraisFixesCash / Math.max(0.01, tmcDecimal)
  }

  const srY1 = calcSeuilRentabilite(caY1, pnlY1, true, false)
  const srY2 = calcSeuilRentabilite(caY2, pnlY2, false, true)
  const srY3 = calcSeuilRentabilite(caY3, pnlY3, false, false)

  // Formatage monétaire
  const f = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="flex flex-col gap-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary"><Calculator className="h-6 w-6" /></div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Simulateur d'Investissement & ROI</h2>
            <p className="text-sm text-muted-foreground">BP Complet : Investissement, Financement, Seuils de Rentabilité et P&L à 5 ans.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Investissement Total</span>
            <span className="text-xl font-bold text-foreground">{f(totalInvestissement)}</span>
          </div>
          <div className="w-px bg-border my-1"></div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Besoin d'Emprunt</span>
            <span className="text-xl font-bold text-blue-500">{f(montantEmprunt)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* COLONNE GAUCHE : LES INPUTS (7 colonnes) */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          
          {/* 1. PRÉVISIONS CA & MARGE */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3 mb-4"><TrendingUp className="h-4 w-4 text-primary" /> 1. Prévisions CA & Marge</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div className="space-y-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">CA Optique Y1 (HT 20%)</label><Input type="number" value={caOptiqueY1} onChange={e => setCaOptiqueY1(Number(e.target.value))} className="text-xs font-semibold text-blue-500" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">CA Audio Y1 (HT 5.5%)</label><Input type="number" value={caAudioY1} onChange={e => setCaAudioY1(Number(e.target.value))} className="text-xs font-semibold text-emerald-500" /></div>
              </div>
              
              <div className="md:col-span-2 bg-muted/20 p-4 rounded-lg border border-border flex flex-col justify-center">
                <label className="text-xs font-bold text-foreground mb-3 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary"/> Marge Brute Moyenne ciblée : <span className="text-primary text-lg">{marge}%</span></label>
                <input type="range" min="62" max="70" step="0.5" value={marge} onChange={e => setMarge(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>62%</span><span>66%</span><span>70%</span></div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 border-t border-border pt-4">
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y2 (%)</label><Input type="number" value={growthY2} onChange={e => setGrowthY2(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y3 (%)</label><Input type="number" value={growthY3} onChange={e => setGrowthY3(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y4 (%)</label><Input type="number" value={growthY4} onChange={e => setGrowthY4(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y5 (%)</label><Input type="number" value={growthY5} onChange={e => setGrowthY5(Number(e.target.value))} className="text-xs" /></div>
            </div>
          </div>

          {/* 2. INVESTISSEMENTS (CAPEX) */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3 mb-4"><Euro className="h-4 w-4 text-primary" /> 2. Investissements de départ (HT)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Travaux & Aménag.</label><Input type="number" value={travaux} onChange={e => setTravaux(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Frais Architecte/Pilote</label><Input type="number" value={fraisArchi} onChange={e => setFraisArchi(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Honoraires Brokers</label><Input type="number" value={brokers} onChange={e => setBrokers(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Débours Architecte</label><Input type="number" value={debours} onChange={e => setDebours(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Matériel (Hors Leasing)</label><Input type="number" value={materielHorsLeasing} onChange={e => setMaterielHorsLeasing(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Stock de démarrage</label><Input type="number" value={stockDemarrage} onChange={e => setStockDemarrage(Number(e.target.value))} className="text-xs border-amber-500/30" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Frais Pré-Ouverture</label><Input type="number" value={fraisPreouv} onChange={e => setFraisPreouv(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Droit d'entrée Franchise</label><Input type="number" value={droitEntree} onChange={e => setDroitEntree(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">BFR (Trésorerie départ)</label><Input type="number" value={bfr} onChange={e => setBfr(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Dépôt garantie (Nb mois)</label><Input type="number" value={cautionMois} onChange={e => setCautionMois(Number(e.target.value))} className="text-xs" /></div>
            </div>
          </div>

          {/* 3. FINANCEMENT BANCAIRE */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-900/5 p-5">
            <h3 className="font-semibold text-blue-500 text-sm flex items-center gap-2 border-b border-blue-500/20 pb-3 mb-4"><Landmark className="h-4 w-4" /> 3. Financement Bancaire</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-[11px] text-foreground mb-1 block font-bold">Apport Personnel (€)</label><Input type="number" value={apport} onChange={e => setApport(Number(e.target.value))} className="text-xs border-blue-500/50" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Taux d'emprunt (%)</label><Input type="number" value={tauxEmprunt} step="0.1" onChange={e => setTauxEmprunt(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Durée (Années)</label><Input type="number" value={dureeEmprunt} onChange={e => setDureeEmprunt(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Franchise décalage (Mois)</label><Input type="number" value={decalageMois} onChange={e => setDecalageMois(Number(e.target.value))} className="text-xs" title="Mois durant lesquels seul l'intérêt est remboursé" /></div>
            </div>
          </div>

          {/* 4. FRAIS FIXES & LEASING */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3 mb-4"><Building className="h-4 w-4 text-primary" /> 4. Local & Leasing</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border-b border-border pb-4">
              <div><label className="text-[11px] text-muted-foreground mb-1 block font-bold">Loyer Annuel (€)</label><Input type="number" value={loyerAnnuel} onChange={e => setLoyerAnnuel(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Charges Locales (€)</label><Input type="number" value={chargesLocal} onChange={e => setChargesLocal(Number(e.target.value))} className="text-xs" /></div>
              <div><label className="text-[11px] text-amber-500 mb-1 block">Abattement Loyer Y1 (€)</label><Input type="number" value={abattementY1} onChange={e => setAbattementY1(Number(e.target.value))} className="text-xs border-amber-500/30 bg-amber-500/5" /></div>
              <div><label className="text-[11px] text-amber-500 mb-1 block">Abattement Loyer Y2 (€)</label><Input type="number" value={abattementY2} onChange={e => setAbattementY2(Number(e.target.value))} className="text-xs border-amber-500/30 bg-amber-500/5" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Matériel en Leasing (Amorti sur 5 ans)</label><Input type="number" value={materielLeasing} onChange={e => setMaterielLeasing(Number(e.target.value))} className="text-xs" /></div>
              <div className="bg-muted/30 p-2 rounded flex flex-col justify-center border border-border">
                <span className="text-[10px] text-muted-foreground font-semibold">Frais Variables Acuitis (Vérrouillés)</span>
                <span className="text-xs">1% Royalties (Min 5k) + 6% Com (Nat/Loc)<br/>+ 8% Frais Généraux (Fixes/Autres)</span>
              </div>
            </div>
          </div>

          {/* 5. RESSOURCES HUMAINES */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 5. Salaires & RH</h3>
              <Button variant="outline" size="sm" onClick={addEmployee} className="h-7 text-xs"><Plus className="mr-1 h-3 w-3" /> Ajouter</Button>
            </div>
            <div className="space-y-3">
              {employees.map((emp) => (
                <div key={emp.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border">
                  <Input value={emp.role} onChange={e => updateEmployee(emp.id, "role", e.target.value)} placeholder="Rôle" className="w-full md:w-1/3 text-xs h-8" />
                  <Input type="number" value={emp.netMonthly} onChange={e => updateEmployee(emp.id, "netMonthly", Number(e.target.value))} placeholder="Salaire Net Mensuel" className="w-full md:w-1/4 text-xs h-8" />
                  <select value={emp.type} onChange={e => updateEmployee(emp.id, "type", e.target.value)} className="w-full md:w-1/4 h-8 rounded-md border border-input bg-background px-2 text-[11px]">
                    <option value="1.44">Salarié (x1.44)</option>
                    <option value="1.33">TNS (x1.33)</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-[10px] whitespace-nowrap cursor-pointer px-2">
                    <input type="checkbox" checked={emp.isARE} onChange={e => updateEmployee(emp.id, "isARE", e.target.checked)} className="accent-primary" />
                    ARE (Gratuit Y1)
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => removeEmployee(emp.id)} className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 ml-auto"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLONNE DROITE : LES RÉSULTATS (5 colonnes) */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          
          {/* ENCART SEUIL RENTABILITÉ */}
          <div className="rounded-xl border-2 border-emerald-500/20 bg-card shadow-lg overflow-hidden shrink-0">
            <div className="bg-emerald-500/10 px-5 py-4 border-b border-emerald-500/20">
              <h3 className="font-bold text-emerald-500 flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Seuils de Rentabilité</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Chiffre d'affaires à atteindre pour couvrir l'ensemble des charges cash et annuités bancaires.</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center bg-background p-3 rounded border border-border">
                <span className="font-semibold text-sm">Année 1</span>
                <span className="text-lg font-bold text-foreground">{f(srY1)}</span>
              </div>
              <div className="flex justify-between items-center bg-background p-3 rounded border border-border">
                <span className="font-semibold text-sm">Année 2</span>
                <span className="text-lg font-bold text-foreground">{f(srY2)}</span>
              </div>
              <div className="flex justify-between items-center bg-background p-3 rounded border border-border">
                <span className="font-semibold text-sm">Année 3</span>
                <span className="text-lg font-bold text-foreground">{f(srY3)}</span>
              </div>
            </div>
          </div>

          {/* ENCART RENTABILITÉ & ROI */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex-1 flex flex-col">
            <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3 mb-4"><FileText className="h-5 w-5 text-primary" /> Synthèse Rentabilité (P&L à 5 ans)</h3>
            
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="pb-2 w-32">Indicateur</th>
                    <th className="pb-2 text-right">Y1</th>
                    <th className="pb-2 text-right">Y2</th>
                    <th className="pb-2 text-right">Y3</th>
                    <th className="pb-2 text-right">Y4</th>
                    <th className="pb-2 text-right">Y5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2 text-muted-foreground">C.A. Total HT</td><td className="py-2 text-right font-medium">{f(caY1)}</td><td className="py-2 text-right font-medium">{f(caY2)}</td><td className="py-2 text-right font-medium">{f(caY3)}</td><td className="py-2 text-right font-medium">{f(caY4)}</td><td className="py-2 text-right font-medium">{f(caY5)}</td></tr>
                  <tr><td className="py-2 text-muted-foreground">Marge Brute</td><td className="py-2 text-right text-emerald-500">{f(pnlY1.margeBrute)}</td><td className="py-2 text-right text-emerald-500">{f(pnlY2.margeBrute)}</td><td className="py-2 text-right text-emerald-500">{f(pnlY3.margeBrute)}</td><td className="py-2 text-right text-emerald-500">{f(pnlY4.margeBrute)}</td><td className="py-2 text-right text-emerald-500">{f(pnlY5.margeBrute)}</td></tr>
                  <tr className="bg-muted/10"><td className="py-2 font-bold pl-1">EBITDA</td><td className="py-2 text-right font-bold">{f(pnlY1.ebitda)}</td><td className="py-2 text-right font-bold">{f(pnlY2.ebitda)}</td><td className="py-2 text-right font-bold">{f(pnlY3.ebitda)}</td><td className="py-2 text-right font-bold">{f(pnlY4.ebitda)}</td><td className="py-2 text-right font-bold">{f(pnlY5.ebitda)}</td></tr>
                  <tr><td className="py-2 text-muted-foreground">Sortie Cash Emprunt</td><td className="py-2 text-right text-amber-500">-{f(pnlY1.annuiteCash)}</td><td className="py-2 text-right text-amber-500">-{f(pnlY2.annuiteCash)}</td><td className="py-2 text-right text-amber-500">-{f(pnlY3.annuiteCash)}</td><td className="py-2 text-right text-amber-500">-{f(pnlY4.annuiteCash)}</td><td className="py-2 text-right text-amber-500">-{f(pnlY5.annuiteCash)}</td></tr>
                  <tr><td className="py-2 text-muted-foreground font-bold">RÉSULTAT NET</td><td className={`py-2 text-right font-bold ${pnlY1.resultatNet < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{f(pnlY1.resultatNet)}</td><td className={`py-2 text-right font-bold ${pnlY2.resultatNet < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{f(pnlY2.resultatNet)}</td><td className={`py-2 text-right font-bold ${pnlY3.resultatNet < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{f(pnlY3.resultatNet)}</td><td className={`py-2 text-right font-bold ${pnlY4.resultatNet < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{f(pnlY4.resultatNet)}</td><td className={`py-2 text-right font-bold ${pnlY5.resultatNet < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{f(pnlY5.resultatNet)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* METRICS FINALES ROI */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mt-auto">
              <h4 className="text-sm font-bold text-primary mb-3">Analyse du R.O.I (Retour sur Apport)</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Apport Personnel de départ</span>
                  <span className="text-sm font-bold text-foreground">{f(apport)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Bénéfice Net Cumulé (5 ans)</span>
                  <span className="text-sm font-bold text-emerald-500">
                    {f(pnlY1.resultatNet + pnlY2.resultatNet + pnlY3.resultatNet + pnlY4.resultatNet + pnlY5.resultatNet)}
                  </span>
                </div>
                <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">R.O.I à 5 ans</span>
                  <Badge className="bg-primary hover:bg-primary text-white text-sm">
                    {apport > 0 ? (((pnlY1.resultatNet + pnlY2.resultatNet + pnlY3.resultatNet + pnlY4.resultatNet + pnlY5.resultatNet) / apport) * 100).toFixed(1) : 0} %
                  </Badge>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}