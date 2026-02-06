'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { SERVICE_TYPES, ECUADOR_PROVINCES } from '@/lib/types'
import { Users, ArrowRight, Clock, MapPin } from 'lucide-react'

interface RedistributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromProvince: string | null
  toProvince: string | null
  availableAgents: Record<string, number>
  onConfirm: (fromProvince: string, toProvince: string, serviceType: string, count: number) => void
}

export function RedistributionDialog({
  open,
  onOpenChange,
  fromProvince,
  toProvince,
  availableAgents,
  onConfirm,
}: RedistributionDialogProps) {
  const [selectedService, setSelectedService] = useState<string>('')
  const [agentCount, setAgentCount] = useState<number>(1)

  console.log('🎭 RedistributionDialog render - open:', open, 'from:', fromProvince, 'to:', toProvince)

  const fromProvinceName = ECUADOR_PROVINCES.find(p => p.id === fromProvince)?.name || ''
  const toProvinceName = ECUADOR_PROVINCES.find(p => p.id === toProvince)?.name || ''

  const maxAgents = selectedService ? (availableAgents[selectedService] || 0) : 0

  // Calcular tiempo estimado de viaje basado en distancia
  const estimatedTravelTime = (() => {
    if (!fromProvince || !toProvince) return 3
    const from = ECUADOR_PROVINCES.find(p => p.id === fromProvince)
    const to = ECUADOR_PROVINCES.find(p => p.id === toProvince)
    if (!from || !to) return 3
    
    const distance = Math.sqrt(
      Math.pow(to.coordinates.x - from.coordinates.x, 2) +
      Math.pow(to.coordinates.y - from.coordinates.y, 2)
    )
    return Math.max(3, Math.min(6, Math.ceil(distance / 5)))
  })()

  const handleConfirm = () => {
    if (fromProvince && toProvince && selectedService && agentCount > 0) {
      onConfirm(fromProvince, toProvince, selectedService, agentCount)
      onOpenChange(false)
      setSelectedService('')
      setAgentCount(1)
    }
  }

  const selectedServiceData = SERVICE_TYPES.find(s => s.id === selectedService)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Redistribuir Personal de Servicio
          </DialogTitle>
          <DialogDescription>
            Transfiere agentes entre provincias para optimizar la respuesta a emergencias
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* From/To Display */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted rounded-lg border border-border">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Origen</p>
              </div>
              <p className="font-semibold text-base">{fromProvinceName}</p>
            </div>
            
            <div className="mx-4 flex flex-col items-center">
              <ArrowRight className="text-primary animate-pulse" size={28} />
              {selectedService && agentCount > 0 && (
                <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{estimatedTravelTime}s
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Destino</p>
              </div>
              <p className="font-semibold text-base">{toProvinceName}</p>
            </div>
          </div>

          {/* Service Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="service" className="text-sm font-medium">Tipo de Servicio</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service" className="h-11">
                <SelectValue placeholder="Selecciona un tipo de servicio" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                {SERVICE_TYPES.map(service => {
                  const available = availableAgents[service.id] || 0
                  return (
                    <SelectItem 
                      key={service.id} 
                      value={service.id}
                      disabled={available === 0}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="flex-1">{service.name}</span>
                        <span className={`text-xs font-semibold ${available > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          {available} disponible{available !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Count */}
          {selectedService && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <Label htmlFor="count" className="text-sm font-medium">Número de Agentes a Transferir</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentCount(Math.max(1, agentCount - 1))}
                  disabled={agentCount <= 1}
                >
                  -
                </Button>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={maxAgents}
                  value={agentCount}
                  onChange={(e) => setAgentCount(Math.max(1, Math.min(maxAgents, parseInt(e.target.value) || 1)))}
                  className="flex-1 text-center text-lg font-semibold h-11"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentCount(Math.min(maxAgents, agentCount + 1))}
                  disabled={agentCount >= maxAgents}
                >
                  +
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  de {maxAgents}
                </span>
              </div>
              
              {/* Preview Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Disponibles después</span>
                  <span className="font-semibold">{maxAgents - agentCount} agentes</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${((maxAgents - agentCount) / maxAgents) * 100}%`,
                      backgroundColor: selectedServiceData?.color || '#888'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedService && (
            <div 
              className="flex items-start gap-3 p-4 rounded-lg border-2 animate-in slide-in-from-top-3"
              style={{ 
                backgroundColor: `${selectedServiceData?.color}15`,
                borderColor: `${selectedServiceData?.color}40`
              }}
            >
              <Users 
                className="mt-0.5 flex-shrink-0" 
                size={20} 
                style={{ color: selectedServiceData?.color }}
              />
              <div className="flex-1 text-sm space-y-1">
                <p>
                  Se transferirán <strong>{agentCount}</strong> agente{agentCount !== 1 ? 's' : ''} de{' '}
                  <strong style={{ color: selectedServiceData?.color }}>
                    {selectedServiceData?.name}
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Tiempo estimado de llegada: <strong>~{estimatedTravelTime} segundos</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Los agentes viajarán de forma escalonada y podrás ver su progreso en el mapa
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedService || agentCount < 1 || agentCount > maxAgents}
            className="min-w-[140px]"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Confirmar Transferencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
