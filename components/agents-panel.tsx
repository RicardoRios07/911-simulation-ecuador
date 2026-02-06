'use client'

import React from "react"

import { Agent, SERVICE_TYPES, ECUADOR_PROVINCES } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  Car, 
  Heart, 
  Building, 
  Flame, 
  ShieldCheck, 
  AlertTriangle,
  User,
  Users
} from 'lucide-react'

interface AgentsPanelProps {
  agents: Agent[]
  selectedProvince: string | null
}

const serviceIcons: Record<string, React.ElementType> = {
  seguridad: Shield,
  transito: Car,
  sanitaria: Heart,
  municipal: Building,
  siniestros: Flame,
  militar: ShieldCheck,
  riesgos: AlertTriangle,
}

const serviceInstitutions: Record<string, string[]> = {
  seguridad: [
    'Policía Nacional',
    'Fuerzas Armadas',
    'Agentes Metropolitanos'
  ],
  transito: [
    'ANT',
    'Comisiones de Tránsito',
    'Agentes Civiles de Tránsito'
  ],
  sanitaria: [
    'Ministerio de Salud',
    'IESS',
    'Cruz Roja',
    'Hospitales'
  ],
  municipal: [
    'Municipios',
    'Empresas Municipales',
    'Servicios Urbanos'
  ],
  siniestros: [
    'Bomberos',
    'Cruz Roja',
    'Policía Nacional'
  ],
  militar: [
    'Fuerzas Armadas',
    'Rescate Militar',
    'Seguridad Fronteriza'
  ],
  riesgos: [
    'SGR',
    'Bomberos',
    'Fuerzas Armadas',
    'GAD'
  ],
}

export function AgentsPanel({ agents, selectedProvince }: AgentsPanelProps) {
  const filteredAgents = selectedProvince 
    ? agents.filter(a => a.province === selectedProvince)
    : agents

  const groupedByType = SERVICE_TYPES.map(service => ({
    ...service,
    agents: filteredAgents.filter(a => a.type === service.id),
    available: filteredAgents.filter(a => a.type === service.id && a.status === 'available').length,
    busy: filteredAgents.filter(a => a.type === service.id && a.status === 'busy').length,
    responding: filteredAgents.filter(a => a.type === service.id && a.status === 'responding').length,
  }))

  const provinceName = selectedProvince 
    ? ECUADOR_PROVINCES.find(p => p.id === selectedProvince)?.name 
    : 'Nacional'

  return (
    <Card className="h-full bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Personal Operativo
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {provinceName}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Disponible
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Ocupado
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Respondiendo
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            En tránsito
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="px-4 pb-4 space-y-3">
            {groupedByType.map(service => {
              const Icon = serviceIcons[service.id] || User
              const total = service.agents.length

              return (
                <div 
                  key={service.id}
                  className="p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${service.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: service.color }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          {service.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {total} agentes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Instituciones que atienden */}
                  <div className="mb-2">
                    <p className="text-[10px] text-muted-foreground mb-1">Instituciones:</p>
                    <div className="flex flex-wrap gap-1">
                      {serviceInstitutions[service.id]?.map((institution, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-[9px] px-1.5 py-0"
                          style={{ borderColor: service.color, color: service.color }}
                        >
                          {institution}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Barra de estado */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                    {service.available > 0 && (
                      <div 
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${(service.available / total) * 100}%` }}
                      />
                    )}
                    {service.busy > 0 && (
                      <div 
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${(service.busy / total) * 100}%` }}
                      />
                    )}
                    {service.responding > 0 && (
                      <div 
                        className="h-full bg-red-500 transition-all animate-pulse"
                        style={{ width: `${(service.responding / total) * 100}%` }}
                      />
                    )}
                  </div>

                  {/* Números */}
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-emerald-500">{service.available} disp.</span>
                    <span className="text-amber-500">{service.busy} ocup.</span>
                    <span className="text-red-500">{service.responding} resp.</span>
                  </div>

                  {/* Visualización de agentes como avatares */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {service.agents.slice(0, 24).map(agent => {
                      const statusColor = 
                        agent.status === 'available' ? 'emerald' :
                        agent.status === 'busy' ? 'amber' :
                        agent.status === 'relocating' ? 'purple' :
                        'red'
                      
                      const statusBgColor = 
                        agent.status === 'available' ? 'bg-emerald-500' :
                        agent.status === 'busy' ? 'bg-amber-500' :
                        agent.status === 'relocating' ? 'bg-purple-500' :
                        'bg-red-500'
                      
                      return (
                        <div
                          key={agent.id}
                          className={`relative group cursor-pointer`}
                          title={`${agent.name || agent.avatar || agent.id}`}
                        >
                          {/* Avatar del agente */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 ${
                              agent.status === 'responding' || agent.status === 'relocating' ? 'animate-pulse' : ''
                            }`}
                            style={{ 
                              backgroundColor: `${service.color}30`,
                              borderColor: `var(--${statusColor}-500, ${service.color})`
                            }}
                          >
                            <Icon 
                              className="w-3.5 h-3.5" 
                              style={{ color: service.color }} 
                            />
                          </div>
                          
                          {/* Indicador de estado */}
                          <div 
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${statusBgColor} ${
                              agent.status === 'responding' || agent.status === 'relocating' ? 'animate-pulse' : ''
                            }`}
                          />
                          
                          {/* Tooltip on hover - Mejorado */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-popover text-popover-foreground text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-border shadow-lg min-w-[120px]">
                            <div className="font-bold text-[10px] mb-0.5">{agent.name || agent.avatar || 'Agente'}</div>
                            <div className="text-[8px] text-muted-foreground mb-1">{agent.avatar || agent.id}</div>
                            <div className={`capitalize font-semibold ${
                              agent.status === 'available' ? 'text-emerald-400' :
                              agent.status === 'relocating' ? 'text-purple-400' :
                              agent.status === 'busy' ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              {agent.status === 'relocating' ? '🚗 En tránsito' : 
                               agent.status === 'responding' ? '🚨 Respondiendo' :
                               agent.status === 'busy' ? '⏳ Ocupado' : '✓ Disponible'}
                            </div>
                            <div className="text-muted-foreground mt-0.5">
                              {agent.status === 'relocating' && agent.relocatingTo ? 
                                `→ ${ECUADOR_PROVINCES.find(p => p.id === agent.relocatingTo)?.name}` :
                                ECUADOR_PROVINCES.find(p => p.id === agent.province)?.name
                              }
                            </div>
                            {agent.relocatingProgress !== undefined && (
                              <div className="mt-1">
                                <div className="w-full bg-muted rounded-full h-1">
                                  <div 
                                    className="bg-purple-500 h-1 rounded-full transition-all" 
                                    style={{ width: `${agent.relocatingProgress * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {service.agents.length > 24 && (
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                        style={{ 
                          backgroundColor: `${service.color}20`,
                          color: service.color
                        }}
                      >
                        +{service.agents.length - 24}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
