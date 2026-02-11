# 🚨 Sistema de Optimización ECU 911 Ecuador

Sistema inteligente de simulación y redistribución de recursos para el ECU 911 de Ecuador, utilizando algoritmos matemáticos avanzados (Teoría de Colas M/M/c) y datos reales de personal articulado.

## 🎯 Características Principales

- ✅ **Simulación en Tiempo Real** de emergencias basada en datos históricos
- ✅ **Análisis de Capacidad** usando Teoría de Colas (Erlang-C)
- ✅ **Sistema de Alertas Inteligente** con clasificación por severidad
- ✅ **Sugerencias de Redistribución** basadas en algoritmos de optimización
- ✅ **Datos Reales** de 5,082 personas en 24 provincias
- ✅ **Visualización Interactiva** con mapa de Ecuador
- ✅ **Alineación con ODS** 3, 11 y 16

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev

# Abrir http://localhost:3000
```

## 📂 Estructura del Proyecto

```
lib/
├── simulation-engine.ts           # Motor principal de simulación
├── personnel-data-loader.ts       # Cargador de datos de personal
├── redistribution-analyzer.ts     # Algoritmos de optimización
├── alert-system.ts                # Sistema de alertas
└── types.ts                       # Tipos TypeScript

components/
├── ecu911-dashboard.tsx           # Dashboard principal
├── agents-panel.tsx               # Panel de agentes
├── analysis-panel.tsx             # Análisis y redistribución
├── emergency-feed.tsx             # Feed de emergencias
└── ecuador-map.tsx                # Mapa interactivo

data/
└── personal_articulado_provincia_2025.csv  # Datos reales ECU 911
```

## 💻 Uso de los Módulos

### 1. Cargar Datos de Personal

```typescript
import { SimulationEngine } from '@/lib/simulation-engine'
import fs from 'fs'

const engine = new SimulationEngine()

// Cargar datos de personal desde CSV
const csvContent = fs.readFileSync('data/personal_articulado_provincia_2025.csv', 'utf-8')
await engine.loadPersonnelData(csvContent)

// Los agentes ahora se sincronizan con datos reales
console.log(`Total de agentes: ${engine.getAgents().length}`)
```

### 2. Obtener Análisis de Capacidad

```typescript
// Obtener análisis de todas las provincias
const analyses = engine.getCapacityAnalyses()

analyses.forEach(analysis => {
  console.log(`${analysis.provinceId}:`)
  console.log(`  Utilización: ${analysis.utilizationRate.toFixed(1)}%`)
  console.log(`  Personal: ${analysis.currentPersonnel}`)
  console.log(`  Recomendado: ${analysis.recommendedPersonnel}`)
  console.log(`  Estado: ${analysis.status}`)
  console.log(`  Prioridad: ${analysis.priority}/10`)
})
```

### 3. Generar Sugerencias de Redistribución

```typescript
// Obtener sugerencias ordenadas por impacto
const suggestions = engine.getRedistributionSuggestions()

// Top 3 sugerencias
suggestions.slice(0, 3).forEach((suggestion, index) => {
  console.log(`\nSugerencia #${index + 1}:`)
  console.log(`  De: ${suggestion.fromProvince}`)
  console.log(`  Hacia: ${suggestion.toProvince}`)
  console.log(`  Personal: ${suggestion.totalPersonnel}`)
  console.log(`  Impacto: ${suggestion.impactScore}/100`)
  console.log(`  Mejora esperada: ${suggestion.estimatedImprovementPercentage.toFixed(1)}%`)
  console.log(`  Prioridad: ${suggestion.priority}/10`)
})
```

### 4. Suscribirse a Alertas

```typescript
// Escuchar nuevas alertas en tiempo real
const unsubscribe = engine.subscribeToAlerts(alert => {
  console.log(`🚨 Nueva alerta: ${alert.title}`)
  console.log(`   Severidad: ${alert.severity}`)
  console.log(`   ${alert.message}`)
  
  // Reconocer alerta automáticamente
  if (alert.severity === 'critical') {
    engine.acknowledgeAlert(alert.id, 'Sistema Automático')
  }
})

