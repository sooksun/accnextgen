import { toast, ToastOptions } from 'react-toastify'

interface ConfirmOptions {
  message: string
  onConfirm: () => void
  onCancel?: () => void
}

/**
 * แสดง toast สำหรับ success message
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  })
}

/**
 * แสดง toast สำหรับ error message
 */
export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  })
}

/**
 * แสดง toast สำหรับ warning message
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  })
}

/**
 * แสดง toast สำหรับ info message
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  })
}

/**
 * แสดง confirmation dialog ด้วย toast (ใช้ custom confirm)
 * ใช้ browser confirm() แทน (เพราะ react-toastify ไม่มี confirm dialog)
 * แต่แสดง toast ตามผลลัพธ์
 */
export const showConfirm = ({ message, onConfirm, onCancel }: ConfirmOptions) => {
  const confirmed = window.confirm(message)
  if (confirmed) {
    onConfirm()
    showInfo('ดำเนินการสำเร็จ')
  } else {
    onCancel?.()
    showInfo('ยกเลิกการดำเนินการ')
  }
}

// Global state สำหรับ confirmation dialog (จะถูก set จาก ConfirmDialogProvider)
let globalConfirmState: {
  isOpen: boolean
  message: string
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
} = {
  isOpen: false,
  message: '',
  onConfirm: null,
  onCancel: null,
}

let globalSetConfirmState: ((state: any) => void) | null = null

export const setGlobalConfirmState = (setState: (state: any) => void) => {
  globalSetConfirmState = setState
}

/**
 * Promise-based confirmation ที่แสดง custom dialog
 * ใช้ React component ผ่าน ConfirmDialogProvider
 */
export const showConfirmPromise = (message: string): Promise<boolean> => {
  if (!globalSetConfirmState) {
    // Fallback to browser confirm if provider not initialized
    const confirmed = window.confirm(message)
    if (!confirmed) {
      showInfo('ยกเลิกการดำเนินการ')
    }
    return Promise.resolve(confirmed)
  }

  return new Promise((resolve) => {
    const newState = {
      isOpen: true,
      message,
      onConfirm: () => {
        globalSetConfirmState!({ isOpen: false, message: '', onConfirm: null, onCancel: null })
        globalConfirmState = { isOpen: false, message: '', onConfirm: null, onCancel: null }
        resolve(true)
      },
      onCancel: () => {
        globalSetConfirmState!({ isOpen: false, message: '', onConfirm: null, onCancel: null })
        globalConfirmState = { isOpen: false, message: '', onConfirm: null, onCancel: null }
        showInfo('ยกเลิกการดำเนินการ')
        resolve(false)
      },
    }
    globalSetConfirmState!(newState)
    globalConfirmState = newState
  })
}

