"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, X, Truck, FileText, CreditCard, Pencil, Trash2, ChevronRight } from "lucide-react";
import { formatNumber, formatDateShort, formatDate } from "@/src/lib/utils";

// ==================== Types ====================

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
}

interface OrderListItem {
  id: string;
  code: string;
  status: string;
  orderDate: string;
  subTotal: string;
  vatAmount: string;
  grandTotal: string;
  customer: { name: string };
  items: OrderItem[];
  shipment: { carrier: string; trackingNo: string | null; shippedAt: string | null; shippingFee: string | null } | null;
  _count: { payments: number; documents: number };
}

interface OrderDetail {
  id: string;
  code: string;
  status: string;
  orderDate: string;
  subTotal: string;
  vatRate: string;
  vatAmount: string;
  grandTotal: string;
  note: string | null;
  customer: { id: string; name: string; taxId: string | null; address: string | null; email: string | null; phone: string | null };
  items: OrderItem[];
  shipment: { id: string; carrier: string; trackingNo: string | null; shippedAt: string | null; shippingFee: string | null } | null;
  payments: { id: string; amount: string; method: string; receivedAt: string; note: string | null }[];
  documents: { id: string; type: string; number: string; grandTotal: string }[];
  attachments: { id: string; fileName: string; url: string }[];
}

// ==================== Constants ====================

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  DRAFT: { label: "ร่าง", variant: "secondary" },
  INVOICED: { label: "ออกบิลแล้ว", variant: "default" },
  PAID: { label: "ชำระแล้ว", variant: "success" },
  CLOSED: { label: "ปิดแล้ว", variant: "warning" },
  VOID: { label: "ยกเลิก", variant: "destructive" },
};

