'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, AcademicYear, TransactionCategory } from '@/lib/api'
import ThaiDatePicker from '@/components/ThaiDatePicker'
import { showSuccess, showError } from '@/lib/toast'

export default function NewTransactionPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  
  const [formData, setFormData] = useState({
    txnDate: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    academicYearId: '',
    categoryId: '',
    memberId: user?.id || '',
    amount: '',
    description: '',
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    // เมื่อเปลี่ยน type ให้ load categories ใหม่
    loadCategories()
  }, [formData.type])

  // อัปเดต memberId เมื่อ user เปลี่ยน
  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, memberId: user.id }))
    }
  }, [user])

  // Redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [years, activeYear] = await Promise.all([
        apiClient.academicYears.getAll(),
        apiClient.academicYears.getActive(),
      ])
      
      setAcademicYears(years)
      
      if (activeYear) {
        setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await apiClient.categories.getAll(formData.type)
      setCategories(cats)
      if (cats.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0].id }))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await apiClient.transactions.create({
        ...formData,
        amount: parseFloat(formData.amount),
      })
      
      showSuccess('บันทึกรายการสำเร็จ')
      router.push('/transactions')
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองอีกครั้ง'
      showError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">บันทึกรายการใหม่</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่ *
            </label>
            <div className="date-picker-wrapper">
              <ThaiDatePicker
                value={formData.txnDate}
                onChange={(value) => setFormData({ ...formData, txnDate: value })}
                placeholder="เลือกวันที่"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="INCOME">รายรับ</option>
              <option value="EXPENSE">รายจ่าย</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ปีการศึกษา *
            </label>
            <select
              required
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">เลือกปีการศึกษา</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หมวดหมู่ *
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวนเงิน (บาท) *
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ผู้บันทึก *
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md cursor-not-allowed"
            />
            <input type="hidden" value={formData.memberId} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              คำอธิบาย
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="อธิบายรายการเพิ่มเติม (ถ้ามี)"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}

