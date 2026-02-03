'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Agent, Emergency, ECUADOR_PROVINCES, SERVICE_TYPES } from '@/lib/types'
import ecuadorGeoJSON from '@/data/ecuador-provinces.json'

interface EcuadorMapProps {
  agents: Agent[]
  emergencies: Emergency[]
  selectedProvince: string | null
  onProvinceSelect: (provinceId: string | null) => void
  provinceStats: Record<string, { emergencies: number; agents: number }>
}

// Componente para centrar el mapa automáticamente
function MapController() {
  const map = useMap()
  
  useEffect(() => {
    // Centrar en Ecuador (coordenadas aproximadas)
    map.setView([-1.8, -78.5], 7)
  }, [map])
  
  return null
}

export function EcuadorMap({
  agents,
  emergencies,
  selectedProvince,
  onProvinceSelect,
  provinceStats,
}: EcuadorMapProps) {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getServiceColor = (serviceId: string) => {
    const service = SERVICE_TYPES.find(s => s.id === serviceId)
    return service?.color || '#888888'
  }

  const getProvinceCenter = (provinceId: string): [number, number] => {
    const province = ECUADOR_PROVINCES.find(p => p.id === provinceId)
    if (!province) return [-1.8, -78.5]
    // Convertir coordenadas del modelo a lat/lng aproximadas
    return [
      -0.2 - province.coordinates.y * 0.05,
      -78.2 - province.coordinates.x * 0.05
    ]
  }

  const onEachProvince = (feature: any, layer: any) => {
    const provinceId = feature.properties.id
    const stats = provinceStats[provinceId]
    
    layer.on({
      click: () => {
        onProvinceSelect(selectedProvince === provinceId ? null : provinceId)
      },
      mouseover: (e: any) => {
        setHoveredProvince(provinceId)
        e.target.setStyle({
          weight: 3,
          fillOpacity: 0.5
        })
      },
      mouseout: (e: any) => {
        setHoveredProvince(null)
        e.target.setStyle(provinceStyle(feature))
      }
    })

    // Tooltip con información
    layer.bindTooltip(
      `<div style="padding: 4px">
        <strong>${feature.properties.name}</strong><br/>
        Emergencias: ${stats?.emergencies || 0}<br/>
        Agentes: ${stats?.agents || 0}
      </div>`,
      { sticky: true }
    )
  }

  const provinceStyle = (feature: any) => {
    const provinceId = feature.properties.id
    const stats = provinceStats[provinceId]
    const isSelected = selectedProvince === provinceId
    const isHovered = hoveredProvince === provinceId
    
    // Color basado en cantidad de emergencias
    const emergencyCount = stats?.emergencies || 0
    const intensity = Math.min(1, emergencyCount / 100)
    
    return {
      fillColor: isSelected ? '#f59e0b' : `rgb(${30 + intensity * 200}, ${41 + intensity * 100}, 59)`,
      weight: isSelected ? 3 : isHovered ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#f59e0b' : isHovered ? '#64748b' : '#334155',
      fillOpacity: isSelected ? 0.6 : 0.4 + intensity * 0.2
    }
  }

  if (!isMounted) {
    return (
      <div className="relative w-full h-full bg-card rounded-lg overflow-hidden border border-border flex items-center justify-center">
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-card rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[-1.8, -78.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <MapController />
        
        {/* Capa base del mapa */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Provincias de Ecuador */}
        <GeoJSON
          data={ecuadorGeoJSON as any}
          style={provinceStyle}
          onEachFeature={onEachProvince}
        />
        
        {/* Agentes */}
        {agents.map((agent, idx) => {
          const center = getProvinceCenter(agent.province)
          // Añadir offset aleatorio pero consistente basado en el ID
          const offsetLat = ((parseInt(agent.id, 36) % 1000) / 1000 - 0.5) * 0.3
          const offsetLng = ((parseInt(agent.id, 36) % 500) / 500 - 0.5) * 0.3
          
          return (
            <CircleMarker
              key={`agent-${agent.id}`}
              center={[center[0] + offsetLat, center[1] + offsetLng]}
              radius={agent.status === 'responding' ? 8 : 5}
              pathOptions={{
                fillColor: getServiceColor(agent.type),
                color: '#ffffff',
                weight: 1,
                opacity: 1,
                fillOpacity: agent.status === 'responding' ? 0.8 : 0.6
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>{agent.id}</strong><br/>
                  Tipo: {SERVICE_TYPES.find(s => s.id === agent.type)?.name}<br/>
                  Estado: {agent.status === 'available' ? 'Disponible' : 
                          agent.status === 'responding' ? 'Respondiendo' : 'En pausa'}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
        
        {/* Emergencias */}
        {emergencies.map((emergency) => {
          const center = getProvinceCenter(emergency.province)
          const offsetLat = ((parseInt(emergency.id, 36) % 800) / 800 - 0.5) * 0.2
          const offsetLng = ((parseInt(emergency.id, 36) % 400) / 400 - 0.5) * 0.2
          
          return (
            <CircleMarker
              key={`emergency-${emergency.id}`}
              center={[center[0] + offsetLat, center[1] + offsetLng]}
              radius={emergency.status === 'pending' ? 10 : 7}
              pathOptions={{
                fillColor: emergency.status === 'pending' ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: emergency.status === 'pending' ? 0.7 : 0.5
              }}
              className={emergency.status === 'pending' ? 'animate-pulse' : ''}
            >
              <Popup>
                <div className="text-xs">
                  <strong>Emergencia {emergency.id}</strong><br/>
                  Tipo: {SERVICE_TYPES.find(s => s.id === emergency.type)?.name}<br/>
                  Prioridad: {emergency.priority}<br/>
                  Estado: {emergency.status === 'pending' ? 'Pendiente' : 'En Atención'}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      
      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border z-[1000]">
        <h4 className="text-xs font-semibold text-foreground mb-2">Tipos de Servicio</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {SERVICE_TYPES.slice(0, 6).map(service => (
            <div key={service.id} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full border border-white" 
                style={{ backgroundColor: service.color }}
              />
              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                {service.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info de provincia seleccionada */}
      {(selectedProvince || hoveredProvince) && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border min-w-[180px] z-[1000]">
          <h4 className="text-sm font-semibold text-primary mb-1.5">
            {ECUADOR_PROVINCES.find(p => p.id === (selectedProvince || hoveredProvince))?.name}
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex justify-between">
              <span>Emergencias:</span>
              <span className="font-semibold">{provinceStats[selectedProvince || hoveredProvince || '']?.emergencies || 0}</span>
            </p>
            <p className="flex justify-between">
              <span>Agentes:</span>
              <span className="font-semibold">{provinceStats[selectedProvince || hoveredProvince || '']?.agents || 0}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
