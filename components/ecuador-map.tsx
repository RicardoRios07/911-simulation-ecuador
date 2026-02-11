'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { feature } from 'topojson-client'
import { Agent, Emergency, ECUADOR_PROVINCES, SERVICE_TYPES } from '@/lib/types'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ArrowLeftRight, Users } from 'lucide-react'
import { RedistributionDialog } from './redistribution-dialog'
import ecuadorTopoJSON from '@/data/ecuador.topo.json'

// Convert TopoJSON to GeoJSON
const ecuadorGeoJSON = feature(ecuadorTopoJSON as any, (ecuadorTopoJSON as any).objects.default)

// Import Leaflet dynamically to avoid SSR issues
const MapContainerDynamic = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayerDynamic = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const GeoJSONDynamic = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
)

const CircleMarkerDynamic = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)

const PopupDynamic = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

interface EcuadorMapProps {
  agents: Agent[]
  emergencies: Emergency[]
  selectedProvince: string | null
  onProvinceSelect: (provinceId: string | null) => void
  provinceStats: Record<string, { emergencies: number; agents: number }>
  redistributionMode?: boolean
  onRedistributionModeChange?: (mode: boolean) => void
  onRedistribute?: (fromProvince: string, toProvince: string, serviceType: string, count: number) => void
}

// Mapeo de IDs del TopoJSON a IDs internos
const PROVINCE_ID_MAP: Record<string, string> = {
  'EC.GU': 'guayas',
  'EC.ES': 'esmeraldas',
  'EC.CR': 'carchi',
  'EC.IM': 'imbabura',
  'EC.SU': 'sucumbios',
  'EC.SE': 'santa_elena',
  'EC.SD': 'santo_domingo',
  'EC.AZ': 'azuay',
  'EC.EO': 'el_oro',
  'EC.LJ': 'loja',
  'EC.ZC': 'zamora_chinchipe',
  'EC.CN': 'canar',
  'EC.BO': 'bolivar',
  'EC.CT': 'cotopaxi',
  'EC.LR': 'los_rios',
  'EC.MN': 'manabi',
  'EC.CB': 'chimborazo',
  'EC.MS': 'morona_santiago',
  'EC.PI': 'pichincha',
  'EC.PA': 'pastaza',
  'EC.TU': 'tungurahua',
  'EC.NA': 'orellana',
  'EC.1076': 'napo',
  'EC.GA': 'galapagos',
}

// Mapeo inverso
const PROVINCE_ID_REVERSE: Record<string, string> = Object.entries(PROVINCE_ID_MAP).reduce((acc, [key, value]) => {
  acc[value] = key
  return acc
}, {} as Record<string, string>)

