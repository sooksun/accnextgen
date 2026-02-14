'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, TransactionSummary, CategoryBoardItem, MemberBoardItem, MonthlySummaryItem } from '@/lib/api'
import SummaryCard from '@/components/SummaryCard'
import CategoryBarChart from '@/components/CategoryBarChart'
import CategoryLineChart from '@/components/CategoryLineChart'
import MonthlyChart from '@/components/MonthlyChart'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [categoryBoard, setCategoryBoard] = useState<CategoryBoardItem[]>([])
  const [memberBoard, setMemberBoard] = useState<MemberBoardItem[]>([])
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  const loadData = async () => {
    if (!isAuthenticated) return // ไม่เรียก API ถ้ายังไม่ได้ login
    
    setLoading(true)
    try {
      const [summaryData, categoryData, memberData, monthlyData] = await Promise.all([
        apiClient.transactions.getSummary(),
        apiClient.transactions.getBoardByCategory(),
        apiClient.transactions.getBoardByMember(),
        apiClient.transactions.getMonthlySummary(),
      ])
      setSummary(summaryData)
      setCategoryBoard(categoryData)
      setMemberBoard(memberData)
      setMonthlySummary(monthlyData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      // ถ้าได้ 401 ให้ redirect ไป login
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading])

  // แสดง loading ถ้ายังเช็ค auth ไม่เสร็จ
  if (authLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    )
  }

  // ไม่แสดงอะไรถ้ายังไม่ได้ login (จะ redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="ยอดรวมรับ"
                amount={summary.totalIncome}
                type="income"
              />
              <SummaryCard
                title="ยอดรวมจ่าย"
                amount={summary.totalExpense}
                type="expense"
              />
              <SummaryCard
                title="ยอดสุทธิ"
                amount={summary.balance}
                type="balance"
              />
            </div>
          )}

          {/* Monthly Summary Charts */}
          {monthlySummary.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-4 md:mb-6">รายงานรายรับ-รายจ่าย-รวม ตามรายเดือน</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="text-sm md:text-lg font-medium mb-3 md:mb-4 text-center">กราฟแท่ง + เส้น</h3>
                  <MonthlyChart data={monthlySummary} chartType="composed" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-medium mb-3 md:mb-4 text-center">กราฟเส้น</h3>
                  <MonthlyChart data={monthlySummary} chartType="line" />
                </div>
              </div>
            </div>
          )}

          {/* Category Board with Charts */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
            <h2 className="text-base md:text-xl font-semibold mb-4 md:mb-6">รายงานตามหมวดหมู่</h2>
            {categoryBoard.length === 0 ? (
              <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">ไม่มีข้อมูลหมวดหมู่</p>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Bar Chart */}
                  <div>
                    <h3 className="text-sm md:text-lg font-medium mb-3 md:mb-4 text-center">กราฟแท่ง</h3>
                    <CategoryBarChart data={categoryBoard} />
                  </div>

                  {/* Line Chart */}
                  <div>
                    <h3 className="text-sm md:text-lg font-medium mb-3 md:mb-4 text-center">กราฟเส้น</h3>
                    <CategoryLineChart data={categoryBoard} />
                  </div>
                </div>

                {/* Table Section */}
                <div>
                  <h3 className="text-sm md:text-lg font-medium mb-3 md:mb-4">ตารางสรุป</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                            หมวดหมู่
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ประเภท
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                            จำนวนเงิน
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                            จำนวนรายการ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categoryBoard.map((item) => (
                          <tr key={item.categoryId} className="hover:bg-gray-50">
                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                              {item.categoryName}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <span className={`px-1.5 md:px-2 inline-flex text-[10px] md:text-xs leading-5 font-semibold rounded-full ${
                                item.categoryType === 'INCOME' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.categoryType === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
                              </span>
                            </td>
                            <td className={`px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-right font-semibold ${
                              item.categoryType === 'INCOME' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.categoryType === 'INCOME' ? '+' : '-'}฿{item.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-right text-gray-500">
                              {item.transactionCount} รายการ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Member Board */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
            <h2 className="text-base md:text-xl font-semibold mb-3 md:mb-4">รายงานตามผู้บันทึก</h2>
            {memberBoard.length === 0 ? (
              <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">ไม่มีข้อมูลผู้บันทึก</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้บันทึก
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รายรับ
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รายจ่าย
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ยอดสุทธิ
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวนรายการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {memberBoard.map((item) => (
                      <tr key={item.memberId} className="hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                          {item.memberName}
                        </td>
                        <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-right text-green-600 font-semibold">
                          +฿{item.totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-right text-red-600 font-semibold">
                          -฿{item.totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-right font-semibold ${
                          item.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.balance >= 0 ? '+' : ''}฿{item.balance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-right text-gray-500">
                          {item.transactionCount} รายการ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

