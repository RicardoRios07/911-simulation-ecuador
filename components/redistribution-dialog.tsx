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
import { Users, ArrowRight } from 'lucide-react'

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

  const fromProvinceName = ECUADOR_PROVINCES.find(p => p.id === fromProvince)?.name || ''
  const toProvinceName = ECUADOR_PROVINCES.find(p => p.id === toProvince)?.name || ''

  const maxAgents = selectedService ? (availableAgents[selectedService] || 0) : 0

  const handleConfirm = () => {
    if (fromProvince && toProvince && selectedService && agentCount > 0) {
      onConfirm(fromProvince, toProvince, selectedService, agentCount)
      onOpenChange(false)
      setSelectedService('')
      setAgentCount(1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redistribuir Personal</DialogTitle>
          <DialogDescription>
            Transfiere agentes entre provincias para optimizar la respuesta a emergencias
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* From/To Display */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">Origen</p>
              <p className="font-semibold">{fromProvinceName}</p>
            </div>
            
            <ArrowRight className="mx-4 text-primary" size={24} />
            
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">Destino</p>
              <p className="font-semibold">{toProvinceName}</p>
            </div>
          </div>

          {/* Service Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Tipo de Servicio</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Selecciona un tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(service => {
                  const available = availableAgents[service.id] || 0
                  return (
                    <SelectItem 
                      key={service.id} 
                      value={service.id}
                      disabled={available === 0}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({available} disponibles)
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
            <div className="space-y-2">
              <Label htmlFor="count">Número de Agentes</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={maxAgents}
                  value={agentCount}
                  onChange={(e) => setAgentCount(Math.max(1, Math.min(maxAgents, parseInt(e.target.value) || 1)))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  de {maxAgents}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los agentes tardarán aproximadamente {Math.ceil(agentCount * 3)} segundos en llegar
              </p>
            </div>
          )}

          {/* Summary */}
          {selectedService && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Users className="text-primary" size={20} />
              <p className="text-sm">
                Se transferirán <strong>{agentCount}</strong> agente(s) de{' '}
                <strong>{SERVICE_TYPES.find(s => s.id === selectedService)?.name}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedService || agentCount < 1 || agentCount > maxAgents}
          >
            Confirmar Redistribución
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