export function EcuadorMap({
  agents,
  emergencies,
  selectedProvince,
  onProvinceSelect,
  provinceStats,
  redistributionMode: externalRedistributionMode = false,
  onRedistributionModeChange,
  onRedistribute,
}: EcuadorMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [sourceProvince, setSourceProvince] = useState<string | null>(null)
  const [destProvince, setDestProvince] = useState<string | null>(null)
  const [showRedistributionDialog, setShowRedistributionDialog] = useState(false)
  const [geoJsonKey, setGeoJsonKey] = useState(0)

  // Usar el modo de redistribución externo si se proporciona
  const redistributionMode = externalRedistributionMode

  // Refs para evitar stale closures en los event handlers
  const redistributionModeRef = useRef(redistributionMode)
  const sourceProvinceRef = useRef(sourceProvince)
  const destProvinceRef = useRef(destProvince)
  const selectedProvinceRef = useRef(selectedProvince)

  // Mantener refs actualizados
  useEffect(() => {
    redistributionModeRef.current = redistributionMode
    console.log('📌 Ref actualizado - redistributionMode:', redistributionMode)
  }, [redistributionMode])

  useEffect(() => {
    sourceProvinceRef.current = sourceProvince
    console.log('📌 Ref actualizado - sourceProvince:', sourceProvince)
  }, [sourceProvince])

  useEffect(() => {
    destProvinceRef.current = destProvince
    console.log('📌 Ref actualizado - destProvince:', destProvince)
  }, [destProvince])

  useEffect(() => {
    selectedProvinceRef.current = selectedProvince
  }, [selectedProvince])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Forzar re-render del GeoJSON cuando cambian los estados clave
  useEffect(() => {
    console.log('🔄 Actualizando GeoJSON key. redistMode:', redistributionMode, 'sourceProvince:', sourceProvince, 'destProvince:', destProvince)
    setGeoJsonKey(prev => {
      const newKey = prev + 1
      console.log('🔑 Nuevo GeoJSON key:', newKey)
      return newKey
    })
  }, [redistributionMode, sourceProvince, destProvince])

  // Log cuando sourceProvince cambia
  useEffect(() => {
    console.log('🟣 sourceProvince cambió a:', sourceProvince)
    if (sourceProvince) {
      console.log('🟣 Provincia origen establecida:', sourceProvince)
    }
  }, [sourceProvince])

  // Resetear selectedProvince cuando se activa modo redistribución
  useEffect(() => {
    if (redistributionMode && selectedProvince) {
      console.log('🧹 Limpiando selectedProvince porque modo redistribución está activo')
      onProvinceSelect(null)
    }
  }, [redistributionMode, selectedProvince, onProvinceSelect])

  const getServiceColor = (serviceId: string) => {
    const service = SERVICE_TYPES.find(s => s.id === serviceId)
    return service?.color || '#888888'
  }

  const getProvinceCenterFromId = (provinceId: string): [number, number] => {
    const topoId = PROVINCE_ID_REVERSE[provinceId]
    const feature = (ecuadorGeoJSON as any).features.find((f: any) => f.id === topoId)
    if (!feature) return [-1.5, -78.5]
    
    // Get center from GeoJSON coordinates
    // Handle both Polygon and MultiPolygon geometries
    let coords: number[][]
    if (feature.geometry.type === 'Polygon') {
      coords = feature.geometry.coordinates[0]
    } else if (feature.geometry.type === 'MultiPolygon') {
      // Use the largest polygon
      coords = feature.geometry.coordinates[0][0]
    } else {
      return [-1.5, -78.5]
    }
    
    let sumLng = 0
    let sumLat = 0
    
    coords.forEach((coord) => {
      const [lng, lat] = coord as [number, number]
      sumLng += lng
      sumLat += lat
    })
    
    return [sumLat / coords.length, sumLng / coords.length]
  }

  // Group agents by province and type
  const agentGroups = agents.reduce((acc, agent) => {
    const key = `${agent.province}-${agent.type}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(agent)
    return acc
  }, {} as Record<string, Agent[]>)

  const onEachProvince = useCallback((feature: any, layer: any) => {
    const topoId = feature.id // ID del TopoJSON (ej: "EC.GU")
    const provinceId = PROVINCE_ID_MAP[topoId] || topoId // Convertir a ID interno
    const stats = provinceStats[provinceId]
    
    console.log('🔧 Vinculando eventos para provincia:', provinceId)
    
    layer.on({
      click: (e: any) => {
        // Usar refs para obtener valores actuales
        const currentRedistMode = redistributionModeRef.current
        const currentSourceProvince = sourceProvinceRef.current
        const currentSelectedProvince = selectedProvinceRef.current
        
        console.log('📍 Click detectado en:', provinceId)
        console.log('🚦 Modo redistribución (REF):', currentRedistMode)
        console.log('🏠 Provincia origen actual (REF):', currentSourceProvince)
        
        if (currentRedistMode) {
          // En modo redistribución
          if (!currentSourceProvince) {
            // Primera selección: origen
            setSourceProvince(provinceId)
            console.log('✅ Provincia ORIGEN seleccionada:', provinceId)
          } else if (currentSourceProvince === provinceId) {
            // Clic en la misma provincia: cancelar selección
            setSourceProvince(null)
            console.log('❌ Selección de origen cancelada')
          } else {
            // Segunda selección: destino
            console.log('✅ Provincia DESTINO seleccionada:', provinceId)
            console.log('🔔 Abriendo diálogo de redistribución. From:', currentSourceProvince, 'To:', provinceId)
            
            // Actualizar destino y abrir diálogo
            setDestProvince(provinceId)
            
            // Usar setTimeout para asegurar que el estado se actualice antes de abrir el diálogo
            setTimeout(() => {
              setShowRedistributionDialog(true)
              console.log('🔔 showRedistributionDialog cambiado a: true')
            }, 10)
          }
        } else {
          console.log('🗺️ Modo normal - seleccionando provincia')
          onProvinceSelect(currentSelectedProvince === provinceId ? null : provinceId)
        }
      },
      mouseover: (e: any) => {
        setHoveredProvince(provinceId)
        e.target.setStyle({
          weight: 3,
          fillOpacity: 0.6
        })
      },
      mouseout: (e: any) => {
        setHoveredProvince(null)
        e.target.setStyle(provinceStyle(feature))
      }
    })

    layer.bindTooltip(
      `<div style="padding: 4px">
        <strong>${feature.properties.name}</strong><br/>
        Emergencias: ${stats?.emergencies || 0}<br/>
        Agentes: ${stats?.agents || 0}
      </div>`,
      { sticky: true }
    )
  }, [provinceStats, onProvinceSelect])

  const provinceStyle = useCallback((feature: any) => {
    const topoId = feature.id
    const provinceId = PROVINCE_ID_MAP[topoId] || topoId
    const stats = provinceStats[provinceId]
    
    // Usar refs para valores actuales
    const currentRedistMode = redistributionModeRef.current
    const currentSourceProvince = sourceProvinceRef.current
    const currentDestProvince = destProvinceRef.current
    const currentSelectedProvince = selectedProvinceRef.current
    
    const isSelected = !currentRedistMode && currentSelectedProvince === provinceId
    const isSource = currentRedistMode && currentSourceProvince === provinceId
    const isDest = currentRedistMode && currentDestProvince === provinceId
    const isHovered = hoveredProvince === provinceId
    const isDestHover = currentRedistMode && currentSourceProvince && !currentDestProvince && isHovered && provinceId !== currentSourceProvince
    
    if (isSource) {
      console.log('🟡 Aplicando estilo AMARILLO a provincia origen:', provinceId)
    }
    if (isDest) {
      console.log('🟣 Aplicando estilo PÚRPURA a provincia destino:', provinceId)
    }
    
    const emergencyCount = stats?.emergencies || 0
    const intensity = Math.min(1, emergencyCount / 50)
    
    // Púrpura para destino o hover cuando hay origen seleccionado
    const fillColor = isSource ? '#eab308' : (isDest || isDestHover) ? '#8b5cf6' : isSelected ? '#f59e0b' : `rgb(${30 + intensity * 180}, ${41 + intensity * 80}, 59)`
    const borderColor = isSource ? '#eab308' : (isDest || isDestHover) ? '#8b5cf6' : isSelected ? '#f59e0b' : isHovered ? '#64748b' : '#334155'
    
    return {
      fillColor,
      weight: isSelected || isSource || isDest || isDestHover ? 3 : isHovered ? 2 : 1,
      opacity: 1,
      color: borderColor,
      fillOpacity: isSelected || isSource || isDest || isDestHover ? 0.7 : 0.3 + intensity * 0.2
    }
  }, [provinceStats, hoveredProvince])

  if (!isMounted) {
    return (
      <div className="relative w-full h-full bg-card rounded-lg overflow-hidden border border-border flex items-center justify-center">
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-card rounded-lg border border-border">
      <MapContainerDynamic
        center={[-1.5, -78.5]}
        zoom={6}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
        zoomControl={true}
      >
        <TileLayerDynamic
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        
        <GeoJSONDynamic
          data={ecuadorGeoJSON as any}
          style={provinceStyle}
          onEachFeature={onEachProvince}
          key={`geojson-${geoJsonKey}`}
        />
        
        {/* Agent Groups - Show as clusters */}
        {Object.entries(agentGroups).map(([key, groupAgents]) => {
          const [provinceId, serviceType] = key.split('-')
          const center = getProvinceCenterFromId(provinceId)
          const count = groupAgents.length
          const color = getServiceColor(serviceType)
          const relocatingCount = groupAgents.filter(a => a.status === 'relocating').length
          const radius = Math.min(20, 5 + Math.sqrt(count) * 2)
          
          // Add slight offset based on service type
          const serviceIndex = SERVICE_TYPES.findIndex(s => s.id === serviceType)
          const angle = (serviceIndex / SERVICE_TYPES.length) * Math.PI * 2
          const offsetLat = Math.cos(angle) * 0.1
          const offsetLng = Math.sin(angle) * 0.1
          
          return (
            <CircleMarkerDynamic
              key={key}
              center={[center[0] + offsetLat, center[1] + offsetLng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: relocatingCount > 0 ? '#8b5cf6' : '#ffffff',
                weight: relocatingCount > 0 ? 3 : 2,
                opacity: 1,
                fillOpacity: 0.7,
                className: relocatingCount > 0 ? 'animate-pulse' : ''
              }}
            >
              <PopupDynamic>
                <div className="text-xs">
                  <strong>{SERVICE_TYPES.find(s => s.id === serviceType)?.name}</strong><br/>
                  {ECUADOR_PROVINCES.find(p => p.id === provinceId)?.name}<br/>
                  <div className="flex items-center gap-1 mt-1">
                    <Users size={12} />
                    <span className="font-semibold">{count} agentes</span>
                  </div>
                  <div className="text-[10px] mt-1 space-y-0.5">
                    <div className="text-green-400">
                      {groupAgents.filter(a => a.status === 'available').length} disponibles
                    </div>
                    <div className="text-yellow-400">
                      {groupAgents.filter(a => a.status === 'responding').length} respondiendo
                    </div>
                    {relocatingCount > 0 && (
                      <div className="text-purple-400 font-semibold">
                        {relocatingCount} en tránsito
                      </div>
                    )}
                  </div>
                </div>
              </PopupDynamic>
            </CircleMarkerDynamic>
          )
        })}
        
        {/* Agentes en movimiento - mostrar individualmente con animación */}
        {agents.filter(a => a.status === 'relocating').map((agent) => {
          const color = getServiceColor(agent.type)
          const latLng = getProvinceCenterFromId(agent.relocatingFrom || agent.province)
          
          // Calcular posición interpolada basada en coordenadas del mapa
          let currentLat = latLng[0]
          let currentLng = latLng[1]
          
          if (agent.relocatingTo && agent.relocatingProgress !== undefined) {
            const toLatLng = getProvinceCenterFromId(agent.relocatingTo)
            currentLat = latLng[0] + (toLatLng[0] - latLng[0]) * agent.relocatingProgress
            currentLng = latLng[1] + (toLatLng[1] - latLng[1]) * agent.relocatingProgress
          }
          
          return (
            <CircleMarkerDynamic
              key={`relocating-${agent.id}`}
              center={[currentLat, currentLng]}
              radius={8}
              pathOptions={{
                fillColor: color,
                color: '#8b5cf6',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9,
              }}
              className="animate-pulse"
            >
              <PopupDynamic>
                <div className="text-xs">
                  <div className="font-semibold text-purple-400">🚗 En Tránsito</div>
                  <div className="mt-1">
                    <strong>{agent.name || agent.avatar}</strong>
                  </div>
                  <div className="text-[10px] mt-1">
                    {SERVICE_TYPES.find(s => s.id === agent.type)?.name}
                  </div>
                  <div className="text-[10px] mt-1 space-y-0.5">
                    <div>Desde: {ECUADOR_PROVINCES.find(p => p.id === agent.relocatingFrom)?.name}</div>
                    <div>Hacia: {ECUADOR_PROVINCES.find(p => p.id === agent.relocatingTo)?.name}</div>
                    {agent.relocatingProgress !== undefined && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-purple-500 h-1.5 rounded-full transition-all" 
                            style={{ width: `${agent.relocatingProgress * 100}%` }}
                          />
                        </div>
                        <div className="text-center mt-0.5">{Math.round(agent.relocatingProgress * 100)}%</div>
                      </div>
                    )}
                  </div>
                </div>
              </PopupDynamic>
            </CircleMarkerDynamic>
          )
        })}
        
        {/* Emergencies */}
        {emergencies.map((emergency) => {
          const center = getProvinceCenterFromId(emergency.province)
          const offsetLat = ((parseInt(emergency.id, 36) % 800) / 800 - 0.5) * 0.15
          const offsetLng = ((parseInt(emergency.id, 36) % 400) / 400 - 0.5) * 0.15
          
          return (
            <CircleMarkerDynamic
              key={`emergency-${emergency.id}`}
              center={[center[0] + offsetLat, center[1] + offsetLng]}
              radius={emergency.status === 'pending' ? 8 : 6}
              pathOptions={{
                fillColor: emergency.status === 'pending' ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: emergency.status === 'pending' ? 0.8 : 0.5
              }}
              className={emergency.status === 'pending' ? 'animate-pulse' : ''}
            >
              <PopupDynamic>
                <div className="text-xs">
                  <strong>Emergencia {emergency.id}</strong><br/>
                  Tipo: {SERVICE_TYPES.find(s => s.id === emergency.type)?.name}<br/>
                  Prioridad: {emergency.priority}<br/>
                  Estado: {emergency.status === 'pending' ? 'Pendiente' : 'En Atención'}
                </div>
              </PopupDynamic>
            </CircleMarkerDynamic>
          )
        })}
      </MapContainerDynamic>
      
      {/* Indicador de Modo Redistribución */}
      {redistributionMode && (
        <Card className="absolute top-4 left-4 p-3 z-[1000] bg-primary/20 border-2 border-primary shadow-lg">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-primary-foreground flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 animate-pulse" />
              Modo Redistribución Activo
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-primary-foreground/80 font-semibold">
                {!sourceProvince 
                  ? '1️⃣ Selecciona provincia ORIGEN (🟡 Amarillo)' 
                  : '2️⃣ Selecciona provincia DESTINO (🟣 Púrpura)'}
              </p>
              {sourceProvince && (
                <div className="text-[10px] bg-yellow-500/30 text-yellow-200 p-1.5 rounded border border-yellow-400">
                  Origen: <span className="font-semibold">{ECUADOR_PROVINCES.find(p => p.id === sourceProvince)?.name}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 p-3 z-[1000]">
        <h4 className="text-xs font-semibold text-foreground mb-2">Tipos de Servicio</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {SERVICE_TYPES.map(service => (
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
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-muted-foreground">Emergencia pendiente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[10px] text-muted-foreground">En atención</span>
          </div>
        </div>
      </Card>

      {/* Province Info */}
      {(selectedProvince || hoveredProvince) && (
        <Card className="absolute top-4 right-4 p-3 min-w-[180px] z-[1000]">
          <h4 className="text-sm font-semibold text-primary mb-1.5">
            {ECUADOR_PROVINCES.find(p => p.id === (selectedProvince || hoveredProvince))?.name}
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex justify-between">
              <span>Emergencias:</span>
              <span className="font-semibold text-red-400">
                {provinceStats[selectedProvince || hoveredProvince || '']?.emergencies || 0}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Agentes:</span>
              <span className="font-semibold text-green-400">
                {provinceStats[selectedProvince || hoveredProvince || '']?.agents || 0}
              </span>
            </p>
            {selectedProvince || hoveredProvince ? (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[10px] font-semibold mb-1">Por tipo:</p>
                {SERVICE_TYPES.slice(0, 4).map(service => {
                  const count = agents.filter(
                    a => a.province === (selectedProvince || hoveredProvince) && a.type === service.id
                  ).length
                  if (count === 0) return null
                  return (
                    <div key={service.id} className="flex justify-between text-[10px]">
                      <span>{service.name.split(' ')[0]}:</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </Card>
      )}

      {/* Redistribution Dialog */}
      <RedistributionDialog
        open={showRedistributionDialog}
        onOpenChange={(open) => {
          setShowRedistributionDialog(open)
          if (!open) {
            // Si se cierra el diálogo sin confirmar, limpiar estados
            setSourceProvince(null)
            setDestProvince(null)
            // Mantener redistributionMode activo para permitir otra operación
          }
        }}
        fromProvince={sourceProvince}
        toProvince={destProvince}
        availableAgents={
          sourceProvince
            ? SERVICE_TYPES.reduce((acc, service) => {
                acc[service.id] = agents.filter(
                  a => a.province === sourceProvince && a.type === service.id && a.status === 'available'
                ).length
                return acc
              }, {} as Record<string, number>)
            : {}
        }
        onConfirm={(from, to, serviceType, count) => {
          if (onRedistribute) {
            onRedistribute(from, to, serviceType, count)
          }
          setShowRedistributionDialog(false)
          setSourceProvince(null)
          setDestProvince(null)
          // Mantener redistributionMode activo para otra operación
        }}
      />
    </div>
  )
}
