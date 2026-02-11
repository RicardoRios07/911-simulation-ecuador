/**
 * Sistema de Alertas Inteligente para ECU 911
 * 
 * Monitorea el estado del sistema en tiempo real y genera alertas
 * cuando se detectan condiciones que requieren redistribución de personal
 */

import { RedistributionSuggestion, CapacityAnalysis, Alert, AlertType, AlertSeverity } from './types'

export class AlertSystem {
  private alerts: Alert[] = []
  private alertHistory: Alert[] = []
  private listeners: Set<(alert: Alert) => void> = new Set()
  private readonly MAX_ALERTS_ACTIVE = 50
  private readonly ALERT_EXPIRY_MINUTES = 60

  /**
   * Evalúa el estado de capacidad y genera alertas si es necesario
   */
  evaluateCapacity(analysis: CapacityAnalysis): Alert[] {
    const newAlerts: Alert[] = []

    // Alerta crítica: Sistema colapsado (utilización >= 100%)
    if (analysis.utilizationRate >= 100) {
      newAlerts.push(this.createAlert({
        type: 'capacity_critical',
        severity: 'critical',
        title: `Sistema Colapsado en ${this.getProvinceName(analysis.provinceId)}`,
        message: `La provincia ${this.getProvinceName(analysis.provinceId)} tiene ${analysis.utilizationRate.toFixed(1)}% de utilización. ` +
          `Se requieren ${analysis.personnelDifference} personas adicionales de forma URGENTE. ` +
          `Tiempo de espera promedio: ${analysis.avgResponseTimeMinutes.toFixed(1)} minutos.`,
        provinceId: analysis.provinceId,
        data: {
          utilizationRate: analysis.utilizationRate,
          personnelNeeded: analysis.personnelDifference,
          currentPersonnel: analysis.currentPersonnel,
          emergenciesPerHour: analysis.emergenciesPerHour,
        },
      }))
    }
    // Alerta alta: Sobrecarga crítica (utilización >= 90%)
    else if (analysis.utilizationRate >= 90) {
      newAlerts.push(this.createAlert({
        type: 'capacity_overload',
        severity: 'high',
        title: `Sobrecarga en ${this.getProvinceName(analysis.provinceId)}`,
        message: `La provincia ${this.getProvinceName(analysis.provinceId)} está operando al ${analysis.utilizationRate.toFixed(1)}% de capacidad. ` +
          `Se recomienda redistribuir ${analysis.personnelDifference} personas para mantener servicio óptimo. ` +
          `Tiempo de espera actual: ${analysis.avgResponseTimeMinutes.toFixed(1)} minutos.`,
        provinceId: analysis.provinceId,
        data: {
          utilizationRate: analysis.utilizationRate,
          personnelRecommended: analysis.personnelDifference,
          currentPersonnel: analysis.currentPersonnel,
        },
      }))
    }
    // Alerta media: Utilización alta (utilización >= 80%)
    else if (analysis.utilizationRate >= 80) {
      newAlerts.push(this.createAlert({
        type: 'capacity_warning',
        severity: 'medium',
        title: `Capacidad Limitada en ${this.getProvinceName(analysis.provinceId)}`,
        message: `${this.getProvinceName(analysis.provinceId)} está cerca del límite de capacidad (${analysis.utilizationRate.toFixed(1)}%). ` +
          `Considere preparar redistribución de ${analysis.personnelDifference} personas.`,
        provinceId: analysis.provinceId,
        data: {
          utilizationRate: analysis.utilizationRate,
          personnelRecommended: analysis.personnelDifference,
        },
      }))
    }

    // Alerta de tiempo de espera excesivo
    if (analysis.avgResponseTimeMinutes > 15) {
      newAlerts.push(this.createAlert({
        type: 'response_time_high',
        severity: analysis.avgResponseTimeMinutes > 30 ? 'high' : 'medium',
        title: `Tiempo de Respuesta Elevado en ${this.getProvinceName(analysis.provinceId)}`,
        message: `El tiempo promedio de respuesta en ${this.getProvinceName(analysis.provinceId)} es de ${analysis.avgResponseTimeMinutes.toFixed(1)} minutos, ` +
          `superando el objetivo de 15 minutos. Se requiere acción inmediata.`,
        provinceId: analysis.provinceId,
        data: {
          avgResponseTime: analysis.avgResponseTimeMinutes,
          targetResponseTime: 15,
        },
      }))
    }

    // Alerta de subutilización (recursos desperdiciados)
    if (analysis.utilizationRate < 40 && analysis.currentPersonnel > 10) {
      newAlerts.push(this.createAlert({
        type: 'capacity_underutilized',
        severity: 'low',
        title: `Recursos Subutilizados en ${this.getProvinceName(analysis.provinceId)}`,
        message: `${this.getProvinceName(analysis.provinceId)} tiene solo ${analysis.utilizationRate.toFixed(1)}% de utilización. ` +
          `Hay ${Math.abs(analysis.personnelDifference)} personas disponibles que podrían redistribuirse a otras provincias.`,
        provinceId: analysis.provinceId,
        data: {
          utilizationRate: analysis.utilizationRate,
          excessPersonnel: Math.abs(analysis.personnelDifference),
        },
      }))
    }

    // Añadir nuevas alertas
    newAlerts.forEach(alert => this.addAlert(alert))

    return newAlerts
  }

