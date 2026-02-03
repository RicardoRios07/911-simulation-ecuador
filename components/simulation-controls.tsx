'use client'

import React from "react"

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Upload, 
  Zap, 
  Clock,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { CSVData } from '@/lib/types'

interface SimulationControlsProps {
  isRunning: boolean
  speed: number
  onToggleRunning: () => void
  onSpeedChange: (speed: number) => void
  onReset: () => void
  onCSVLoad: (data: CSVData[]) => void
  currentTime: Date
  hasCSVData: boolean
}

export function SimulationControls({
  isRunning,
  speed,
  onToggleRunning,
  onSpeedChange,
  onReset,
  onCSVLoad,
  currentTime,
  hasCSVData,
}: SimulationControlsProps) {
  const [csvStatus, setCSVStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [csvFileName, setCSVFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCSVStatus('loading')
    setCSVFileName(file.name)

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
      
      const data: CSVData[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Parse CSV respetando comillas
        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())

        if (values.length >= headers.length) {
          const row: Record<string, string> = {}
          headers.forEach((header, idx) => {
            row[header] = values[idx]?.replace(/['"]/g, '') || ''
          })

          data.push({
            fecha: row['fecha'] || '',
            provincia: row['provincia'] || '',
            canton: row['canton'] || '',
            cod_parroquia: row['cod_parroquia'] || '',
            parroquia: row['parroquia'] || '',
            tipo_servicio: row['tipo_servicio'] || '',
            subtipo: row['subtipo'] || '',
            dia_semana: row['dia_semana'] || '',
            dia_mes: row['dia_mes'] || '',
            mes: row['mes'] || '',
            año: row['año'] || '',
          })
        }
      }

      if (data.length > 0) {
        onCSVLoad(data)
        setCSVStatus('success')
      } else {
        setCSVStatus('error')
      }
    } catch (error) {
      console.error('[v0] Error parsing CSV:', error)
      setCSVStatus('error')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-EC', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-EC', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Control de Simulación
          </CardTitle>
          <Badge 
            variant={isRunning ? 'default' : 'secondary'}
            className={isRunning ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}
          >
            {isRunning ? 'Ejecutando' : 'Pausado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tiempo de simulación */}
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tiempo Simulado</p>
              <p className="text-sm font-mono text-foreground">{formatTime(currentTime)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Fecha</p>
            <p className="text-sm font-mono text-foreground">{formatDate(currentTime)}</p>
          </div>
        </div>

        {/* Controles principales */}
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? 'secondary' : 'default'}
            size="sm"
            onClick={onToggleRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Iniciar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Control de velocidad */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Velocidad</span>
            <span className="text-xs font-mono text-foreground">{speed}x</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(v) => onSpeedChange(v[0])}
            min={0.5}
            max={10}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0.5x</span>
            <span>5x</span>
            <span>10x</span>
          </div>
        </div>

        {/* Carga de CSV */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Datos Personalizados</span>
            {hasCSVData && (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="w-2.5 h-2.5 mr-1" />
                CSV Cargado
              </Badge>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            disabled={csvStatus === 'loading'}
          >
            {csvStatus === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Cargar CSV
              </>
            )}
          </Button>

          {csvStatus === 'success' && csvFileName && (
            <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 truncate">{csvFileName}</span>
            </div>
          )}

          {csvStatus === 'error' && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400">Error al cargar CSV</span>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Columnas requeridas: fecha, provincia, canton, tipo_servicio, subtipo
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
