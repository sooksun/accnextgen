"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FolderKanban,
  FileText,
  Wallet,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "แดชบอร์ด",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "ลูกค้า",
    href: "/customers",
    icon: Users,
  },
  {
    label: "สินค้า/บริการ",
    href: "/products",
    icon: Package,
  },
  {
    label: "ออเดอร์",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    label: "โครงการ",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "เอกสาร",
    href: "/documents",
    icon: FileText,
  },
  {
    label: "การเงิน",
    href: "/finance",
    icon: Wallet,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-blue-400">AccNextGen</h1>
            <p className="text-xs text-slate-400">ระบบบัญชีมินิมัล</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-700 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">v2.0 - Minimal Accounting</p>
        </div>
      )}
    </aside>
  );
}
