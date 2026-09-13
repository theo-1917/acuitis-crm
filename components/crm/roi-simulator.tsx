"use client"

import { useState } from "react"
import { Calculator, Euro, TrendingUp, Building, Users, FileText, Plus, Trash2, SlidersHorizontal, Landmark, FileSpreadsheet, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Employee = { id: number; role: string; netMonthly: number; type: "1.44" | "1.33"; isARE: boolean; startYear: number }

export function RoiSimulator() {
  // === ÉTATS : HYPOTHÈSES GÉNÉRALES ===
  const [caOptiqueHT, setCaOptiqueHT] = useState(300000)
  const [caAudioHT, setCaAudioHT] = useState(150000)
  
  const [growthY2, setGrowthY2] = useState(20)
  const [growthY3, setGrowthY3] = useState(15)
  const [growthY4, setGrowthY4] = useState(10)
  const [growthY5, setGrowthY5] = useState(5)
  
  const [marge, setMarge] = useState(64)

  // === ÉTATS : INVESTISSEMENTS ===
  const [travaux, setTravaux] = useState(250000)
  const [fraisArchi, setFraisArchi] = useState(28000)
  const [brokers, setBrokers] = useState(10000)
  const [debours, setDebours] = useState(3000)
  const [fraisJuridiques, setFraisJuridiques] = useState(3000)
  const [autresFraisInvest, setAutresFraisInvest] = useState(0)
  const [materielHorsLeasing, setMaterielHorsLeasing] = useState(10000)
  const [materielLeasing, setMaterielLeasing] = useState(51000)
  
  const [cautionMois, setCautionMois] = useState(3)
  const [fraisPreouv, setFraisPreouv] = useState(15000)
  const [bfr, setBfr] = useState(20000)
  const [droitEntree, setDroitEntree] = useState(30000)
  const [stockDemarrage, setStockDemarrage] = useState(50000)

  // === ÉTATS : FRAIS FIXES & LOCAL ===
  const [loyerAnnuel, setLoyerAnnuel] = useState(36000)
  const [abattementY1, setAbattementY1] = useState(0)
  const [abattementY2, setAbattementY2] = useState(0)
  const [chargesLocal, setChargesLocal] = useState(3000)

  // === ÉTATS : FINANCEMENT ===
  const [apport, setApport] = useState(80000)
  const [tauxEmprunt, setTauxEmprunt] = useState(3.5)
  const [dureeEmprunt, setDureeEmprunt] = useState(7)
  const [decalageMois, setDecalageMois] = useState(6)

  // === ÉTATS : RH (SALAIRES) ===
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, role: "Opticien / Directeur", netMonthly: 2500, type: "1.33", isARE: true, startYear: 1 },
    { id: 2, role: "Audioprothésiste", netMonthly: 3000, type: "1.44", isARE: false, startYear: 1 }
  ])

  const addEmployee = () => setEmployees([...employees, { id: Date.now(), role: "Opticien", netMonthly: 2000, type: "1.44", isARE: false, startYear: 1 }])
  const removeEmployee = (id: number) => setEmployees(employees.filter(e => e.id !== id))
  const updateEmployee = (id: number, field: string, value: any) => setEmployees(employees.map(e => e.id === id ? { ...e, [field]: value } : e))

  // ==========================================
  // MOTEUR DE CALCUL MATHÉMATIQUE
  // ==========================================

  const loyerMensuel = loyerAnnuel / 12
  const caution = loyerMensuel * cautionMois
  const totalInvestissement = travaux + fraisArchi + brokers + debours + materielHorsLeasing + fraisJuridiques + autresFraisInvest + caution + fraisPreouv + bfr + droitEntree + stockDemarrage
  const montantEmprunt = Math.max(0, totalInvestissement - apport)
  
  const tauxMensuel = (tauxEmprunt / 100) / 12
  const nbMoisAmortissementPlein = (dureeEmprunt * 12) - decalageMois
  const mensualitePleine = tauxMensuel === 0 ? montantEmprunt / nbMoisAmortissementPlein : (montantEmprunt * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -nbMoisAmortissementPlein))
  
  let remainingCapital = montantEmprunt
  const yearlyInterests = [0, 0, 0, 0, 0]
  const yearlyCapital = [0, 0, 0, 0, 0]
  
  let monthIndex = 1
  for (let y = 0; y < 5; y++) {
    for (let m = 0; m < 12; m++) {
      const interestThisMonth = remainingCapital * tauxMensuel
      yearlyInterests[y] += interestThisMonth
      
      let capitalThisMonth = 0
      if (monthIndex > decalageMois) {
        capitalThisMonth = mensualitePleine - interestThisMonth
      }
      yearlyCapital[y] += capitalThisMonth
      remainingCapital -= capitalThisMonth
      monthIndex++
    }
  }

  const dotationsAmortissements = (travaux + fraisArchi + brokers + debours + materielHorsLeasing + fraisJuridiques + autresFraisInvest + droitEntree) / 7
  const leasingAnnuel = materielLeasing / 5
  
  // CALCUL INTELLIGENT DES SALAIRES (Avec année de démarrage)
  const calcSalaires = (yearIdx: number) => {
    return employees.reduce((tot, emp) => {
      if (yearIdx < emp.startYear) return tot // Pas encore embauché
      if (yearIdx === emp.startYear && emp.isARE) return tot // 1ère année d'embauche gratuite si ARE
      return tot + ((emp.netMonthly * 12) * parseFloat(emp.type))
    }, 0)
  }

  const yearsData = []
  let cumulCashFlow = 0

  for (let y = 0; y < 5; y++) {
    const currentYear = y + 1
    
    let factor = 1
    if (y >= 1) factor *= (1 + growthY2 / 100)
    if (y >= 2) factor *= (1 + growthY3 / 100)
    if (y >= 3) factor *= (1 + growthY4 / 100)
    if (y >= 4) factor *= (1 + growthY5 / 100)

    const caOpt = caOptiqueHT * factor
    const caAud = caAudioHT * factor
    const caTot = caOpt + caAud
    const margeBrute = caTot * (marge / 100)

    const personnel = calcSalaires(currentYear) // Utilisation de la nouvelle fonction
    const loyerEff = loyerAnnuel - (y === 0 ? abattementY1 : (y === 1 ? abattementY2 : 0))
    const chargesEspace = loyerEff + chargesLocal
    const comLocal = caTot * 0.03
    const autresFrais = caTot * 0.05
    const fraisGen = caTot * 0.03
    const totalFraisMagasin = personnel + chargesEspace + comLocal + leasingAnnuel + autresFrais + fraisGen
    
    const ebitdaMagasin = margeBrute - totalFraisMagasin
    const ebitMagasin = ebitdaMagasin - dotationsAmortissements

    const comNat = caTot * 0.03
    const royalties = Math.max(5000, caTot * 0.01)
    const fraisPreouvExce = y === 0 ? fraisPreouv : 0 

    const ebitdaApresFranchise = ebitdaMagasin - comNat - royalties - fraisPreouvExce
    const ebitSte = ebitdaApresFranchise - dotationsAmortissements

    const fraisFinanciers = yearlyInterests[y]
    const rai = ebitSte - fraisFinanciers
    const is = y === 0 ? 0 : (rai > 0 ? rai * 0.25 : 0)
    const resultatNet = rai - is

    const cashFlowBrut = resultatNet + dotationsAmortissements
    const rembCapital = yearlyCapital[y]
    const cashFlowNet = cashFlowBrut - rembCapital
    cumulCashFlow += cashFlowNet

    const tmcDecimal = (margeBrute - (comLocal + autresFrais + fraisGen + comNat + royalties)) / Math.max(1, caTot)
    const fraisFixesCash = chargesEspace + personnel + leasingAnnuel + rembCapital + fraisFinanciers
    const srHT = fraisFixesCash / Math.max(0.01, tmcDecimal)

    yearsData.push({
      caOpt, caAud, caTot, margeBrute, personnel, chargesEspace, comLocal, autresFrais, fraisGen, totalFraisMagasin, leasing: leasingAnnuel,
      ebitdaMagasin, ebitMagasin, comNat, royalties, fraisPreouvExce, ebitdaApresFranchise, ebitSte, fraisFinanciers, 
      is, resultatNet, cashFlowBrut, rembCapital, cashFlowNet, cumulCashFlow, srHT
    })
  }

  const tvaMoyenne = () => ((caOptiqueHT * 0.20) + (caAudioHT * 0.055)) / (caOptiqueHT + caAudioHT)
  
  const f = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0)
  const fK = (val: number) => Math.round(val / 1000)

  // Impression native du navigateur
  const handlePrint = () => {
    window.print();
  }

  return (
    // L'ajout de print:max-h-none print:overflow-visible permet au PDF de faire plusieurs pages si besoin sans couper le contenu !
    <div className="flex flex-col gap-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 pb-10 print:max-h-none print:overflow-visible print:bg-white print:text-black">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shrink-0 shadow-sm print:shadow-none print:border-none print:p-0 print:mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary print:hidden"><Calculator className="h-6 w-6" /></div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Simulateur d'Investissement & ROI <span className="hidden print:inline"> - Acuitis</span></h2>
            <p className="text-sm text-muted-foreground">Business Plan complet : Seuil de Rentabilité et Compte de Résultat à 5 ans.</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Investissement Total</span>
            <span className="text-xl font-bold text-foreground">{f(totalInvestissement)}</span>
          </div>
          <div className="w-px bg-border my-1 h-8"></div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Besoin d'Emprunt</span>
            <span className="text-xl font-bold text-blue-500">{f(montantEmprunt)}</span>
          </div>
          
          {/* BOUTON IMPRESSION / PDF */}
          <Button onClick={handlePrint} className="ml-4 print:hidden bg-indigo-600 hover:bg-indigo-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Exporter en PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 print:block">
        
        {/* COLONNE GAUCHE : LES INPUTS (7 colonnes) */}
        <div className="xl:col-span-7 flex flex-col gap-5 print:mb-6">
          
          {/* 1. PRÉVISIONS CA & MARGE */}
          <div className="rounded-xl border border-border bg-card p-5 print:shadow-none print:break-inside-avoid">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3 mb-4"><TrendingUp className="h-4 w-4 text-primary print:hidden" /> 1. Prévisions CA & Marge</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              
              <div className="space-y-4">
                <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg print:border-gray-200 print:bg-white">
                  <span className="text-[11px] font-bold text-blue-500 mb-2 block print:text-black">CA Optique (TVA 20%)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Montant HT</label>
                      <Input type="number" value={Math.round(caOptiqueHT)} onChange={e => setCaOptiqueHT(Number(e.target.value))} className="text-xs font-semibold text-blue-500 print:border-none print:p-0 print:text-black" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Montant TTC</label>
                      <Input type="number" value={Math.round(caOptiqueHT * 1.20)} onChange={e => setCaOptiqueHT(Number(e.target.value) / 1.20)} className="text-xs border-blue-500/30 print:border-none print:p-0 print:text-black" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg print:border-gray-200 print:bg-white">
                  <span className="text-[11px] font-bold text-emerald-500 mb-2 block print:text-black">CA Audition (TVA 5.5%)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Montant HT</label>
                      <Input type="number" value={Math.round(caAudioHT)} onChange={e => setCaAudioHT(Number(e.target.value))} className="text-xs font-semibold text-emerald-500 print:border-none print:p-0 print:text-black" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Montant TTC</label>
                      <Input type="number" value={Math.round(caAudioHT * 1.055)} onChange={e => setCaAudioHT(Number(e.target.value) / 1.055)} className="text-xs border-emerald-500/30 print:border-none print:p-0 print:text-black" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/20 p-4 rounded-lg border border-border flex flex-col justify-center print:border-gray-200 print:bg-white">
                <label className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary print:hidden"/> Marge Brute :</span>
                  <span className="text-primary text-lg print:text-black">{marge}%</span>
                </label>
                <input type="range" min="62" max="70" step="0.5" value={marge} onChange={e => setMarge(Number(e.target.value))} className="w-full accent-primary mt-2 print:hidden" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 print:hidden"><span>62%</span><span>66%</span><span>70%</span></div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 border-t border-border pt-4">
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y2 (%)</label><Input type="number" value={growthY2} onChange={e => setGrowthY2(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y3 (%)</label><Input type="number" value={growthY3} onChange={e => setGrowthY3(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y4 (%)</label><Input type="number" value={growthY4} onChange={e => setGrowthY4(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Croissance Y5 (%)</label><Input type="number" value={growthY5} onChange={e => setGrowthY5(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
            </div>
          </div>

          {/* 2. INVESTISSEMENTS (CAPEX) */}
          <div className="rounded-xl border border-border bg-card p-5 print:shadow-none print:break-inside-avoid print:mt-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3 mb-4"><Euro className="h-4 w-4 text-primary print:hidden" /> 2. Investissements de départ (HT)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Travaux & Aménag.</label><Input type="number" value={travaux} onChange={e => setTravaux(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Frais Architecte/Pilote</label><Input type="number" value={fraisArchi} onChange={e => setFraisArchi(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Honoraires Brokers</label><Input type="number" value={brokers} onChange={e => setBrokers(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Débours Architecte</label><Input type="number" value={debours} onChange={e => setDebours(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Frais Juridiques</label><Input type="number" value={fraisJuridiques} onChange={e => setFraisJuridiques(Number(e.target.value))} className="text-xs border-primary/20 print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Autres Frais Invest.</label><Input type="number" value={autresFraisInvest} onChange={e => setAutresFraisInvest(Number(e.target.value))} className="text-xs border-primary/20 print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Matériel (Hors Leasing)</label><Input type="number" value={materielHorsLeasing} onChange={e => setMaterielHorsLeasing(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-violet-500 font-semibold mb-1 block print:text-black">Matériel Leasing (5 ans)</label><Input type="number" value={materielLeasing} onChange={e => setMaterielLeasing(Number(e.target.value))} className="text-xs border-violet-500/30 bg-violet-500/5 print:border-none print:p-0 print:bg-white" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Stock de démarrage</label><Input type="number" value={stockDemarrage} onChange={e => setStockDemarrage(Number(e.target.value))} className="text-xs border-amber-500/30 print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Dépôt garantie (Nb mois)</label><Input type="number" value={cautionMois} onChange={e => setCautionMois(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Frais Pré-Ouverture</label><Input type="number" value={fraisPreouv} onChange={e => setFraisPreouv(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Droit d'entrée Franchise</label><Input type="number" value={droitEntree} onChange={e => setDroitEntree(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">BFR (Trésorerie départ)</label><Input type="number" value={bfr} onChange={e => setBfr(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
            </div>
          </div>

          {/* 3. FINANCEMENT BANCAIRE */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-900/5 p-5 print:shadow-none print:border-gray-200 print:bg-white print:break-inside-avoid print:mt-4">
            <h3 className="font-semibold text-blue-500 text-sm flex items-center gap-2 border-b border-blue-500/20 pb-3 mb-4 print:text-black print:border-gray-200"><Landmark className="h-4 w-4 print:hidden" /> 3. Financement Bancaire</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-[11px] text-foreground mb-1 block font-bold print:text-black">Apport Personnel (€)</label><Input type="number" value={apport} onChange={e => setApport(Number(e.target.value))} className="text-xs border-blue-500/50 print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Taux d'emprunt (%)</label><Input type="number" value={tauxEmprunt} step="0.1" onChange={e => setTauxEmprunt(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Durée (Années)</label><Input type="number" value={dureeEmprunt} onChange={e => setDureeEmprunt(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Franchise décalage (Mois)</label><Input type="number" value={decalageMois} onChange={e => setDecalageMois(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
            </div>
          </div>

          {/* 4. FRAIS FIXES & LOCAL */}
          <div className="rounded-xl border border-border bg-card p-5 print:shadow-none print:break-inside-avoid print:mt-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3 mb-4"><Building className="h-4 w-4 text-primary print:hidden" /> 4. Local & Frais Fixes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border-b border-border pb-4">
              <div><label className="text-[11px] text-muted-foreground mb-1 block font-bold">Loyer Annuel (€)</label><Input type="number" value={loyerAnnuel} onChange={e => setLoyerAnnuel(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-muted-foreground mb-1 block">Charges Locales (€)</label><Input type="number" value={chargesLocal} onChange={e => setChargesLocal(Number(e.target.value))} className="text-xs print:border-none print:p-0" /></div>
              <div><label className="text-[11px] text-amber-500 mb-1 block print:text-black">Abattement Loyer Y1 (€)</label><Input type="number" value={abattementY1} onChange={e => setAbattementY1(Number(e.target.value))} className="text-xs border-amber-500/30 bg-amber-500/5 print:border-none print:p-0 print:bg-white" /></div>
              <div><label className="text-[11px] text-amber-500 mb-1 block print:text-black">Abattement Loyer Y2 (€)</label><Input type="number" value={abattementY2} onChange={e => setAbattementY2(Number(e.target.value))} className="text-xs border-amber-500/30 bg-amber-500/5 print:border-none print:p-0 print:bg-white" /></div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded flex flex-col justify-center border border-border print:bg-white">
              <span className="text-[11px] text-foreground font-semibold">Frais Variables Acuitis (Verrouillés dans le système)</span>
              <span className="text-xs text-muted-foreground">1% Royalties (Min 5k) + 6% Com (Nat/Loc) + 8% Frais Généraux (Fixes/Autres)</span>
            </div>
          </div>

          {/* 5. RESSOURCES HUMAINES */}
          <div className="rounded-xl border border-border bg-card p-5 print:shadow-none print:break-inside-avoid print:mt-4">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary print:hidden" /> 5. Salaires & RH</h3>
              <Button variant="outline" size="sm" onClick={addEmployee} className="h-7 text-xs print:hidden"><Plus className="mr-1 h-3 w-3" /> Ajouter</Button>
            </div>
            <div className="space-y-3">
              {employees.map((emp) => (
                <div key={emp.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border print:bg-white print:p-0 print:border-b print:border-0 print:border-gray-200">
                  <Input value={emp.role} onChange={e => updateEmployee(emp.id, "role", e.target.value)} placeholder="Rôle" className="w-full md:w-1/3 text-xs h-8 print:border-none print:p-0" />
                  
                  {/* NOUVEAU : SÉLECTEUR D'ANNÉE DE DÉMARRAGE */}
                  <select value={emp.startYear} onChange={e => updateEmployee(emp.id, "startYear", Number(e.target.value))} className="w-full md:w-20 h-8 rounded-md border border-input bg-background px-2 text-[11px] text-amber-600 font-semibold print:border-none print:p-0 print:text-black">
                    <option value={1}>Début Y1</option><option value={2}>Début Y2</option><option value={3}>Début Y3</option><option value={4}>Début Y4</option><option value={5}>Début Y5</option>
                  </select>

                  <Input type="number" value={emp.netMonthly} onChange={e => updateEmployee(emp.id, "netMonthly", Number(e.target.value))} placeholder="Salaire Net Mensuel" className="w-full md:w-1/5 text-xs h-8 print:border-none print:p-0" />
                  <select value={emp.type} onChange={e => updateEmployee(emp.id, "type", e.target.value)} className="w-full md:w-1/5 h-8 rounded-md border border-input bg-background px-2 text-[11px] print:border-none print:p-0">
                    <option value="1.44">Salarié (x1.44)</option><option value="1.33">TNS (x1.33)</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-[10px] whitespace-nowrap cursor-pointer px-2">
                    <input type="checkbox" checked={emp.isARE} onChange={e => updateEmployee(emp.id, "isARE", e.target.checked)} className="accent-primary" />
                    ARE <span className="hidden lg:inline">(Gratuit Y1)</span>
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => removeEmployee(emp.id)} className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 ml-auto print:hidden"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLONNE DROITE : LES RÉSULTATS (5 colonnes) */}
        <div className="xl:col-span-5 flex flex-col gap-5 print:block print:mt-8">
          
          {/* ENCART SEUIL RENTABILITÉ DÉTAILLÉ */}
          <div className="rounded-xl border-2 border-emerald-500/20 bg-card shadow-lg overflow-hidden shrink-0 print:border-gray-300 print:shadow-none print:break-inside-avoid">
            <div className="bg-emerald-500/10 px-5 py-4 border-b border-emerald-500/20 print:bg-gray-100 print:border-gray-300">
              <h3 className="font-bold text-emerald-500 flex items-center gap-2 print:text-black"><TrendingUp className="h-5 w-5 print:hidden" /> Seuils de Rentabilité (SR)</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Chiffre d'affaires à atteindre pour couvrir l'ensemble des charges cash et annuités bancaires.</p>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((y) => {
                const sr = yearsData[y-1].srHT
                const srMensuelHT = sr / 12
                const srMensuelTTC = srMensuelHT * (1 + tvaMoyenne())
                return (
                  <div key={y} className="bg-background p-3 rounded border border-border flex flex-col gap-2 print:border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Année {y}</span>
                      <span className="text-lg font-bold text-foreground text-emerald-500 print:text-black">{f(sr)} <span className="text-[10px] font-normal text-muted-foreground uppercase">Annuel HT</span></span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground bg-muted/30 px-2 py-1.5 rounded print:bg-white print:border print:border-gray-100">
                      <span className="font-medium">Objectif Mensuel :</span>
                      <div className="flex gap-3">
                        <span><b className="text-foreground">{f(srMensuelHT)}</b> HT</span>
                        <span className="border-l border-border pl-3"><b className="text-foreground">{f(srMensuelTTC)}</b> TTC</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ENCART RENTABILITÉ & ROI DÉTAILLÉ TYPE EXCEL */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex-1 flex flex-col print:shadow-none print:break-inside-avoid print:mt-6">
            <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3 mb-4"><FileSpreadsheet className="h-5 w-5 text-primary print:hidden" /> Synthèse Rentabilité (P&L en k€)</h3>
            
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="text-muted-foreground border-b-2 border-border">
                    <th className="pb-2 min-w-[160px]">Compte de résultat</th>
                    <th className="pb-2 text-right w-12">Y1</th>
                    <th className="pb-2 text-right w-12">Y2</th>
                    <th className="pb-2 text-right w-12">Y3</th>
                    <th className="pb-2 text-right w-12">Y4</th>
                    <th className="pb-2 text-right w-12">Y5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {/* REVENUS */}
                  <tr className="bg-muted/10 print:bg-gray-100"><td colSpan={6} className="py-1 pl-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider print:text-black">Revenus</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Optique</td><td className="py-1 text-right">{fK(yearsData[0].caOpt)}</td><td className="py-1 text-right">{fK(yearsData[1].caOpt)}</td><td className="py-1 text-right">{fK(yearsData[2].caOpt)}</td><td className="py-1 text-right">{fK(yearsData[3].caOpt)}</td><td className="py-1 text-right">{fK(yearsData[4].caOpt)}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Audition</td><td className="py-1 text-right">{fK(yearsData[0].caAud)}</td><td className="py-1 text-right">{fK(yearsData[1].caAud)}</td><td className="py-1 text-right">{fK(yearsData[2].caAud)}</td><td className="py-1 text-right">{fK(yearsData[3].caAud)}</td><td className="py-1 text-right">{fK(yearsData[4].caAud)}</td></tr>
                  <tr className="bg-primary/5 font-bold print:bg-gray-50"><td className="py-1.5 pl-1 text-primary print:text-black">CA NET EN K€ HT</td><td className="py-1.5 text-right">{fK(yearsData[0].caTot)}</td><td className="py-1.5 text-right">{fK(yearsData[1].caTot)}</td><td className="py-1.5 text-right">{fK(yearsData[2].caTot)}</td><td className="py-1.5 text-right">{fK(yearsData[3].caTot)}</td><td className="py-1.5 text-right">{fK(yearsData[4].caTot)}</td></tr>
                  <tr className="font-bold border-b-2 border-border"><td className="py-1.5 text-foreground">MARGE BRUTE</td><td className="py-1.5 text-right">{fK(yearsData[0].margeBrute)}</td><td className="py-1.5 text-right">{fK(yearsData[1].margeBrute)}</td><td className="py-1.5 text-right">{fK(yearsData[2].margeBrute)}</td><td className="py-1.5 text-right">{fK(yearsData[3].margeBrute)}</td><td className="py-1.5 text-right">{fK(yearsData[4].margeBrute)}</td></tr>
                  
                  {/* FRAIS MAGASIN */}
                  <tr className="bg-muted/10 print:bg-gray-100"><td colSpan={6} className="py-1 pl-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider print:text-black">Frais Magasin</td></tr>
                  <tr className="text-red-400 print:text-gray-700"><td className="py-1">Frais de personnel et charges</td><td className="py-1 text-right">-{fK(yearsData[0].personnel)}</td><td className="py-1 text-right">-{fK(yearsData[1].personnel)}</td><td className="py-1 text-right">-{fK(yearsData[2].personnel)}</td><td className="py-1 text-right">-{fK(yearsData[3].personnel)}</td><td className="py-1 text-right">-{fK(yearsData[4].personnel)}</td></tr>
                  <tr className="text-red-400 print:text-gray-700"><td className="py-1">Charges d'espace (Loyer inc.)</td><td className="py-1 text-right">-{fK(yearsData[0].chargesEspace)}</td><td className="py-1 text-right">-{fK(yearsData[1].chargesEspace)}</td><td className="py-1 text-right">-{fK(yearsData[2].chargesEspace)}</td><td className="py-1 text-right">-{fK(yearsData[3].chargesEspace)}</td><td className="py-1 text-right">-{fK(yearsData[4].chargesEspace)}</td></tr>
                  <tr className="text-red-400 print:text-gray-700"><td className="py-1">Frais de communication (Loc)</td><td className="py-1 text-right">-{fK(yearsData[0].comLocal)}</td><td className="py-1 text-right">-{fK(yearsData[1].comLocal)}</td><td className="py-1 text-right">-{fK(yearsData[2].comLocal)}</td><td className="py-1 text-right">-{fK(yearsData[3].comLocal)}</td><td className="py-1 text-right">-{fK(yearsData[4].comLocal)}</td></tr>
                  <tr className="text-red-400 print:text-gray-700"><td className="py-1">Leasing</td><td className="py-1 text-right">-{fK(yearsData[0].leasing)}</td><td className="py-1 text-right">-{fK(yearsData[1].leasing)}</td><td className="py-1 text-right">-{fK(yearsData[2].leasing)}</td><td className="py-1 text-right">-{fK(yearsData[3].leasing)}</td><td className="py-1 text-right">-{fK(yearsData[4].leasing)}</td></tr>
                  <tr className="text-red-400 print:text-gray-700"><td className="py-1">Autres frais magasins (5%)</td><td className="py-1 text-right">-{fK(yearsData[0].autresFrais)}</td><td className="py-1 text-right">-{fK(yearsData[1].autresFrais)}</td><td className="py-1 text-right">-{fK(yearsData[2].autresFrais)}</td><td className="py-1 text-right">-{fK(yearsData[3].autresFrais)}</td><td className="py-1 text-right">-{fK(yearsData[4].autresFrais)}</td></tr>
                  <tr className="text-red-400 border-b-2 border-border print:text-gray-700"><td className="py-1">Frais généraux (3%)</td><td className="py-1 text-right">-{fK(yearsData[0].fraisGen)}</td><td className="py-1 text-right">-{fK(yearsData[1].fraisGen)}</td><td className="py-1 text-right">-{fK(yearsData[2].fraisGen)}</td><td className="py-1 text-right">-{fK(yearsData[3].fraisGen)}</td><td className="py-1 text-right">-{fK(yearsData[4].fraisGen)}</td></tr>
                  
                  {/* PERFORMANCE MAGASIN */}
                  <tr className="bg-emerald-500/10 font-bold print:bg-gray-100"><td className="py-1.5 pl-1 text-emerald-600 print:text-black">EBITDA Magasin</td><td className="py-1.5 text-right">{fK(yearsData[0].ebitdaMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[1].ebitdaMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[2].ebitdaMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[3].ebitdaMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[4].ebitdaMagasin)}</td></tr>
                  <tr className="text-muted-foreground"><td className="py-1">Amortissements</td><td className="py-1 text-right">-{fK(dotationsAmortissements)}</td><td className="py-1 text-right">-{fK(dotationsAmortissements)}</td><td className="py-1 text-right">-{fK(dotationsAmortissements)}</td><td className="py-1 text-right">-{fK(dotationsAmortissements)}</td><td className="py-1 text-right">-{fK(dotationsAmortissements)}</td></tr>
                  <tr className="font-bold border-b-2 border-border"><td className="py-1.5 text-foreground">Résultat d'exploit. (EBIT)</td><td className="py-1.5 text-right">{fK(yearsData[0].ebitMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[1].ebitMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[2].ebitMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[3].ebitMagasin)}</td><td className="py-1.5 text-right">{fK(yearsData[4].ebitMagasin)}</td></tr>

                  {/* REDEVANCES */}
                  <tr className="bg-muted/10 print:bg-gray-100"><td colSpan={6} className="py-1 pl-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider print:text-black">Réseau & Franchise</td></tr>
                  <tr className="text-amber-500 print:text-gray-700"><td className="py-1">Communication nationale</td><td className="py-1 text-right">-{fK(yearsData[0].comNat)}</td><td className="py-1 text-right">-{fK(yearsData[1].comNat)}</td><td className="py-1 text-right">-{fK(yearsData[2].comNat)}</td><td className="py-1 text-right">-{fK(yearsData[3].comNat)}</td><td className="py-1 text-right">-{fK(yearsData[4].comNat)}</td></tr>
                  <tr className="text-amber-500 print:text-gray-700"><td className="py-1">Cotisation annuelle</td><td className="py-1 text-right">-{fK(yearsData[0].royalties)}</td><td className="py-1 text-right">-{fK(yearsData[1].royalties)}</td><td className="py-1 text-right">-{fK(yearsData[2].royalties)}</td><td className="py-1 text-right">-{fK(yearsData[3].royalties)}</td><td className="py-1 text-right">-{fK(yearsData[4].royalties)}</td></tr>
                  <tr className="text-amber-500 print:text-gray-700"><td className="py-1">Frais de préouverture exc.</td><td className="py-1 text-right">-{fK(yearsData[0].fraisPreouvExce)}</td><td className="py-1 text-right">-0</td><td className="py-1 text-right">-0</td><td className="py-1 text-right">-0</td><td className="py-1 text-right">-0</td></tr>
                  
                  {/* PERFORMANCE STE */}
                  <tr className="bg-primary/10 font-bold border-t-2 border-border print:bg-gray-100"><td className="py-1.5 pl-1 text-primary print:text-black">EBITDA après Franchise</td><td className="py-1.5 text-right">{fK(yearsData[0].ebitdaApresFranchise)}</td><td className="py-1.5 text-right">{fK(yearsData[1].ebitdaApresFranchise)}</td><td className="py-1.5 text-right">{fK(yearsData[2].ebitdaApresFranchise)}</td><td className="py-1.5 text-right">{fK(yearsData[3].ebitdaApresFranchise)}</td><td className="py-1.5 text-right">{fK(yearsData[4].ebitdaApresFranchise)}</td></tr>
                  <tr className="font-bold"><td className="py-1 text-foreground">EBIT Société</td><td className="py-1 text-right">{fK(yearsData[0].ebitSte)}</td><td className="py-1 text-right">{fK(yearsData[1].ebitSte)}</td><td className="py-1 text-right">{fK(yearsData[2].ebitSte)}</td><td className="py-1 text-right">{fK(yearsData[3].ebitSte)}</td><td className="py-1 text-right">{fK(yearsData[4].ebitSte)}</td></tr>
                  
                  <tr className="text-red-400 print:text-gray-700"><td className="py-1">Frais Financiers (Intérêts)</td><td className="py-1 text-right">-{fK(yearsData[0].fraisFinanciers)}</td><td className="py-1 text-right">-{fK(yearsData[1].fraisFinanciers)}</td><td className="py-1 text-right">-{fK(yearsData[2].fraisFinanciers)}</td><td className="py-1 text-right">-{fK(yearsData[3].fraisFinanciers)}</td><td className="py-1 text-right">-{fK(yearsData[4].fraisFinanciers)}</td></tr>
                  <tr className="text-red-400 border-b-2 border-border print:text-gray-700"><td className="py-1">Impôts (IS)</td><td className="py-1 text-right">-{fK(yearsData[0].is)}</td><td className="py-1 text-right">-{fK(yearsData[1].is)}</td><td className="py-1 text-right">-{fK(yearsData[2].is)}</td><td className="py-1 text-right">-{fK(yearsData[3].is)}</td><td className="py-1 text-right">-{fK(yearsData[4].is)}</td></tr>
                  <tr className="bg-muted/30 font-bold text-foreground print:bg-gray-200"><td className="py-2 pl-1">RÉSULTAT NET</td><td className="py-2 text-right">{fK(yearsData[0].resultatNet)}</td><td className="py-2 text-right">{fK(yearsData[1].resultatNet)}</td><td className="py-2 text-right">{fK(yearsData[2].resultatNet)}</td><td className="py-2 text-right">{fK(yearsData[3].resultatNet)}</td><td className="py-2 text-right">{fK(yearsData[4].resultatNet)}</td></tr>
                  
                  {/* CASH FLOW */}
                  <tr className="bg-muted/10 print:bg-gray-100"><td colSpan={6} className="py-1 pl-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider border-t border-border print:text-black">Trésorerie (Cash Flow)</td></tr>
                  <tr className="font-bold"><td className="py-1 text-foreground">Cash flow brut (CAF)</td><td className="py-1 text-right">{fK(yearsData[0].cashFlowBrut)}</td><td className="py-1 text-right">{fK(yearsData[1].cashFlowBrut)}</td><td className="py-1 text-right">{fK(yearsData[2].cashFlowBrut)}</td><td className="py-1 text-right">{fK(yearsData[3].cashFlowBrut)}</td><td className="py-1 text-right">{fK(yearsData[4].cashFlowBrut)}</td></tr>
                  <tr className="text-amber-500 border-b border-border print:text-gray-700"><td className="py-1">Remboursement emprunt</td><td className="py-1 text-right">-{fK(yearsData[0].rembCapital)}</td><td className="py-1 text-right">-{fK(yearsData[1].rembCapital)}</td><td className="py-1 text-right">-{fK(yearsData[2].rembCapital)}</td><td className="py-1 text-right">-{fK(yearsData[3].rembCapital)}</td><td className="py-1 text-right">-{fK(yearsData[4].rembCapital)}</td></tr>
                  <tr className="font-bold bg-background"><td className="py-2 text-foreground">CASH FLOW NET</td><td className={`py-2 text-right ${yearsData[0].cashFlowNet < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[0].cashFlowNet)}</td><td className={`py-2 text-right ${yearsData[1].cashFlowNet < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[1].cashFlowNet)}</td><td className={`py-2 text-right ${yearsData[2].cashFlowNet < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[2].cashFlowNet)}</td><td className={`py-2 text-right ${yearsData[3].cashFlowNet < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[3].cashFlowNet)}</td><td className={`py-2 text-right ${yearsData[4].cashFlowNet < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[4].cashFlowNet)}</td></tr>
                  <tr className="font-bold bg-muted/20 border-b-2 border-border print:bg-gray-100"><td className="py-2 text-foreground pl-1">CASH FLOW CUMULÉ</td><td className={`py-2 text-right ${yearsData[0].cumulCashFlow < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[0].cumulCashFlow)}</td><td className={`py-2 text-right ${yearsData[1].cumulCashFlow < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[1].cumulCashFlow)}</td><td className={`py-2 text-right ${yearsData[2].cumulCashFlow < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[2].cumulCashFlow)}</td><td className={`py-2 text-right ${yearsData[3].cumulCashFlow < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[3].cumulCashFlow)}</td><td className={`py-2 text-right ${yearsData[4].cumulCashFlow < 0 ? 'text-red-500' : 'text-emerald-500 print:text-black'}`}>{fK(yearsData[4].cumulCashFlow)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* METRICS FINALES ROI */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mt-auto print:bg-gray-50 print:border-gray-300 print:break-inside-avoid">
              <h4 className="text-sm font-bold text-primary mb-3 print:text-black">Analyse du R.O.I (Retour sur Apport en 5 ans)</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Apport Personnel de départ</span>
                  <span className="text-sm font-bold text-foreground">{f(apport)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Bénéfice Net Cumulé (5 ans)</span>
                  <span className="text-sm font-bold text-emerald-500 print:text-black">
                    {f(yearsData.reduce((acc, curr) => acc + curr.resultatNet, 0))}
                  </span>
                </div>
                <div className="pt-2 border-t border-primary/10 flex justify-between items-center print:border-gray-300">
                  <span className="text-xs font-bold text-foreground">R.O.I à 5 ans</span>
                  <Badge className="bg-primary hover:bg-primary text-white text-sm print:bg-white print:text-black print:border print:border-black">
                    {apport > 0 ? ((yearsData.reduce((acc, curr) => acc + curr.resultatNet, 0) / apport) * 100).toFixed(1) : 0} %
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