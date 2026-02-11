import axios from 'axios'
import { getAuthToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8892'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// เพิ่ม interceptor เพื่อส่ง token ไปกับทุก request
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// เพิ่ม interceptor สำหรับจัดการ error response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ถ้าได้ 401 ให้ลบ token ที่ invalid
    // Component จะจัดการ redirect เอง
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        // Trigger custom event เพื่อให้ AuthContext รู้ว่าต้อง logout
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'FINANCE' | 'TEACHER' | 'STAFF' | 'AUDITOR'
  createdAt?: string
  updatedAt?: string
}

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface TransactionCategory {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  description?: string
}

export interface Transaction {
  id: string
  txnDate: string
  amount: number
  description?: string
  type: 'INCOME' | 'EXPENSE'
  source: 'MANUAL' | 'SLIP_OCR'
  academicYear: AcademicYear
  category: TransactionCategory
  member: User
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  fileName: string
  filePath: string
  mimeType: string
  fileSize: number
}

export interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  count: number
}

export interface CategoryBoardItem {
  categoryId: string
  categoryName: string
  categoryType: 'INCOME' | 'EXPENSE'
  totalAmount: number
  transactionCount: number
}

export interface MemberBoardItem {
  memberId: string
  memberName: string
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

export interface MonthlySummaryItem {
  month: string // "YYYY-MM"
  monthLabel: string // "มกราคม 2568"
  totalIncome: number
  totalExpense: number
  balance: number
}

// API Functions
export const apiClient = {
  // Users
  users: {
    getAll: () => api.get<User[]>('/users').then((res) => res.data),
    getById: (id: string) => api.get<User>(`/users/${id}`).then((res) => res.data),
    create: (data: { name: string; email: string; role?: string }) => {
      return api.post<User>('/users', data).then((res) => res.data)
    },
    update: (id: string, data: { name?: string; email?: string; role?: string }) => {
      return api.patch<User>(`/users/${id}`, data).then((res) => res.data)
    },
    changePassword: (id: string, password: string) => {
      return api.patch<{ message: string }>(`/users/${id}/password`, { password }).then((res) => res.data)
    },
    delete: (id: string) => {
      return api.delete(`/users/${id}`).then((res) => res.data)
    },
  },

  // Academic Years
  academicYears: {
    getAll: () => api.get<AcademicYear[]>('/academic-years').then((res) => res.data),
    getActive: () => api.get<AcademicYear>('/academic-years/active').then((res) => res.data),
    getById: (id: string) => api.get<AcademicYear>(`/academic-years/${id}`).then((res) => res.data),
  },

  // Categories
  categories: {
    getAll: (type?: 'INCOME' | 'EXPENSE') => {
      const url = type ? `/categories?type=${type}` : '/categories'
      return api.get<TransactionCategory[]>(url).then((res) => res.data)
    },
    getById: (id: string) => api.get<TransactionCategory>(`/categories/${id}`).then((res) => res.data),
    create: (data: { name: string; type: 'INCOME' | 'EXPENSE'; description?: string }) => {
      return api.post<TransactionCategory>('/categories', data).then((res) => res.data)
    },
    update: (id: string, data: { name?: string; type?: 'INCOME' | 'EXPENSE'; description?: string }) => {
      return api.patch<TransactionCategory>(`/categories/${id}`, data).then((res) => res.data)
    },
    delete: (id: string) => {
      return api.delete(`/categories/${id}`).then((res) => res.data)
    },
  },

  // Transactions
  transactions: {
    getAll: (params?: {
      from?: string
      to?: string
      academicYearId?: string
      categoryId?: string
      memberId?: string
      type?: 'INCOME' | 'EXPENSE'
      page?: number
      limit?: number
    }) => {
      return api
        .get<{ data: Transaction[]; pagination: any }>('/transactions', { params })
        .then((res) => res.data)
    },
    getSummary: (params?: {
      from?: string
      to?: string
      academicYearId?: string
    }) => {
      return api.get<TransactionSummary>('/transactions/summary', { params }).then((res) => res.data)
    },
    getMonthlySummary: (params?: {
      from?: string
      to?: string
      academicYearId?: string
    }) => {
      return api.get<MonthlySummaryItem[]>('/transactions/summary/monthly', { params }).then((res) => res.data)
    },
    create: async (data: {
      txnDate: string
      amount: number
      description?: string
      type: 'INCOME' | 'EXPENSE'
      academicYearId: string
      categoryId: string
      memberId: string
      file?: File
    }) => {
      if (data.file) {
        // ถ้ามีไฟล์ ใช้ endpoint /transactions/with-attachment
        const formData = new FormData()
        formData.append('txnDate', data.txnDate)
        formData.append('amount', data.amount.toString())
        if (data.description) formData.append('description', data.description)
        formData.append('type', data.type)
        formData.append('academicYearId', data.academicYearId)
        formData.append('categoryId', data.categoryId)
        formData.append('memberId', data.memberId)
        formData.append('file', data.file)
        
        return api.post<Transaction>('/transactions/with-attachment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data)
      } else {
        // ถ้าไม่มีไฟล์ ใช้ JSON endpoint ปกติ
        const { file, ...jsonData } = data
        return api.post<Transaction>('/transactions', jsonData).then((res) => res.data)
      }
    },
    parseSlip: async (file: File, memberId: string, academicYearId?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('memberId', memberId)
      if (academicYearId) {
        formData.append('academicYearId', academicYearId)
      }
      return api
        .post<{
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
        }>('/transactions/from-slip', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => res.data)
    },
    createFromSlip: async (data: {
      slipData: {
        type: 'INCOME' | 'EXPENSE'
        description: string
        amount: number
        date: string
      }
      memberId: string
      academicYearId: string
      categoryId: string
      fileName?: string
      fileBase64?: string
      mimeType?: string
    }) => {
      return api.post<Transaction>('/transactions/from-slip/create', data).then((res) => res.data)
    },
    getBoardByCategory: (params?: {
      from?: string
      to?: string
      academicYearId?: string
    }) => {
      return api
        .get<CategoryBoardItem[]>('/transactions/board/category', { params })
        .then((res) => res.data)
    },
    getBoardByMember: (params?: {
      from?: string
      to?: string
      academicYearId?: string
    }) => {
      return api.get<MemberBoardItem[]>('/transactions/board/member', { params }).then((res) => res.data)
    },
    getById: (id: string) => {
      return api.get<Transaction>(`/transactions/${id}`).then((res) => res.data)
    },
    update: async (id: string, data: {
      txnDate?: string
      amount?: number
      description?: string
      type?: 'INCOME' | 'EXPENSE'
      academicYearId?: string
      categoryId?: string
      file?: File
      shouldDeleteAttachment?: boolean
    }) => {
      if (data.file || data.shouldDeleteAttachment) {
        // ถ้ามีไฟล์หรือต้องการลบ attachment ใช้ endpoint พร้อม attachment
        const formData = new FormData()
        if (data.txnDate) formData.append('txnDate', data.txnDate)
        if (data.amount !== undefined) formData.append('amount', data.amount.toString())
        if (data.description !== undefined) formData.append('description', data.description || '')
        if (data.type) formData.append('type', data.type)
        if (data.academicYearId) formData.append('academicYearId', data.academicYearId)
        if (data.categoryId) formData.append('categoryId', data.categoryId)
        if (data.shouldDeleteAttachment) formData.append('shouldDeleteAttachment', 'true')
        if (data.file) formData.append('file', data.file)
        
        return api.patch<Transaction>(`/transactions/${id}/with-attachment`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data)
      } else {
        // ถ้าไม่มีไฟล์ ใช้ JSON endpoint ปกติ
        const { file, shouldDeleteAttachment, ...jsonData } = data
        return api.patch<Transaction>(`/transactions/${id}`, jsonData).then((res) => res.data)
      }
    },
    delete: (id: string) => {
      return api.delete(`/transactions/${id}`).then((res) => res.data)
    },
  },
  attachments: {
    checkDuplicate: async (fileBase64: string, fileName?: string, fileSize?: number) => {
      return api
        .post<{
          isDuplicate: boolean
          message: string
          existingAttachment?: {
            id: string
            fileName: string
            uploadedAt: string
            transaction: {
              id: string
              description: string
              amount: number
              txnDate: string
              member: {
                name: string
              }
              category: {
                name: string
              }
              academicYear: {
                name: string
              }
            }
            uploader: {
              name: string
            }
          }
        }>('/attachments/check-duplicate', {
          fileBase64,
          fileName,
          fileSize,
        })
        .then((res) => res.data)
    },
  },
}

export default apiClient

