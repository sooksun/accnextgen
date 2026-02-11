"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Eye,
  X,
  Pencil,
  Trash2,
  Building2,
  GraduationCap,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { formatNumber } from "@/src/lib/utils";

// ==================== Types ====================

interface CustomerUnit {
  id: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
}

interface Customer {
  id: string;
  name: string;
  type: "COMPANY" | "SCHOOL" | "INDIVIDUAL";
  taxId: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  units: CustomerUnit[];
  _count: { orders: number; projects: number; documents: number };
}

interface CustomerDetail extends Customer {
  orders: { id: string; code: string; status: string; grandTotal: string }[];
  projects: { id: string; code: string; title: string }[];
  documents: { id: string; number: string; type: string; grandTotal: string }[];
}

// ==================== Constants ====================

const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  COMPANY: { label: "บริษัท", icon: <Building2 className="h-4 w-4" /> },
  SCHOOL: { label: "สถานศึกษา", icon: <GraduationCap className="h-4 w-4" /> },
  INDIVIDUAL: { label: "บุคคล", icon: <User className="h-4 w-4" /> },
};

// ==================== Component ====================

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "COMPANY" as string,
    taxId: "",
    address: "",
    email: "",
    phone: "",
  });

  // Detail panel
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Unit form (inline add)
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState({
    name: "",
    contactName: "",
    contactPhone: "",
  });

  // ==================== Fetching ====================

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(search)}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data ?? []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function fetchCustomerDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
      }
    } catch (err) {
      console.error("Fetch detail error:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  function openDetail(id: string) {
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    } else {
      fetchCustomerDetail(id);
    }
  }

  // ==================== Form Handlers ====================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchCustomers();
        if (selectedCustomer?.id === editingId) {
          fetchCustomerDetail(editingId);
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบลูกค้านี้หรือไม่?")) return;
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      fetchCustomers();
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleEdit(customer: Customer) {
    // Fetch full detail to get address (list API may not include it)
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (res.ok) {
        const full: Customer & { address?: string } = await res.json();
        setForm({
          name: full.name,
          type: full.type,
          taxId: full.taxId ?? "",
          address: full.address ?? "",
          email: full.email ?? "",
          phone: full.phone ?? "",
        });
      } else {
        setForm({
          name: customer.name,
          type: customer.type,
          taxId: customer.taxId ?? "",
          address: "",
          email: customer.email ?? "",
          phone: customer.phone ?? "",
        });
      }
    } catch {
      setForm({
        name: customer.name,
        type: customer.type,
        taxId: customer.taxId ?? "",
        address: "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
      });
    }
    setEditingId(customer.id);
    setShowForm(true);
  }

  function resetForm() {
    setForm({
      name: "",
      type: "COMPANY",
      taxId: "",
      address: "",
      email: "",
      phone: "",
    });
  }

  // ==================== Unit CRUD ====================

  async function handleAddUnit() {
    if (!selectedCustomer || !unitForm.name.trim()) return;
    try {
      const res = await fetch("/api/customer-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          name: unitForm.name.trim(),
          contactName: unitForm.contactName.trim() || undefined,
          contactPhone: unitForm.contactPhone.trim() || undefined,
        }),
      });
      if (res.ok) {
        setUnitForm({ name: "", contactName: "", contactPhone: "" });
        setShowUnitForm(false);
        fetchCustomerDetail(selectedCustomer.id);
        fetchCustomers();
      }
    } catch (err) {
      console.error("Add unit error:", err);
    }
  }

  async function handleDeleteUnit(unitId: string) {
    if (!selectedCustomer) return;
    if (!confirm("ต้องการลบหน่วยงานนี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/customer-units?id=${unitId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCustomerDetail(selectedCustomer.id);
        fetchCustomers();
      }
    } catch (err) {
      console.error("Delete unit error:", err);
    }
  }

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ลูกค้า</h1>
          <p className="text-slate-500 mt-1">
            จัดการข้อมูลลูกค้าและหน่วยงานย่อย
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มลูกค้า
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาชื่อ, เลขผู้เสียภาษี, อีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "แก้ไขลูกค้า" : "เพิ่มลูกค้าใหม่"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-sm font-medium">ชื่อ *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">ประเภท</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="COMPANY">บริษัท</option>
                  <option value="SCHOOL">สถานศึกษา</option>
                  <option value="INDIVIDUAL">บุคคล</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">เลขผู้เสียภาษี</label>
                <Input
                  value={form.taxId}
                  onChange={(e) =>
                    setForm({ ...form, taxId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">โทรศัพท์</label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">อีเมล</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">ที่อยู่</label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">
                  {editingId ? "บันทึก" : "เพิ่มลูกค้า"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Detail Panel */}
      {selectedCustomer && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg text-blue-900">
                  {selectedCustomer.name}
                </CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {typeLabels[selectedCustomer.type]?.icon}
                  {typeLabels[selectedCustomer.type]?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(selectedCustomer)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  แก้ไข
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(selectedCustomer.id)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  ลบ
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedCustomer(null)}
                >
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
                {/* Customer Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">
                      ข้อมูลลูกค้า
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-lg">
                          {selectedCustomer.name}
                        </span>
                      </div>
                      {selectedCustomer.taxId && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-mono">
                            {selectedCustomer.taxId}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>{selectedCustomer.address}</span>
                        </div>
                      )}
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">
                      สรุปกิจกรรม
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedCustomer.orders?.length ?? 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          ออเดอร์ล่าสุด
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedCustomer.projects?.length ?? 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          โครงการล่าสุด
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedCustomer.documents?.length ?? 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          เอกสารล่าสุด
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Units Section */}
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">
                    หน่วยงาน ({selectedCustomer.units?.length ?? 0})
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.units?.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                      >
                        <div>
                          <div className="font-medium">{unit.name}</div>
                          {(unit.contactName || unit.contactPhone) && (
                            <div className="text-sm text-slate-500">
                              {unit.contactName}
                              {unit.contactName && unit.contactPhone && " · "}
                              {unit.contactPhone}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {showUnitForm ? (
                      <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            placeholder="ชื่อหน่วยงาน *"
                            value={unitForm.name}
                            onChange={(e) =>
                              setUnitForm({ ...unitForm, name: e.target.value })
                            }
                          />
                          <Input
                            placeholder="ชื่อผู้ติดต่อ"
                            value={unitForm.contactName}
                            onChange={(e) =>
                              setUnitForm({
                                ...unitForm,
                                contactName: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="เบอร์โทร"
                            value={unitForm.contactPhone}
                            onChange={(e) =>
                              setUnitForm({
                                ...unitForm,
                                contactPhone: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddUnit}
                            disabled={!unitForm.name.trim()}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            บันทึก
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowUnitForm(false);
                              setUnitForm({
                                name: "",
                                contactName: "",
                                contactPhone: "",
                              });
                            }}
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUnitForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มหน่วยงาน
                      </Button>
                    )}
                  </div>
                </div>

                {/* Recent Orders/Projects/Documents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedCustomer.orders?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">
                        ออเดอร์ล่าสุด
                      </h4>
                      <div className="space-y-1">
                        {selectedCustomer.orders.slice(0, 5).map((o) => (
                          <div
                            key={o.id}
                            className="text-sm flex justify-between py-1 border-b border-slate-100 last:border-0"
                          >
                            <span className="font-mono">{o.code}</span>
                            <span className="font-mono text-slate-600">
                              {formatNumber(o.grandTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCustomer.projects?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">
                        โครงการล่าสุด
                      </h4>
                      <div className="space-y-1">
                        {selectedCustomer.projects.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            className="text-sm py-1 border-b border-slate-100 last:border-0"
                          >
                            <span className="font-mono">{p.code}</span>{" "}
                            {p.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCustomer.documents?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">
                        เอกสารล่าสุด
                      </h4>
                      <div className="space-y-1">
                        {selectedCustomer.documents.slice(0, 5).map((d) => (
                          <div
                            key={d.id}
                            className="text-sm flex justify-between py-1 border-b border-slate-100 last:border-0"
                          >
                            <span className="font-mono">{d.number}</span>
                            <span className="font-mono text-slate-600">
                              {formatNumber(d.grandTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>เลขผู้เสียภาษี</TableHead>
                <TableHead>หน่วยงานย่อย</TableHead>
                <TableHead className="text-center">ออเดอร์</TableHead>
                <TableHead className="text-center">โครงการ</TableHead>
                <TableHead className="text-center">เอกสาร</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                    ไม่พบข้อมูลลูกค้า
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className={`cursor-pointer ${
                      selectedCustomer?.id === customer.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => openDetail(customer.id)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 w-fit"
                      >
                        {typeLabels[customer.type]?.icon}
                        {typeLabels[customer.type]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {customer.taxId ?? "-"}
                    </TableCell>
                    <TableCell>
                      {customer.units && customer.units.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.units.map((u) => (
                            <Badge
                              key={u.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {u.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {customer._count?.orders ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {customer._count?.projects ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {customer._count?.documents ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant={
                            selectedCustomer?.id === customer.id
                              ? "default"
                              : "ghost"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedCustomer?.id === customer.id) {
                              setSelectedCustomer(null);
                            } else {
                              fetchCustomerDetail(customer.id);
                            }
                          }}
                        >
                          {selectedCustomer?.id === customer.id ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
