"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, Printer, X, FileText, Receipt, FileCheck } from "lucide-react";
import { formatNumber, formatDateShort } from "@/src/lib/utils";

// ==================== Types ====================

interface DocRecord {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  subTotal: string;
  vatAmount: string;
  grandTotal: string;
  note: string | null;
  customer: { name: string; taxId: string | null };
  order: { code: string } | null;
  project: { code: string; title: string } | null;
  withholdingTax: { rate: string; taxAmount: string } | null;
  _count: { payments: number; attachments: number };
}

interface CustomerOption {
  id: string;
  name: string;
  taxId: string | null;
}

interface OrderOption {
  id: string;
  code: string;
  subTotal: string;
  vatRate: string;
  vatAmount: string;
  grandTotal: string;
  items: { name: string; qty: number; unitPrice: string; lineTotal: string }[];
}

interface ProjectOption {
  id: string;
  code: string;
  title: string;
  milestones: { id: string; title: string; amount: string; isBilled: boolean }[];
}

// ==================== Constants ====================

const docTypeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  QUOTATION: { label: "ใบเสนอราคา", color: "bg-blue-100 text-blue-800", icon: <FileText className="h-4 w-4" /> },
  INVOICE: { label: "ใบแจ้งหนี้", color: "bg-yellow-100 text-yellow-800", icon: <Receipt className="h-4 w-4" /> },
  TAX_INVOICE_RECEIPT: { label: "ใบกำกับภาษี/ใบเสร็จ", color: "bg-green-100 text-green-800", icon: <FileCheck className="h-4 w-4" /> },
};

