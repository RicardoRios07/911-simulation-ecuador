/**
 * Analizador de Redistribución de Personal 911 Ecuador
 * 
 * Implementa algoritmos matemáticos y estadísticos para:
 * - Análisis de teoría de colas (M/M/c)
 * - Distribución de Poisson para llegada de emergencias
 * - Optimización de recursos mediante programación lineal
 * - Análisis de capacidad y utilización
 * - Sugerencias inteligentes de redistribución
 */

import { PersonnelByProvince, RedistributionSuggestion, QueueAnalysis, CapacityAnalysis } from './types'
import { ECUADOR_PROVINCES } from './types'

export class RedistributionAnalyzer {
  private readonly OPTIMAL_UTILIZATION = 0.75 // 75% utilización óptima
  private readonly CRITICAL_UTILIZATION = 0.90 // 90% utilización crítica
  private readonly MIN_UTILIZATION = 0.40 // 40% utilización mínima
  private readonly AVG_SERVICE_TIME_MINUTES = 25 // Tiempo promedio de atención: 25 minutos

  /**
   * Analiza la distribución actual vs demanda usando teoría de colas M/M/c
   * 
   * M/M/c: Modelo de cola con:
   * - Llegadas siguiendo distribución de Poisson
   * - Tiempos de servicio exponenciales
   * - c servidores (personal disponible)
   * 
   * @param emergenciesPerHour Tasa de llegada de emergencias (λ)
   * @param availablePersonnel Número de servidores disponibles (c)
   * @returns Análisis detallado de la cola
   */
  analyzeQueuePerformance(
    emergenciesPerHour: number,
    availablePersonnel: number
  ): QueueAnalysis {
    // λ = tasa de llegada (emergencias/hora)
    const lambda = emergenciesPerHour
    
    // μ = tasa de servicio (emergencias/hora por servidor)
    // Si tiempo promedio = 25 min, entonces μ = 60/25 = 2.4 emergencias/hora
    const mu = 60 / this.AVG_SERVICE_TIME_MINUTES
    
    // c = número de servidores
    const c = Math.max(1, availablePersonnel)
    
    // ρ = factor de utilización (λ / (c * μ))
    const rho = lambda / (c * mu)
    
    // Probabilidad de que el sistema esté vacío (P0)
    // Fórmula de Erlang-C
    const p0 = this.calculateP0(lambda, mu, c)
    
    // Probabilidad de espera (Erlang-C formula)
    const erlangC = this.calculateErlangC(lambda, mu, c, p0)
    
    // Tiempo promedio de espera en cola (Wq)
    const waitTimeMinutes = erlangC * (1 / (c * mu - lambda)) * 60
    
    // Tiempo promedio en el sistema (W = Wq + 1/μ)
    const systemTimeMinutes = waitTimeMinutes + this.AVG_SERVICE_TIME_MINUTES
    
    // Número promedio en cola (Lq = λ * Wq)
    const avgQueueLength = lambda * (waitTimeMinutes / 60)
    
    // Número promedio en el sistema (L = λ * W)
    const avgSystemLength = lambda * (systemTimeMinutes / 60)
    
    return {
      utilizationFactor: rho,
      utilizationPercentage: rho * 100,
      probabilityOfWaiting: erlangC,
      avgWaitTimeMinutes: waitTimeMinutes,
      avgSystemTimeMinutes: systemTimeMinutes,
      avgQueueLength: avgQueueLength,
      avgSystemLength: avgSystemLength,
      isOverloaded: rho >= 1.0,
      isCritical: rho >= this.CRITICAL_UTILIZATION,
      isOptimal: rho >= this.MIN_UTILIZATION && rho <= this.OPTIMAL_UTILIZATION,
      isUnderutilized: rho < this.MIN_UTILIZATION,
      recommendedPersonnel: this.calculateOptimalServers(lambda, mu),
    }
  }

  /**
   * Calcula P0 (probabilidad de sistema vacío) para modelo M/M/c
   */
  private calculateP0(lambda: number, mu: number, c: number): number {
    let sum = 0
    const rho = lambda / mu
    
    // Suma de términos (ρ^n / n!) para n = 0 hasta c-1
    for (let n = 0; n < c; n++) {
      sum += Math.pow(rho, n) / this.factorial(n)
    }
    
    // Último término: (ρ^c / c!) * (c*μ / (c*μ - λ))
    const lastTerm = (Math.pow(rho, c) / this.factorial(c)) * (c * mu / (c * mu - lambda))
    
    return 1 / (sum + lastTerm)
  }

