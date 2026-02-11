'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, AcademicYear } from '@/lib/api'
import { showSuccess, showError, showWarning } from '@/lib/toast'

export default function UploadSlipPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null)
  
  const [formData, setFormData] = useState({
    memberId: user?.id || '',
    academicYearId: '',
  })
  
  const [slipResult, setSlipResult] = useState<any>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

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
      const [years, active] = await Promise.all([
        apiClient.academicYears.getAll(),
        apiClient.academicYears.getActive(),
      ])
      
      setAcademicYears(years)
      setActiveYear(active)
      
      if (active) {
        setFormData((prev) => ({ ...prev, academicYearId: active.id }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setSlipResult(null)
      
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

  const handleUpload = async () => {
    if (!selectedFile || !formData.memberId) {
      showWarning('กรุณาเลือกไฟล์และผู้บันทึก')
      return
    }

    setUploading(true)
    try {
      const result = await apiClient.transactions.parseSlip(
        selectedFile,
        formData.memberId,
        formData.academicYearId || undefined
      )
      
      // เก็บข้อมูลใน sessionStorage แทน query string เพื่อหลีกเลี่ยง HTTP 431
      const storageKey = 'slip-upload-data'
      sessionStorage.setItem(storageKey, JSON.stringify(result))
      
      showSuccess('อ่านสลิปสำเร็จ! กำลังนำไปหน้ายืนยันข้อมูล')
      
      // ไปยังหน้า confirm (ไม่ต้องส่งข้อมูลผ่าน URL)
      router.push('/transactions/upload-slip/confirm')
    } catch (error: any) {
      console.error('Error parsing slip:', error)
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอ่านสลิป'
      showError(errorMsg)
    } finally {
      setUploading(false)
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">อัปโหลดสลิป/ใบเสร็จ</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เลือกไฟล์ (รูปภาพหรือ PDF) *
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}
          {selectedFile && !preview && (
            <p className="mt-2 text-sm text-gray-600">
              ไฟล์: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ปีการศึกษา (ถ้าไม่ระบุจะใช้ปีการศึกษาปัจจุบัน)
          </label>
          <select
            value={formData.academicYearId}
            onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">ใช้ปีการศึกษาปัจจุบัน ({activeYear?.name || 'ไม่พบ'})</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 หมายเหตุ:</strong> ระบบจะใช้ AI Vision อ่านสลิปและสร้างรายการอัตโนมัติ
            หากข้อมูลที่อ่านได้ไม่ถูกต้อง คุณสามารถแก้ไขได้ภายหลัง
          </p>
        </div>


        <div className="flex space-x-4">
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !formData.memberId}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'กำลังอัปโหลดและประมวลผล...' : 'อัปโหลดและประมวลผล'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}

