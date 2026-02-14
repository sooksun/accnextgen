"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download, Lock, Unlock, CreditCard, Trash2, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { useConfirm } from "@/components/ConfirmDialog";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import { formatNumber, formatDateShort } from "@/src/lib/utils";

interface Expense {
  id: string;
  expenseDate: string;
  vendorName: string;
  category: string;
  description: string | null;
  hasVat: boolean;
  subTotal: string;
  vatAmount: string;
  grandTotal: string;
  paymentMethod: string;
  relatedOrderId?: string | null;
  relatedProjectId?: string | null;
}

interface Payment {
  id: string;
  receivedAt: string;
  method: string;
  amount: string;
  note: string | null;
  order: { code: string } | null;
  document: { number: string; type: string } | null;
}

interface ClosedMonth {
  id: string;
  year: number;
  month: number;
  closedAt: string;
  note: string | null;
}

interface OrderOption {
  id: string;
  code: string;
  customer?: { name: string };
}

interface ProjectOption {
  id: string;
  code: string;
  title: string;
}

interface DocumentOption {
  id: string;
  number: string;
  type: string;
}

const categoryLabels: Record<string, string> = {
  INVENTORY_PURCHASE: "ซื้อสินค้า",
  SHIPPING_OUT: "ค่าส่งของ",
  PLATFORM_FEE: "ค่าแพลตฟอร์ม",
  MARKETING: "การตลาด",
  SOFTWARE_CLOUD: "ซอฟต์แวร์/Cloud",
  SALARY_FREELANCE: "เงินเดือน/จ้างงาน",
  TRAVEL_COMM: "เดินทาง/สื่อสาร",
  OFFICE_SUPPLIES: "อุปกรณ์สำนักงาน",
  OTHER: "อื่นๆ",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "โอนเงิน",
  CARD: "บัตร",
  OTHER: "อื่นๆ",
};

const docTypeLabels: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา",
  INVOICE: "ใบแจ้งหนี้",
  TAX_INVOICE_RECEIPT: "ใบกำกับภาษี/ใบเสร็จ",
};

