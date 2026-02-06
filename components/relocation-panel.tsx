'use client'

import React from 'react'
import { Agent, SERVICE_TYPES, ECUADOR_PROVINCES } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowRight, Truck, User } from 'lucide-react'

interface RelocationPanelProps {
  agents: Agent[]
}

export function RelocationPanel({ agents }: RelocationPanelProps) {
  const relocatingAgents = agents.filter(a => a.status === 'relocating')

  if (relocatingAgents.length === 0) {
    return null
  }

  // Agrupar por ruta (from -> to)
  const routes = relocatingAgents.reduce((acc, agent) => {
    const key = `${agent.relocatingFrom}-${agent.relocatingTo}-${agent.type}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(agent)
    return acc
  }, {} as Record<string, Agent[]>)

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-2 border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-500 animate-pulse" />
            Personal en Tránsito
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
            {relocatingAgents.length} agente{relocatingAgents.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="px-4 pb-4 space-y-3">
            {Object.entries(routes).map(([key, routeAgents]) => {
              const [fromId, toId, serviceType] = key.split('-')
              const service = SERVICE_TYPES.find(s => s.id === serviceType)
              const fromProvince = ECUADOR_PROVINCES.find(p => p.id === fromId)
              const toProvince = ECUADOR_PROVINCES.find(p => p.id === toId)
              
              // Calcular progreso promedio
              const avgProgress = routeAgents.reduce((sum, a) => 
                sum + (a.relocatingProgress || 0), 0
              ) / routeAgents.length

              return (
                <div
                  key={key}
                  className="p-3 rounded-lg border transition-all"
                  style={{ 
                    backgroundColor: `${service?.color}10`,
                    borderColor: `${service?.color}40`
                  }}
                >
                  {/* Encabezado de la ruta */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${service?.color}30` }}
                      >
                        <Truck 
                          className="w-4 h-4" 
                          style={{ color: service?.color }} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold truncate" style={{ color: service?.color }}>
                          {service?.name}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[80px]">{fromProvince?.name}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[80px]">{toProvince?.name}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] ml-2"
                      style={{ borderColor: service?.color, color: service?.color }}
                    >
                      {routeAgents.length} agente{routeAgents.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>Progreso</span>
                      <span className="font-semibold">{Math.round(avgProgress * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 ease-linear animate-pulse"
                        style={{ 
                          width: `${avgProgress * 100}%`,
                          backgroundColor: service?.color
                        }}
                      />
                    </div>
                  </div>

                  {/* Lista de agentes (primeros 3) */}
                  <div className="mt-2 space-y-1">
                    {routeAgents.slice(0, 3).map(agent => (
                      <div 
                        key={agent.id} 
                        className="flex items-center gap-2 text-[9px] text-muted-foreground bg-muted/30 rounded px-2 py-1"
                      >
                        <User className="w-3 h-3 flex-shrink-0" style={{ color: service?.color }} />
                        <span className="flex-1 truncate">{agent.name || agent.avatar}</span>
                        <span className="font-semibold" style={{ color: service?.color }}>
                          {Math.round((agent.relocatingProgress || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                    {routeAgents.length > 3 && (
                      <div className="text-[9px] text-muted-foreground text-center py-1">
                        +{routeAgents.length - 3} más
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
