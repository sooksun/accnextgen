'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, AcademicYear, TransactionCategory } from '@/lib/api'
import ThaiDatePicker from '@/components/ThaiDatePicker'
import { showSuccess, showError, showWarning } from '@/lib/toast'

export default function ConfirmSlipPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])

  // ข้อมูลจาก URL params (ถูก encode เป็น base64)
  const [slipData, setSlipData] = useState<{
    slipData: {
      type: 'INCOME' | 'EXPENSE'
      description: string
      amount: number
      date: string
    }
    memberId: string
    academicYearId: string
    categoryId: string | null
    fileName: string
    fileSize: number
    mimeType: string
    fileBuffer: string
  } | null>(null)

  const [formData, setFormData] = useState({
    txnDate: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    academicYearId: '',
    categoryId: '',
    memberId: user?.id || '',
    amount: '',
    description: '',
  })

  useEffect(() => {
    // อ่านข้อมูลจาก sessionStorage แทน query string เพื่อหลีกเลี่ยง HTTP 431
    const storageKey = 'slip-upload-data'
    const storedData = sessionStorage.getItem(storageKey)
    
    if (storedData) {
      try {
        const decoded = JSON.parse(storedData)
        setSlipData(decoded)
        setFormData({
          txnDate: decoded.slipData.date,
          type: decoded.slipData.type,
          academicYearId: decoded.academicYearId,
          categoryId: decoded.categoryId || '',
          memberId: decoded.memberId,
          amount: decoded.slipData.amount.toString(),
          description: decoded.slipData.description,
        })
        // ลบข้อมูลออกจาก sessionStorage หลังจากอ่านแล้ว (ป้องกันข้อมูลค้าง)
        // จะ clear ทีหลังเมื่อ submit สำเร็จหรือ cancel
      } catch (error) {
        console.error('Error parsing slip data:', error)
        showError('ไม่สามารถโหลดข้อมูลได้')
        sessionStorage.removeItem(storageKey)
        router.push('/transactions/upload-slip')
      }
    } else {
      // ถ้าไม่มีข้อมูลใน sessionStorage แสดงว่าไม่ได้มาจากหน้า upload
      showWarning('ไม่พบข้อมูลการอัปโหลด กรุณาอัปโหลดสลิปใหม่')
      router.push('/transactions/upload-slip')
    }
  }, [router])

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (formData.type) {
      loadCategories()
    }
  }, [formData.type])

  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, memberId: user.id }))
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const years = await apiClient.academicYears.getAll()
      setAcademicYears(years)
    } catch (error) {
      console.error('Error loading data:', error)
      showError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await apiClient.categories.getAll(formData.type)
      setCategories(cats)
      // ถ้า categoryId เดิมไม่ตรงกับ type ใหม่ ให้เลือก category แรก
      if (cats.length > 0) {
        const currentCat = cats.find((cat) => cat.id === formData.categoryId)
        if (!currentCat) {
          setFormData((prev) => ({ ...prev, categoryId: cats[0].id }))
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slipData) return

    setSubmitting(true)

    try {
      // ตรวจสอบว่าไฟล์นี้มีการอัปโหลดเข้ามาแล้วหรือยัง
      if (slipData.fileBuffer) {
        const duplicateCheck = await apiClient.attachments.checkDuplicate(
          slipData.fileBuffer,
          slipData.fileName,
          slipData.fileSize
        )

        if (duplicateCheck.isDuplicate && duplicateCheck.existingAttachment) {
          const existing = duplicateCheck.existingAttachment
          const txnDate = new Date(existing.transaction.txnDate).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          
          showError(
            `ไฟล์นี้มีการอัปโหลดเข้ามาในระบบแล้ว\n\n` +
            `รายการเดิม:\n` +
            `- วันที่: ${txnDate}\n` +
            `- รายการ: ${existing.transaction.description}\n` +
            `- จำนวนเงิน: ${Number(existing.transaction.amount).toLocaleString()} บาท\n` +
            `- หมวดหมู่: ${existing.transaction.category.name}\n` +
            `- ผู้บันทึก: ${existing.transaction.member.name}\n` +
            `- อัปโหลดเมื่อ: ${new Date(existing.uploadedAt).toLocaleString('th-TH')}`
          )
          setSubmitting(false)
          return
        }
      }

      // ถ้าไม่ซ้ำ ให้บันทึกข้อมูล
      await apiClient.transactions.createFromSlip({
        slipData: {
          type: formData.type,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.txnDate,
        },
        memberId: formData.memberId,
        academicYearId: formData.academicYearId,
        categoryId: formData.categoryId,
        fileName: slipData.fileName,
        fileBase64: slipData.fileBuffer,
        mimeType: slipData.mimeType,
      })

      // ลบข้อมูลออกจาก sessionStorage หลังจากบันทึกสำเร็จ
      sessionStorage.removeItem('slip-upload-data')
      
      showSuccess('บันทึกข้อมูลสำเร็จ!')
      router.push('/transactions')
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองอีกครั้ง'
      showError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!slipData) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  const imagePreview = slipData.mimeType.startsWith('image/')
    ? `data:${slipData.mimeType};base64,${slipData.fileBuffer}`
    : null

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">สรุปผลการอ่านสลิป</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ภาพสลิป */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ภาพสลิป/ใบเสร็จ</h2>
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Slip preview"
              className="w-full h-auto rounded-lg border border-gray-300"
            />
          ) : (
            <div className="p-8 text-center text-gray-500 border border-gray-300 rounded-lg">
              <p>ไม่สามารถแสดงภาพได้</p>
              <p className="text-sm mt-2">ไฟล์: {slipData.fileName}</p>
            </div>
          )}
        </div>

        {/* ฟอร์มแก้ไขข้อมูล */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลที่อ่านได้</h2>
          <p className="text-sm text-gray-600 mb-4">
            ตรวจสอบและแก้ไขข้อมูลตามความจำเป็น
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="อธิบายรายการเพิ่มเติม (ถ้ามี)"
                  disabled={submitting}
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

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // ลบข้อมูลออกจาก sessionStorage เมื่อยกเลิก
                    sessionStorage.removeItem('slip-upload-data')
                    router.push('/transactions/upload-slip')
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

