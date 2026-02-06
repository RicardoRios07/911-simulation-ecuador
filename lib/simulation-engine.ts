import { Agent, Emergency, CSVData, SERVICE_TYPES, ECUADOR_PROVINCES, ProvinceStatistics } from './types'

// Motor de simulación de eventos discretos
export class SimulationEngine {
  private agents: Agent[] = []
  private emergencies: Emergency[] = []
  private resolvedEmergencies: Emergency[] = []
  private eventQueue: SimulationEvent[] = []
  private currentTime: Date = new Date(2025, 10, 1, 0, 0, 0) // 1 de noviembre 2025
  private csvData: CSVData[] = []
  private provinceStats: Map<string, ProvinceStatistics> = new Map()
  private listeners: Set<(state: SimulationState) => void> = new Set()

  constructor() {
    this.initializeAgents()
    this.initializeStats()
  }

  private initializeAgents() {
    // Nombres de ejemplo para los agentes
    const names = [
      'Juan P.', 'María G.', 'Carlos R.', 'Ana M.', 'Luis F.',
      'Carmen S.', 'Pedro L.', 'Sofia V.', 'Diego A.', 'Laura C.',
      'Miguel T.', 'Isabel N.', 'Jorge E.', 'Patricia D.', 'Roberto H.',
      'Valentina Q.', 'Fernando B.', 'Gabriela O.', 'Andrés M.', 'Daniela P.'
    ]
    
    // Inicializar agentes basados en población y demanda estimada
    let agentIndex = 0
    ECUADOR_PROVINCES.forEach(province => {
      const baseAgents = Math.max(3, Math.floor(province.population / 100000))
      
      SERVICE_TYPES.forEach(service => {
        const agentCount = Math.ceil(baseAgents * (service.count / 269066))
        for (let i = 0; i < Math.max(1, agentCount); i++) {
          this.agents.push({
            id: `${province.id}-${service.id}-${i}`,
            type: service.id,
            status: 'available',
            province: province.id,
            position: {
              x: province.coordinates.x + (Math.random() - 0.5) * 5,
              y: province.coordinates.y + (Math.random() - 0.5) * 5,
            },
            name: names[agentIndex % names.length] + ' ' + (Math.floor(agentIndex / names.length) + 1),
            avatar: `AG-${String(agentIndex + 1).padStart(3, '0')}`,
          })
          agentIndex++
        }
      })
    })
  }

  private initializeStats() {
    ECUADOR_PROVINCES.forEach(province => {
      this.provinceStats.set(province.id, {
        province: province.id,
        emergencies: 0,
        agents: this.agents.filter(a => a.province === province.id).length,
        avgResponseTime: 0,
        byType: {},
      })
    })
  }

  loadCSVData(data: CSVData[]) {
    this.csvData = data
    this.recalculateDistribution()
  }

  private recalculateDistribution() {
    if (this.csvData.length === 0) return

    // Recalcular estadísticas por provincia basadas en datos reales
    const provinceEmergencies = new Map<string, Map<string, number>>()

    this.csvData.forEach(row => {
      const provinceName = this.normalizeProvinceName(row.provincia)
      if (!provinceEmergencies.has(provinceName)) {
        provinceEmergencies.set(provinceName, new Map())
      }
      const typeMap = provinceEmergencies.get(provinceName)!
      const serviceType = this.mapServiceType(row.tipo_servicio)
      typeMap.set(serviceType, (typeMap.get(serviceType) || 0) + 1)
    })

    // Actualizar estadísticas
    provinceEmergencies.forEach((typeMap, province) => {
      const stats = this.provinceStats.get(province)
      if (stats) {
        stats.byType = Object.fromEntries(typeMap)
        stats.emergencies = Array.from(typeMap.values()).reduce((a, b) => a + b, 0)
      }
    })
  }

  private mapServiceType(serviceName: string): string {
    const mapping: Record<string, string> = {
      'Seguridad Ciudadana': 'seguridad',
      'Tránsito y Movilidad': 'transito',
      'Gestión Sanitaria': 'sanitaria',
      'Servicios Municipales': 'municipal',
      'Gestión de Siniestros': 'siniestros',
      'Servicio Militar': 'militar',
      'Gestión de Riesgos': 'riesgos',
    }
    return mapping[serviceName] || 'seguridad'
  }

