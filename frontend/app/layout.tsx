import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import 'antd/dist/reset.css'
import AntdProvider from '@/components/AntdProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import ToastProvider from '@/components/ToastProvider'
import ConfirmDialogProvider from '@/components/ConfirmDialogProvider'
import ErrorBoundary from '@/components/ErrorBoundary'

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  variable: '--font-sarabun',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ระบบบันทึกรายรับ-รายจ่ายโรงเรียน',
  description: 'ระบบจัดการการเงินสำหรับโรงเรียน',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <AntdProvider>
            <AuthProvider>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
              <ToastProvider />
              <ConfirmDialogProvider />
            </AuthProvider>
          </AntdProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