// ==================== Component ====================

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [productCatalog, setProductCatalog] = useState<{ id: string; name: string; sku: string | null; category: string; unit: string; unitPrice: string }[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [docItems, setDocItems] = useState<{ name: string; description: string; unit: string; qty: number; unitPrice: number; productId: string }[]>([]);

  const [form, setForm] = useState({
    type: "QUOTATION" as string,
    customerId: "",
    refType: "none" as "none" | "order" | "project",
    orderId: "",
    projectId: "",
    issueDate: new Date().toISOString().split("T")[0],
    subTotal: 0,
    vatRate: 7,
    vatAmount: 0,
    grandTotal: 0,
    note: "",
    // WHT
    hasWht: false,
    whtRate: 3,
    whtBaseAmount: 0,
    whtTaxAmount: 0,
    whtCertificateNo: "",
  });

  // ==================== Data Fetching ====================

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) setDocuments((await res.json()).data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers?limit=200");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data.map((c: CustomerOption) => ({
          id: c.id, name: c.name, taxId: c.taxId,
        })));
      }
    } catch (err) { console.error(err); }
  }

  async function fetchProductCatalog() {
    try {
      const res = await fetch("/api/products?limit=200&active=true");
      if (res.ok) setProductCatalog((await res.json()).data);
    } catch (err) { console.error(err); }
  }

  async function fetchOrdersForCustomer(customerId: string) {
    try {
      const res = await fetch(`/api/orders?customerId=${customerId}&limit=50`);
      if (res.ok) setOrders((await res.json()).data);
    } catch (err) { console.error(err); }
  }

  async function fetchProjectsForCustomer(customerId: string) {
    try {
      const res = await fetch(`/api/projects?customerId=${customerId}&limit=50`);
      if (res.ok) setProjects((await res.json()).data);
    } catch (err) { console.error(err); }
  }

  // ==================== Form Helpers ====================

  function resetForm() {
    setForm({
      type: "QUOTATION",
      customerId: "",
      refType: "none",
      orderId: "",
      projectId: "",
      issueDate: new Date().toISOString().split("T")[0],
      subTotal: 0,
      vatRate: 7,
      vatAmount: 0,
      grandTotal: 0,
      note: "",
      hasWht: false,
      whtRate: 3,
      whtBaseAmount: 0,
      whtTaxAmount: 0,
      whtCertificateNo: "",
    });
    setDocItems([]);
    setOrders([]);
    setProjects([]);
    setFormError("");
  }

  function openForm() {
    resetForm();
    setShowForm(true);
    fetchCustomers();
    fetchProductCatalog();
  }

  // ==================== Document Items ====================

  function addDocItem() {
    setDocItems(prev => [...prev, { name: "", description: "", unit: "ชิ้น", qty: 1, unitPrice: 0, productId: "" }]);
  }

  function addProductToDoc(product: typeof productCatalog[0]) {
    setDocItems(prev => [...prev, {
      name: product.name,
      description: "",
      unit: product.unit,
      qty: 1,
      unitPrice: Number(product.unitPrice),
      productId: product.id,
    }]);
    setShowProductPicker(false);
    setProductSearch("");
    // Recalculate
    setTimeout(recalcFromItems, 0);
  }

  function updateDocItem(idx: number, field: string, value: string | number) {
    setDocItems(prev => {
      const items = [...prev];
      items[idx] = { ...items[idx], [field]: value };
      return items;
    });
    setTimeout(recalcFromItems, 0);
  }

  function removeDocItem(idx: number) {
    setDocItems(prev => prev.filter((_, i) => i !== idx));
    setTimeout(recalcFromItems, 0);
  }

  function recalcFromItems() {
    setDocItems(currentItems => {
      const sub = currentItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
      const roundedSub = Math.round(sub * 100) / 100;
      setForm(prev => {
        const { vatAmount, grandTotal } = recalcTotals(roundedSub, prev.vatRate);
        return {
          ...prev,
          subTotal: roundedSub,
          vatAmount,
          grandTotal,
          whtBaseAmount: prev.hasWht ? roundedSub : prev.whtBaseAmount,
          whtTaxAmount: prev.hasWht ? recalcWht(roundedSub, prev.whtRate) : prev.whtTaxAmount,
        };
      });
      return currentItems;
    });
  }

  function recalcTotals(subTotal: number, vatRate: number) {
    const vatAmount = Math.round(subTotal * vatRate / 100 * 100) / 100;
    const grandTotal = Math.round((subTotal + vatAmount) * 100) / 100;
    return { vatAmount, grandTotal };
  }

  function recalcWht(baseAmount: number, whtRate: number) {
    return Math.round(baseAmount * whtRate / 100 * 100) / 100;
  }

  function updateSubTotal(value: number) {
    const { vatAmount, grandTotal } = recalcTotals(value, form.vatRate);
    const whtTaxAmount = form.hasWht ? recalcWht(value, form.whtRate) : 0;
    setForm(prev => ({
      ...prev,
      subTotal: value,
      vatAmount,
      grandTotal,
      whtBaseAmount: form.hasWht ? value : prev.whtBaseAmount,
      whtTaxAmount,
    }));
  }

  function updateVatRate(value: number) {
    const { vatAmount, grandTotal } = recalcTotals(form.subTotal, value);
    setForm(prev => ({ ...prev, vatRate: value, vatAmount, grandTotal }));
  }

  function toggleWht(checked: boolean) {
    if (checked) {
      const whtTaxAmount = recalcWht(form.subTotal, form.whtRate);
      setForm(prev => ({
        ...prev,
        hasWht: true,
        whtBaseAmount: form.subTotal,
        whtTaxAmount,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        hasWht: false,
        whtBaseAmount: 0,
        whtTaxAmount: 0,
        whtCertificateNo: "",
      }));
    }
  }

  function updateWhtRate(value: number) {
    const whtTaxAmount = recalcWht(form.whtBaseAmount, value);
    setForm(prev => ({ ...prev, whtRate: value, whtTaxAmount }));
  }

  function updateWhtBase(value: number) {
    const whtTaxAmount = recalcWht(value, form.whtRate);
    setForm(prev => ({ ...prev, whtBaseAmount: value, whtTaxAmount }));
  }

  function handleCustomerChange(customerId: string) {
    setForm(prev => ({ ...prev, customerId, orderId: "", projectId: "", refType: "none" }));
    if (customerId) {
      fetchOrdersForCustomer(customerId);
      fetchProjectsForCustomer(customerId);
    } else {
      setOrders([]);
      setProjects([]);
    }
  }

  function handleRefTypeChange(refType: "none" | "order" | "project") {
    setForm(prev => ({ ...prev, refType, orderId: "", projectId: "" }));
  }

  function handleOrderSelect(orderId: string) {
    setForm(prev => ({ ...prev, orderId }));
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const subTotal = Number(order.subTotal);
        const vatRate = Number(order.vatRate);
        const { vatAmount, grandTotal } = recalcTotals(subTotal, vatRate);
        setForm(prev => ({
          ...prev,
          orderId,
          subTotal,
          vatRate,
          vatAmount,
          grandTotal,
          whtBaseAmount: prev.hasWht ? subTotal : prev.whtBaseAmount,
          whtTaxAmount: prev.hasWht ? recalcWht(subTotal, prev.whtRate) : prev.whtTaxAmount,
        }));
      }
    }
  }

  function handleProjectMilestoneSelect(projectId: string) {
    setForm(prev => ({ ...prev, projectId }));
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // sum milestones ที่ยังไม่ได้ bill
        const unbilledTotal = project.milestones
          .filter(m => !m.isBilled)
          .reduce((sum, m) => sum + Number(m.amount), 0);
        if (unbilledTotal > 0) {
          const { vatAmount, grandTotal } = recalcTotals(unbilledTotal, form.vatRate);
          setForm(prev => ({
            ...prev,
            projectId,
            subTotal: unbilledTotal,
            vatAmount,
            grandTotal,
            whtBaseAmount: prev.hasWht ? unbilledTotal : prev.whtBaseAmount,
            whtTaxAmount: prev.hasWht ? recalcWht(unbilledTotal, prev.whtRate) : prev.whtTaxAmount,
          }));
        }
      }
    }
  }

  // ==================== Submit ====================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        type: form.type,
        customerId: form.customerId,
        issueDate: form.issueDate,
        subTotal: form.subTotal,
        vatRate: form.vatRate,
        vatAmount: form.vatAmount,
        grandTotal: form.grandTotal,
        note: form.note || undefined,
      };

      if (form.refType === "order" && form.orderId) {
        payload.orderId = form.orderId;
      }
      if (form.refType === "project" && form.projectId) {
        payload.projectId = form.projectId;
      }

      if (form.hasWht && form.whtTaxAmount > 0) {
        payload.wht = {
          rate: form.whtRate,
          baseAmount: form.whtBaseAmount,
          taxAmount: form.whtTaxAmount,
          certificateNo: form.whtCertificateNo || undefined,
        };
      }

      // Include line items if any
      if (docItems.length > 0) {
        payload.items = docItems.filter(i => i.name).map(item => ({
          name: item.name,
          description: item.description || undefined,
          unit: item.unit,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          productId: item.productId || undefined,
        }));
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchDocuments();
      } else {
        const err = await res.json();
        setFormError(err.error || "เกิดข้อผิดพลาดในการสร้างเอกสาร");
      }
    } catch (err) {
      console.error(err);
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrintPdf(id: string) {
    window.open(`/api/documents/${id}/pdf`, "_blank");
  }

  // ==================== Render ====================

  const netReceived = form.hasWht
    ? Math.round((form.grandTotal - form.whtTaxAmount) * 100) / 100
    : form.grandTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">เอกสาร</h1>
          <p className="text-slate-500 mt-1">จัดการใบเสนอราคา, ใบแจ้งหนี้, ใบกำกับภาษี</p>
        </div>
        <Button onClick={openForm}>
          <Plus className="h-4 w-4 mr-2" /> สร้างเอกสาร
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="ค้นหาเลขเอกสาร, ลูกค้า..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white">
          <option value="">ทุกประเภท</option>
          <option value="QUOTATION">ใบเสนอราคา</option>
          <option value="INVOICE">ใบแจ้งหนี้</option>
          <option value="TAX_INVOICE_RECEIPT">ใบกำกับภาษี/ใบเสร็จ</option>
        </select>
      </div>

      {/* ==================== Create Form ==================== */}
      {showForm && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-blue-900">สร้างเอกสารใหม่</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Error message */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
                  {formError}
                </div>
              )}

              {/* Row 1: Document Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">ประเภทเอกสาร *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["QUOTATION", "INVOICE", "TAX_INVOICE_RECEIPT"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, type }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                        form.type === type
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      {docTypeLabels[type].icon}
                      <span className="text-sm font-medium">{docTypeLabels[type].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Customer + Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">ลูกค้า *</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    required
                  >
                    <option value="">-- เลือกลูกค้า --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.taxId ? `(${c.taxId})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">วันที่ออกเอกสาร *</label>
                  <Input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Reference (Order / Project) */}
              {form.customerId && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">อ้างอิงจาก</label>
                  <div className="flex gap-2 mb-3">
                    <Button
                      type="button" size="sm"
                      variant={form.refType === "none" ? "default" : "outline"}
                      onClick={() => handleRefTypeChange("none")}
                    >
                      ไม่ระบุ
                    </Button>
                    <Button
                      type="button" size="sm"
                      variant={form.refType === "order" ? "default" : "outline"}
                      onClick={() => handleRefTypeChange("order")}
                      disabled={orders.length === 0}
                    >
                      ออเดอร์ ({orders.length})
                    </Button>
                    <Button
                      type="button" size="sm"
                      variant={form.refType === "project" ? "default" : "outline"}
                      onClick={() => handleRefTypeChange("project")}
                      disabled={projects.length === 0}
                    >
                      โครงการ ({projects.length})
                    </Button>
                  </div>

                  {form.refType === "order" && orders.length > 0 && (
                    <select
                      value={form.orderId}
                      onChange={(e) => handleOrderSelect(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">-- เลือกออเดอร์ --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} - ยอด {formatNumber(o.grandTotal)} บาท
                        </option>
                      ))}
                    </select>
                  )}

                  {form.refType === "project" && projects.length > 0 && (
                    <div>
                      <select
                        value={form.projectId}
                        onChange={(e) => handleProjectMilestoneSelect(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">-- เลือกโครงการ --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.title}
                          </option>
                        ))}
                      </select>
                      {form.projectId && (() => {
                        const proj = projects.find(p => p.id === form.projectId);
                        if (!proj) return null;
                        return (
                          <div className="mt-2 text-sm text-slate-500 bg-slate-50 rounded p-2">
                            <div className="font-medium mb-1">งวดงานที่ยังไม่ได้ออกบิล:</div>
                            {proj.milestones.filter(m => !m.isBilled).map(m => (
                              <div key={m.id} className="flex justify-between">
                                <span>{m.title}</span>
                                <span className="font-mono">{formatNumber(m.amount)}</span>
                              </div>
                            ))}
                            {proj.milestones.filter(m => !m.isBilled).length === 0 && (
                              <div className="text-orange-500">ไม่มีงวดงานที่ยังไม่ได้ออกบิล</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Row 4: Line Items */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-700">รายการสินค้า/บริการ</h4>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="default" onClick={() => setShowProductPicker(!showProductPicker)}>
                      📦 เลือกจากแค็ตตาล็อก
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={addDocItem}>+ เพิ่มรายการเอง</Button>
                  </div>
                </div>

                {/* Product Picker */}
                {showProductPicker && (
                  <div className="border rounded-lg bg-white shadow-lg p-3">
                    <Input
                      placeholder="ค้นหาสินค้า/บริการ..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="mb-2"
                      autoFocus
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {productCatalog
                        .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())))
                        .map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProductToDoc(p)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-blue-50 text-left text-sm transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${p.category === "GOODS" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                {p.category === "GOODS" ? "สินค้า" : "บริการ"}
                              </span>
                              <span className="font-medium">{p.name}</span>
                              {p.sku && <span className="text-slate-400 text-xs">({p.sku})</span>}
                            </div>
                            <div className="text-right">
                              <span className="font-mono">{formatNumber(p.unitPrice)}</span>
                              <span className="text-slate-400 text-xs ml-1">/{p.unit}</span>
                            </div>
                          </button>
                        ))}
                      {productCatalog.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                        <div className="text-center py-3 text-slate-400 text-sm">ไม่พบสินค้า/บริการ</div>
                      )}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-end">
                      <Button type="button" size="sm" variant="ghost" onClick={() => { setShowProductPicker(false); setProductSearch(""); }}>ปิด</Button>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                {docItems.length > 0 && (
                  <>
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 mt-2">
                      <div className="col-span-4">ชื่อรายการ</div>
                      <div className="col-span-2">หน่วย</div>
                      <div className="col-span-1">จำนวน</div>
                      <div className="col-span-2">ราคา/หน่วย</div>
                      <div className="col-span-2 text-right">รวม</div>
                      <div className="col-span-1"></div>
                    </div>
                    {docItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Input placeholder="ชื่อสินค้า/บริการ" value={item.name} onChange={(e) => updateDocItem(idx, "name", e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <select value={item.unit} onChange={(e) => updateDocItem(idx, "unit", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                            {["ชิ้น","ชุด","อัน","กล่อง","แพ็ค","ตัว","งาน","เดือน","ครั้ง","โครงการ","รายการ"].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <Input type="number" value={item.qty} onChange={(e) => updateDocItem(idx, "qty", Number(e.target.value))} min={1} />
                        </div>
                        <div className="col-span-2">
                          <Input type="number" value={item.unitPrice} onChange={(e) => updateDocItem(idx, "unitPrice", Number(e.target.value))} min={0} step="0.01" className="font-mono" />
                        </div>
                        <div className="col-span-2 flex items-center justify-end font-mono text-sm font-medium">
                          {formatNumber(item.qty * item.unitPrice)}
                        </div>
                        <div className="col-span-1 flex items-center">
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeDocItem(idx)} className="text-red-500">✕</Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right text-sm border-t pt-2">
                      <span className="font-medium">รวมจากรายการ: </span>
                      <span className="font-mono font-bold text-blue-600">
                        {formatNumber(docItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0))}
                      </span>
                      <span className="text-slate-400 ml-1">บาท</span>
                    </div>
                  </>
                )}

                {docItems.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-sm border rounded-lg bg-slate-50/50">
                    คลิก &quot;เลือกจากแค็ตตาล็อก&quot; หรือ &quot;เพิ่มรายการเอง&quot; เพื่อเพิ่มรายการสินค้า/บริการ
                    <br /><span className="text-xs">หรือกรอกยอดรวมด้านล่างโดยตรง</span>
                  </div>
                )}
              </div>

              {/* Row 5: Amount Calculation */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-700">จำนวนเงิน</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-500">มูลค่าก่อน VAT (ฐานภาษี) *</label>
                    <Input
                      type="number"
                      value={form.subTotal}
                      onChange={(e) => updateSubTotal(Number(e.target.value))}
                      min={0}
                      step="0.01"
                      className="mt-1 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500">อัตรา VAT (%)</label>
                    <Input
                      type="number"
                      value={form.vatRate}
                      onChange={(e) => updateVatRate(Number(e.target.value))}
                      min={0}
                      max={100}
                      step="0.01"
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500">ภาษีมูลค่าเพิ่ม</label>
                    <div className="h-10 mt-1 flex items-center font-mono text-blue-600 font-medium">
                      {formatNumber(form.vatAmount)} บาท
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="text-lg font-semibold text-slate-700">ยอดรวมทั้งสิ้น</span>
                  <span className="text-2xl font-bold font-mono text-blue-700">
                    {formatNumber(form.grandTotal)} บาท
                  </span>
                </div>
              </div>

              {/* Row 5: WHT (Withholding Tax) */}
              <div className="border rounded-lg p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasWht}
                    onChange={(e) => toggleWht(e.target.checked)}
                    className="rounded"
                  />
                  <span className="font-medium text-slate-700">ลูกค้าหักภาษี ณ ที่จ่าย (WHT)</span>
                </label>

                {form.hasWht && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="text-sm text-slate-500">อัตรา WHT (%)</label>
                      <Input
                        type="number"
                        value={form.whtRate}
                        onChange={(e) => updateWhtRate(Number(e.target.value))}
                        min={0}
                        max={100}
                        step="0.01"
                        className="mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">ฐานคำนวณ WHT</label>
                      <Input
                        type="number"
                        value={form.whtBaseAmount}
                        onChange={(e) => updateWhtBase(Number(e.target.value))}
                        min={0}
                        step="0.01"
                        className="mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">จำนวน WHT ถูกหัก</label>
                      <div className="h-10 mt-1 flex items-center font-mono text-red-600 font-medium">
                        - {formatNumber(form.whtTaxAmount)} บาท
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">เลขรับรองหัก ณ ที่จ่าย (ถ้ามี)</label>
                      <Input
                        value={form.whtCertificateNo}
                        onChange={(e) => setForm(prev => ({ ...prev, whtCertificateNo: e.target.value }))}
                        placeholder="เช่น WH-2026-001"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-slate-500">ยอดรับสุทธิ (หลังหัก WHT)</label>
                      <div className="h-10 mt-1 flex items-center text-lg font-bold font-mono text-green-700">
                        {formatNumber(netReceived)} บาท
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 6: Note */}
              <div>
                <label className="text-sm font-medium text-slate-700">หมายเหตุ</label>
                <Input
                  value={form.note}
                  onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                  className="mt-1"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="min-w-[140px]">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      กำลังสร้าง...
                    </span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      สร้างเอกสาร
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  ยกเลิก
                </Button>

                {/* Preview Summary */}
                <div className="ml-auto text-right text-sm text-slate-500">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${docTypeLabels[form.type]?.color}`}>
                    {docTypeLabels[form.type]?.icon}
                    {docTypeLabels[form.type]?.label}
                  </span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ==================== Document Table ==================== */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>อ้างอิง</TableHead>
                <TableHead className="text-right">ฐานภาษี</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead className="text-center">WHT</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    กำลังโหลด...
                  </div>
                </TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-slate-300" />
                    <span>ยังไม่มีเอกสาร</span>
                    <Button size="sm" variant="outline" onClick={openForm}>
                      <Plus className="h-3 w-3 mr-1" /> สร้างเอกสารแรก
                    </Button>
                  </div>
                </TableCell></TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono font-medium">{doc.number}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${docTypeLabels[doc.type]?.color}`}>
                        {docTypeLabels[doc.type]?.label}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateShort(doc.issueDate)}</TableCell>
                    <TableCell>{doc.customer.name}</TableCell>
                    <TableCell className="text-sm">
                      {doc.order ? <Badge variant="outline">{doc.order.code}</Badge> : null}
                      {doc.project ? <Badge variant="outline">{doc.project.code}</Badge> : null}
                      {!doc.order && !doc.project ? <span className="text-slate-300">-</span> : null}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(doc.subTotal)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(doc.vatAmount)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatNumber(doc.grandTotal)}</TableCell>
                    <TableCell className="text-center">
                      {doc.withholdingTax ? (
                        <Badge variant="warning" className="text-xs">
                          {Number(doc.withholdingTax.rate)}% = {formatNumber(doc.withholdingTax.taxAmount)}
                        </Badge>
                      ) : <span className="text-slate-300">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handlePrintPdf(doc.id)} title="พิมพ์ PDF">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="ดูรายละเอียด">
                          <Eye className="h-4 w-4" />
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
    </div>
  );
}