  /**
   * Evalúa una sugerencia de redistribución y genera alerta si es prioritaria
   */
  evaluateRedistributionSuggestion(suggestion: RedistributionSuggestion): Alert | null {
    // Solo generar alertas para sugerencias de alta prioridad
    if (suggestion.priority < 7) return null

    const severity: AlertSeverity = 
      suggestion.priority >= 9 ? 'critical' :
      suggestion.priority >= 8 ? 'high' : 'medium'

    const alert = this.createAlert({
      type: 'redistribution_suggested',
      severity,
      title: `Redistribución Recomendada: ${this.getProvinceName(suggestion.fromProvince)} → ${this.getProvinceName(suggestion.toProvince)}`,
      message: suggestion.reason + ` ` +
        `Se recomienda transferir ${suggestion.totalPersonnel} personas. ` +
        `Mejora esperada: ${suggestion.estimatedImprovementPercentage.toFixed(1)}%. ` +
        `Distancia: ${suggestion.distanceKm.toFixed(0)} km.`,
      provinceId: suggestion.toProvince,
      data: {
        suggestionId: suggestion.id,
        fromProvince: suggestion.fromProvince,
        toProvince: suggestion.toProvince,
        personnel: suggestion.totalPersonnel,
        breakdown: suggestion.personnelBreakdown,
        impactScore: suggestion.impactScore,
        priority: suggestion.priority,
      },
    })

    this.addAlert(alert)
    return alert
  }

