export type Metier = "Opticien" | "Audio" | "Investisseur"

export type ProspectStatut =
  | "Premier contact"
  | "Qualifié"
  | "DIP envoyé"
  | "Négociation"
  | "Signé"

export type Prospect = {
  id: string
  nom: string
  ville: string
  score: number
  statut: ProspectStatut
  apport: number
  metier: Metier
  initiales: string
}

export const prospects: Prospect[] = [
  {
    id: "p1",
    nom: "Camille Vasseur",
    ville: "Lyon 6e",
    score: 92,
    statut: "Négociation",
    apport: 180000,
    metier: "Opticien",
    initiales: "CV",
  },
  {
    id: "p2",
    nom: "Julien Moreau",
    ville: "Bordeaux Centre",
    score: 87,
    statut: "DIP envoyé",
    apport: 150000,
    metier: "Audio",
    initiales: "JM",
  },
  {
    id: "p3",
    nom: "Groupe Astéria",
    ville: "Paris 8e",
    score: 84,
    statut: "Qualifié",
    apport: 420000,
    metier: "Investisseur",
    initiales: "GA",
  },
  {
    id: "p4",
    nom: "Sarah Benkhelifa",
    ville: "Lille",
    score: 78,
    statut: "DIP envoyé",
    apport: 95000,
    metier: "Opticien",
    initiales: "SB",
  },
  {
    id: "p5",
    nom: "Thomas Lefèvre",
    ville: "Nantes",
    score: 71,
    statut: "Qualifié",
    apport: 120000,
    metier: "Audio",
    initiales: "TL",
  },
  {
    id: "p6",
    nom: "Inès Fontaine",
    ville: "Montpellier",
    score: 64,
    statut: "Premier contact",
    apport: 80000,
    metier: "Opticien",
    initiales: "IF",
  },
  {
    id: "p7",
    nom: "Capital Optique SAS",
    ville: "Strasbourg",
    score: 58,
    statut: "Qualifié",
    apport: 300000,
    metier: "Investisseur",
    initiales: "CO",
  },
  {
    id: "p8",
    nom: "Damien Roux",
    ville: "Toulouse",
    score: 46,
    statut: "Premier contact",
    apport: 55000,
    metier: "Audio",
    initiales: "DR",
  },
  {
    id: "p9",
    nom: "Léa Chevalier",
    ville: "Rennes",
    score: 39,
    statut: "Premier contact",
    apport: 40000,
    metier: "Opticien",
    initiales: "LC",
  },
  {
    id: "p10",
    nom: "Antoine Girard",
    ville: "Nice",
    score: 81,
    statut: "Signé",
    apport: 210000,
    metier: "Opticien",
    initiales: "AG",
  },
]

export type ZoneType = "cible" | "exclusivite" | "premier-refus"

export type Local = {
  id: string
  adresse: string
  ville: string
  surface: number
  loyer: number
  type: ZoneType
  disponibilite: string
}

export const locaux: Local[] = [
  {
    id: "l1",
    adresse: "24 rue de la République",
    ville: "Lyon 2e",
    surface: 145,
    loyer: 6800,
    type: "cible",
    disponibilite: "Disponible immédiatement",
  },
  {
    id: "l2",
    adresse: "8 place de la Comédie",
    ville: "Montpellier",
    surface: 120,
    loyer: 5400,
    type: "exclusivite",
    disponibilite: "Sous 3 mois",
  },
  {
    id: "l3",
    adresse: "112 rue de Rivoli",
    ville: "Paris 1er",
    surface: 90,
    loyer: 9200,
    type: "premier-refus",
    disponibilite: "Négociation en cours",
  },
  {
    id: "l4",
    adresse: "45 rue Sainte-Catherine",
    ville: "Bordeaux",
    surface: 165,
    loyer: 7100,
    type: "cible",
    disponibilite: "Disponible immédiatement",
  },
  {
    id: "l5",
    adresse: "3 Grande Rue",
    ville: "Grenoble",
    surface: 110,
    loyer: 4300,
    type: "exclusivite",
    disponibilite: "Sous 6 mois",
  },
]

