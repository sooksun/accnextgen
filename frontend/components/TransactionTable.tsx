'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/api'
import { formatThaiDate } from '@/lib/date-utils'
import { showConfirmPromise, showSuccess, showError } from '@/lib/toast'
import { apiClient } from '@/lib/api'
import EditTransactionModal from './EditTransactionModal'

interface TransactionTableProps {
  transactions: Transaction[]
  onRefresh?: () => void
}

export default function TransactionTable({ transactions, onRefresh }: TransactionTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = await showConfirmPromise(
      `คุณต้องการลบรายการ "${transaction.description || 'ไม่มีคำอธิบาย'}" จำนวน ${transaction.type === 'INCOME' ? '+' : '-'}฿${transaction.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ใช่หรือไม่?`
    )

    if (!confirmed) return

    setDeletingId(transaction.id)
    try {
      await apiClient.transactions.delete(transaction.id)
      showSuccess('ลบรายการสำเร็จ')
      onRefresh?.()
    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการลบ กรุณาลองอีกครั้ง'
      showError(errorMsg)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditSuccess = () => {
    onRefresh?.()
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return formatThaiDate(dateString, 'DD MMM BBBB') // แสดงเป็น พ.ศ.
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        ไม่พบรายการ
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
              วันที่
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ประเภท
            </th>
            <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
              หมวดหมู่
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              คำอธิบาย
            </th>
            <th className="px-2 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
              จำนวนเงิน
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ผู้บันทึก
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              การจัดการ
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((txn) => (
            <tr 
              key={txn.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleEdit(txn)}
            >
              <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                {formatDate(txn.txnDate)}
              </td>
              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    txn.type === 'INCOME'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {txn.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
                </span>
              </td>
              <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                {txn.category.name}
              </td>
              <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-900">
                {txn.description || '-'}
              </td>
              <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-right">
                <span
                  className={
                    txn.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {txn.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(txn.amount)}
                </span>
              </td>
              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {txn.member.name}
              </td>
              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(txn)
                    }}
                    className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded transition-colors"
                    title="แก้ไข"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(txn)
                    }}
                    disabled={deletingId === txn.id}
                    className="text-red-600 hover:text-red-900 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="ลบ"
                  >
                    {deletingId === txn.id ? 'กำลังลบ...' : 'ลบ'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isEditModalOpen && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTransaction(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