  generateEmergency(): Emergency {
    // Generar emergencia basada en distribución real o simulada
    let emergency: Emergency
    
    if (this.csvData.length > 0) {
      // Usar datos reales del CSV filtrados por el mes actual
      const currentMonth = this.currentTime.getMonth() + 1 // 1-12
      const currentDay = this.currentTime.getDate()
      const currentDayOfWeek = this.currentTime.toLocaleDateString('es-ES', { weekday: 'long' })
      
      // Filtrar datos del CSV por el mes actual (noviembre = 11)
      const relevantData = this.csvData.filter(row => {
        const rowMonth = parseInt(row.mes)
        return rowMonth === currentMonth
      })
      
      // Seleccionar un registro aleatorio del mes actual
      const dataPoint = relevantData.length > 0 
        ? relevantData[Math.floor(Math.random() * relevantData.length)]
        : this.csvData[Math.floor(Math.random() * this.csvData.length)]
      
      const serviceType = this.mapServiceType(dataPoint.tipo_servicio)
      const provinceName = this.normalizeProvinceName(dataPoint.provincia)
      
      emergency = {
        id: `em-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: serviceType,
        subtype: dataPoint.subtipo || this.getRandomSubtype(serviceType),
        province: provinceName,
        canton: dataPoint.canton,
        parroquia: dataPoint.parroquia,
        timestamp: new Date(this.currentTime),
        status: 'pending',
        priority: SERVICE_TYPES.find(s => s.id === serviceType)?.priority || 2,
      }
    } else {
      // Generación por defecto si no hay CSV
      const serviceType = this.weightedRandomService()
      const province = this.weightedRandomProvince(serviceType)
      const provinceData = ECUADOR_PROVINCES.find(p => p.id === province)!

      emergency = {
        id: `em-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: serviceType,
        subtype: this.getRandomSubtype(serviceType),
        province: province,
        canton: 'Canton ' + Math.floor(Math.random() * 10 + 1),
        parroquia: 'Parroquia ' + Math.floor(Math.random() * 20 + 1),
        timestamp: new Date(this.currentTime),
        status: 'pending',
        priority: SERVICE_TYPES.find(s => s.id === serviceType)?.priority || 2,
      }
    }

    return emergency
  }
  
  private normalizeProvinceName(provinceName: string): string {
    // Mapeo de nombres de provincias del CSV a IDs
    const mapping: Record<string, string> = {
      'azuay': 'azuay',
      'bol\u00edvar': 'bolivar',
      'bolivar': 'bolivar',
      'ca\u00f1ar': 'canar',
      'canar': 'canar',
      'carchi': 'carchi',
      'chimborazo': 'chimborazo',
      'cotopaxi': 'cotopaxi',
      'el oro': 'el_oro',
      'esmeraldas': 'esmeraldas',
      'gal\u00e1pagos': 'galapagos',
      'galapagos': 'galapagos',
      'guayas': 'guayas',
      'imbabura': 'imbabura',
      'loja': 'loja',
      'los r\u00edos': 'los_rios',
      'los rios': 'los_rios',
      'manab\u00ed': 'manabi',
      'manabi': 'manabi',
      'morona santiago': 'morona_santiago',
      'napo': 'napo',
      'orellana': 'orellana',
      'pastaza': 'pastaza',
      'pichincha': 'pichincha',
      'santa elena': 'santa_elena',
      'santo domingo de los ts\u00e1chilas': 'santo_domingo',
      'santo domingo': 'santo_domingo',
      'sucumb\u00edos': 'sucumbios',
      'sucumbios': 'sucumbios',
      'tungurahua': 'tungurahua',
      'zamora chinchipe': 'zamora_chinchipe',
    }
    
    const normalized = provinceName.toLowerCase().trim()
    return mapping[normalized] || 'pichincha' // Default a Pichincha si no se encuentra
  }

  private weightedRandomService(): string {
    const total = SERVICE_TYPES.reduce((sum, s) => sum + s.count, 0)
    let random = Math.random() * total
    
    for (const service of SERVICE_TYPES) {
      random -= service.count
      if (random <= 0) return service.id
    }
    return SERVICE_TYPES[0].id
  }

  private weightedRandomProvince(serviceType: string): string {
    // Si hay datos CSV, usar distribución real
    if (this.csvData.length > 0) {
      const provinceWeights = new Map<string, number>()
      this.csvData
        .filter(row => this.mapServiceType(row.tipo_servicio) === serviceType)
        .forEach(row => {
          const province = this.normalizeProvinceName(row.provincia)
          provinceWeights.set(province, (provinceWeights.get(province) || 0) + 1)
        })

      if (provinceWeights.size > 0) {
        const total = Array.from(provinceWeights.values()).reduce((a, b) => a + b, 0)
        let random = Math.random() * total
        for (const [province, weight] of provinceWeights) {
          random -= weight
          if (random <= 0) return province
        }
      }
    }

    // Fallback: distribución basada en población
    const total = ECUADOR_PROVINCES.reduce((sum, p) => sum + p.population, 0)
    let random = Math.random() * total
    for (const province of ECUADOR_PROVINCES) {
      random -= province.population
      if (random <= 0) return province.id
    }
    return ECUADOR_PROVINCES[0].id
  }

