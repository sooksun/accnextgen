'use client'

import { useState, useEffect } from 'react'
import { apiClient, Transaction, AcademicYear, TransactionCategory } from '@/lib/api'
import ThaiDatePicker from '@/components/ThaiDatePicker'
import { showInfo, showError } from '@/lib/toast'

interface EditTransactionModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [existingAttachment, setExistingAttachment] = useState<any>(null)

  const [formData, setFormData] = useState({
    txnDate: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    academicYearId: '',
    categoryId: '',
    amount: '',
    description: '',
  })

  // โหลดข้อมูลเมื่อเปิด modal
  useEffect(() => {
    if (isOpen && transaction) {
      loadInitialData()
      setFormData({
        txnDate: transaction.txnDate,
        type: transaction.type,
        academicYearId: transaction.academicYear.id,
        categoryId: transaction.category.id,
        amount: transaction.amount.toString(),
        description: transaction.description || '',
      })
      
      // โหลด attachment เดิม (ถ้ามี)
      if (transaction.attachments && transaction.attachments.length > 0) {
        setExistingAttachment(transaction.attachments[0])
      } else {
        setExistingAttachment(null)
      }
      
      // Reset file selection
      setSelectedFile(null)
      setPreview(null)
    }
  }, [isOpen, transaction])

  // เมื่อเปลี่ยน type ให้ load categories ใหม่
  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [formData.type, isOpen])

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
      // ถ้า category เดิมไม่ตรงกับ type ใหม่ ให้เลือก category แรก
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setExistingAttachment(null) // ซ่อน attachment เดิมเมื่อเลือกไฟล์ใหม่
      
      // สร้าง preview สำหรับรูปภาพ
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    setSubmitting(true)

    try {
      // Logic การจัดการ attachment:
      // 1. ถ้ามี existingAttachment แต่ไม่มี selectedFile และผู้ใช้กดลบ existingAttachment (existingAttachment === null) = ต้องลบ attachment เดิม
      // 2. ถ้ามี selectedFile = จะแทนที่ attachment เดิม (ลบแล้วเพิ่มใหม่)
      // 3. ถ้าไม่มี existingAttachment และไม่มี selectedFile = ไม่ต้องทำอะไร
      
      const hasExistingAttachment = transaction.attachments && transaction.attachments.length > 0
      const shouldDeleteAttachment = (hasExistingAttachment && existingAttachment === null) || (hasExistingAttachment && selectedFile !== null)

      await apiClient.transactions.update(transaction.id, {
        txnDate: formData.txnDate,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        type: formData.type,
        academicYearId: formData.academicYearId,
        categoryId: formData.categoryId,
        file: selectedFile || undefined,
        shouldDeleteAttachment: shouldDeleteAttachment,
      })

      showInfo('บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating transaction:', error)
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองอีกครั้ง'
      showError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !transaction) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">แก้ไขข้อมูลรายการ</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              disabled={submitting}
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 h-[42px]"
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
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 h-[42px]"
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
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 h-[42px]"
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
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 h-[42px]"
                    placeholder="0.00"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ผู้บันทึก *
                  </label>
                  <input
                    type="text"
                    value={transaction.member.name}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md cursor-not-allowed h-[42px]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อัปโหลดไฟล์แนบ (รูปภาพ)
                  </label>
                  {existingAttachment && !selectedFile && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          {existingAttachment.mimeType?.startsWith('image/') && (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8892'}/attachments/${existingAttachment.id}`}
                              alt={existingAttachment.fileName}
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{existingAttachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {(existingAttachment.fileSize / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExistingAttachment(null)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={submitting}
                  />
                  {preview && (
                    <div className="mt-4 relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full h-auto rounded-lg border border-gray-300 max-h-48"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {selectedFile && !preview && (
                    <p className="mt-2 text-sm text-gray-600">
                      ไฟล์: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
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
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
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

