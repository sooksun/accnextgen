'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, Transaction, TransactionSummary } from '@/lib/api'
import TransactionTable from '@/components/TransactionTable'
import FilterBar from '@/components/FilterBar'
import SummaryCard from '@/components/SummaryCard'
import NewTransactionModal from '@/components/NewTransactionModal'
import UploadSlipModal from '@/components/UploadSlipModal'

export default function TransactionsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    from?: string
    to?: string
    academicYearId?: string
    categoryId?: string
  }>({})
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [showUploadSlipModal, setShowUploadSlipModal] = useState(false)

  // Redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  const loadTransactions = async () => {
    if (!isAuthenticated) return // ไม่เรียก API ถ้ายังไม่ได้ login
    
    setLoading(true)
    try {
      const [transactionsData, summaryData] = await Promise.all([
        apiClient.transactions.getAll({ ...filters, limit: 50 }),
        apiClient.transactions.getSummary(filters),
      ])
      setTransactions(transactionsData.data)
      setSummary(summaryData)
    } catch (error: any) {
      console.error('Error loading transactions:', error)
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
      loadTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isAuthenticated, authLoading])

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
        <h1 className="hidden md:block text-3xl font-bold text-gray-900">รายการรายรับ-รายจ่าย</h1>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowNewTransactionModal(true)}
            className="px-2 md:px-4 py-1.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs md:text-base whitespace-nowrap"
          >
            + บันทึกรายการใหม่
          </button>
          <button
            onClick={() => setShowUploadSlipModal(true)}
            className="px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-base whitespace-nowrap"
          >
            📄 อัปโหลดสลิป
          </button>
        </div>
      </div>

      {/* แสดงยอดเงินรวม */}
      {summary && !loading && (
        <>
          {/* Mobile: แสดงเฉพาะยอดคงเหลือ */}
          <div className="md:hidden">
            <SummaryCard
              title="ยอดคงเหลือ"
              amount={summary.balance}
              type="balance"
            />
          </div>
          {/* Desktop: แสดงครบทั้ง 3 cards */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
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
              title="ยอดคงเหลือ"
              amount={summary.balance}
              type="balance"
            />
          </div>
        </>
      )}

      <div className="hidden md:block">
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <TransactionTable transactions={transactions} onRefresh={loadTransactions} />
        )}
      </div>

      {/* Modals */}
      <NewTransactionModal
        isOpen={showNewTransactionModal}
        onClose={() => setShowNewTransactionModal(false)}
        onSuccess={loadTransactions}
      />
      <UploadSlipModal
        isOpen={showUploadSlipModal}
        onClose={() => setShowUploadSlipModal(false)}
      />
    </div>
  )
}

