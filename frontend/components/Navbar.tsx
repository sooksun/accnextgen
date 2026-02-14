'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()

  const navItems = [
    { href: '/', label: 'แดชบอร์ด' },
    { href: '/transactions', label: 'รายการ' },
    { href: '/board/category', label: 'บอร์ดหมวดหมู่', hideOnMobile: true },
    { href: '/board/member', label: 'บอร์ดผู้บันทึก', hideOnMobile: true },
    { href: '/settings', label: 'ตั้งค่า', hideOnMobile: true },
  ]

  return (
    <nav className="bg-gradient-to-r from-primary-700 to-secondary-700 text-white shadow-lg">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="text-sm md:text-xl font-bold hover:text-primary-200 truncate max-w-[120px] md:max-w-none">
            🏫 <span className="hidden sm:inline">ระบบการเงินโรงเรียน</span><span className="sm:hidden">การเงิน</span>
          </Link>
          <div className="flex items-center space-x-1 md:space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex space-x-0.5 md:space-x-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-1.5 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-base ${
                        item.hideOnMobile ? 'hidden md:inline-block' : ''
                      } ${
                        pathname === item.href
                          ? 'bg-white/20 font-semibold'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center space-x-1 md:space-x-3 border-l border-white/20 pl-1 md:pl-4">
                  <span className="text-xs md:text-sm truncate max-w-[60px] md:max-w-none">
                    <span className="hidden md:inline">{user?.name} ({user?.role})</span>
                    <span className="md:hidden">{user?.name}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-2 md:px-3 py-1 text-xs md:text-sm bg-white/10 hover:bg-white/20 rounded transition-colors whitespace-nowrap"
                  >
                    <span className="hidden md:inline">ออกจากระบบ</span>
                    <span className="md:hidden">ออก</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-1 md:space-x-2">
                <Link
                  href="/login"
                  className="px-2 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/10 transition-colors text-xs md:text-base"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-2 md:px-4 py-1.5 md:py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-xs md:text-base"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