  private getRandomSubtype(serviceType: string): string {
    const subtypes: Record<string, string[]> = {
      seguridad: ['Robo', 'Asalto', 'Violencia Doméstica', 'Alteración del Orden', 'Sospechoso'],
      transito: ['Accidente', 'Vehículo Averiado', 'Congestión', 'Señalización', 'Control'],
      sanitaria: ['Emergencia Médica', 'Traslado', 'Parto', 'Intoxicación', 'Heridas'],
      municipal: ['Alumbrado', 'Alcantarillado', 'Basura', 'Vías', 'Permisos'],
      siniestros: ['Incendio Estructural', 'Incendio Forestal', 'Rescate', 'Materiales Peligrosos'],
      militar: ['Apoyo Operativo', 'Control', 'Seguridad', 'Patrullaje'],
      riesgos: ['Inundación', 'Deslizamiento', 'Sismo', 'Evacuación', 'Alerta'],
    }
    const options = subtypes[serviceType] || ['General']
    return options[Math.floor(Math.random() * options.length)]
  }

  assignAgent(emergency: Emergency): Agent | null {
    const availableAgents = this.agents.filter(
      a => a.status === 'available' && 
           a.type === emergency.type && 
           a.province === emergency.province
    )

    if (availableAgents.length === 0) {
      // Buscar en provincias cercanas
      const nearbyAgents = this.agents.filter(
        a => a.status === 'available' && a.type === emergency.type
      )
      if (nearbyAgents.length > 0) {
        const agent = nearbyAgents[0]
        agent.status = 'responding'
        agent.currentEmergency = emergency
        emergency.assignedAgent = agent.id
        emergency.status = 'assigned'
        return agent
      }
      return null
    }

    const agent = availableAgents[0]
    agent.status = 'responding'
    agent.currentEmergency = emergency
    emergency.assignedAgent = agent.id
    emergency.status = 'assigned'
    return agent
  }

  resolveEmergency(emergencyId: string) {
    const emergency = this.emergencies.find(e => e.id === emergencyId)
    if (emergency) {
      emergency.status = 'resolved'
      this.emergencies = this.emergencies.filter(e => e.id !== emergencyId)
      this.resolvedEmergencies.push(emergency)

      if (emergency.assignedAgent) {
        const agent = this.agents.find(a => a.id === emergency.assignedAgent)
        if (agent) {
          agent.status = 'available'
          agent.currentEmergency = undefined
        }
      }
    }
  }

  tick(deltaTime: number = 1000) {
    this.currentTime = new Date(this.currentTime.getTime() + deltaTime)

    // Generar nuevas emergencias basadas en tasa
    const emergencyRate = 0.3 // Probabilidad de nueva emergencia por tick
    if (Math.random() < emergencyRate) {
      const emergency = this.generateEmergency()
      this.emergencies.push(emergency)
      
      // Intentar asignar agente inmediatamente
      this.assignAgent(emergency)

      // Actualizar estadísticas
      const stats = this.provinceStats.get(emergency.province)
      if (stats) {
        stats.emergencies++
        stats.byType[emergency.type] = (stats.byType[emergency.type] || 0) + 1
      }
    }

    // Simular resolución de emergencias
    this.emergencies.forEach(emergency => {
      if (emergency.status === 'assigned' && Math.random() < 0.1) {
        this.resolveEmergency(emergency.id)
      }
    })

    // Notificar listeners
    this.notifyListeners()
  }

