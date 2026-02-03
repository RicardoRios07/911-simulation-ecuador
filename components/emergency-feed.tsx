'use client'

import { Emergency, SERVICE_TYPES, ECUADOR_PROVINCES } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertCircle, 
  Clock, 
  MapPin, 
  CheckCircle2,
  Timer,
  Siren
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface EmergencyFeedProps {
  emergencies: Emergency[]
  selectedProvince: string | null
}

export function EmergencyFeed({ emergencies, selectedProvince }: EmergencyFeedProps) {
  const filteredEmergencies = selectedProvince
    ? emergencies.filter(e => e.province === selectedProvince)
    : emergencies

  const sortedEmergencies = [...filteredEmergencies].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getStatusConfig = (status: Emergency['status']) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Pendiente', 
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: AlertCircle
        }
      case 'assigned':
        return { 
          label: 'Asignado', 
          color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: Timer
        }
      case 'responding':
        return { 
          label: 'En camino', 
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: Siren
        }
      case 'resolved':
        return { 
          label: 'Resuelto', 
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2
        }
      default:
        return { 
          label: 'Desconocido', 
          color: 'bg-muted text-muted-foreground',
          icon: Clock
        }
    }
  }

  const getServiceColor = (serviceId: string) => {
    return SERVICE_TYPES.find(s => s.id === serviceId)?.color || '#888888'
  }

  const getServiceName = (serviceId: string) => {
    return SERVICE_TYPES.find(s => s.id === serviceId)?.name || serviceId
  }

  const getProvinceName = (provinceId: string) => {
    return ECUADOR_PROVINCES.find(p => p.id === provinceId)?.name || provinceId
  }

  return (
    <Card className="h-full bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Siren className="w-4 h-4 text-destructive animate-pulse" />
            Emergencias Activas
          </CardTitle>
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            {filteredEmergencies.length} activas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="px-4 pb-4 space-y-2">
            {sortedEmergencies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay emergencias activas</p>
              </div>
            ) : (
              sortedEmergencies.map(emergency => {
                const statusConfig = getStatusConfig(emergency.status)
                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={emergency.id}
                    className={`p-3 rounded-lg border transition-all hover:border-primary/30 ${
                      emergency.status === 'pending' 
                        ? 'bg-red-500/5 border-red-500/20 animate-pulse' 
                        : 'bg-secondary/30 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ backgroundColor: getServiceColor(emergency.type) }}
                        />
                        <span className="text-xs font-medium text-foreground">
                          {getServiceName(emergency.type)}
                        </span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConfig.color}`}>
                        <StatusIcon className="w-2.5 h-2.5 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground mb-1">
                      {emergency.subtype}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {getProvinceName(emergency.province)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(emergency.timestamp), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>

                    {emergency.priority === 1 && (
                      <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                        Alta Prioridad
                      </Badge>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
