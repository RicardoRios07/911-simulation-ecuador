// Tipos para la simulación del 911 Ecuador

export interface Province {
  id: string
  name: string
  coordinates: { x: number; y: number }
  population: number
}

export interface EmergencyType {
  id: string
  name: string
  color: string
  icon: string
  count: number
  priority: number
}

export interface Agent {
  id: string
  type: string
  status: 'available' | 'busy' | 'responding' | 'relocating'
  province: string
  currentEmergency?: Emergency
  position: { x: number; y: number }
  name?: string
  avatar?: string
  relocatingTo?: string
  relocatingFrom?: string
  relocatingProgress?: number // 0 a 1
}

export interface Emergency {
  id: string
  type: string
  subtype: string
  province: string
  canton: string
  parroquia: string
  timestamp: Date
  status: 'pending' | 'assigned' | 'responding' | 'resolved'
  priority: number
  assignedAgent?: string
}

export interface SimulationState {
  isRunning: boolean
  speed: number
  currentTime: Date
  totalEmergencies: number
  resolvedEmergencies: number
  activeEmergencies: Emergency[]
  agents: Agent[]
  statistics: ProvinceStatistics[]
}

export interface ProvinceStatistics {
  province: string
  emergencies: number
  agents: number
  avgResponseTime: number
  byType: Record<string, number>
}

export interface CSVData {
  fecha: string
  provincia: string
  canton: string
  cod_parroquia: string
  parroquia: string
  tipo_servicio: string
  subtipo: string
  dia_semana: string
  dia_mes: string
  mes: string
  año: string
}

export const SERVICE_TYPES: EmergencyType[] = [
  { id: 'seguridad', name: 'Seguridad Ciudadana', color: '#f59e0b', icon: 'shield', count: 181765, priority: 1 },
  { id: 'transito', name: 'Tránsito y Movilidad', color: '#3b82f6', icon: 'car', count: 34780, priority: 2 },
  { id: 'sanitaria', name: 'Gestión Sanitaria', color: '#ef4444', icon: 'heart', count: 32434, priority: 1 },
  { id: 'municipal', name: 'Servicios Municipales', color: '#8b5cf6', icon: 'building', count: 10541, priority: 3 },
  { id: 'siniestros', name: 'Gestión de Siniestros', color: '#f97316', icon: 'flame', count: 4354, priority: 1 },
  { id: 'militar', name: 'Servicio Militar', color: '#22c55e', icon: 'shield-check', count: 4185, priority: 2 },
  { id: 'riesgos', name: 'Gestión de Riesgos', color: '#06b6d4', icon: 'alert-triangle', count: 1007, priority: 1 },
]

export const ECUADOR_PROVINCES: Province[] = [
  { id: 'azuay', name: 'Azuay', coordinates: { x: 38, y: 68 }, population: 881394 },
  { id: 'bolivar', name: 'Bolívar', coordinates: { x: 28, y: 55 }, population: 209933 },
  { id: 'canar', name: 'Cañar', coordinates: { x: 35, y: 62 }, population: 281396 },
  { id: 'carchi', name: 'Carchi', coordinates: { x: 35, y: 8 }, population: 186869 },
  { id: 'chimborazo', name: 'Chimborazo', coordinates: { x: 32, y: 55 }, population: 524004 },
  { id: 'cotopaxi', name: 'Cotopaxi', coordinates: { x: 30, y: 42 }, population: 488716 },
  { id: 'el_oro', name: 'El Oro', coordinates: { x: 28, y: 75 }, population: 715751 },
  { id: 'esmeraldas', name: 'Esmeraldas', coordinates: { x: 22, y: 12 }, population: 643654 },
  { id: 'galapagos', name: 'Galápagos', coordinates: { x: 5, y: 35 }, population: 33042 },
  { id: 'guayas', name: 'Guayas', coordinates: { x: 22, y: 62 }, population: 4387434 },
  { id: 'imbabura', name: 'Imbabura', coordinates: { x: 32, y: 18 }, population: 476257 },
  { id: 'loja', name: 'Loja', coordinates: { x: 40, y: 80 }, population: 521154 },
  { id: 'los_rios', name: 'Los Ríos', coordinates: { x: 22, y: 52 }, population: 921763 },
  { id: 'manabi', name: 'Manabí', coordinates: { x: 15, y: 42 }, population: 1562079 },
  { id: 'morona_santiago', name: 'Morona Santiago', coordinates: { x: 55, y: 68 }, population: 196535 },
  { id: 'napo', name: 'Napo', coordinates: { x: 55, y: 38 }, population: 133705 },
  { id: 'orellana', name: 'Orellana', coordinates: { x: 68, y: 38 }, population: 161338 },
  { id: 'pastaza', name: 'Pastaza', coordinates: { x: 60, y: 52 }, population: 114202 },
  { id: 'pichincha', name: 'Pichincha', coordinates: { x: 30, y: 28 }, population: 3228233 },
  { id: 'santa_elena', name: 'Santa Elena', coordinates: { x: 12, y: 58 }, population: 401178 },
  { id: 'santo_domingo', name: 'Santo Domingo', coordinates: { x: 24, y: 32 }, population: 458580 },
  { id: 'sucumbios', name: 'Sucumbíos', coordinates: { x: 58, y: 18 }, population: 230503 },
  { id: 'tungurahua', name: 'Tungurahua', coordinates: { x: 35, y: 48 }, population: 590600 },
  { id: 'zamora_chinchipe', name: 'Zamora Chinchipe', coordinates: { x: 52, y: 80 }, population: 120416 },
]
