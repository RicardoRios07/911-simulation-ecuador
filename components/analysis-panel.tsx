'use client'

import { SERVICE_TYPES, ECUADOR_PROVINCES } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

interface AnalysisPanelProps {
  currentDistribution: Record<string, Record<string, number>>
  suggestedDistribution: Record<string, Record<string, number>>
  provinceEmergencies: Record<string, number>
}

export function AnalysisPanel({
  currentDistribution,
  suggestedDistribution,
  provinceEmergencies,
}: AnalysisPanelProps) {
  // Calcular provincias con déficit de personal
  const deficitProvinces = ECUADOR_PROVINCES.map(province => {
    const current = currentDistribution[province.id] || {}
    const suggested = suggestedDistribution[province.id] || {}
    
    let totalCurrent = 0
    let totalSuggested = 0
    
    SERVICE_TYPES.forEach(service => {
      totalCurrent += current[service.id] || 0
      totalSuggested += suggested[service.id] || 0
    })

    return {
      province,
      current: totalCurrent,
      suggested: totalSuggested,
      deficit: totalSuggested - totalCurrent,
      emergencies: provinceEmergencies[province.id] || 0,
    }
  }).filter(p => p.deficit > 0).sort((a, b) => b.deficit - a.deficit)

  // Calcular provincias con exceso
  const surplusProvinces = ECUADOR_PROVINCES.map(province => {
    const current = currentDistribution[province.id] || {}
    const suggested = suggestedDistribution[province.id] || {}
    
    let totalCurrent = 0
    let totalSuggested = 0
    
    SERVICE_TYPES.forEach(service => {
      totalCurrent += current[service.id] || 0
      totalSuggested += suggested[service.id] || 0
    })

    return {
      province,
      current: totalCurrent,
      suggested: totalSuggested,
      surplus: totalCurrent - totalSuggested,
      emergencies: provinceEmergencies[province.id] || 0,
    }
  }).filter(p => p.surplus > 0).sort((a, b) => b.surplus - a.surplus)

  // Top tipos de servicio con más demanda
  const servicesDemand = SERVICE_TYPES.map(service => {
    let totalEmergencies = 0
    let totalAgents = 0

    Object.values(currentDistribution).forEach(dist => {
      totalAgents += dist[service.id] || 0
    })

    // Usar datos estáticos de noviembre 2025
    totalEmergencies = service.count

    return {
      service,
      emergencies: totalEmergencies,
      agents: totalAgents,
      ratio: totalAgents > 0 ? totalEmergencies / totalAgents : 0,
    }
  }).sort((a, b) => b.ratio - a.ratio)

  return (
    <Card className="h-full bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Análisis de Distribución
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Recomendaciones basadas en demanda real
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="px-4 pb-4 space-y-4">
            {/* Provincias con déficit */}
            <div>
              <h4 className="text-xs font-medium text-destructive flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3 h-3" />
                Provincias con Déficit de Personal
              </h4>
              
              {deficitProvinces.length === 0 ? (
                <div className="text-center py-4 bg-emerald-500/10 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                  <p className="text-xs text-emerald-400">Distribución equilibrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deficitProvinces.slice(0, 5).map(item => (
                    <div 
                      key={item.province.id}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {item.province.name}
                        </span>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                          +{item.deficit} agentes
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Actual: {item.current}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-red-400">Óptimo: {item.suggested}</span>
                      </div>
                      <Progress 
                        value={(item.current / item.suggested) * 100} 
                        className="h-1 mt-2 bg-red-500/20"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Provincias con exceso */}
            <div>
              <h4 className="text-xs font-medium text-amber-400 flex items-center gap-1 mb-2">
                <Users className="w-3 h-3" />
                Provincias con Exceso de Personal
              </h4>
              
              {surplusProvinces.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Sin excesos detectados
                </p>
              ) : (
                <div className="space-y-2">
                  {surplusProvinces.slice(0, 3).map(item => (
                    <div 
                      key={item.province.id}
                      className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {item.province.name}
                        </span>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                          -{item.surplus} agentes
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Actual: {item.current}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-amber-400">Óptimo: {item.suggested}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Demanda por tipo de servicio */}
            <div>
              <h4 className="text-xs font-medium text-foreground flex items-center gap-1 mb-2">
                <TrendingDown className="w-3 h-3" />
                Carga por Tipo de Servicio
              </h4>
              <div className="space-y-2">
                {servicesDemand.slice(0, 5).map(item => (
                  <div 
                    key={item.service.id}
                    className="p-2 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.service.color }}
                        />
                        <span className="text-xs font-medium text-foreground">
                          {item.service.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {item.ratio.toFixed(0)} em/agente
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{item.emergencies.toLocaleString()} emergencias</span>
                      <span>{item.agents} agentes</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (item.ratio / 200) * 100)} 
                      className="h-1 mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
