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

                  {/* Visualización de agentes como iconos */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {service.agents.slice(0, 20).map(agent => (
                      <div
                        key={agent.id}
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                          agent.status === 'available' 
                            ? 'bg-emerald-500/20' 
                            : agent.status === 'busy'
                            ? 'bg-amber-500/20'
                            : 'bg-red-500/20 animate-pulse'
                        }`}
                        title={`${agent.id} - ${agent.status}`}
                      >
                        <User className={`w-2.5 h-2.5 ${
                          agent.status === 'available' 
                            ? 'text-emerald-500' 
                            : agent.status === 'busy'
                            ? 'text-amber-500'
                            : 'text-red-500'
                        }`} />
                      </div>
                    ))}
                    {service.agents.length > 20 && (
                      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-[8px] text-muted-foreground">+{service.agents.length - 20}</span>
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
