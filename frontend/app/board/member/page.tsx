'use client'

import { useEffect, useState } from 'react'
import { apiClient, MemberBoardItem } from '@/lib/api'
import FilterBar from '@/components/FilterBar'

export default function MemberBoardPage() {
  const [data, setData] = useState<MemberBoardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    from?: string
    to?: string
    academicYearId?: string
  }>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const boardData = await apiClient.transactions.getBoardByMember(filters)
      setData(boardData)
    } catch (error) {
      console.error('Error loading board data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">บอร์ดแยกตามผู้บันทึก</h1>

      <FilterBar filters={filters} onFiltersChange={setFilters} />

      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้บันทึก
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวมรับ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวมจ่าย
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดสุทธิ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนรายการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.memberId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.memberName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      +{formatCurrency(item.totalIncome)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      -{formatCurrency(item.totalExpense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span
                        className={item.balance >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {item.balance >= 0 ? '+' : ''}
                        {formatCurrency(item.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {item.transactionCount} รายการ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                ไม่พบข้อมูล
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

