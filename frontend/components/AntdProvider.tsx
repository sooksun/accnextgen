'use client'

import { ConfigProvider } from 'antd'
import thTHLocale from 'antd/locale/th_TH'
import type { ReactNode } from 'react'

interface AntdProviderProps {
  children: ReactNode
}

export default function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider locale={thTHLocale}>
      {children}
    </ConfigProvider>
  )
}