  subscribe(listener: (state: SimulationState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach(listener => listener(state))
  }

  getState(): SimulationState {
    return {
      isRunning: true,
      speed: 1,
      currentTime: this.currentTime,
      totalEmergencies: this.emergencies.length + this.resolvedEmergencies.length,
      resolvedEmergencies: this.resolvedEmergencies.length,
      activeEmergencies: [...this.emergencies],
      agents: [...this.agents],
      statistics: Array.from(this.provinceStats.values()),
    }
  }

  getAgents(): Agent[] {
    return this.agents
  }

  getEmergencies(): Emergency[] {
    return this.emergencies
  }

  getProvinceStats(): ProvinceStatistics[] {
    return Array.from(this.provinceStats.values())
  }

  getAgentsByProvince(provinceId: string): Agent[] {
    return this.agents.filter(a => a.province === provinceId)
  }

  getAgentDistribution(): Record<string, Record<string, number>> {
    const distribution: Record<string, Record<string, number>> = {}
    
    ECUADOR_PROVINCES.forEach(province => {
      distribution[province.id] = {}
      SERVICE_TYPES.forEach(service => {
        distribution[province.id][service.id] = this.agents.filter(
          a => a.province === province.id && a.type === service.id
        ).length
      })
    })

    return distribution
  }

  suggestOptimalDistribution(): Record<string, Record<string, number>> {
    const suggestions: Record<string, Record<string, number>> = {}
    
    // Calcular distribución óptima basada en demanda real
    const totalByType = new Map<string, number>()
    const totalByProvince = new Map<string, Map<string, number>>()

    this.provinceStats.forEach((stats, province) => {
      totalByProvince.set(province, new Map(Object.entries(stats.byType)))
      Object.entries(stats.byType).forEach(([type, count]) => {
        totalByType.set(type, (totalByType.get(type) || 0) + count)
      })
    })

    ECUADOR_PROVINCES.forEach(province => {
      suggestions[province.id] = {}
      const provinceData = totalByProvince.get(province.id) || new Map()
      
      SERVICE_TYPES.forEach(service => {
        const demand = provinceData.get(service.id) || 0
        const totalDemand = totalByType.get(service.id) || 1
        const totalAgentsForType = this.agents.filter(a => a.type === service.id).length
        
        // Sugerir agentes proporcionales a la demanda
        const suggestedAgents = Math.max(1, Math.round(totalAgentsForType * (demand / totalDemand)))
        suggestions[province.id][service.id] = suggestedAgents
      })
    })

    return suggestions
  }

  // Redistribuir personal entre provincias
  redistributeAgents(fromProvince: string, toProvince: string, serviceType: string, count: number): boolean {
    const availableAgents = this.agents.filter(
      a => a.province === fromProvince && a.type === serviceType && a.status === 'available'
    )

    if (availableAgents.length < count) {
      console.warn(`No hay suficientes agentes disponibles en ${fromProvince}`)
      return false
    }

    // Seleccionar agentes a mover
    const agentsToMove = availableAgents.slice(0, count)
    const fromProvinceData = ECUADOR_PROVINCES.find(p => p.id === fromProvince)!
    const toProvinceData = ECUADOR_PROVINCES.find(p => p.id === toProvince)!

    // Simular movimiento (cambiar estado a 'relocating')
    agentsToMove.forEach((agent, index) => {
      agent.status = 'relocating'
      agent.relocatingFrom = fromProvince
      agent.relocatingTo = toProvince
      agent.relocatingProgress = 0
      
      const startPos = { ...agent.position }
      const endPos = {
        x: toProvinceData.coordinates.x + (Math.random() - 0.5) * 5,
        y: toProvinceData.coordinates.y + (Math.random() - 0.5) * 5,
      }
      
      // Duración del viaje basado en distancia (3-6 segundos)
      const distance = Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
      )
      const travelTime = Math.max(3000, Math.min(6000, distance * 100))
      const startTime = Date.now()
      
      // Animar el movimiento con requestAnimationFrame
      const animateMovement = () => {
        const elapsed = Date.now() - startTime - (index * 500) // Escalonar inicio
        const progress = Math.min(1, elapsed / travelTime)
        
        if (progress < 1) {
          agent.relocatingProgress = progress
          // Interpolación suave (ease-in-out)
          const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
          
          agent.position = {
            x: startPos.x + (endPos.x - startPos.x) * easeProgress,
            y: startPos.y + (endPos.y - startPos.y) * easeProgress,
          }
          this.notifyListeners()
          requestAnimationFrame(animateMovement)
        } else {
          // Llegada
          agent.province = toProvince
          agent.position = endPos
          agent.status = 'available'
          agent.relocatingProgress = undefined
          agent.relocatingFrom = undefined
          agent.relocatingTo = undefined
          
          // Actualizar estadísticas
          this.updateProvinceStats(fromProvince)
          this.updateProvinceStats(toProvince)
          this.notifyListeners()
        }
      }
      
      // Iniciar animación después del escalonamiento
      setTimeout(() => requestAnimationFrame(animateMovement), index * 500)
    })

    return true
  }

  private updateProvinceStats(provinceId: string) {
    const stats = this.provinceStats.get(provinceId)
    if (stats) {
      stats.agents = this.agents.filter(a => a.province === provinceId).length
    }
  }

  // Obtener agentes en tránsito
  getRelocatingAgents(): Agent[] {
    return this.agents.filter(a => a.status === 'relocating')
  }
}

interface SimulationEvent {
  time: Date
  type: 'emergency_created' | 'emergency_assigned' | 'emergency_resolved'
  data: unknown
}

interface SimulationState {
  isRunning: boolean
  speed: number
  currentTime: Date
  totalEmergencies: number
  resolvedEmergencies: number
  activeEmergencies: Emergency[]
  agents: Agent[]
  statistics: ProvinceStatistics[]
}
