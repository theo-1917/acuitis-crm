"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { formatEuro } from "@/lib/crm-data"
import { Building2, MapPin } from "lucide-react"

// Correction des icônes Leaflet pour Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

type Local = {
  id: number
  ville: string
  adresse: string
  loyer: number
  surface: number
  lat: number
  lng: number
  photo_url: string
  statut: string
}

export default function MapView({ locaux, onSelect }: { locaux: Local[], onSelect: (id: number) => void }) {
  // Coordonnées par défaut : Centre de la France
  const center: [number, number] = [46.2276, 2.2137]

  return (
    <MapContainer 
      center={center} 
      zoom={6} 
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
    >
      {/* Fond de carte sombre (Dark Mode) pour correspondre au CRM */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {locaux.map((local) => {
        if (!local.lat || !local.lng) return null

        return (
          <Marker key={local.id} position={[local.lat, local.lng]}>
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                {local.photo_url ? (
                  <img src={local.photo_url} alt={local.ville} className="w-full h-24 object-cover rounded-md mb-2" />
                ) : (
                  <div className="w-full h-24 bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                    <Building2 className="text-gray-400 h-8 w-8" />
                  </div>
                )}
                <h4 className="font-bold text-sm m-0">{local.ville}</h4>
                <p className="text-xs text-gray-500 m-0 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {local.adresse || "Adresse non précisée"}
                </p>
                <div className="flex justify-between items-center mt-2 border-t pt-2">
                  <span className="font-semibold text-emerald-600 text-xs">
                    {local.loyer ? formatEuro(local.loyer) : "-"}
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{local.surface} m²</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}