// Para dejar de escuchar
// unsubscribe()
```

### 5. Obtener Estadísticas de Alertas

```typescript
const stats = engine.getAlertStatistics()

console.log(`Alertas Activas: ${stats.total}`)
console.log(`  🔴 Críticas: ${stats.critical}`)
console.log(`  🟠 Altas: ${stats.high}`)
console.log(`  🟡 Medias: ${stats.medium}`)
console.log(`  🟢 Bajas: ${stats.low}`)
console.log(`\nPor Tipo:`)
Object.entries(stats.byType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`)
})
```

### 6. Ejecutar Redistribución

```typescript
// Aplicar una sugerencia de redistribución
const suggestion = suggestions[0]

const success = engine.redistributeAgents(
  suggestion.fromProvince,
  suggestion.toProvince,
  'seguridad', // tipo de servicio
  5 // cantidad de agentes
)

if (success) {
  console.log('✅ Redistribución iniciada')
  
  // Monitorear agentes en tránsito
  const relocating = engine.getRelocatingAgents()
  console.log(`Agentes en tránsito: ${relocating.length}`)
  
  relocating.forEach(agent => {
    console.log(`  ${agent.name}: ${(agent.relocatingProgress! * 100).toFixed(0)}%`)
  })
} else {
  console.log('❌ No hay suficientes agentes disponibles')
}
```

## 📊 Algoritmos Implementados

### Teoría de Colas M/M/c (Erlang-C)

Modelo matemático para sistemas de atención con múltiples servidores:

**Variables:**
- λ: Tasa de llegada de emergencias (emergencias/hora)
- μ: Tasa de servicio (60 min / 25 min servicio promedio = 2.4)
- c: Número de servidores (personal disponible)
- ρ: Factor de utilización = λ / (c × μ)

**Métricas Calculadas:**
- **Probabilidad de espera** (Erlang-C formula)
- **Tiempo promedio en cola** (Wq)
- **Longitud de cola** (Lq)
- **Personal recomendado** para mantener utilización óptima (75%)

### Algoritmo de Redistribución

**Entrada:** Análisis de capacidad de 24 provincias  
**Salida:** Top 10 sugerencias ranqueadas por impacto

**Score de Impacto (0-100):**
- 40%: Reducción de utilización en destino
- 30%: Prioridad de la provincia (basada en sobrecarga)
- 20%: Cobertura del déficit
- 10%: Proximidad geográfica

**Validaciones:**
- Máximo 30% del personal puede ser transferido
- Provincia origen no debe quedar sobrecargada (>90%)
- Personal transferido debe cubrir al menos 50% del déficit

## 🎨 Componentes de UI

### Dashboard Principal

```tsx
import { ECU911Dashboard } from '@/components/ecu911-dashboard'

export default function Page() {
  return <ECU911Dashboard />
}
```

### Uso Individual de Componentes

```tsx
import { AgentsPanel } from '@/components/agents-panel'
import { AnalysisPanel } from '@/components/analysis-panel'
import { EmergencyFeed } from '@/components/emergency-feed'

<AgentsPanel 
  agents={agents} 
  onFilterChange={(filters) => console.log(filters)} 
/>

<AnalysisPanel 
  suggestions={suggestions}
  onApply={(suggestion) => applySuggestion(suggestion)}
/>

<EmergencyFeed 
  emergencies={emergencies}
  maxItems={50}
/>
```

## 🔧 Configuración

### Parámetros del Analizador

```typescript
// En redistribution-analyzer.ts
class RedistributionAnalyzer {
  // Umbrales de utilización
  private readonly OPTIMAL_UTILIZATION = 0.75  // 75%
  private readonly CRITICAL_UTILIZATION = 0.90 // 90%
  private readonly MIN_UTILIZATION = 0.40      // 40%
  
  // Tiempo promedio de servicio
  private readonly AVG_SERVICE_TIME_MINUTES = 25 // minutos
}
```

### Intervalo de Análisis

```typescript
// En simulation-engine.ts
private readonly ANALYSIS_INTERVAL_MS = 60000  // Análisis cada 60 segundos
```

## 📈 Métricas y KPIs

El sistema calcula automáticamente:

| Métrica | Descripción | Objetivo |
|---------|-------------|----------|
| **Utilización (ρ)** | % de ocupación del personal | 40-75% |
| **Tiempo de espera** | Minutos en cola promedio | <10 min |
| **Personal recomendado** | c óptimo calculado | Variable |
| **Déficit/Exceso** | Diferencia vs recomendado | ±0 |
| **Emergencias/hora** | Tasa λ actual | Variable |
| **Score de impacto** | Efectividad de redistribución | >80/100 |

## 🧪 Testing

```bash
# Ejecutar tests (futuro)
pnpm test

# Test de un módulo específico
pnpm test personnel-data-loader

# Coverage
pnpm test:coverage
```

## 🐛 Debugging

### Modo Verbose

```typescript
// Activar logs detallados
const engine = new SimulationEngine()
engine.setVerbose(true) // Imprime cada evento

// Ver estado completo
console.log(JSON.stringify(engine.getState(), null, 2))
```

### Herramientas de Desarrollo

```typescript
// Acceder a módulos internos para debugging
const personnelLoader = engine.getPersonnelLoader()
const analyzer = engine.getRedistributionAnalyzer()
const alertSystem = engine.getAlertSystem()

// Ver resumen de alertas
console.log(alertSystem.generateSummary())
```

## 🌐 Datos

### Formato CSV de Personal

```csv
Provincia,Personal_ECU911,Policia_Nacional,Fuerzas_Armadas,Medicos_MSP_IESS,Bomberos,Personal_Transito,Cruz_Roja,Agentes_Municipales,Total_Personal,Notas
Pichincha,520,280,45,85,35,55,12,215,1247,"Incluye Planta Central..."
Guayas,400,350,55,90,40,60,15,45,1055,"Centro Zonal Samborondón..."
...
```

### Mapeode Categorías a Servicios

| Categoría Personal | Tipo de Servicio |
|--------------------|------------------|
| `policia_nacional` | `seguridad` |
| `medicos_msp_iess` | `sanitaria` |
| `bomberos` | `siniestros` |
| `personal_transito` | `transito` |
| `fuerzas_armadas` | `militar` |
| `agentes_municipales` | `municipal` |

## 📝 Contribuir

### Guidelines

1. Seguir TypeScript strict mode
2. Documentar funciones públicas con JSDoc
3. Mantener cobertura de tests >80%
4. Usar Prettier para formateo
5. Commits semánticos: `feat:`, `fix:`, `docs:`

### Roadmap

- [ ] Tests unitarios completos
- [ ] Integración de Machine Learning para predicción
- [ ] API REST para integración externa
- [ ] Dashboard ejecutivo dedicado
- [ ] Exportación de reportes PDF
- [ ] Modo "What-if" para escenarios

## 📚 Referencias

- **Erlang-C Formula:** [Wikipedia](https://en.wikipedia.org/wiki/Erlang_(unit)#Erlang_C_formula)
- **Queueing Theory:** Hillier & Lieberman, "Introduction to Operations Research"
- **ECU 911:** [Sitio Oficial](https://www.ecu911.gob.ec/)
- **ODS:** [Naciones Unidas](https://sdgs.un.org/)

## 📄 Licencia

MIT License - Ver archivo `LICENSE` para detalles

## 👥 Autores

- **[Tu Nombre]** - Desarrollo Principal
- **ECU 911 Ecuador** - Provisión de Datos

## 🙏 Agradecimientos

- Sistema Integrado de Seguridad ECU 911 por los datos
- Comunidad open source de algoritmos de optimización
- [Otros agradecimientos]

---

**Versión:** 1.0.0  
**Última Actualización:** Febrero 2026  
**Estado:** ✅ Prototipo Funcional