  /**
   * Calcula la probabilidad de espera (Erlang-C)
   */
  private calculateErlangC(lambda: number, mu: number, c: number, p0: number): number {
    const rho = lambda / mu
    const numerator = Math.pow(rho, c) / this.factorial(c)
    const denominator = 1 - (lambda / (c * mu))
    
    return (numerator * p0) / denominator
  }

  /**
   * Calcula el factorial de un número
   */
  private factorial(n: number): number {
    if (n <= 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  }

  /**
   * Calcula el número óptimo de servidores para mantener utilización objetivo
   */
  private calculateOptimalServers(lambda: number, mu: number): number {
    // c_óptimo = λ / (μ * ρ_objetivo)
    const optimalServers = Math.ceil(lambda / (mu * this.OPTIMAL_UTILIZATION))
    return Math.max(1, optimalServers)
  }

  /**
   * Analiza la capacidad actual de una provincia
   */
  analyzeProvinceCapacity(
    provinceId: string,
    personnel: PersonnelByProvince,
    emergenciesLast24h: number,
    population: number
  ): CapacityAnalysis {
    // Tasa de emergencias por hora (promedio de las últimas 24h)
    const emergenciesPerHour = emergenciesLast24h / 24
    
    // Personal total disponible
    const totalPersonnel = personnel.total_personal
    
    // Análisis de cola
    const queueAnalysis = this.analyzeQueuePerformance(emergenciesPerHour, totalPersonnel)
    
    // Métricas adicionales
    const emergenciesPer100k = (emergenciesLast24h / population) * 100000
    const personnelPer100k = (totalPersonnel / population) * 100000
    const emergenciesPerPersonnel = emergenciesLast24h / totalPersonnel
    
    // Calcular déficit o exceso de personal
    const personnelDifference = queueAnalysis.recommendedPersonnel - totalPersonnel
    
    return {
      provinceId,
      currentPersonnel: totalPersonnel,
      recommendedPersonnel: queueAnalysis.recommendedPersonnel,
      personnelDifference,
      utilizationRate: queueAnalysis.utilizationPercentage,
      emergenciesPerHour,
      emergenciesLast24h,
      emergenciesPer100k,
      personnelPer100k,
      emergenciesPerPersonnel,
      avgResponseTimeMinutes: queueAnalysis.avgWaitTimeMinutes + 5, // + tiempo de desplazamiento
      queueAnalysis,
      status: this.determineCapacityStatus(queueAnalysis),
      priority: this.calculatePriority(queueAnalysis, personnelDifference),
    }
  }

  /**
   * Determina el estado de capacidad basado en el análisis de cola
   */
  private determineCapacityStatus(analysis: QueueAnalysis): 'critical' | 'overloaded' | 'optimal' | 'underutilized' {
    if (analysis.isOverloaded) return 'critical'
    if (analysis.isCritical) return 'overloaded'
    if (analysis.isOptimal) return 'optimal'
    if (analysis.isUnderutilized) return 'underutilized'
    return 'optimal'
  }

  /**
   * Calcula la prioridad de redistribución (1-10, 10 = más urgente)
   */
  private calculatePriority(analysis: QueueAnalysis, personnelDifference: number): number {
    let priority = 5 // Base
    
    // Ajustar por utilización
    if (analysis.utilizationFactor >= 1.0) priority = 10
    else if (analysis.utilizationFactor >= 0.95) priority = 9
    else if (analysis.utilizationFactor >= 0.90) priority = 8
    else if (analysis.utilizationFactor >= 0.80) priority = 7
    else if (analysis.utilizationFactor >= 0.70) priority = 6
    else if (analysis.utilizationFactor < 0.30) priority = 3
    else if (analysis.utilizationFactor < 0.40) priority = 4
    
    // Ajustar por déficit de personal
    const deficitPercentage = Math.abs(personnelDifference) / analysis.recommendedPersonnel
    if (deficitPercentage > 0.5) priority = Math.min(10, priority + 2)
    else if (deficitPercentage > 0.3) priority = Math.min(10, priority + 1)
    
    return Math.max(1, Math.min(10, Math.round(priority)))
  }

  /**
   * Genera sugerencias de redistribución basadas en análisis de múltiples provincias
   * 
   * Algoritmo:
   * 1. Identifica provincias con exceso de personal (subutilizadas)
   * 2. Identifica provincias con déficit de personal (sobrecargadas)
   * 3. Calcula redistribuciones óptimas minimizando distancia y maximizando impacto
   * 4. Genera sugerencias priorizadas
   */
  generateRedistributionSuggestions(
    capacityAnalyses: CapacityAnalysis[]
  ): RedistributionSuggestion[] {
    const suggestions: RedistributionSuggestion[] = []
    
    // Separar provincias por estado
    const overloaded = capacityAnalyses.filter(a => 
      a.personnelDifference > 0 && (a.status === 'critical' || a.status === 'overloaded')
    ).sort((a, b) => b.priority - a.priority)
    
    const underutilized = capacityAnalyses.filter(a => 
      a.personnelDifference < 0 && a.status === 'underutilized'
    ).sort((a, b) => a.utilizationRate - b.utilizationRate)
    
    // Generar sugerencias de redistribución
    overloaded.forEach(targetProvince => {
      underutilized.forEach(sourceProvince => {
        const availableToTransfer = Math.abs(sourceProvince.personnelDifference)
        const neededInTarget = targetProvince.personnelDifference
        const transferAmount = Math.min(
          Math.floor(availableToTransfer * 0.3), // Máximo 30% del exceso
          Math.ceil(neededInTarget * 0.5) // Cubrir al menos 50% del déficit
        )
        
        if (transferAmount > 0) {
          const distance = this.calculateProvinceDistance(
            sourceProvince.provinceId,
            targetProvince.provinceId
          )
          
          // Calcular impacto esperado
          const impactScore = this.calculateImpactScore(
            transferAmount,
            targetProvince,
            sourceProvince,
            distance
          )
          
          // Calcular distribución por categoría de personal
          const personnelBreakdown = this.suggestPersonnelBreakdown(
            transferAmount,
            targetProvince.emergenciesLast24h
          )
          
          suggestions.push({
            id: `sugg-${sourceProvince.provinceId}-${targetProvince.provinceId}-${Date.now()}`,
            fromProvince: sourceProvince.provinceId,
            toProvince: targetProvince.provinceId,
            totalPersonnel: transferAmount,
            personnelBreakdown,
            reason: this.generateReason(targetProvince, sourceProvince),
            priority: targetProvince.priority,
            impactScore,
            distanceKm: distance,
            estimatedImprovementPercentage: this.calculateExpectedImprovement(
              targetProvince,
              transferAmount
            ),
            currentUtilization: targetProvince.utilizationRate,
            projectedUtilization: this.calculateProjectedUtilization(
              targetProvince,
              transferAmount
            ),
            cost: this.estimateRedistributionCost(transferAmount, distance),
            timestamp: new Date(),
          })
        }
      })
    })
    
    // Ordenar por prioridad y impacto
    return suggestions.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      return b.impactScore - a.impactScore
    })
  }

  /**
   * Calcula la distancia aproximada entre dos provincias (km)
   */
  private calculateProvinceDistance(provinceId1: string, provinceId2: string): number {
    const p1 = ECUADOR_PROVINCES.find(p => p.id === provinceId1)
    const p2 = ECUADOR_PROVINCES.find(p => p.id === provinceId2)
    
    if (!p1 || !p2) return 500 // Default si no se encuentra
    
    // Fórmula de distancia euclidiana con factor de escala
    // Cada unidad de coordenada ≈ 15 km
    const dx = p1.coordinates.x - p2.coordinates.x
    const dy = p1.coordinates.y - p2.coordinates.y
    return Math.sqrt(dx * dx + dy * dy) * 15
  }

  /**
   * Calcula un score de impacto (0-100) para una redistribución propuesta
   */
  private calculateImpactScore(
    transferAmount: number,
    target: CapacityAnalysis,
    source: CapacityAnalysis,
    distance: number
  ): number {
    // Factores que contribuyen al impacto:
    // 1. Reducción de utilización en provincia destino (peso: 40%)
    const utilizationReduction = (target.utilizationRate - this.OPTIMAL_UTILIZATION * 100) / 100
    const utilizationScore = Math.min(40, utilizationReduction * 40)
    
    // 2. Prioridad de la provincia destino (peso: 30%)
    const priorityScore = (target.priority / 10) * 30
    
    // 3. Cantidad de personal transferido vs necesidad (peso: 20%)
    const coverageRatio = transferAmount / target.personnelDifference
    const coverageScore = Math.min(20, coverageRatio * 20)
    
    // 4. Proximidad geográfica (peso: 10%)
    const distanceScore = Math.max(0, 10 - (distance / 100))
    
    const totalScore = utilizationScore + priorityScore + coverageScore + distanceScore
    return Math.max(0, Math.min(100, totalScore))
  }

  /**
   * Sugiere distribución de personal por categoría
   */
  private suggestPersonnelBreakdown(
    totalPersonnel: number,
    emergenciesLast24h: number
  ): Record<string, number> {
    // Distribución basada en estadísticas nacionales del CSV
    // Adaptada a las proporciones reales de emergencias
    return {
      policia_nacional: Math.ceil(totalPersonnel * 0.35), // 35% - Seguridad ciudadana predomina
      personal_ecu911: Math.ceil(totalPersonnel * 0.25), // 25% - Operadores
      medicos_msp_iess: Math.ceil(totalPersonnel * 0.15), // 15% - Salud
      personal_transito: Math.ceil(totalPersonnel * 0.10), // 10% - Tránsito
      bomberos: Math.ceil(totalPersonnel * 0.08), // 8% - Siniestros
      fuerzas_armadas: Math.ceil(totalPersonnel * 0.05), // 5% - Apoyo militar
      agentes_municipales: Math.floor(totalPersonnel * 0.02), // 2% - Servicios
    }
  }

  /**
   * Genera una razón descriptiva para la redistribución
   */
  private generateReason(target: CapacityAnalysis, source: CapacityAnalysis): string {
    const reasons: string[] = []
    
    if (target.utilizationRate >= 100) {
      reasons.push(`Sistema colapsado en ${this.getProvinceName(target.provinceId)} (${target.utilizationRate.toFixed(1)}% utilización)`)
    } else if (target.utilizationRate >= 90) {
      reasons.push(`Alta sobrecarga en ${this.getProvinceName(target.provinceId)} (${target.utilizationRate.toFixed(1)}% utilización)`)
    } else {
      reasons.push(`Optimización de recursos en ${this.getProvinceName(target.provinceId)}`)
    }
    
    if (target.queueAnalysis.avgWaitTimeMinutes > 10) {
      reasons.push(`Tiempo de espera crítico: ${target.queueAnalysis.avgWaitTimeMinutes.toFixed(1)} minutos`)
    }
    
    if (source.utilizationRate < 40) {
      reasons.push(`${this.getProvinceName(source.provinceId)} tiene capacidad disponible (${source.utilizationRate.toFixed(1)}% utilización)`)
    }
    
    return reasons.join('. ')
  }

  /**
   * Obtiene el nombre legible de una provincia
   */
  private getProvinceName(provinceId: string): string {
    const province = ECUADOR_PROVINCES.find(p => p.id === provinceId)
    return province?.name || provinceId
  }

  /**
   * Calcula la mejora esperada en porcentaje
   */
  private calculateExpectedImprovement(
    target: CapacityAnalysis,
    transferAmount: number
  ): number {
    const currentUtil = target.utilizationRate
    const projectedUtil = this.calculateProjectedUtilization(target, transferAmount)
    return ((currentUtil - projectedUtil) / currentUtil) * 100
  }

  /**
   * Calcula la utilización proyectada después de redistribución
   */
  private calculateProjectedUtilization(
    target: CapacityAnalysis,
    additionalPersonnel: number
  ): number {
    const newPersonnel = target.currentPersonnel + additionalPersonnel
    const lambda = target.emergenciesPerHour
    const mu = 60 / this.AVG_SERVICE_TIME_MINUTES
    const newRho = lambda / (newPersonnel * mu)
    return newRho * 100
  }

  /**
   * Estima el costo de redistribución (unidades arbitrarias)
   */
  private estimateRedistributionCost(personnel: number, distanceKm: number): number {
    // Costo base por persona: 100 unidades
    const personnelCost = personnel * 100
    
    // Costo de transporte: $1 por km por persona
    const transportCost = personnel * distanceKm
    
    // Costo de adaptación: $50 por persona
    const adaptationCost = personnel * 50
    
    return personnelCost + transportCost + adaptationCost
  }

  /**
   * Valida si una redistribución propuesta es factible
   */
  validateRedistribution(
    suggestion: RedistributionSuggestion,
    sourceCapacity: CapacityAnalysis
  ): { valid: boolean; reason?: string } {
    // No se puede transferir más del 30% del personal
    const maxTransfer = Math.floor(sourceCapacity.currentPersonnel * 0.3)
    if (suggestion.totalPersonnel > maxTransfer) {
      return {
        valid: false,
        reason: `No se puede transferir más del 30% del personal de ${this.getProvinceName(suggestion.fromProvince)} (máximo: ${maxTransfer} personas)`
      }
    }
    
    // La provincia fuente no debe quedar sobrecargada
    const remainingPersonnel = sourceCapacity.currentPersonnel - suggestion.totalPersonnel
    const mu = 60 / this.AVG_SERVICE_TIME_MINUTES
    const newRho = sourceCapacity.emergenciesPerHour / (remainingPersonnel * mu)
    
    if (newRho > this.CRITICAL_UTILIZATION) {
      return {
        valid: false,
        reason: `La transferencia dejaría a ${this.getProvinceName(suggestion.fromProvince)} sobrecargada (${(newRho * 100).toFixed(1)}% utilización)`
      }
    }
    
    return { valid: true }
  }
}
