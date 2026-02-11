"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  Calendar,
} from "lucide-react";
import { formatNumber, formatDateShort, formatDate } from "@/src/lib/utils";

interface Project {
  id: string;
  code: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  customer: { name: string };
  unit: { name: string } | null;
  milestones: {
    id: string;
    title: string;
    amount: string;
    dueDate: string | null;
    isBilled: boolean;
  }[];
  _count: { documents: number };
}

interface ProjectDetail {
  id: string;
  code: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  note?: string | null;
  customer: {
    id: string;
    name: string;
    taxId: string | null;
  };
  unit: { id: string; name: string } | null;
  milestones: {
    id: string;
    title: string;
    amount: string;
    dueDate: string | null;
    isBilled: boolean;
  }[];
  documents: {
    id: string;
    number: string;
    type: string;
    grandTotal: string;
  }[];
  attachments: { id: string; fileName: string }[];
}

const DOC_TYPE_LABELS: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา",
  INVOICE: "ใบแจ้งหนี้",
  TAX_INVOICE_RECEIPT: "ใบกำกับภาษี+ใบเสร็จ",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<
    { id: string; name: string; units: { id: string; name: string }[] }[]
  >([]);
  const [form, setForm] = useState({
    customerId: "",
    unitId: "",
    title: "",
    startDate: "",
    endDate: "",
    milestones: [{ title: "", amount: 0, dueDate: "" }],
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editingProject, setEditingProject] =
    useState<ProjectDetail | null>(null);
  const [detailProject, setDetailProject] = useState<ProjectDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [milestoneToggling, setMilestoneToggling] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchProjects();
  }, [search]);
  useEffect(() => {
    if (showForm) fetchCustomers();
  }, [showForm]);

  async function fetchProjects() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/projects?${params}`);
      if (res.ok) setProjects((await res.json()).data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers?limit=100");
      if (res.ok) setCustomers((await res.json()).data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchProjectDetail(id: string) {
    setDetailLoading(true);
    setDetailProject(null);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) setDetailProject(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }

  function openDetail(project: Project) {
    if (detailProject?.id === project.id) {
      setDetailProject(null);
    } else {
      fetchProjectDetail(project.id);
    }
  }

  function openEdit(project: ProjectDetail) {
    setEditId(project.id);
    setEditingProject(project);
    setForm({
      customerId: project.customer.id,
      unitId: project.unit?.id ?? "",
      title: project.title,
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().slice(0, 10)
        : "",
      endDate: project.endDate
        ? new Date(project.endDate).toISOString().slice(0, 10)
        : "",
      milestones:
        project.milestones.length > 0
          ? project.milestones.map((m) => ({
              title: m.title,
              amount: Number(m.amount),
              dueDate: m.dueDate
                ? new Date(m.dueDate).toISOString().slice(0, 10)
                : "",
            }))
          : [{ title: "", amount: 0, dueDate: "" }],
    });
    setShowForm(true);
    setDetailProject(null);
  }

  function closeEdit() {
    setEditId(null);
    setEditingProject(null);
    setShowForm(false);
    setForm({
      customerId: "",
      unitId: "",
      title: "",
      startDate: "",
      endDate: "",
      milestones: [{ title: "", amount: 0, dueDate: "" }],
    });
    fetchProjects();
  }

  function addMilestone() {
    setForm({
      ...form,
      milestones: [
        ...form.milestones,
        { title: "", amount: 0, dueDate: "" },
      ],
    });
  }

  function updateMilestone(
    idx: number,
    field: string,
    value: string | number
  ) {
    const ms = [...form.milestones];
    ms[idx] = { ...ms[idx], [field]: value };
    setForm({ ...form, milestones: ms });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = {
        ...form,
        unitId: form.unitId || undefined,
        milestones: form.milestones
          .filter((m) => m.title)
          .map((m) => ({
            ...m,
            amount: Number(m.amount),
            dueDate: m.dueDate || undefined,
          })),
      };
      const url = editId ? `/api/projects/${editId}` : "/api/projects";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        closeEdit();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("คุณต้องการลบโครงการนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDetailProject(null);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleMilestoneBilled(milestoneId: string) {
    if (!detailProject) return;
    setMilestoneToggling(milestoneId);
    try {
      const updated = detailProject.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, isBilled: !m.isBilled }
          : m
      );
      const milestones = updated.map((m) => ({
        id: m.id,
        title: m.title,
        amount: Number(m.amount),
        dueDate: m.dueDate,
        isBilled: m.isBilled,
      }));
      const res = await fetch(`/api/projects/${detailProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestones }),
      });
      if (res.ok) {
        const data = await res.json();
        setDetailProject({
          ...detailProject,
          milestones: data.milestones ?? detailProject.milestones.map((m) =>
            m.id === milestoneId
              ? { ...m, isBilled: !m.isBilled }
              : m
          ),
        });
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMilestoneToggling(null);
    }
  }

  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const totalMilestone = form.milestones.reduce(
    (sum, m) => sum + Number(m.amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">โครงการ</h1>
          <p className="text-slate-500 mt-1">
            จัดการโครงการงานบริการและงวดงาน
          </p>
        </div>
        <Button
          onClick={() => {
            setEditId(null);
            setShowForm(!showForm);
            setForm({
              customerId: "",
              unitId: "",
              title: "",
              startDate: "",
              endDate: "",
              milestones: [{ title: "", amount: 0, dueDate: "" }],
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> สร้างโครงการ
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาชื่อ/รหัสโครงการ, ลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editId ? "แก้ไขโครงการ" : "สร้างโครงการใหม่"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ลูกค้า *</label>
                  {editId ? (
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                      {selectedCustomer?.name ?? editingProject?.customer?.name ?? "-"}
                    </div>
                  ) : (
                    <select
                      value={form.customerId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          customerId: e.target.value,
                          unitId: "",
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">เลือกลูกค้า</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">หน่วยงานย่อย</label>
                  <select
                    value={form.unitId}
                    onChange={(e) =>
                      setForm({ ...form, unitId: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">ไม่ระบุ</option>
                    {(selectedCustomer?.units ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">ชื่อโครงการ *</label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">วันเริ่ม</label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">วันสิ้นสุด</label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    งวดงาน (Milestones)
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addMilestone}
                  >
                    + เพิ่มงวด
                  </Button>
                </div>
                {form.milestones.map((ms, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 mb-2"
                  >
                    <div className="col-span-5">
                      <Input
                        placeholder="ชื่องวดงาน"
                        value={ms.title}
                        onChange={(e) =>
                          updateMilestone(idx, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="จำนวนเงิน"
                        value={ms.amount}
                        onChange={(e) =>
                          updateMilestone(idx, "amount", Number(e.target.value))
                        }
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="date"
                        value={ms.dueDate}
                        onChange={(e) =>
                          updateMilestone(idx, "dueDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      {form.milestones.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setForm({
                              ...form,
                              milestones: form.milestones.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                          className="text-red-500"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-right text-sm mt-1">
                  รวมงวดงาน:{" "}
                  <span className="font-bold font-mono">
                    {formatNumber(totalMilestone)}
                  </span>{" "}
                  บาท
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editId ? "บันทึกการแก้ไข" : "สร้างโครงการ"}
                </Button>
                <Button type="button" variant="outline" onClick={closeEdit}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>ชื่อโครงการ</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>หน่วยงาน</TableHead>
                    <TableHead>ระยะเวลา</TableHead>
                    <TableHead>งวดงาน</TableHead>
                    <TableHead className="text-right">มูลค่ารวม</TableHead>
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
                  ) : projects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-slate-400"
                      >
                        ไม่พบโครงการ
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => {
                      const totalAmt = project.milestones.reduce(
                        (sum, m) => sum + Number(m.amount),
                        0
                      );
                      const billedCount = project.milestones.filter(
                        (m) => m.isBilled
                      ).length;
                      const isSelected =
                        detailProject?.id === project.id;
                      return (
                        <TableRow
                          key={project.id}
                          className={
                            isSelected
                              ? "bg-blue-50 hover:bg-blue-100 cursor-pointer"
                              : "cursor-pointer hover:bg-slate-50"
                          }
                          onClick={() => openDetail(project)}
                        >
                          <TableCell className="font-mono font-medium">
                            {project.code}
                          </TableCell>
                          <TableCell>{project.title}</TableCell>
                          <TableCell>{project.customer.name}</TableCell>
                          <TableCell>{project.unit?.name ?? "-"}</TableCell>
                          <TableCell className="text-sm">
                            {project.startDate
                              ? formatDateShort(project.startDate)
                              : "?"}{" "}
                            -{" "}
                            {project.endDate
                              ? formatDateShort(project.endDate)
                              : "?"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {billedCount > 0 && (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              )}
                              <span className="text-sm">
                                {billedCount}/{project.milestones.length} งวด
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(totalAmt)}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openDetail(project)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

        {detailLoading && (
          <Card className="w-[420px] shrink-0 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                รายละเอียดโครงการ
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12 text-center text-slate-500">
              กำลังโหลด...
            </CardContent>
          </Card>
        )}

        {detailProject && !detailLoading && (
          <Card className="w-[420px] shrink-0 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50 flex flex-row items-start justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                {detailProject.code}
              </CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDetailProject(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  {detailProject.title}
                </h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>
                    <span className="text-slate-500">ลูกค้า:</span>{" "}
                    {detailProject.customer.name}
                  </p>
                  {detailProject.customer.taxId && (
                    <p className="font-mono text-xs">
                      เลขประจำตัวผู้เสียภาษี: {detailProject.customer.taxId}
                    </p>
                  )}
                  <p>
                    <span className="text-slate-500">หน่วยงาน:</span>{" "}
                    {detailProject.unit?.name ?? "-"}
                  </p>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {detailProject.startDate ? (
                      <span>
                        {formatDate(detailProject.startDate)}
                        {detailProject.endDate &&
                          ` - ${formatDate(detailProject.endDate)}`}
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium mb-2">งวดงาน</h5>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>งวด</TableHead>
                      <TableHead className="text-right">จำนวนเงิน</TableHead>
                      <TableHead>ครบกำหนด</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailProject.milestones.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(m.amount)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.dueDate ? formatDateShort(m.dueDate) : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={
                              m.isBilled
                                ? "text-green-600 hover:text-green-700"
                                : "text-slate-300 hover:text-slate-500"
                            }
                            disabled={milestoneToggling === m.id}
                            onClick={() => toggleMilestoneBilled(m.id)}
                            title={m.isBilled ? "งวดออกบัญชีแล้ว" : "คลิกเพื่อทำเครื่องหมายงวดออกบัญชี"}
                          >
                            {m.isBilled ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {detailProject.milestones.length > 0 && (() => {
                const totalAmt = detailProject.milestones.reduce(
                  (s, m) => s + Number(m.amount),
                  0
                );
                const billedAmt = detailProject.milestones
                  .filter((m) => m.isBilled)
                  .reduce((s, m) => s + Number(m.amount), 0);
                const pct = totalAmt > 0 ? (billedAmt / totalAmt) * 100 : 0;
                return (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">ความคืบหน้างวดออกบัญชี</span>
                    <span className="font-medium">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>
                      ออกแล้ว: {formatNumber(billedAmt)} บาท
                    </span>
                    <span>รวม: {formatNumber(totalAmt)} บาท</span>
                  </div>
                </div>
                );
              })()}

              {detailProject.documents.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    เอกสารที่เกี่ยวข้อง
                  </h5>
                  <ul className="space-y-1 text-sm">
                    {detailProject.documents.map((d) => (
                      <li
                        key={d.id}
                        className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0"
                      >
                        <span>
                          {DOC_TYPE_LABELS[d.type] ?? d.type} {d.number}
                        </span>
                        <span className="font-mono">
                          {formatNumber(d.grandTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailProject.attachments.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">ไฟล์แนบ</h5>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {detailProject.attachments.map((a) => (
                      <li key={a.id}>{a.fileName}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(detailProject)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  แก้ไข
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(detailProject.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  ลบ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
