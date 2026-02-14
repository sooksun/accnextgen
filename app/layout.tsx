import type { Metadata } from "next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ToastContainer } from "react-toastify";
import { Sidebar } from "@/components/Sidebar";
import { ConfirmProvider } from "@/components/ConfirmDialog";

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
        <AntdRegistry>
          <ConfirmProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 bg-slate-50">
                <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
              </main>
            </div>
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </ConfirmProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