  /**
   * Crea un objeto de alerta con valores por defecto
   */
  private createAlert(params: {
    type: AlertType
    severity: AlertSeverity
    title: string
    message: string
    provinceId?: string
    data?: Record<string, any>
  }): Alert {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      provinceId: params.provinceId,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      data: params.data || {},
    }
  }

  /**
   * Añade una alerta al sistema
   */
  private addAlert(alert: Alert): void {
    // Verificar si ya existe una alerta similar activa
    const similarAlert = this.alerts.find(a => 
      a.type === alert.type &&
      a.provinceId === alert.provinceId &&
      !a.resolved &&
      (Date.now() - a.timestamp.getTime()) < 5 * 60 * 1000 // 5 minutos
    )

    if (similarAlert) {
      // Actualizar alerta existente en lugar de duplicar
      similarAlert.message = alert.message
      similarAlert.data = alert.data
      similarAlert.timestamp = alert.timestamp
      return
    }

    // Añadir nueva alerta
    this.alerts.unshift(alert)

    // Limitar número de alertas activas
    if (this.alerts.length > this.MAX_ALERTS_ACTIVE) {
      const removed = this.alerts.splice(this.MAX_ALERTS_ACTIVE)
      this.alertHistory.push(...removed)
    }

    // Notificar listeners
    this.notifyListeners(alert)

    // Limpiar alertas expiradas
    this.cleanupExpiredAlerts()
  }

  /**
   * Limpia alertas expiradas y las mueve al historial
   */
  private cleanupExpiredAlerts(): void {
    const now = Date.now()
    const expiryTime = this.ALERT_EXPIRY_MINUTES * 60 * 1000

    const [active, expired] = this.alerts.reduce<[Alert[], Alert[]]>(
      ([active, expired], alert) => {
        if (!alert.resolved && now - alert.timestamp.getTime() > expiryTime) {
          alert.resolved = true
          alert.resolvedAt = new Date()
          alert.resolvedReason = 'Expirada automáticamente'
          expired.push(alert)
        } else {
          active.push(alert)
        }
        return [active, expired]
      },
      [[], []]
    )

    this.alerts = active
    this.alertHistory.push(...expired)

    // Limitar historial a 200 alertas
    if (this.alertHistory.length > 200) {
      this.alertHistory = this.alertHistory.slice(0, 200)
    }
  }

  /**
   * Obtiene todas las alertas activas
   */
  getActiveAlerts(filter?: {
    severity?: AlertSeverity
    type?: AlertType
    provinceId?: string
  }): Alert[] {
    let alerts = [...this.alerts].filter(a => !a.resolved)

    if (filter?.severity) {
      alerts = alerts.filter(a => a.severity === filter.severity)
    }
    if (filter?.type) {
      alerts = alerts.filter(a => a.type === filter.type)
    }
    if (filter?.provinceId) {
      alerts = alerts.filter(a => a.provinceId === filter.provinceId)
    }

    return alerts
  }

  /**
   * Obtiene estadísticas de alertas
   */
  getAlertStatistics(): {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    byType: Record<AlertType, number>
    byProvince: Record<string, number>
    acknowledged: number
    unacknowledged: number
  } {
    const activeAlerts = this.getActiveAlerts()

    const stats = {
      total: activeAlerts.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      byType: {} as Record<AlertType, number>,
      byProvince: {} as Record<string, number>,
      acknowledged: 0,
      unacknowledged: 0,
    }

    activeAlerts.forEach(alert => {
      // Por severidad
      stats[alert.severity]++

      // Por tipo
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1

      // Por provincia
      if (alert.provinceId) {
        stats.byProvince[alert.provinceId] = (stats.byProvince[alert.provinceId] || 0) + 1
      }

      // Por estado de reconocimiento
      if (alert.acknowledged) {
        stats.acknowledged++
      } else {
        stats.unacknowledged++
      }
    })

    return stats
  }

  /**
   * Marca una alerta como reconocida
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) return false

    alert.acknowledged = true
    alert.acknowledgedAt = new Date()
    alert.acknowledgedBy = acknowledgedBy

    return true
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string, reason?: string, resolvedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) return false

    alert.resolved = true
    alert.resolvedAt = new Date()
    alert.resolvedReason = reason
    alert.resolvedBy = resolvedBy

    // Mover al historial
    this.alerts = this.alerts.filter(a => a.id !== alertId)
    this.alertHistory.unshift(alert)

    return true
  }

  /**
   * Resuelve todas las alertas de una provincia
   */
  resolveProvinceAlerts(provinceId: string, reason?: string): number {
    const provinceAlerts = this.alerts.filter(a => a.provinceId === provinceId)
    
    provinceAlerts.forEach(alert => {
      this.resolveAlert(alert.id, reason)
    })

    return provinceAlerts.length
  }

  /**
   * Suscribe un listener para recibir nuevas alertas
   */
  subscribe(listener: (alert: Alert) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notifica a los listeners sobre una nueva alerta
   */
  private notifyListeners(alert: Alert): void {
    this.listeners.forEach(listener => {
      try {
        listener(alert)
      } catch (error) {
        console.error('Error en listener de alertas:', error)
      }
    })
  }

  /**
   * Obtiene el nombre legible de una provincia
   */
  private getProvinceName(provinceId?: string): string {
    if (!provinceId) return 'Desconocida'
    
    const { ECUADOR_PROVINCES } = require('./types')
    const province = ECUADOR_PROVINCES.find((p: any) => p.id === provinceId)
    return province?.name || provinceId
  }

  /**
   * Limpia todas las alertas (usar con precaución)
   */
  clearAllAlerts(): void {
    this.alertHistory.push(...this.alerts)
    this.alerts = []
  }

  /**
   * Obtiene el historial de alertas
   */
  getAlertHistory(limit: number = 50): Alert[] {
    return this.alertHistory.slice(0, limit)
  }

  /**
   * Genera un resumen del estado actual de alertas
   */
  generateSummary(): string {
    const stats = this.getAlertStatistics()
    const lines: string[] = []

    lines.push(`📊 RESUMEN DE ALERTAS DEL SISTEMA ECU 911`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    lines.push(`Total de alertas activas: ${stats.total}`)
    lines.push(``)
    lines.push(`Por Severidad:`)
    lines.push(`  🔴 Críticas: ${stats.critical}`)
    lines.push(`  🟠 Altas: ${stats.high}`)
    lines.push(`  🟡 Medias: ${stats.medium}`)
    lines.push(`  🟢 Bajas: ${stats.low}`)
    lines.push(``)
    lines.push(`Estado:`)
    lines.push(`  ✅ Reconocidas: ${stats.acknowledged}`)
    lines.push(`  ⏳ Pendientes: ${stats.unacknowledged}`)

    if (Object.keys(stats.byType).length > 0) {
      lines.push(``)
      lines.push(`Por Tipo:`)
      Object.entries(stats.byType).forEach(([type, count]) => {
        lines.push(`  • ${type}: ${count}`)
      })
    }

    return lines.join('\n')
  }
}
