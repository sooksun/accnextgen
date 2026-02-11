'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CategoryBoardItem } from '@/lib/api'

interface CategoryLineChartProps {
  data: CategoryBoardItem[]
}

export default function CategoryLineChart({ data }: CategoryLineChartProps) {
  // แปลงข้อมูลให้เหมาะกับกราฟ
  const chartData = data.map(item => ({
    name: item.categoryName.length > 10 ? item.categoryName.substring(0, 10) + '...' : item.categoryName,
    fullName: item.categoryName,
    รายรับ: item.categoryType === 'INCOME' ? item.totalAmount : 0,
    รายจ่าย: item.categoryType === 'EXPENSE' ? item.totalAmount : 0,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.fullName}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value > 0) {
              return (
                <p key={index} className="text-sm" style={{ color: entry.color }}>
                  {`${entry.dataKey}: ฿${entry.value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-[300px] sm:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
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
            dataKey="รายรับ" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line 
            type="monotone" 
            dataKey="รายจ่าย" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ fill: '#ef4444', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

