/**
 * EJEMPLO DE USO COMPLETO
 * Sistema de Optimización ECU 911 Ecuador
 * 
 * Este archivo demuestra cómo integrar todos los módulos
 * para crear un sistema completo de análisis y redistribución
 */

import { SimulationEngine } from './lib/simulation-engine'
import { Alert, CapacityAnalysis, RedistributionSuggestion } from './lib/types'
import fs from 'fs'

async function ejemploCompleto() {
  console.log('🚀 Iniciando Sistema de Optimización ECU 911\n')
  
  // 1. INICIALIZAR MOTOR DE SIMULACIÓN
  console.log('📊 Paso 1: Inicializando motor de simulación...')
  const engine = new SimulationEngine()
  
  // 2. CARGAR DATOS DE PERSONAL
  console.log('📂 Paso 2: Cargando datos de personal...')
  const csvContent = fs.readFileSync('./data/personal_articulado_provincia_2025.csv', 'utf-8')
  await engine.loadPersonnelData(csvContent)
  
  const totalAgents = engine.getAgents().length
  console.log(`✅ ${totalAgents} agentes sincronizados con datos reales\n`)
  
  // 3. SUSCRIBIRSE A ALERTAS
  console.log('🔔 Paso 3: Configurando sistema de alertas...')
  let alertCount = 0
  
  engine.subscribeToAlerts((alert: Alert) => {
    alertCount++
    
    console.log(`\n🚨 ALERTA #${alertCount}:`)
    console.log(`   Severidad: ${getSeverityEmoji(alert.severity)} ${alert.severity.toUpperCase()}`)
    console.log(`   ${alert.title}`)
    console.log(`   ${alert.message}`)
    
    // Auto-reconocer alertas críticas
    if (alert.severity === 'critical') {
      engine.acknowledgeAlert(alert.id, 'Sistema Demo')
      console.log('   ✅ Alerta reconocida automáticamente')
    }
  })
  
  console.log('✅ Sistema de alertas activado\n')
  
  // 4. EJECUTAR SIMULACIÓN
  console.log('⏱️  Paso 4: Ejecutando simulación (60 segundos)...')
  console.log('   Generando emergencias...')
  console.log('   Asignando agentes...')
  console.log('   Analizando capacidad...\n')
  
  // Simular 60 segundos = 60 ticks
  for (let i = 0; i < 60; i++) {
    engine.tick(1000) // 1 segundo por tick
    
    // Mostrar progreso cada 10 segundos
    if ((i + 1) % 10 === 0) {
      const state = engine.getState()
      console.log(`   └─ ${i + 1}s: ${state.activeEmergencies.length} emergencias activas, ${state.resolvedEmergencies} resueltas`)
    }
  }
  
  console.log('\n✅ Simulación completada\n')
  
  // 5. ANÁLISIS DE CAPACIDAD
  console.log('📈 Paso 5: Analizando capacidad de provincias...\n')
  const analyses = engine.getCapacityAnalyses()
  
  // Mostrar top 5 provincias más sobrecargadas
  const overloaded = analyses
    .filter((a: CapacityAnalysis) => a.utilizationRate > 80)
    .sort((a: CapacityAnalysis, b: CapacityAnalysis) => b.utilizationRate - a.utilizationRate)
    .slice(0, 5)
  
  if (overloaded.length > 0) {
    console.log('🔴 PROVINCIAS CON ALTA UTILIZACIÓN:')
    overloaded.forEach((analysis: CapacityAnalysis) => {
      console.log(`\n   ${getProvinceName(analysis.provinceId).toUpperCase()}`)
      console.log(`   ├─ Utilización: ${analysis.utilizationRate.toFixed(1)}%`)
      console.log(`   ├─ Personal actual: ${analysis.currentPersonnel}`)
      console.log(`   ├─ Personal recomendado: ${analysis.recommendedPersonnel}`)
      console.log(`   ├─ Déficit: ${analysis.personnelDifference} personas`)
      console.log(`   ├─ Tiempo de respuesta: ${analysis.avgResponseTimeMinutes.toFixed(1)} min`)
      console.log(`   └─ Prioridad: ${analysis.priority}/10`)
    })
  } else {
    console.log('✅ Todas las provincias operan en rangos normales')
  }
  
  console.log('\n')
  
  // Mostrar provincias subutilizadas
  const underutilized = analyses
    .filter((a: CapacityAnalysis) => a.utilizationRate < 40)
    .sort((a: CapacityAnalysis, b: CapacityAnalysis) => a.utilizationRate - b.utilizationRate)
    .slice(0, 5)
  
  if (underutilized.length > 0) {
    console.log('🟢 PROVINCIAS CON CAPACIDAD DISPONIBLE:')
    underutilized.forEach((analysis: CapacityAnalysis) => {
      console.log(`   • ${getProvinceName(analysis.provinceId)}: ${analysis.utilizationRate.toFixed(1)}% (${Math.abs(analysis.personnelDifference)} personas disponibles)`)
    })
  }
  
  console.log('\n')
  
  // 6. SUGERENCIAS DE REDISTRIBUCIÓN
  console.log('🔄 Paso 6: Generando sugerencias de redistribución...\n')
  const suggestions = engine.getRedistributionSuggestions()
  
  if (suggestions.length > 0) {
    console.log(`✅ ${suggestions.length} sugerencias generadas\n`)
    
    // Mostrar top 3
    console.log('🏆 TOP 3 SUGERENCIAS:')
    suggestions.slice(0, 3).forEach((suggestion: RedistributionSuggestion, index: number) => {
      console.log(`\n${index + 1}. ${getProvinceName(suggestion.fromProvince).toUpperCase()} → ${getProvinceName(suggestion.toProvince).toUpperCase()}`)
      console.log(`   ├─ Personal a transferir: ${suggestion.totalPersonnel}`)
      console.log(`   ├─ Desglose:`)
      Object.entries(suggestion.personnelBreakdown).forEach(([category, count]: [string, number]) => {
        if ((count as number) > 0) {
          console.log(`   │  ├─ ${count} ${formatCategory(category)}`)
        }
      })
      console.log(`   ├─ Impacto: ${suggestion.impactScore.toFixed(0)}/100`)
      console.log(`   ├─ Mejora esperada: ${suggestion.estimatedImprovementPercentage.toFixed(1)}%`)
      console.log(`   ├─ Prioridad: ${suggestion.priority}/10`)
      console.log(`   ├─ Distancia: ${suggestion.distanceKm.toFixed(0)} km`)
      console.log(`   ├─ Costo estimado: $${suggestion.cost.toLocaleString()}`)
      console.log(`   └─ Razón: ${suggestion.reason.substring(0, 100)}...`)
    })
  } else {
    console.log('✅ No se requieren redistribuciones en este momento')
  }
  
  console.log('\n')
  
  // 7. ESTADÍSTICAS DE ALERTAS
  console.log('📊 Paso 7: Resumen de alertas...\n')
  const alertStats = engine.getAlertStatistics()
  
  console.log('ESTADÍSTICAS DE ALERTAS:')
  console.log(`├─ Total: ${alertStats.total}`)
  console.log(`├─ Por Severidad:`)
  console.log(`│  ├─ 🔴 Críticas: ${alertStats.critical}`)
  console.log(`│  ├─ 🟠 Altas: ${alertStats.high}`)
  console.log(`│  ├─ 🟡 Medias: ${alertStats.medium}`)
  console.log(`│  └─ 🟢 Bajas: ${alertStats.low}`)
  console.log(`└─ Estado:`)
  console.log(`   ├─ ✅ Reconocidas: ${alertStats.acknowledged}`)
  console.log(`   └─ ⏳ Pendientes: ${alertStats.unacknowledged}`)
  
  if (Object.keys(alertStats.byType).length > 0) {
    console.log('\nPOR TIPO:')
    Object.entries(alertStats.byType).forEach(([type, count]) => {
      console.log(`   • ${formatAlertType(type)}: ${count}`)
    })
  }
  
  console.log('\n')
  
  // 8. RESUMEN EJECUTIVO
  console.log('=' .repeat(70))
  console.log('📋 RESUMEN EJECUTIVO')
  console.log('=' .repeat(70))
  
  const state = engine.getState()
  
  console.log('\nOPERACIONES:')
  console.log(`├─ Emergencias totales: ${state.totalEmergencies}`)
  console.log(`├─ Emergencias resueltas: ${state.resolvedEmergencies}`)
  console.log(`├─ Emergencias activas: ${state.activeEmergencies.length}`)
  console.log(`└─ Tasa de resolución: ${((state.resolvedEmergencies / state.totalEmergencies) * 100).toFixed(1)}%`)
  
  console.log('\nRECURSOS:')
  console.log(`├─ Personal total: ${totalAgents}`)
  const available = engine.getAgents().filter((a: any) => a.status === 'available').length
  const busy = engine.getAgents().filter((a: any) => a.status === 'busy' || a.status === 'responding').length
  const relocating = engine.getAgents().filter((a: any) => a.status === 'relocating').length
  console.log(`├─ Disponibles: ${available} (${((available / totalAgents) * 100).toFixed(1)}%)`)
  console.log(`├─ Ocupados: ${busy} (${((busy / totalAgents) * 100).toFixed(1)}%)`)
  console.log(`└─ En tránsito: ${relocating}`)
  
  console.log('\nALERTAS:')
  console.log(`├─ Críticas: ${alertStats.critical}`)
  console.log(`├─ Altas: ${alertStats.high}`)
  console.log(`└─ Total: ${alertStats.total}`)
  
  console.log('\nRECOMENDACIONES:')
  if (suggestions.length > 0) {
    console.log(`├─ Redistribuciones sugeridas: ${suggestions.length}`)
    console.log(`├─ Personal a mover (total): ${suggestions.reduce((sum: number, s: RedistributionSuggestion) => sum + s.totalPersonnel, 0)}`)
    console.log(`└─ Mejora esperada promedio: ${(suggestions.reduce((sum: number, s: RedistributionSuggestion) => sum + s.estimatedImprovementPercentage, 0) / suggestions.length).toFixed(1)}%`)
  } else {
    console.log(`└─ Sistema operando óptimamente. No se requieren acciones.`)
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ ANÁLISIS COMPLETADO')
  console.log('='.repeat(70) + '\n')
  
  // 9. OPCIONES DE ACCIÓN
  if (suggestions.length > 0 && suggestions[0].priority >= 8) {
    console.log('⚠️  ATENCIÓN: Se detectaron situaciones de alta prioridad')
    console.log('💡 RECOMENDACIÓN: Aplicar sugerencia #1 inmediatamente\n')
    
    console.log('Para aplicar la redistribución en el sistema real:')
    console.log('```typescript')
    console.log(`engine.redistributeAgents(`)
    console.log(`  '${suggestions[0].fromProvince}',`)
    console.log(`  '${suggestions[0].toProvince}',`)
    console.log(`  'seguridad', // o el tipo apropiado`)
    console.log(`  ${suggestions[0].totalPersonnel}`)
    console.log(`)`)
    console.log('```\n')
  }
}

// FUNCIONES AUXILIARES

function getSeverityEmoji(severity: string): string {
  const emojis: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  }
  return emojis[severity] || '⚪'
}

