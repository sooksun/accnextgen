"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Package, Wrench, ToggleLeft, ToggleRight, FolderOpen, X, Download, Globe, Zap, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useConfirm } from "@/components/ConfirmDialog";
import { formatNumber, formatDateShort } from "@/src/lib/utils";

interface ProductGroup {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category: "GOODS" | "SERVICE";
  groupId: string | null;
  group: { id: string; name: string } | null;
  unit: string;
  unitPrice: string;
  discount: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  scrapedAt: string | null;
  isActive: boolean;
}

const categoryLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  GOODS: { label: "สินค้า", icon: <Package className="h-3 w-3" />, color: "bg-blue-100 text-blue-800" },
  SERVICE: { label: "บริการ", icon: <Wrench className="h-3 w-3" />, color: "bg-purple-100 text-purple-800" },
};

const defaultUnits = ["ชิ้น", "ชุด", "อัน", "กล่อง", "แพ็ค", "ตัว", "งาน", "เดือน", "ครั้ง", "โครงการ", "รายการ"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Groups
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [showGroupMgr, setShowGroupMgr] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  // Fetch external
  const [showFetchDialog, setShowFetchDialog] = useState(false);
  const [fetchMethod, setFetchMethod] = useState<"scrape" | "api">("scrape");
  const [fetchSource, setFetchSource] = useState("");
  const [fetchKeyword, setFetchKeyword] = useState("");
  const [fetchUpdateExisting, setFetchUpdateExisting] = useState(false);
  const [fetchDryRun, setFetchDryRun] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success: boolean; stats?: Record<string, number>; log?: string; error?: string } | null>(null);
  const [apiProviders, setApiProviders] = useState<Record<string, { name: string; configured: boolean; docs: string }>>({});
  const confirm = useConfirm();

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    category: "GOODS" as string,
    groupId: "",
    unit: "ชิ้น",
    unitPrice: 0,
    discount: 0,
    imageUrl: "",
    sourceUrl: "",
    isActive: true,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search) params.set("search", search);
      if (catFilter) params.set("category", catFilter);
      if (groupFilter) params.set("groupId", groupFilter);
      if (showInactive) params.set("active", "false");
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) setProducts((await res.json()).data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, catFilter, groupFilter, showInactive]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/product-groups?count=true&active=false");
      if (res.ok) setGroups((await res.json()).data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    fetch("/api/products/fetch-external").then(r => r.json()).then(d => setApiProviders(d.providers || {})).catch(() => {});
  }, []);

  function resetForm() {
    setForm({ sku: "", name: "", description: "", category: "GOODS", groupId: "", unit: "ชิ้น", unitPrice: 0, discount: 0, imageUrl: "", sourceUrl: "", isActive: true });
    setEditingId(null);
    setFormError("");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  async function openEdit(product: Product) {
    setForm({
      sku: product.sku ?? "",
      name: product.name,
      description: product.description ?? "",
      category: product.category,
      groupId: product.groupId ?? "",
      unit: product.unit,
      unitPrice: Number(product.unitPrice),
      discount: product.discount ? Number(product.discount) : 0,
      imageUrl: product.imageUrl ?? "",
      sourceUrl: product.sourceUrl ?? "",
      isActive: product.isActive,
    });
    setEditingId(product.id);
    setShowForm(true);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sku: form.sku || null,
          description: form.description || null,
          groupId: form.groupId || null,
          unitPrice: Number(form.unitPrice),
          discount: form.discount ? Number(form.discount) : null,
          imageUrl: form.imageUrl || null,
          sourceUrl: form.sourceUrl || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchProducts();
        toast.success(editingId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสินค้า/บริการแล้ว");
      } else {
        const err = await res.json();
        setFormError(err.error || "เกิดข้อผิดพลาด");
        toast.error(err.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({ title: "ยืนยันการลบ", message: `ต้องการลบ "${name}" หรือไม่?`, variant: "danger", confirmLabel: "ลบ" });
    if (!ok) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
        toast.success("ลบรายการแล้ว");
      } else {
        const err = await res.json();
        toast.error(err.error || "ไม่สามารถลบได้");
      }
    } catch (err) { console.error(err); toast.error("ไม่สามารถเชื่อมต่อได้"); }
  }

  async function toggleActive(product: Product) {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) fetchProducts();
    } catch (err) { console.error(err); }
  }

  // Group management
  async function addGroup() {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch("/api/product-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      if (res.ok) { setNewGroupName(""); fetchGroups(); toast.success("เพิ่มหมวดหมู่แล้ว"); }
      else { const e = await res.json(); toast.error(e.error || "เกิดข้อผิดพลาด"); }
    } catch (err) { console.error(err); }
  }

  async function updateGroup(id: string, name: string) {
    try {
      const res = await fetch("/api/product-groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) { setEditingGroupId(null); fetchGroups(); }
    } catch (err) { console.error(err); }
  }

  async function deleteGroup(id: string, name: string) {
    const ok = await confirm({
      title: "ลบหมวดหมู่",
      message: `ลบหมวดหมู่ "${name}"?\nสินค้าที่อยู่ในหมวดนี้จะถูกย้ายเป็น "ไม่มีหมวดหมู่"`,
      variant: "danger",
      confirmLabel: "ลบ",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/product-groups?id=${id}`, { method: "DELETE" });
      if (res.ok) { fetchGroups(); fetchProducts(); toast.success("ลบหมวดหมู่แล้ว"); }
      else toast.error("ไม่สามารถลบได้");
    } catch (err) { console.error(err); toast.error("ไม่สามารถเชื่อมต่อได้"); }
  }

  async function handleFetchExternal() {
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch("/api/products/fetch-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: fetchMethod,
          source: fetchSource || (fetchMethod === "scrape" ? "demo" : "demo-shopee"),
          keyword: fetchKeyword,
          limit: 50,
          dryRun: fetchDryRun,
          updateExisting: fetchUpdateExisting,
          matchBy: "sku",
        }),
      });
      const data = await res.json();
      setFetchResult(data);
      if (data.success && !fetchDryRun) {
        fetchProducts();
      }
    } catch (err) {
      setFetchResult({ success: false, error: "ไม่สามารถเชื่อมต่อได้" });
    } finally {
      setFetching(false);
    }
  }

  const goodsCount = products.filter(p => p.category === "GOODS").length;
  const serviceCount = products.filter(p => p.category === "SERVICE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">สินค้า/บริการ</h1>
          <p className="text-slate-500 mt-1">จัดการรายการสินค้าและบริการ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowFetchDialog(!showFetchDialog); setFetchResult(null); }}>
            <Download className="h-4 w-4 mr-2" /> ดึงสินค้าจากภายนอก
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> เพิ่มสินค้า/บริการ
          </Button>
        </div>
      </div>

      {/* Fetch External Dialog */}
      {showFetchDialog && (
        <Card className="border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                <Download className="h-4 w-4" /> ดึงสินค้าจากภายนอก
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowFetchDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* สถานะการใช้งาน */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <div className="font-medium text-slate-700 mb-1">สถานะการใช้งาน</div>
              <ul className="list-disc list-inside space-y-0.5">
                <li><strong>Demo</strong> — ใช้ได้ทันที (ข้อมูลตัวอย่างจากสคริปต์)</li>
                {fetchMethod === "scrape" ? (
                  <li><strong>Scraping จริง</strong> — เลือก &quot;ระบุ URL เอง&quot; แล้วใส่ลิงก์หน้าเว็บ (ผลลัพธ์ขึ้นกับโครงหน้าเว็บและอาจถูกจำกัด)</li>
                ) : (
                  <li><strong>API จริง</strong> — ต้องตั้งค่า API Key ในไฟล์ .env ของแต่ละแพลตฟอร์มก่อน</li>
                )}
              </ul>
            </div>

            {/* Method Toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={fetchMethod === "scrape" ? "default" : "outline"}
                onClick={() => { setFetchMethod("scrape"); setFetchSource(""); }}
                className={fetchMethod === "scrape" ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                <Globe className="h-4 w-4 mr-1" /> Feature 1: Web Scraping
              </Button>
              <Button
                size="sm"
                variant={fetchMethod === "api" ? "default" : "outline"}
                onClick={() => { setFetchMethod("api"); setFetchSource(""); }}
                className={fetchMethod === "api" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                <Zap className="h-4 w-4 mr-1" /> Feature 2: Official API
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Source Select */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">แหล่งข้อมูล</label>
                {fetchMethod === "scrape" ? (
                  <select value={fetchSource} onChange={(e) => setFetchSource(e.target.value)}
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">-- เลือกเว็บไซต์ --</option>
                    <optgroup label="Demo (ทดสอบ)">
                      <option value="demo">Demo ทั่วไป</option>
                      <option value="demo-jib">Demo JIB</option>
                      <option value="demo-banana">Demo BaNANA</option>
                      <option value="demo-shopee">Demo Shopee</option>
                      <option value="demo-lazada">Demo Lazada</option>
                      <option value="demo-lotuss">Demo Lotus&apos;s</option>
                      <option value="demo-bigc">Demo BigC</option>
                      <option value="demo-lnwshop">Demo LnwShop</option>
                    </optgroup>
                    <optgroup label="Scrape จริง (ต้องมี URL)">
                      <option value="url">ระบุ URL เอง</option>
                    </optgroup>
                  </select>
                ) : (
                  <select value={fetchSource} onChange={(e) => setFetchSource(e.target.value)}
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">-- เลือก API --</option>
                    <optgroup label="Demo (ทดสอบ)">
                      <option value="demo-lnwshop">Demo LnwShop API</option>
                      <option value="demo-shopee">Demo Shopee API</option>
                      <option value="demo-lazada">Demo Lazada API</option>
                      <option value="demo-bigc">Demo BigC API</option>
                    </optgroup>
                    <optgroup label="Official API (ต้องตั้งค่า API Key)">
                      {Object.entries(apiProviders).map(([key, p]) => (
                        <option key={key} value={key} disabled={!p.configured}>
                          {p.name} {p.configured ? "✓" : "(ยังไม่ตั้งค่า)"}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                )}
              </div>

              {/* Keyword */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">คำค้นหา (ไม่บังคับ)</label>
                <Input
                  placeholder="เช่น printer, กระดาษ A4"
                  value={fetchKeyword}
                  onChange={(e) => setFetchKeyword(e.target.value)}
                />
              </div>

              {/* URL input for custom scraping */}
              {fetchMethod === "scrape" && fetchSource === "url" && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">URL เว็บไซต์</label>
                  <Input
                    placeholder="https://www.jib.co.th/web/product/..."
                    value={fetchKeyword}
                    onChange={(e) => setFetchKeyword(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Options */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={fetchUpdateExisting} onChange={(e) => setFetchUpdateExisting(e.target.checked)} className="rounded" />
                อัปเดตรายการที่มีอยู่แล้ว
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={fetchDryRun} onChange={(e) => setFetchDryRun(e.target.checked)} className="rounded" />
                ดูตัวอย่างก่อน (Dry Run)
              </label>
            </div>

            {/* Action */}
            <div className="flex items-center gap-3">
              <Button onClick={handleFetchExternal} disabled={fetching || !fetchSource}>
                {fetching ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> กำลังดึงข้อมูล...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" /> ดึงสินค้า</>
                )}
              </Button>
              <span className="text-xs text-slate-400">
                {fetchMethod === "scrape" ? "🌐 Feature 1: ดึงจากหน้าเว็บ" : "⚡ Feature 2: ดึงจาก Official API"}
              </span>
            </div>

            {/* Result */}
            {fetchResult && (
              <div className={`p-3 rounded-lg text-sm ${fetchResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                {fetchResult.success ? (
                  <div>
                    <div className="font-medium text-green-800 mb-1">
                      {fetchDryRun ? "✓ ตัวอย่างข้อมูล (ยังไม่บันทึก)" : "✓ ดึงข้อมูลสำเร็จ!"}
                    </div>
                    <div className="text-green-700 space-x-4">
                      <span>พบ: {fetchResult.stats?.total ?? 0}</span>
                      <span>นำเข้า: {fetchResult.stats?.imported ?? 0}</span>
                      <span>อัปเดต: {fetchResult.stats?.updated ?? 0}</span>
                      <span>ข้าม: {fetchResult.stats?.skipped ?? 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-800">
                    <div className="font-medium mb-1">✗ เกิดข้อผิดพลาด</div>
                    <div className="text-xs whitespace-pre-wrap">{fetchResult.error}</div>
                  </div>
                )}
              </div>
            )}

            {/* Provider status */}
            {fetchMethod === "api" && Object.keys(apiProviders).length > 0 && (
              <div className="text-xs text-slate-400 border-t pt-3">
                <div className="font-medium mb-1">สถานะ API Providers:</div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(apiProviders).map(([key, p]) => (
                    <a key={key} href={p.docs} target="_blank" rel="noopener noreferrer"
                      className={`px-2 py-1 rounded ${p.configured ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.configured ? "✓" : "✗"} {p.name}
                    </a>
                  ))}
                </div>
                <div className="mt-1 text-slate-400">ตั้งค่า API Keys ในไฟล์ .env เพื่อเชื่อมต่อ API จริง</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer" onClick={() => setCatFilter("")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg"><Package className="h-5 w-5 text-slate-600" /></div>
            <div>
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-xs text-slate-500">ทั้งหมด</div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setCatFilter("GOODS")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Package className="h-5 w-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{goodsCount}</div>
              <div className="text-xs text-slate-500">สินค้า</div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setCatFilter("SERVICE")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Wrench className="h-5 w-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{serviceCount}</div>
              <div className="text-xs text-slate-500">บริการ</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="ค้นหาชื่อ, SKU, รายละเอียด..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white">
          <option value="">ทุกประเภท</option>
          <option value="GOODS">สินค้า</option>
          <option value="SERVICE">บริการ</option>
        </select>
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white">
          <option value="">ทุกหมวดหมู่</option>
          <option value="none">ไม่มีหมวดหมู่</option>
          {groups.filter(g => g.isActive).map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g._count?.products ?? 0})</option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={() => setShowGroupMgr(!showGroupMgr)}>
          <FolderOpen className="h-4 w-4 mr-1" /> จัดการหมวดหมู่
        </Button>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
          แสดงที่ปิดใช้งาน
        </label>
      </div>

      {/* Group Manager */}
      {showGroupMgr && (
        <Card className="border-amber-200 shadow-md">
          <CardHeader className="bg-amber-50 border-b border-amber-100 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" /> จัดการหมวดหมู่สินค้า
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowGroupMgr(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Add new group */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="ชื่อหมวดหมู่ใหม่ เช่น อุปกรณ์สำนักงาน"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGroup()}
                className="flex-1"
              />
              <Button onClick={addGroup} disabled={!newGroupName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> เพิ่ม
              </Button>
            </div>
            {/* Group list */}
            <div className="space-y-2">
              {groups.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีหมวดหมู่</p>
              ) : (
                groups.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    {editingGroupId === g.id ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && updateGroup(g.id, editingGroupName)}
                          className="flex-1 h-8"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => updateGroup(g.id, editingGroupName)}>บันทึก</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingGroupId(null)}>ยกเลิก</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-sm">{g.name}</span>
                          <span className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">
                            {g._count?.products ?? 0} รายการ
                          </span>
                          {!g.isActive && <span className="text-xs text-red-400">(ปิดใช้งาน)</span>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingGroupId(g.id); setEditingGroupName(g.name); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteGroup(g.id, g.name)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <CardTitle className="text-lg text-blue-900">
              {editingId ? "แก้ไขสินค้า/บริการ" : "เพิ่มสินค้า/บริการใหม่"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{formError}</div>
              )}

              {/* Category Toggle */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">ประเภท *</label>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, category: "GOODS", unit: "ชิ้น" }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      form.category === "GOODS" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"
                    }`}>
                    <Package className="h-4 w-4" /> สินค้า
                  </button>
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, category: "SERVICE", unit: "งาน" }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      form.category === "SERVICE" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-500"
                    }`}>
                    <Wrench className="h-4 w-4" /> บริการ
                  </button>
                </div>
              </div>

              {/* Group selector */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">หมวดหมู่</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                  className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                  {groups.filter(g => g.isActive).map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">รหัส SKU</label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="เช่น PRD-001" />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium">ชื่อสินค้า/บริการ *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">สถานะ</label>
                  <div className="flex items-center gap-2 h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                      <span className="text-sm">{form.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">หน่วยนับ *</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {defaultUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">ราคาต่อหน่วย (บาท) *</label>
                  <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} min={0} step="0.01" required className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium">ส่วนลด (บาท)</label>
                  <Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} min={0} step="0.01" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium">ราคาสุทธิ</label>
                  <div className="h-10 flex items-center font-mono text-green-600 font-bold">
                    {formatNumber(form.unitPrice - (form.discount || 0))} บาท
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">รายละเอียด</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">URL รูปภาพ</label>
                  <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm font-medium">URL แหล่งที่มา</label>
                  <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "เพิ่มสินค้า/บริการ")}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>ยกเลิก</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-24">รหัส (SKU)</TableHead>
                <TableHead>ชื่อสินค้า/บริการ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">ราคา/หน่วย</TableHead>
                <TableHead className="text-right">ส่วนลด</TableHead>
                <TableHead className="text-right">ราคาสุทธิ</TableHead>
                <TableHead className="text-center">แหล่ง</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" /> กำลังโหลด...
                  </div>
                </TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-slate-300" />
                    <span>ยังไม่มีรายการสินค้า/บริการ</span>
                    <Button size="sm" variant="outline" onClick={openCreate}>
                      <Plus className="h-3 w-3 mr-1" /> เพิ่มรายการแรก
                    </Button>
                  </div>
                </TableCell></TableRow>
              ) : (
                products.map((product) => {
                  const price = Number(product.unitPrice);
                  const disc = product.discount ? Number(product.discount) : 0;
                  const netPrice = price - disc;
                  return (
                  <TableRow key={product.id} className={product.isActive ? "" : "opacity-50"}>
                    <TableCell className="w-12 p-1">
                      {product.imageUrl ? (
                        <div className="relative w-10 h-10">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded border"
                            loading="lazy"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = "none";
                              const fallback = img.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center absolute inset-0" style={{ display: "none" }}>
                            <Package className="h-4 w-4 text-slate-300" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-500">{product.sku ?? "-"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.description && <div className="text-xs text-slate-400 truncate max-w-xs">{product.description}</div>}
                      {product.scrapedAt && <div className="text-[10px] text-slate-300">ดึงข้อมูล: {formatDateShort(product.scrapedAt)}</div>}
                    </TableCell>
                    <TableCell>
                      {product.group ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                          <FolderOpen className="h-3 w-3" />
                          {product.group.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${categoryLabels[product.category].color}`}>
                        {categoryLabels[product.category].icon}
                        {categoryLabels[product.category].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(product.unitPrice)}</TableCell>
                    <TableCell className="text-right font-mono text-red-500">
                      {disc > 0 ? `-${formatNumber(disc)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">{formatNumber(netPrice)}</TableCell>
                    <TableCell className="text-center">
                      {product.sourceUrl ? (
                        <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-xs underline" title={product.sourceUrl}>🔗</a>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleActive(product)} className="text-sm" title={product.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}>
                        {product.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-slate-300" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
