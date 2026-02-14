'use client'

import { useEffect, useState } from 'react'
import { apiClient, AcademicYear, TransactionCategory } from '@/lib/api'
import ThaiDatePicker from './ThaiDatePicker'

interface FilterBarProps {
  filters: {
    from?: string
    to?: string
    academicYearId?: string
    categoryId?: string
  }
  onFiltersChange: (filters: {
    from?: string
    to?: string
    academicYearId?: string
    categoryId?: string
  }) => void
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [years, cats] = await Promise.all([
        apiClient.academicYears.getAll(),
        apiClient.categories.getAll(),
      ])
      setAcademicYears(years)
      setCategories(cats)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ปีการศึกษา
          </label>
          <select
            value={filters.academicYearId || ''}
            onChange={(e) => handleChange('academicYearId', e.target.value)}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          >
            <option value="">ทั้งหมด</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมวดหมู่
          </label>
          <select
            value={filters.categoryId || ''}
            onChange={(e) => handleChange('categoryId', e.target.value)}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          >
            <option value="">ทั้งหมด</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ตั้งแต่
          </label>
          <div className="date-picker-wrapper">
            <ThaiDatePicker
              value={filters.from}
              onChange={(value) => handleChange('from', value)}
              placeholder="เลือกวันที่เริ่มต้น"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ถึง
          </label>
          <div className="date-picker-wrapper">
            <ThaiDatePicker
              value={filters.to}
              onChange={(value) => handleChange('to', value)}
              placeholder="เลือกวันที่สิ้นสุด"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => onFiltersChange({})}
            className="w-full px-4 py-2 h-[42px] bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>
  )
}

