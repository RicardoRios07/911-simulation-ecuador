// Cargador y procesador de datos de personal del 911 Ecuador
import { PersonnelData, PersonnelByProvince, PersonnelCategory } from './types'

export class PersonnelDataLoader {
  private personnelData: PersonnelByProvince[] = []
  private nationalTotals: Record<PersonnelCategory, number> = {} as Record<PersonnelCategory, number>

  /**
   * Carga los datos del CSV de personal por provincia
   * Procesa y normaliza la información para uso en la simulación
   */
  async loadFromCSV(csvContent: string): Promise<void> {
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',')
    
    this.personnelData = []
    
    // Procesar cada línea (saltando encabezado y líneas de resumen)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('TOTAL_NACIONAL') || line.startsWith('DISTRIBUCIÓN')) break
      
      const values = this.parseCSVLine(line)
      if (values.length < 10) continue
      
      const provinceData: PersonnelByProvince = {
        provincia: this.normalizeProvinceName(values[0]),
        personal_ecu911: parseInt(values[1]) || 0,
        policia_nacional: parseInt(values[2]) || 0,
        fuerzas_armadas: parseInt(values[3]) || 0,
        medicos_msp_iess: parseInt(values[4]) || 0,
        bomberos: parseInt(values[5]) || 0,
        personal_transito: parseInt(values[6]) || 0,
        cruz_roja: parseInt(values[7]) || 0,
        agentes_municipales: parseInt(values[8]) || 0,
        total_personal: parseInt(values[9]) || 0,
        notas: values[10] || '',
      }
      
