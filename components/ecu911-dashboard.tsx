'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { EcuadorMap } from './ecuador-map'
import { AgentsPanel } from './agents-panel'
import { EmergencyFeed } from './emergency-feed'
import { StatisticsPanel } from './statistics-panel'
import { SimulationControls } from './simulation-controls'
import { AnalysisPanel } from './analysis-panel'
import { RelocationPanel } from './relocation-panel'
import { SimulationEngine } from '@/lib/simulation-engine'
import { Agent, Emergency, CSVData, SERVICE_TYPES, ECUADOR_PROVINCES } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Phone, 
  Shield, 
  Activity,
  MapPin,
  BarChart3,
  Users,
  Settings,
  ArrowLeftRight
} from 'lucide-react'

export function ECU911Dashboard() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(new Date(2025, 10, 1, 0, 0, 0)) // 1 noviembre 2025
  const [agents, setAgents] = useState<Agent[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [totalEmergencies, setTotalEmergencies] = useState(0)
  const [resolvedEmergencies, setResolvedEmergencies] = useState(0)
  const [hasCSVData, setHasCSVData] = useState(false)
  const [timeSeriesData, setTimeSeriesData] = useState<Array<{ time: string; count: number }>>([])
  const [emergenciesByType, setEmergenciesByType] = useState<Record<string, number>>({})
  const [currentDistribution, setCurrentDistribution] = useState<Record<string, Record<string, number>>>({})
  const [suggestedDistribution, setSuggestedDistribution] = useState<Record<string, Record<string, number>>>({})
  const [provinceEmergencies, setProvinceEmergencies] = useState<Record<string, number>>({})
  const [redistributionMode, setRedistributionMode] = useState(false)

  const engineRef = useRef<SimulationEngine | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar el motor de simulación
  useEffect(() => {
    const engine = new SimulationEngine()
    engineRef.current = engine

    // Cargar estado inicial
    const state = engine.getState()
    setAgents(state.agents)
    setEmergencies(state.activeEmergencies)
    setCurrentDistribution(engine.getAgentDistribution())
    setSuggestedDistribution(engine.suggestOptimalDistribution())

    // Inicializar estadísticas por tipo
    const initialByType: Record<string, number> = {}
    SERVICE_TYPES.forEach(service => {
      initialByType[service.id] = service.count
    })
    setEmergenciesByType(initialByType)

    // Inicializar datos de serie temporal
    const initialTimeSeries = Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 2}:00`,
      count: Math.floor(Math.random() * 50) + 20,
    }))
    setTimeSeriesData(initialTimeSeries)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Control del bucle de simulación
  useEffect(() => {
    if (isRunning && engineRef.current) {
      intervalRef.current = setInterval(() => {
        const engine = engineRef.current!
        engine.tick(1000 * speed)
        
        const state = engine.getState()
        setAgents([...state.agents])
        setEmergencies([...state.activeEmergencies])
        setTotalEmergencies(state.totalEmergencies)
        setResolvedEmergencies(state.resolvedEmergencies)
        setCurrentTime(state.currentTime)

        // Actualizar serie temporal
        setTimeSeriesData(prev => {
          const newData = [...prev.slice(1)]
          const hour = state.currentTime.getHours()
          const minute = state.currentTime.getMinutes()
          newData.push({
            time: `${hour}:${minute.toString().padStart(2, '0')}`,
            count: state.activeEmergencies.length + Math.floor(Math.random() * 10),
          })
          return newData
        })

        // Actualizar emergencias por provincia
        const byProvince: Record<string, number> = {}
        state.statistics.forEach(stat => {
          byProvince[stat.province] = stat.emergencies
        })
        setProvinceEmergencies(byProvince)

        // Actualizar distribuciones
        setCurrentDistribution(engine.getAgentDistribution())
        setSuggestedDistribution(engine.suggestOptimalDistribution())
      }, 100 / speed)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isRunning, speed])

  const handleToggleRunning = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
  }, [])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    engineRef.current = new SimulationEngine()
    const state = engineRef.current.getState()
    setAgents(state.agents)
    setEmergencies([])
    setTotalEmergencies(0)
    setResolvedEmergencies(0)
    setCurrentTime(new Date(2025, 10, 1, 0, 0, 0)) // Resetear a 1 noviembre 2025
    setHasCSVData(false)
    setCurrentDistribution(engineRef.current.getAgentDistribution())
    setSuggestedDistribution(engineRef.current.suggestOptimalDistribution())
  }, [])

  const handleCSVLoad = useCallback((data: CSVData[]) => {
    if (engineRef.current) {
      engineRef.current.loadCSVData(data)
      setHasCSVData(true)

      // Recalcular estadísticas basadas en CSV
      const byType: Record<string, number> = {}
      const byProvince: Record<string, number> = {}

      data.forEach(row => {
        const type = row.tipo_servicio
        byType[type] = (byType[type] || 0) + 1

        const province = row.provincia.toLowerCase().replace(/\s+/g, '_')
        byProvince[province] = (byProvince[province] || 0) + 1
      })

      setEmergenciesByType(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(byType).map(([key, value]) => {
            const serviceId = SERVICE_TYPES.find(s => s.name === key)?.id || key
            return [serviceId, value]
          })
        ),
      }))

      setProvinceEmergencies(byProvince)
      setSuggestedDistribution(engineRef.current.suggestOptimalDistribution())
    }
  }, [])

  // Calcular estadísticas del mapa
  const provinceStats = ECUADOR_PROVINCES.reduce((acc, province) => {
    acc[province.id] = {
      emergencies: provinceEmergencies[province.id] || 0,
      agents: agents.filter(a => a.province === province.id).length,
    }
    return acc
  }, {} as Record<string, { emergencies: number; agents: number }>)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                  ECU 911
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Simulación
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Sistema Integrado de Seguridad - Ecuador
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">24 Provincias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-muted-foreground">{agents.length} Agentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
                  <span className="text-muted-foreground">
                    {isRunning ? 'En vivo' : 'Pausado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Screen */}
      <main className="flex-1 relative overflow-hidden">
        <Tabs defaultValue="map" className="h-full">
          {/* Selector de Pestañas - Siempre Visible */}
          <div className="absolute top-4 right-4 z-[1002]">
            <TabsList className="bg-card/95 backdrop-blur-sm">
              <TabsTrigger value="map" className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                Mapa
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
                <BarChart3 className="w-3 h-3" />
                Dashboard
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Mapa Completo */}
          <TabsContent value="map" className="h-full mt-0 data-[state=inactive]:hidden">
            {/* Mapa de Ecuador - Pantalla Completa */}
            <div className="absolute inset-0 w-full h-full">
              <EcuadorMap
                agents={agents}
                emergencies={emergencies}
                selectedProvince={selectedProvince}
                onProvinceSelect={setSelectedProvince}
                provinceStats={provinceStats}
                redistributionMode={redistributionMode}
                onRedistributionModeChange={setRedistributionMode}
                onRedistribute={(from, to, serviceType, count) => {
                  if (engineRef.current) {
                    const success = engineRef.current.redistributeAgents(from, to, serviceType, count)
                    if (success) {
                      setAgents([...engineRef.current.getState().agents])
                      
                      // Mostrar notificación de inicio
                      const serviceName = SERVICE_TYPES.find(s => s.id === serviceType)?.name
                      const fromName = ECUADOR_PROVINCES.find(p => p.id === from)?.name
                      const toName = ECUADOR_PROVINCES.find(p => p.id === to)?.name
                      
                      toast({
                        title: "🚗 Redistribución Iniciada",
                        description: `${count} agente${count !== 1 ? 's' : ''} de ${serviceName} viajando de ${fromName} a ${toName}`,
                        duration: 4000,
                      })
                    } else {
                      toast({
                        title: "❌ Error",
                        description: "No hay suficientes agentes disponibles para redistribuir",
                        variant: "destructive",
                        duration: 3000,
                      })
                    }
                  }
                }}
              />
            </div>

            {/* Panel de Controles Lateral Izquierdo */}
            <div className="absolute top-4 left-4 z-[1001] w-80 max-h-[calc(100vh-120px)] overflow-y-auto space-y-4">
              <SimulationControls
                isRunning={isRunning}
                speed={speed}
                onToggleRunning={handleToggleRunning}
                onSpeedChange={handleSpeedChange}
                onReset={handleReset}
                onCSVLoad={handleCSVLoad}
                currentTime={currentTime}
                hasCSVData={hasCSVData}
              />
              
              {/* Panel de personal en tránsito */}
              <RelocationPanel agents={agents} />
              
              <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4" />
                    Redistribuir Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    size="sm"
                    variant={redistributionMode ? "default" : "outline"}
                    onClick={() => {
                      setRedistributionMode(!redistributionMode)
                      if (!redistributionMode) {
                        toast({
                          title: "✅ Modo Redistribución Activado",
                          description: "Haz clic en una provincia origen, luego en una destino",
                          duration: 3000,
                        })
                      }
                    }}
                    className="w-full font-semibold"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    {redistributionMode ? 'Cancelar Redistribución' : 'Activar Redistribución'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {redistributionMode 
                      ? '🟢 Modo activo: Haz clic en provincias para redistribuir'
                      : 'Haz clic en el botón para activar el modo redistribución'}
                  </p>
                  {selectedProvince && (
                    <div className="text-xs bg-primary/10 p-2 rounded">
                      Provincia seleccionada: <span className="font-semibold">{selectedProvince}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel de Emergencias Activas - Derecha (debajo del selector) */}
            <div className="absolute top-16 right-4 z-[1001] w-96 max-h-[calc(100vh-150px)] overflow-hidden">
              <EmergencyFeed emergencies={emergencies} selectedProvince={selectedProvince} />
            </div>
          </TabsContent>

          {/* Tab: Dashboard Completo */}
          <TabsContent value="dashboard" className="h-full mt-0 overflow-auto data-[state=inactive]:hidden">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Panel izquierdo - Controles */}
                <div className="lg:col-span-4">
                  <SimulationControls
                    isRunning={isRunning}
                    speed={speed}
                    onToggleRunning={handleToggleRunning}
                    onSpeedChange={handleSpeedChange}
                    onReset={handleReset}
                    onCSVLoad={handleCSVLoad}
                    currentTime={currentTime}
                    hasCSVData={hasCSVData}
                  />
                </div>

                {/* Panel central - Estadísticas y gráficos */}
                <div className="lg:col-span-8 space-y-4">
                  <Tabs defaultValue="stats" className="h-full">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="stats" className="flex items-center gap-1 text-xs">
                        <BarChart3 className="w-3 h-3" />
                        Estadísticas
                      </TabsTrigger>
                      <TabsTrigger value="agents" className="flex items-center gap-1 text-xs">
                        <Users className="w-3 h-3" />
                        Personal
                      </TabsTrigger>
                      <TabsTrigger value="analysis" className="flex items-center gap-1 text-xs">
                        <Settings className="w-3 h-3" />
                        Análisis
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats" className="mt-0">
                      <StatisticsPanel
                        totalEmergencies={totalEmergencies}
                        resolvedEmergencies={resolvedEmergencies}
                        emergenciesByType={emergenciesByType}
                        timeSeriesData={timeSeriesData}
                      />
                    </TabsContent>

                    <TabsContent value="agents" className="mt-0">
                      <AgentsPanel
                        agents={agents}
                        selectedProvince={selectedProvince}
                      />
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-0">
                      <AnalysisPanel
                        currentDistribution={currentDistribution}
                        suggestedDistribution={suggestedDistribution}
                        provinceEmergencies={provinceEmergencies}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Footer con información */}
              <footer className="mt-6 pt-4 border-t border-border">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Datos: Noviembre 2025</span>
                    <span>•</span>
                    <span>Total: 269,066 emergencias</span>
                    {hasCSVData && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400">
                          Datos CSV Cargados
                        </Badge>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>Sistema de Simulación de Eventos Discretos</span>
                  </div>
                </div>
              </footer>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
