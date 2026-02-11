'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, User, TransactionCategory } from '@/lib/api'
import { authApi } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, showWarning, showConfirmPromise } from '@/lib/toast'

type UserRole = 'ADMIN' | 'FINANCE' | 'TEACHER' | 'STAFF' | 'AUDITOR'

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'ผู้บริหาร',
  FINANCE: 'การเงิน/พัสดุ',
  TEACHER: 'ครู',
  STAFF: 'เจ้าหน้าที่',
  AUDITOR: 'ตรวจสอบ',
}

export default function SettingsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF' as UserRole,
  })
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    description: '',
  })
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers()
      loadCategories()
    }
  }, [isAuthenticated])

  const loadUsers = async () => {
    try {
      const data = await apiClient.users.getAll()
      setUsers(data)
    } catch (error: any) {
      console.error('Error loading users:', error)
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (!formData.password || formData.password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        return
      }

      // ใช้ register endpoint เพราะต้องมี password
      await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      setShowAddModal(false)
      resetForm()
      showSuccess('เพิ่มผู้ใช้สำเร็จ')
      loadUsers()
    } catch (error: any) {
      const errorMsg = error.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้'
      setError(errorMsg)
      showError(errorMsg)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!editingUser) return

    try {
      // Update user ข้อมูลพื้นฐาน
      await apiClient.users.update(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      })

      // ถ้ามี password ใหม่และมีความยาวมากกว่า 0 ให้เปลี่ยนรหัสผ่าน
      if (formData.password && formData.password.trim().length > 0) {
        if (formData.password.length < 6) {
          setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
          showWarning('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
          return
        }
        await apiClient.users.changePassword(editingUser.id, formData.password)
      }

      setEditingUser(null)
      resetForm()
      
      // แสดง toast ตามที่ทำ
      if (formData.password && formData.password.trim().length > 0) {
        showSuccess('แก้ไขข้อมูลและเปลี่ยนรหัสผ่านสำเร็จ')
      } else {
        showSuccess('แก้ไขข้อมูลผู้ใช้สำเร็จ')
      }
      
      loadUsers()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้'
      setError(errorMsg)
      showError(errorMsg)
    }
  }

  const handleDeleteUser = async (id: string) => {
    const confirmed = await showConfirmPromise('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?')
    if (!confirmed) {
      return
    }

    try {
      await apiClient.users.delete(id)
      showSuccess('ลบผู้ใช้สำเร็จ')
      await loadUsers()
    } catch (error: any) {
      const errorMsg = error.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้'
      showError(errorMsg)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'STAFF',
    })
    setError('')
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // ไม่แสดง password
      role: user.role,
    })
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingUser(null)
    resetForm()
  }

  // Categories functions
  const loadCategories = async () => {
    setCategoriesLoading(true)
    try {
      const data = await apiClient.categories.getAll()
      console.log('Loaded categories:', data) // Debug log
      setCategories(data || [])
    } catch (error: any) {
      console.error('Error loading categories:', error)
      setCategories([])
      if (error.response?.status === 401) {
        router.push('/login')
      } else {
        showError('เกิดข้อผิดพลาดในการโหลดหมวดหมู่')
      }
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError('')

    try {
      await apiClient.categories.create({
        name: categoryFormData.name,
        type: categoryFormData.type,
        description: categoryFormData.description || undefined,
      })

      setShowAddCategoryModal(false)
      resetCategoryForm()
      showSuccess('เพิ่มหมวดหมู่สำเร็จ')
      loadCategories()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่'
      setCategoryError(errorMsg)
      showError(errorMsg)
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError('')

    if (!editingCategory) return

    try {
      await apiClient.categories.update(editingCategory.id, {
        name: categoryFormData.name,
        type: categoryFormData.type,
        description: categoryFormData.description || undefined,
      })

      setEditingCategory(null)
      resetCategoryForm()
      showSuccess('แก้ไขหมวดหมู่สำเร็จ')
      loadCategories()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่'
      setCategoryError(errorMsg)
      showError(errorMsg)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const confirmed = await showConfirmPromise('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?')
    if (!confirmed) {
      return
    }

    try {
      await apiClient.categories.delete(id)
      showSuccess('ลบหมวดหมู่สำเร็จ')
      await loadCategories()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่'
      showError(errorMsg)
    }
  }

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      type: 'EXPENSE',
      description: '',
    })
    setCategoryError('')
  }

  const openEditCategoryModal = (category: TransactionCategory) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      type: category.type,
      description: category.description || '',
    })
  }

  const closeCategoryModal = () => {
    setShowAddCategoryModal(false)
    setEditingCategory(null)
    resetCategoryForm()
  }

  if (authLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่า</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + เพิ่มผู้ใช้
        </button>
      </div>

      {/* API Documentation Link */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>📚</span>
              <span>API Documentation</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              เอกสาร API สำหรับทดสอบและดูรายละเอียด endpoints ทั้งหมด
            </p>
          </div>
          <a
            href="http://localhost:8892/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <span>เปิด API Docs</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">จัดการผู้ใช้</h2>

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
                    ชื่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สร้างเมื่อ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </h2>

            <form onSubmit={editingUser ? handleEditUser : handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={!!editingUser}
                  />
                  {editingUser && (
                    <p className="mt-1 text-xs text-gray-500">ไม่สามารถเปลี่ยนอีเมลได้</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    minLength={editingUser ? 0 : 6}
                    placeholder={editingUser ? 'กรอกถ้าต้องการเปลี่ยนรหัสผ่าน' : 'รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)'}
                  />
                  {editingUser && formData.password && formData.password.length > 0 && formData.password.length < 6 && (
                    <p className="mt-1 text-xs text-red-600">
                      รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    บทบาท *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">จัดการหมวดหมู่</h2>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + เพิ่มหมวดหมู่
          </button>
        </div>

        {categoriesLoading ? (
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
                    ชื่อหมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คำอธิบาย
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <p>ยังไม่มีหมวดหมู่</p>
                      <p className="text-sm mt-1">คลิกปุ่ม "+ เพิ่มหมวดหมู่" เพื่อเพิ่มหมวดหมู่ใหม่</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          category.type === 'INCOME' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditCategoryModal(category)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {(showAddCategoryModal || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
            </h2>

            <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อหมวดหมู่ *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="เช่น ค่าอาหารกลางวัน"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภท *
                  </label>
                  <select
                    required
                    value={categoryFormData.type}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="INCOME">รายรับ</option>
                    <option value="EXPENSE">รายจ่าย</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                  />
                </div>
              </div>

              {categoryError && (
                <div className="mt-4 rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{categoryError}</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
                </button>
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