      this.personnelData.push(provinceData)
    }
    
    // Calcular totales nacionales
    this.calculateNationalTotals()
  }

  /**
   * Parsea una línea CSV considerando campos entrecomillados
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  /**
   * Normaliza nombres de provincias a IDs consistentes
   */
  private normalizeProvinceName(name: string): string {
    const mapping: Record<string, string> = {
      'pichincha': 'pichincha',
      'guayas': 'guayas',
      'azuay': 'azuay',
      'manabí': 'manabi',
      'manabi': 'manabi',
      'el_oro': 'el_oro',
      'el oro': 'el_oro',
      'los_rios': 'los_rios',
      'los rios': 'los_rios',
      'tungurahua': 'tungurahua',
      'imbabura': 'imbabura',
      'santo_domingo': 'santo_domingo',
      'santo domingo': 'santo_domingo',
      'chimborazo': 'chimborazo',
      'cotopaxi': 'cotopaxi',
      'esmeraldas': 'esmeraldas',
      'loja': 'loja',
      'carchi': 'carchi',
      'cañar': 'canar',
      'canar': 'canar',
      'bolívar': 'bolivar',
      'bolivar': 'bolivar',
      'santa_elena': 'santa_elena',
      'santa elena': 'santa_elena',
      'morona_santiago': 'morona_santiago',
      'morona santiago': 'morona_santiago',
      'pastaza': 'pastaza',
      'napo': 'napo',
      'zamora_chinchipe': 'zamora_chinchipe',
      'zamora chinchipe': 'zamora_chinchipe',
      'orellana': 'orellana',
      'sucumbíos': 'sucumbios',
      'sucumbios': 'sucumbios',
      'galápagos': 'galapagos',
      'galapagos': 'galapagos',
    }
    
    const normalized = name.toLowerCase().trim().replace(/_/g, ' ')
    return mapping[normalized] || normalized.replace(/ /g, '_')
  }

  /**
   * Calcula totales nacionales sumando todas las provincias
   */
  private calculateNationalTotals(): void {
    this.nationalTotals = {
      personal_ecu911: 0,
      policia_nacional: 0,
      fuerzas_armadas: 0,
      medicos_msp_iess: 0,
      bomberos: 0,
      personal_transito: 0,
      cruz_roja: 0,
      agentes_municipales: 0,
    }
    
    this.personnelData.forEach(province => {
      this.nationalTotals.personal_ecu911 += province.personal_ecu911
      this.nationalTotals.policia_nacional += province.policia_nacional
      this.nationalTotals.fuerzas_armadas += province.fuerzas_armadas
      this.nationalTotals.medicos_msp_iess += province.medicos_msp_iess
      this.nationalTotals.bomberos += province.bomberos
      this.nationalTotals.personal_transito += province.personal_transito
      this.nationalTotals.cruz_roja += province.cruz_roja
      this.nationalTotals.agentes_municipales += province.agentes_municipales
    })
  }

  /**
   * Obtiene datos de personal de una provincia específica
   */
  getProvincePersonnel(provinceId: string): PersonnelByProvince | null {
    return this.personnelData.find(p => p.provincia === provinceId) || null
  }

  /**
   * Obtiene todos los datos de personal
   */
  getAllPersonnel(): PersonnelByProvince[] {
    return [...this.personnelData]
  }

  /**
   * Obtiene totales nacionales por categoría
   */
  getNationalTotals(): Record<PersonnelCategory, number> {
    return { ...this.nationalTotals }
  }

  /**
   * Mapea categorías de personal a tipos de servicio de emergencia
   */
  mapPersonnelToServiceType(category: PersonnelCategory): string {
    const mapping: Record<PersonnelCategory, string> = {
      personal_ecu911: 'all', // Operadores de todos los tipos
      policia_nacional: 'seguridad',
      fuerzas_armadas: 'militar',
      medicos_msp_iess: 'sanitaria',
      bomberos: 'siniestros',
      personal_transito: 'transito',
      cruz_roja: 'sanitaria',
      agentes_municipales: 'municipal',
    }
    return mapping[category] || 'all'
  }

  /**
   * Obtiene personal disponible de una provincia por tipo de servicio
   */
  getPersonnelByServiceType(provinceId: string, serviceType: string): number {
    const provinceData = this.getProvincePersonnel(provinceId)
    if (!provinceData) return 0
    
    // Mapeo inverso: dado un tipo de servicio, ¿qué personal puede atenderlo?
    const serviceMapping: Record<string, PersonnelCategory[]> = {
      seguridad: ['policia_nacional', 'fuerzas_armadas', 'personal_ecu911'],
      transito: ['personal_transito', 'policia_nacional', 'personal_ecu911'],
      sanitaria: ['medicos_msp_iess', 'cruz_roja', 'personal_ecu911'],
      municipal: ['agentes_municipales', 'personal_ecu911'],
      siniestros: ['bomberos', 'personal_ecu911'],
      militar: ['fuerzas_armadas', 'personal_ecu911'],
      riesgos: ['bomberos', 'fuerzas_armadas', 'personal_ecu911'],
    }
    
    const categories = serviceMapping[serviceType] || ['personal_ecu911']
    let total = 0
    
    categories.forEach(category => {
      total += provinceData[category] || 0
    })
    
    return total
  }

  /**
   * Calcula la distribución porcentual de personal por provincia
   */
  getProvinceDistributionPercentage(): Map<string, number> {
    const distribution = new Map<string, number>()
    const total = this.personnelData.reduce((sum, p) => sum + p.total_personal, 0)
    
    this.personnelData.forEach(province => {
      const percentage = (province.total_personal / total) * 100
      distribution.set(province.provincia, percentage)
    })
    
    return distribution
  }

  /**
   * Obtiene el total de personal de una provincia
   */
  getTotalPersonnelByProvince(provinceId: string): number {
    const data = this.getProvincePersonnel(provinceId)
    return data?.total_personal || 0
  }

  /**
   * Calcula densidad de personal (personal por cada 100,000 habitantes)
   */
  calculatePersonnelDensity(provinceId: string, population: number): number {
    const total = this.getTotalPersonnelByProvince(provinceId)
    return (total / population) * 100000
  }
}
