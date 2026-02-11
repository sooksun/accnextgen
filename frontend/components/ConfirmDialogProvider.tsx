'use client'

import { useConfirm } from '@/hooks/useConfirm'
import { useEffect } from 'react'

export default function ConfirmDialogProvider() {
  const { state } = useConfirm()

  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [state.isOpen])

  if (!state.isOpen || !state.message) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget && state.onCancel) {
          state.onCancel()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ยืนยันการดำเนินการ</h3>
        <p className="text-gray-700 mb-6">{state.message}</p>
        <div className="flex space-x-3 justify-end">
          <button
            onClick={state.onCancel || undefined}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={state.onConfirm || undefined}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  )
}