const months = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [closedMonths, setClosedMonths] = useState<ClosedMonth[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const confirm = useConfirm();
  const [expenseForm, setExpenseForm] = useState({
    vendorName: "",
    category: "OTHER" as string,
    description: "",
    hasVat: false,
    subTotal: 0,
    vatRate: 7,
    vatAmount: 0,
    grandTotal: 0,
    paymentMethod: "TRANSFER" as string,
    expenseDate: todayISO(),
    relatedOrderId: "",
    relatedProjectId: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: "TRANSFER" as string,
    receivedAt: todayISO(),
    orderId: "",
    documentId: "",
    note: "",
  });

  useEffect(() => {
    fetchExpenses();
    fetchClosedMonths();
    fetchOrders();
    fetchProjects();
    fetchDocuments();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses?limit=50");
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments() {
    setPaymentsLoading(true);
    try {
      const res = await fetch("/api/payments?limit=50");
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function fetchClosedMonths() {
    try {
      const res = await fetch("/api/monthly-close");
      if (res.ok) setClosedMonths(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders?limit=100");
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects?limit=100");
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents?limit=100");
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function updateExpenseCalc(field: string, value: number | boolean) {
    const updated = { ...expenseForm, [field]: value };
    if (field === "subTotal" || field === "hasVat" || field === "vatRate") {
      const sub = field === "subTotal" ? Number(value) : updated.subTotal;
      const hasVat = field === "hasVat" ? Boolean(value) : updated.hasVat;
      const rate = field === "vatRate" ? Number(value) : updated.vatRate;
      updated.vatAmount = hasVat
        ? Math.round((sub * rate) / 100 * 100) / 100
        : 0;
      updated.grandTotal = Math.round((sub + updated.vatAmount) * 100) / 100;
      updated.subTotal = sub;
      updated.hasVat = hasVat;
      updated.vatRate = rate;
    }
    setExpenseForm(updated);
  }

  function resetExpenseForm() {
    setExpenseForm({
      vendorName: "",
      category: "OTHER",
      description: "",
      hasVat: false,
      subTotal: 0,
      vatRate: 7,
      vatAmount: 0,
      grandTotal: 0,
      paymentMethod: "TRANSFER",
      expenseDate: todayISO(),
      relatedOrderId: "",
      relatedProjectId: "",
    });
    setShowExpenseForm(false);
    setEditingExpenseId(null);
  }

  function startEditExpense(exp: Expense) {
    setExpenseForm({
      vendorName: exp.vendorName,
      category: exp.category,
      description: exp.description ?? "",
      hasVat: exp.hasVat,
      subTotal: Number(exp.subTotal),
      vatRate: 7,
      vatAmount: Number(exp.vatAmount),
      grandTotal: Number(exp.grandTotal),
      paymentMethod: exp.paymentMethod,
      expenseDate: exp.expenseDate.slice(0, 10),
      relatedOrderId: exp.relatedOrderId ?? "",
      relatedProjectId: exp.relatedProjectId ?? "",
    });
    setEditingExpenseId(exp.id);
    setShowExpenseForm(true);
  }

  async function handleSubmitExpense(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...expenseForm,
        expenseDate: expenseForm.expenseDate,
        relatedOrderId: expenseForm.relatedOrderId || undefined,
        relatedProjectId: expenseForm.relatedProjectId || undefined,
      };
      const url = "/api/expenses";
      const method = editingExpenseId ? "PUT" : "POST";
      const body = editingExpenseId ? { id: editingExpenseId, ...payload } : payload;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetExpenseForm();
        fetchExpenses();
        toast.success(editingExpenseId ? "บันทึกการแก้ไขรายจ่ายแล้ว" : "บันทึกรายจ่ายแล้ว");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถเชื่อมต่อได้");
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteExpenseId(null);
        fetchExpenses();
        toast.success("ลบรายจ่ายแล้ว");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "ไม่สามารถลบได้");
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถเชื่อมต่อได้");
    }
  }

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentForm.amount,
          method: paymentForm.method,
          receivedAt: paymentForm.receivedAt || undefined,
          orderId: paymentForm.orderId || undefined,
          documentId: paymentForm.documentId || undefined,
          note: paymentForm.note || undefined,
        }),
      });
      if (res.ok) {
        setShowPaymentForm(false);
        setPaymentForm({
          amount: 0,
          method: "TRANSFER",
          receivedAt: todayISO(),
          orderId: "",
          documentId: "",
          note: "",
        });
        fetchPayments();
        toast.success("บันทึกรายรับแล้ว");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถเชื่อมต่อได้");
    }
  }

  async function handleCloseMonth() {
    const ok = await confirm({
      title: "ปิดเดือน",
      message: `ต้องการปิดเดือน ${months[selectedMonth - 1]} ${selectedYear} หรือไม่? หลังจากปิดจะไม่สามารถแก้ไขรายการในเดือนนี้ได้`,
      variant: "danger",
      confirmLabel: "ปิดเดือน",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/monthly-close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
      });
      if (res.ok) {
        toast.success(`ปิดเดือน ${months[selectedMonth - 1]} ${selectedYear} สำเร็จ`);
        fetchClosedMonths();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถเชื่อมต่อได้");
    }
  }

  async function handleReopenMonth(year: number, month: number) {
    const ok = await confirm({
      title: "เปิดเดือนกลับ",
      message: `ต้องการเปิดเดือน ${months[month - 1]} ${year} อีกครั้งหรือไม่?`,
      confirmLabel: "เปิดเดือน",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/monthly-close?year=${year}&month=${month}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchClosedMonths();
        toast.success(`เปิดเดือน ${months[month - 1]} ${year} กลับแล้ว`);
      } else {
        const err = await res.json();
        toast.error(err.error || "ไม่สามารถเปิดเดือนได้");
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถเชื่อมต่อได้");
    }
  }

  function downloadReport(type: string) {
    window.open(
      `/api/reports/${type}?year=${selectedYear}&month=${selectedMonth}&format=csv`,
      "_blank"
    );
  }

  const isCurrentMonthClosed = closedMonths.some(
    (m) => m.year === selectedYear && m.month === selectedMonth
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">การเงิน</h1>
          <p className="text-slate-500 mt-1">ค่าใช้จ่าย, การชำระเงิน, รายงาน, ปิดเดือน</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses">ค่าใช้จ่าย</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
          <TabsTrigger value="reports">รายงาน</TabsTrigger>
          <TabsTrigger value="close-month">ปิดเดือน</TabsTrigger>
        </TabsList>

        {/* Tab: Expenses */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetExpenseForm();
                setShowExpenseForm(!showExpenseForm);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> เพิ่มค่าใช้จ่าย
            </Button>
          </div>

          {showExpenseForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingExpenseId ? "แก้ไขค่าใช้จ่าย" : "เพิ่มค่าใช้จ่าย"}
                </CardTitle>
                <CardDescription>
                  {editingExpenseId ? "แก้ไขข้อมูลค่าใช้จ่าย" : "บันทึกค่าใช้จ่ายใหม่"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">วันที่ *</label>
                    <ThaiDatePicker
                      value={expenseForm.expenseDate}
                      onChange={(v) =>
                        setExpenseForm({ ...expenseForm, expenseDate: v ?? todayISO() })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ผู้ขาย/ร้านค้า *</label>
                    <Input
                      value={expenseForm.vendorName}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, vendorName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">หมวดหมู่</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, category: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">วิธีชำระ</label>
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(paymentMethodLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ผูกออเดอร์</label>
                    <select
                      value={expenseForm.relatedOrderId || "none"}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          relatedOrderId: e.target.value === "none" ? "" : e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="none">-- ไม่ผูก --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} {o.customer?.name ? ` (${o.customer.name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ผูกโปรเจกต์</label>
                    <select
                      value={expenseForm.relatedProjectId || "none"}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          relatedProjectId: e.target.value === "none" ? "" : e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="none">-- ไม่ผูก --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium">รายละเอียด</label>
                    <Input
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">มูลค่าก่อน VAT *</label>
                    <Input
                      type="number"
                      value={expenseForm.subTotal || ""}
                      onChange={(e) =>
                        updateExpenseCalc("subTotal", Number(e.target.value) || 0)
                      }
                      min={0}
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={expenseForm.hasVat}
                        onChange={(e) => updateExpenseCalc("hasVat", e.target.checked)}
                      />
                      มี VAT
                    </label>
                    {expenseForm.hasVat && (
                      <div className="mt-1 text-sm text-slate-500">
                        VAT {expenseForm.vatRate}%: {formatNumber(expenseForm.vatAmount)} บาท
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">ยอดรวม</label>
                    <div className="h-10 flex items-center font-mono font-bold text-lg">
                      {formatNumber(expenseForm.grandTotal)} บาท
                    </div>
                  </div>
                  <div className="md:col-span-3 flex gap-2">
                    <Button type="submit">
                      {editingExpenseId ? "อัปเดตค่าใช้จ่าย" : "บันทึกค่าใช้จ่าย"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetExpenseForm}>
                      ยกเลิก
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ผู้ขาย</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>ออเดอร์/โปรเจกต์</TableHead>
                    <TableHead className="text-center">VAT</TableHead>
                    <TableHead className="text-right">ฐานภาษี</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        กำลังโหลด...
                      </TableCell>
                    </TableRow>
                  ) : expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                        ไม่พบค่าใช้จ่าย
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{formatDateShort(exp.expenseDate)}</TableCell>
                        <TableCell className="font-medium">{exp.vendorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categoryLabels[exp.category] ?? exp.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {exp.description ?? "-"}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {exp.relatedOrderId
                            ? orders.find((o) => o.id === exp.relatedOrderId)?.code ?? "-"
                            : exp.relatedProjectId
                            ? projects.find((p) => p.id === exp.relatedProjectId)?.code ?? "-"
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {exp.hasVat ? (
                            <Badge variant="success">VAT</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(exp.subTotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatNumber(exp.grandTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditExpense(exp)}
                              disabled={isCurrentMonthClosed}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteExpenseId(exp.id)}
                              disabled={isCurrentMonthClosed}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Payments */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowPaymentForm(!showPaymentForm)}>
              <CreditCard className="h-4 w-4 mr-2" /> เพิ่มการชำระเงิน
            </Button>
          </div>

          {showPaymentForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">บันทึกการรับเงิน</CardTitle>
                <CardDescription>กรอกข้อมูลการชำระเงินที่ได้รับ</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitPayment}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div>
                    <label className="text-sm font-medium mb-1 block">วันที่รับเงิน *</label>
                    <ThaiDatePicker
                      value={paymentForm.receivedAt}
                      onChange={(v) =>
                        setPaymentForm({ ...paymentForm, receivedAt: v ?? todayISO() })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">จำนวนเงิน *</label>
                    <Input
                      type="number"
                      value={paymentForm.amount || ""}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          amount: Number(e.target.value) || 0,
                        })
                      }
                      min={0}
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">วิธีรับเงิน</label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, method: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(paymentMethodLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ผูกออเดอร์</label>
                    <select
                      value={paymentForm.orderId || "none"}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          orderId: e.target.value === "none" ? "" : e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="none">-- ไม่ผูก --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} {o.customer?.name ? ` (${o.customer.name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ผูกเอกสาร</label>
                    <select
                      value={paymentForm.documentId || "none"}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          documentId: e.target.value === "none" ? "" : e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="none">-- ไม่ผูก --</option>
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.number} ({docTypeLabels[d.type] ?? d.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium">หมายเหตุ</label>
                    <Input
                      value={paymentForm.note}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, note: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-3 flex gap-2">
                    <Button type="submit">บันทึกการชำระเงิน</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPaymentForm(false)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>วิธีชำระ</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead>ออเดอร์</TableHead>
                    <TableHead>เอกสาร</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        กำลังโหลด...
                      </TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                        ไม่พบการชำระเงิน
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDateShort(p.receivedAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {paymentMethodLabels[p.method] ?? p.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatNumber(p.amount)}
                        </TableCell>
                        <TableCell>{p.order?.code ?? "-"}</TableCell>
                        <TableCell>
                          {p.document ? (
                            <span>
                              {p.document.number}{" "}
                              <span className="text-slate-500 text-xs">
                                ({docTypeLabels[p.document.type] ?? p.document.type})
                              </span>
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {p.note ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reports */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">รายงานภาษีขาย</CardTitle>
                <CardDescription>
                  VAT Sales - {months[selectedMonth - 1]} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => downloadReport("vat-sales")} className="w-full">
                  <Download className="h-4 w-4 mr-2" /> ดาวน์โหลด CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">รายงานภาษีซื้อ</CardTitle>
                <CardDescription>
                  VAT Purchase - {months[selectedMonth - 1]} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => downloadReport("vat-purchase")} className="w-full">
                  <Download className="h-4 w-4 mr-2" /> ดาวน์โหลด CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">รายงาน WHT</CardTitle>
                <CardDescription>
                  ภาษีหัก ณ ที่จ่าย - {months[selectedMonth - 1]} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => downloadReport("wht")} className="w-full">
                  <Download className="h-4 w-4 mr-2" /> ดาวน์โหลด CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Close Month */}
        <TabsContent value="close-month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ปิดเดือน</CardTitle>
              <CardDescription>
                เมื่อปิดเดือนแล้ว จะไม่สามารถแก้ไขเอกสาร, ค่าใช้จ่าย, หรือการรับเงินในเดือนนั้นได้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold">
                  {months[selectedMonth - 1]} {selectedYear}
                </div>
                {isCurrentMonthClosed ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> ปิดแล้ว
                  </Badge>
                ) : (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Unlock className="h-3 w-3" /> เปิดอยู่
                  </Badge>
                )}
                {!isCurrentMonthClosed ? (
                  <Button onClick={handleCloseMonth} variant="destructive">
                    <Lock className="h-4 w-4 mr-2" /> ปิดเดือนนี้
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleReopenMonth(selectedYear, selectedMonth)}
                    variant="outline"
                  >
                    <Unlock className="h-4 w-4 mr-2" /> เปิดเดือนอีกครั้ง
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ประวัติการปิดเดือน</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เดือน</TableHead>
                    <TableHead>ปิดเมื่อ</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                    <TableHead className="text-right">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedMonths.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                        ยังไม่มีเดือนที่ถูกปิด
                      </TableCell>
                    </TableRow>
                  ) : (
                    closedMonths.map((cm) => (
                      <TableRow key={cm.id}>
                        <TableCell className="font-medium">
                          {months[cm.month - 1]} {cm.year}
                        </TableCell>
                        <TableCell>{formatDateShort(cm.closedAt)}</TableCell>
                        <TableCell>{cm.note ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReopenMonth(cm.year, cm.month)}
                          >
                            <Unlock className="h-3 w-3 mr-1" /> เปิด
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete expense confirmation - uses inline modal via state */}
      {deleteExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 max-w-md">
            <CardHeader>
              <CardTitle>ยืนยันการลบค่าใช้จ่าย</CardTitle>
              <CardDescription>
                คุณต้องการลบค่าใช้จ่ายนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteExpenseId(null)}>
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteExpenseId && handleDeleteExpense(deleteExpenseId)}
              >
                ลบ
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