export const zoneMeta: Record<
  ZoneType,
  { label: string; dot: string; badgeClass: string }
> = {
  cible: {
    label: "Emplacement cible",
    dot: "bg-chart-2",
    badgeClass: "bg-chart-2/10 text-chart-2",
  },
  exclusivite: {
    label: "Zone d'exclusivité",
    dot: "bg-score-low",
    badgeClass: "bg-score-low/10 text-score-low",
  },
  "premier-refus": {
    label: "Droit de 1er refus",
    dot: "bg-score-mid",
    badgeClass: "bg-score-mid/15 text-score-mid-foreground",
  },
}

export type DossierStatut = "Validation" | "Financement" | "Travaux"

export type DocStatut = "valide" | "manquant"

export type Dossier = {
  id: string
  candidat: string
  initiales: string
  ville: string
  metier: Metier
  statut: DossierStatut
  telephone: string
  email: string
  agent: string
  dateBail: string
  dateOuverture: string
  apport: number
  honoraires: number
  banque: string
  financement: "Oui" | "En cours"
  zoneExclusivite: string
  zonePremierRefus: string
  documents: { nom: string; statut: DocStatut }[]
}

export const dossierStatutMeta: Record<
  DossierStatut,
  { label: string; badgeClass: string; dot: string }
> = {
  Validation: {
    label: "Validation",
    badgeClass: "bg-chart-4/12 text-chart-4",
    dot: "bg-chart-4",
  },
  Financement: {
    label: "Financement",
    badgeClass: "bg-score-mid/15 text-score-mid-foreground",
    dot: "bg-score-mid",
  },
  Travaux: {
    label: "Travaux",
    badgeClass: "bg-chart-2/12 text-chart-2",
    dot: "bg-chart-2",
  },
}

const documentsBase = [
  "DIP signé",
  "ROI",
  "Kbis",
  "RIB",
  "Étude de zone",
  "Devis travaux",
]

function docs(validCount: number): { nom: string; statut: DocStatut }[] {
  return documentsBase.map((nom, i) => ({
    nom,
    statut: i < validCount ? "valide" : "manquant",
  }))
}

export const dossiers: Dossier[] = [
  {
    id: "d1",
    candidat: "Camille Vasseur",
    initiales: "CV",
    ville: "Lyon 6e",
    metier: "Opticien",
    statut: "Travaux",
    telephone: "06 12 45 78 90",
    email: "c.vasseur@acuitis-lyon.fr",
    agent: "Cushman & Wakefield",
    dateBail: "2025-06-15",
    dateOuverture: "2025-11-03",
    apport: 180000,
    honoraires: 45000,
    banque: "BNP Paribas",
    financement: "Oui",
    zoneExclusivite: "Lyon 6e — 2,5 km autour de la Place Bellecour",
    zonePremierRefus: "Lyon 3e et Villeurbanne centre",
    documents: docs(6),
  },
  {
    id: "d2",
    candidat: "Julien Moreau",
    initiales: "JM",
    ville: "Bordeaux Centre",
    metier: "Audio",
    statut: "Financement",
    telephone: "06 88 23 41 07",
    email: "j.moreau@gmail.com",
    agent: "BNP Real Estate",
    dateBail: "2025-09-01",
    dateOuverture: "2026-02-15",
    apport: 150000,
    honoraires: 38000,
    banque: "Crédit Agricole",
    financement: "En cours",
    zoneExclusivite: "Bordeaux Triangle d'Or — 1,8 km",
    zonePremierRefus: "Mérignac et Pessac centre",
    documents: docs(4),
  },
  {
    id: "d3",
    candidat: "Antoine Girard",
    initiales: "AG",
    ville: "Nice",
    metier: "Opticien",
    statut: "Validation",
    telephone: "06 34 56 12 89",
    email: "a.girard@optique-nice.fr",
    agent: "JLL",
    dateBail: "2025-10-20",
    dateOuverture: "2026-03-30",
    apport: 210000,
    honoraires: 52000,
    banque: "Société Générale",
    financement: "En cours",
    zoneExclusivite: "Nice — avenue Jean Médecin, rayon 2 km",
    zonePremierRefus: "Cagnes-sur-Mer et Antibes",
    documents: docs(2),
  },
  {
    id: "d4",
    candidat: "Groupe Astéria",
    initiales: "GA",
    ville: "Paris 8e",
    metier: "Investisseur",
    statut: "Financement",
    telephone: "01 45 62 33 10",
    email: "contact@asteria-invest.com",
    agent: "Knight Frank",
    dateBail: "2025-08-05",
    dateOuverture: "2026-01-12",
    apport: 420000,
    honoraires: 90000,
    banque: "HSBC",
    financement: "En cours",
    zoneExclusivite: "Paris 8e — quartier Madeleine",
    zonePremierRefus: "Paris 9e et Paris 17e",
    documents: docs(5),
  },
]

