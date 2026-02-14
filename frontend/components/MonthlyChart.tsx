'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { MonthlySummaryItem } from '@/lib/api'

interface MonthlyChartProps {
  data: MonthlySummaryItem[]
  chartType?: 'line' | 'bar' | 'composed'
}

export default function MonthlyChart({ data, chartType = 'composed' }: MonthlyChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ฿${entry.value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (chartType === 'line') {
    return (
      <div className="w-full h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="monthLabel" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line 
              type="monotone" 
              dataKey="totalIncome" 
              name="รายรับ"
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalExpense" 
              name="รายจ่าย"
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              name="ยอดสุทธิ"
              stroke="#3b82f6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chartType === 'bar') {
    return (
      <div className="w-full h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="monthLabel" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="totalIncome" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalExpense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="balance" name="ยอดสุทธิ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Composed Chart (Bar + Line)
  return (
    <div className="w-full h-[300px] sm:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="monthLabel" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
            tick={{ fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar yAxisId="left" dataKey="totalIncome" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="left" dataKey="totalExpense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="balance" 
            name="ยอดสุทธิ"
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