function getProvinceName(provinceId: string): string {
  const names: Record<string, string> = {
    pichincha: 'Pichincha',
    guayas: 'Guayas',
    azuay: 'Azuay',
    manabi: 'Manabí',
    el_oro: 'El Oro',
    los_rios: 'Los Ríos',
    tungurahua: 'Tungurahua',
    imbabura: 'Imbabura',
    santo_domingo: 'Santo Domingo',
    chimborazo: 'Chimborazo',
    cotopaxi: 'Cotopaxi',
    esmeraldas: 'Esmeraldas',
    loja: 'Loja',
    carchi: 'Carchi',
    canar: 'Cañar',
    bolivar: 'Bolívar',
    santa_elena: 'Santa Elena',
    morona_santiago: 'Morona Santiago',
    pastaza: 'Pastaza',
    napo: 'Napo',
    zamora_chinchipe: 'Zamora Chinchipe',
    orellana: 'Orellana',
    sucumbios: 'Sucumbíos',
    galapagos: 'Galápagos',
  }
  return names[provinceId] || provinceId
}

function formatCategory(category: string): string {
  const names: Record<string, string> = {
    policia_nacional: 'Policías',
    personal_ecu911: 'Operadores ECU911',
    medicos_msp_iess: 'Médicos',
    personal_transito: 'Agentes de Tránsito',
    bomberos: 'Bomberos',
    fuerzas_armadas: 'Militares',
    agentes_municipales: 'Agentes Municipales',
    cruz_roja: 'Cruz Roja',
  }
  return names[category] || category
}

function formatAlertType(type: string): string {
  const names: Record<string, string> = {
    capacity_critical: 'Sistema Colapsado',
    capacity_overload: 'Sobrecarga',
    capacity_warning: 'Capacidad Limitada',
    capacity_underutilized: 'Subutilizado',
    response_time_high: 'Tiempo de Respuesta Alto',
    redistribution_suggested: 'Redistribución Sugerida',
    system_error: 'Error del Sistema',
  }
  return names[type] || type
}

// EJECUTAR EJEMPLO
if (require.main === module) {
  ejemploCompleto().catch(console.error)
}

export { ejemploCompleto }