export type Priorite = "Haute" | "Moyenne" | "Basse"

export type Mission = {
  id: string
  description: string
  priorite: Priorite
  liee: string
  echeance: string
  urgent: boolean
  fait: boolean
}

export const prioriteMeta: Record<Priorite, { badgeClass: string }> = {
  Haute: { badgeClass: "bg-score-low/12 text-score-low" },
  Moyenne: { badgeClass: "bg-score-mid/15 text-score-mid-foreground" },
  Basse: { badgeClass: "bg-muted text-muted-foreground" },
}

export const missions: Mission[] = [
  {
    id: "m1",
    description: "Relancer sur la signature du DIP",
    priorite: "Haute",
    liee: "Julien Moreau",
    echeance: "2025-09-11",
    urgent: true,
    fait: false,
  },
  {
    id: "m2",
    description: "Valider l'étude de zone avec le géomarketing",
    priorite: "Haute",
    liee: "Dossier Nice — A. Girard",
    echeance: "2025-09-12",
    urgent: true,
    fait: false,
  },
  {
    id: "m3",
    description: "Obtenir l'accord de financement définitif",
    priorite: "Moyenne",
    liee: "Groupe Astéria",
    echeance: "2025-09-18",
    urgent: false,
    fait: false,
  },
  {
    id: "m4",
    description: "Planifier la visite du local rue de Rivoli",
    priorite: "Moyenne",
    liee: "Paris 1er — 112 rue de Rivoli",
    echeance: "2025-09-22",
    urgent: false,
    fait: false,
  },
  {
    id: "m5",
    description: "Envoyer le devis travaux au candidat",
    priorite: "Basse",
    liee: "Camille Vasseur",
    echeance: "2025-09-25",
    urgent: false,
    fait: true,
  },
  {
    id: "m6",
    description: "Préparer le comité d'agrément mensuel",
    priorite: "Moyenne",
    liee: "Réseau — 4 dossiers",
    echeance: "2025-09-30",
    urgent: false,
    fait: false,
  },
]

export const kpis = [
  { label: "Prospects actifs", value: 42, delta: "+8 ce mois", trend: "up" as const },
  { label: "Dossiers en cours", value: 4, delta: "+1 cette semaine", trend: "up" as const },
  { label: "Ouvertures 2025", value: 7, delta: "objectif 9", trend: "neutral" as const },
]

export const dossiersValides = [
  { candidat: "Antoine Girard", ville: "Nice", date: "28 août 2025", metier: "Opticien" as Metier },
  { candidat: "Sophie Marchand", ville: "Angers", date: "14 août 2025", metier: "Audio" as Metier },
  { candidat: "Karim Belaïd", ville: "Reims", date: "02 août 2025", metier: "Opticien" as Metier },
  { candidat: "Elsa Ribeiro", ville: "Dijon", date: "21 juil. 2025", metier: "Opticien" as Metier },
]

export function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNombre(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value)
}
