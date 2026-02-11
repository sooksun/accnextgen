'use client'

import { useState, useEffect, useCallback } from 'react'
import { setGlobalConfirmState } from '@/lib/toast'

export interface ConfirmState {
  isOpen: boolean
  message: string
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
  })

  // ตั้งค่า global setState เมื่อ component mount
  useEffect(() => {
    setGlobalConfirmState(setState)
    return () => {
      setGlobalConfirmState(() => {}) // Cleanup
    }
  }, [])

  return { state }
}

