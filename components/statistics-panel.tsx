'use client'

import { SERVICE_TYPES } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { Activity, TrendingUp, BarChart3 } from 'lucide-react'

interface StatisticsPanelProps {
  totalEmergencies: number
  resolvedEmergencies: number
  emergenciesByType: Record<string, number>
  timeSeriesData: Array<{ time: string; count: number }>
}

export function StatisticsPanel({
  totalEmergencies,
  resolvedEmergencies,
  emergenciesByType,
  timeSeriesData,
}: StatisticsPanelProps) {
  const pieData = SERVICE_TYPES.map(service => ({
    id: service.id,
    name: service.name.split(' ')[0],
    value: emergenciesByType[service.id] || service.count,
    color: service.color,
    fullName: service.name,
  }))

  const barData = SERVICE_TYPES.map(service => ({
    name: service.name.split(' ')[0],
    emergencias: emergenciesByType[service.id] || Math.floor(service.count / 30),
    color: service.color,
  }))

  const resolutionRate = totalEmergencies > 0 
    ? ((resolvedEmergencies / totalEmergencies) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-4">
      {/* KPIs principales */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Emergencias</p>
                <p className="text-2xl font-bold text-foreground">{totalEmergencies.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Resueltas</p>
                <p className="text-2xl font-bold text-emerald-400">{resolvedEmergencies.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tasa Resolución</p>
                <p className="text-2xl font-bold text-primary">{resolutionRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de distribución por tipo */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribución por Tipo de Servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={70}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-xs text-foreground font-medium">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payload[0].value?.toLocaleString()} emergencias
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="emergencias" 
                  radius={[0, 4, 4, 0]}
                  fill="#f59e0b"
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico circular */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Proporción Noviembre 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-xs text-foreground font-medium">
                            {payload[0].payload.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payload[0].value?.toLocaleString()} ({((Number(payload[0].value) / 269066) * 100).toFixed(1)}%)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1">
              {pieData.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-muted-foreground flex-1 truncate">
                    {item.fullName}
                  </span>
                  <span className="text-[10px] text-foreground font-medium">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de tendencia */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tendencia en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-xs text-foreground">{label}</p>
                          <p className="text-xs text-primary font-medium">
                            {payload[0].value} emergencias
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