const statusFlow: Record<string, string[]> = {
  DRAFT: ["INVOICED", "VOID"],
  INVOICED: ["PAID", "VOID"],
  PAID: ["CLOSED"],
  CLOSED: [],
  VOID: [],
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

// ==================== Component ====================

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Detail view
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [productCatalog, setProductCatalog] = useState<{ id: string; name: string; sku: string | null; category: string; unit: string; unitPrice: string }[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    vatRate: 7,
    note: "",
    items: [{ name: "", unit: "ชิ้น", qty: 1, unitPrice: 0, productId: "" }],
  });

  // ==================== Fetching ====================

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) setOrders((await res.json()).data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (showForm) { fetchCustomers(); fetchProductCatalog(); }
  }, [showForm]);

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers?limit=100");
      if (res.ok) setCustomers((await res.json()).data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    } catch (err) { console.error(err); }
  }

  async function fetchProductCatalog() {
    try {
      const res = await fetch("/api/products?limit=200&active=true");
      if (res.ok) setProductCatalog((await res.json()).data);
    } catch (err) { console.error(err); }
  }

  async function fetchOrderDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        setSelectedOrder(await res.json());
      }
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  }

  // ==================== Create Form ====================

  function addItem() {
    setForm({ ...form, items: [...form.items, { name: "", unit: "ชิ้น", qty: 1, unitPrice: 0, productId: "" }] });
  }

  function addProductItem(product: typeof productCatalog[0]) {
    const newItem = {
      name: product.name,
      unit: product.unit,
      qty: 1,
      unitPrice: Number(product.unitPrice),
      productId: product.id,
    };
    setForm(prev => ({ ...prev, items: [...prev.items.filter(i => i.name !== ""), newItem] }));
    setShowProductPicker(false);
    setProductSearch("");
  }

  function removeItem(idx: number) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  }

  function updateItem(idx: number, field: string, value: string | number) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: form.items.filter(i => i.name).map((item) => ({
            name: item.name,
            unit: item.unit,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
            productId: item.productId || undefined,
          })),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ customerId: "", vatRate: 7, note: "", items: [{ name: "", unit: "ชิ้น", qty: 1, unitPrice: 0, productId: "" }] });
        fetchOrders();
      }
    } catch (err) { console.error(err); }
  }

  // ==================== Status Change ====================

  async function handleStatusChange(orderId: string, newStatus: string) {
    const statusLabel = statusMap[newStatus]?.label ?? newStatus;
    if (!confirm(`ต้องการเปลี่ยนสถานะเป็น "${statusLabel}" หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          fetchOrderDetail(orderId);
        }
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) { console.error(err); }
  }

  async function handleDelete(orderId: string) {
    if (!confirm("ต้องการลบออเดอร์นี้หรือไม่? การลบจะไม่สามารถกู้คืนได้")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
      } else {
        const err = await res.json();
        alert(err.error || "ไม่สามารถลบได้");
      }
    } catch (err) { console.error(err); }
  }

  // ==================== Calculations ====================

  const subTotal = form.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const vatAmount = Math.round(subTotal * form.vatRate / 100 * 100) / 100;

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ออเดอร์</h1>
          <p className="text-slate-500 mt-1">จัดการคำสั่งซื้อสินค้า</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> สร้างออเดอร์
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="ค้นหาเลขออเดอร์, ลูกค้า..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white">
          <option value="">ทุกสถานะ</option>
          {Object.entries(statusMap).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* ==================== Create Form ==================== */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">สร้างออเดอร์ใหม่</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">ลูกค้า *</label>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">เลือกลูกค้า</option>
                    {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">VAT Rate (%)</label>
                  <Input type="number" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">รายการสินค้า/บริการ</label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="default" onClick={() => setShowProductPicker(!showProductPicker)}>
                      📦 เลือกจากแค็ตตาล็อก
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={addItem}>+ เพิ่มรายการเอง</Button>
                  </div>
                </div>

                {/* Product Picker Dropdown */}
                {showProductPicker && (
                  <div className="mb-3 border rounded-lg bg-white shadow-lg p-3">
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
                            onClick={() => addProductItem(p)}
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

                {/* Items Table Header */}
                <div className="grid grid-cols-12 gap-2 mb-1 text-xs font-medium text-slate-500">
                  <div className="col-span-4">ชื่อสินค้า/บริการ</div>
                  <div className="col-span-2">หน่วย</div>
                  <div className="col-span-1">จำนวน</div>
                  <div className="col-span-2">ราคา/หน่วย</div>
                  <div className="col-span-2 text-right">รวม</div>
                  <div className="col-span-1"></div>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-4">
                      <Input placeholder="ชื่อสินค้า/บริการ" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} required />
                    </div>
                    <div className="col-span-2">
                      <select value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                        {["ชิ้น","ชุด","อัน","กล่อง","แพ็ค","ตัว","งาน","เดือน","ครั้ง","โครงการ","รายการ"].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <Input type="number" value={item.qty} onChange={(e) => updateItem(idx, "qty", Number(e.target.value))} min={1} required />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))} min={0} step="0.01" required className="font-mono" />
                    </div>
                    <div className="col-span-2 flex items-center justify-end font-mono text-sm font-medium">
                      {formatNumber(item.qty * item.unitPrice)}
                    </div>
                    <div className="col-span-1 flex items-center">
                      {form.items.length > 1 && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(idx)} className="text-red-500">✕</Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 text-right space-y-1 text-sm">
                  <div>ฐานภาษี: <span className="font-mono">{formatNumber(subTotal)}</span></div>
                  <div>VAT {form.vatRate}%: <span className="font-mono">{formatNumber(vatAmount)}</span></div>
                  <div className="text-lg font-bold">รวมทั้งสิ้น: <span className="font-mono">{formatNumber(subTotal + vatAmount)}</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">สร้างออเดอร์</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>ยกเลิก</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ==================== Order Detail ==================== */}
      {selectedOrder && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg text-blue-900">
                  {selectedOrder.code}
                </CardTitle>
                <Badge variant={statusMap[selectedOrder.status]?.variant}>
                  {statusMap[selectedOrder.status]?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {/* Status change buttons */}
                {statusFlow[selectedOrder.status]?.map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    size="sm"
                    variant={nextStatus === "VOID" ? "destructive" : "default"}
                    onClick={() => handleStatusChange(selectedOrder.id, nextStatus)}
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {statusMap[nextStatus]?.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(selectedOrder.id)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Customer Info + Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">ข้อมูลลูกค้า</h4>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-1">
                      <div className="font-semibold text-lg">{selectedOrder.customer.name}</div>
                      {selectedOrder.customer.taxId && (
                        <div className="text-sm text-slate-500">เลขผู้เสียภาษี: <span className="font-mono">{selectedOrder.customer.taxId}</span></div>
                      )}
                      {selectedOrder.customer.address && (
                        <div className="text-sm text-slate-500">{selectedOrder.customer.address}</div>
                      )}
                      {selectedOrder.customer.email && (
                        <div className="text-sm text-slate-500">{selectedOrder.customer.email}</div>
                      )}
                      {selectedOrder.customer.phone && (
                        <div className="text-sm text-slate-500">{selectedOrder.customer.phone}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">ข้อมูลออเดอร์</h4>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">วันที่สั่งซื้อ</span>
                        <span className="font-medium">{formatDate(selectedOrder.orderDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">อัตรา VAT</span>
                        <span className="font-mono">{Number(selectedOrder.vatRate)}%</span>
                      </div>
                      {selectedOrder.note && (
                        <div className="pt-2 border-t">
                          <span className="text-sm text-slate-500">หมายเหตุ: </span>
                          <span className="text-sm">{selectedOrder.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">รายการสินค้า ({selectedOrder.items.length} รายการ)</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">ลำดับ</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead className="text-center w-20">จำนวน</TableHead>
                        <TableHead className="text-right w-32">ราคาต่อหน่วย</TableHead>
                        <TableHead className="text-right w-32">รวม</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.qty}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="flex justify-end mt-2">
                    <div className="w-72 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">ฐานภาษี</span>
                        <span className="font-mono">{formatNumber(selectedOrder.subTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">VAT {Number(selectedOrder.vatRate)}%</span>
                        <span className="font-mono">{formatNumber(selectedOrder.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-1">
                        <span>ยอดรวม</span>
                        <span className="font-mono text-blue-700">{formatNumber(selectedOrder.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipment */}
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                    <Truck className="h-4 w-4" /> การจัดส่ง
                  </h4>
                  {selectedOrder.shipment ? (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">ผู้ขนส่ง</span>
                          <div className="font-medium">{selectedOrder.shipment.carrier}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">เลขพัสดุ</span>
                          <div className="font-mono font-medium">{selectedOrder.shipment.trackingNo ?? "-"}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">วันที่ส่ง</span>
                          <div className="font-medium">{selectedOrder.shipment.shippedAt ? formatDateShort(selectedOrder.shipment.shippedAt) : "-"}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">ค่าส่ง</span>
                          <div className="font-mono font-medium">{selectedOrder.shipment.shippingFee ? formatNumber(selectedOrder.shipment.shippingFee) : "-"}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4">ยังไม่มีข้อมูลการจัดส่ง</div>
                  )}
                </div>

                {/* Payments + Documents Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payments */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <CreditCard className="h-4 w-4" /> การชำระเงิน ({selectedOrder.payments.length})
                    </h4>
                    {selectedOrder.payments.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.payments.map((pay) => (
                          <div key={pay.id} className="bg-green-50 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">{paymentMethodLabels[pay.method] ?? pay.method}</div>
                              <div className="text-xs text-slate-500">{formatDateShort(pay.receivedAt)}</div>
                              {pay.note && <div className="text-xs text-slate-400">{pay.note}</div>}
                            </div>
                            <div className="font-mono font-bold text-green-700">{formatNumber(pay.amount)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4">ยังไม่มีการชำระเงิน</div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <FileText className="h-4 w-4" /> เอกสารที่เกี่ยวข้อง ({selectedOrder.documents.length})
                    </h4>
                    {selectedOrder.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.documents.map((doc) => (
                          <div key={doc.id} className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium font-mono">{doc.number}</div>
                              <div className="text-xs text-slate-500">{docTypeLabels[doc.type] ?? doc.type}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-700">{formatNumber(doc.grandTotal)}</span>
                              <Button size="icon" variant="ghost" onClick={() => window.open(`/api/documents/${doc.id}/pdf`, "_blank")}>
                                <FileText className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4">ยังไม่มีเอกสาร</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== Orders Table ==================== */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead className="text-center">เอกสาร</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">กำลังโหลด...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">ไม่พบออเดอร์</TableCell></TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer ${selectedOrder?.id === order.id ? "bg-blue-50" : ""}`}
                    onClick={() => fetchOrderDetail(order.id)}
                  >
                    <TableCell className="font-mono font-medium">{order.code}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>{formatDateShort(order.orderDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[order.status]?.variant}>{statusMap[order.status]?.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(order.grandTotal)}</TableCell>
                    <TableCell className="text-center">{order._count.documents}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant={selectedOrder?.id === order.id ? "default" : "ghost"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedOrder?.id === order.id) {
                            setSelectedOrder(null);
                          } else {
                            fetchOrderDetail(order.id);
                          }
                        }}
                      >
                        {selectedOrder?.id === order.id ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
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
