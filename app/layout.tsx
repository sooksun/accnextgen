import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AccNextGen - ระบบบัญชีมินิมัล",
  description:
    "ระบบบัญชีมินิมัล สำหรับ หจก. - VAT 7% + WHT + PDF Export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 bg-slate-50">
            <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
