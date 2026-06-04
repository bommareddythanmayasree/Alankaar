import { useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2, Download } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

type BranchRecord = {
  id: string;
  branchName: string;
  manager: string;
  address: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
};

const seedBranches: BranchRecord[] = [
  { id: "BR-001", branchName: "Gandhi Nagar",     manager: "Ravi Kumar",      address: "Gandhi Nagar, Vijayawada, AP",     phone: "+91 98480 11001", email: "gandhinagar@alankar.com",     status: "Active" },
  { id: "BR-002", branchName: "Mutyalammapadu",   manager: "Suresh Babu",     address: "Mutyalammapadu, Vijayawada, AP",   phone: "+91 98480 11002", email: "mutyalammapadu@alankar.com",  status: "Active" },
  { id: "BR-003", branchName: "Gayatri Nagar",    manager: "Prasad Rao",      address: "Gayatri Nagar, Vijayawada, AP",    phone: "+91 98480 11003", email: "gayatrinagar@alankar.com",    status: "Active" },
  { id: "BR-004", branchName: "Ayyappa Nagar",    manager: "Venkat Reddy",    address: "Ayyappa Nagar, Vijayawada, AP",    phone: "+91 98480 11004", email: "ayyappanagar@alankar.com",    status: "Active" },
  { id: "BR-005", branchName: "Gannavaram",        manager: "Kiran Varma",     address: "Gannavaram, Krishna Dist, AP",     phone: "+91 98480 11005", email: "gannavaram@alankar.com",      status: "Active" },
  { id: "BR-006", branchName: "Machavaram",        manager: "Sai Teja",        address: "Machavaram, Vijayawada, AP",       phone: "+91 98480 11006", email: "machavaram@alankar.com",      status: "Active" },
  { id: "BR-007", branchName: "Gunadala",          manager: "Naresh Kumar",    address: "Gunadala, Vijayawada, AP",         phone: "+91 98480 11007", email: "gunadala@alankar.com",        status: "Active" },
  { id: "BR-008", branchName: "Governerpet",       manager: "Ramakrishna",     address: "Governerpet, Vijayawada, AP",      phone: "+91 98480 11008", email: "governerpet@alankar.com",     status: "Active" },
  { id: "BR-009", branchName: "Singh Nagar",       manager: "Hari Prasad",     address: "Singh Nagar, Vijayawada, AP",      phone: "+91 98480 11009", email: "singhnagar@alankar.com",      status: "Active" },
  { id: "BR-010", branchName: "Poranki",           manager: "Vijay Mohan",     address: "Poranki, Krishna Dist, AP",        phone: "+91 98480 11010", email: "poranki@alankar.com",         status: "Active" },
  { id: "BR-011", branchName: "Kanuru",            manager: "Surya Rao",       address: "Kanuru, Vijayawada, AP",           phone: "+91 98480 11011", email: "kanuru@alankar.com",          status: "Active" },
  { id: "BR-012", branchName: "Auto Nagar",        manager: "Bhaskar Reddy",   address: "Auto Nagar, Vijayawada, AP",       phone: "+91 98480 11012", email: "autonagar@alankar.com",       status: "Active" },
  { id: "BR-013", branchName: "Benz Circle",       manager: "Mahesh Kumar",    address: "Benz Circle, Vijayawada, AP",      phone: "+91 98480 11013", email: "benzcircle@alankar.com",      status: "Active" },
  { id: "BR-014", branchName: "Vinchipeta",        manager: "Arun Teja",       address: "Vinchipeta, Vijayawada, AP",       phone: "+91 98480 11014", email: "vinchipeta@alankar.com",      status: "Active" },
  { id: "BR-015", branchName: "Prasadampadu",      manager: "Krishna Chaitanya", address: "Prasadampadu, Vijayawada, AP",  phone: "+91 98480 11015", email: "prasadampadu@alankar.com",   status: "Active" },
  { id: "BR-016", branchName: "Patamata",          manager: "Satish Kumar",    address: "Patamata, Vijayawada, AP",         phone: "+91 98480 11016", email: "patamata@alankar.com",        status: "Active" },
  { id: "BR-017", branchName: "Narasaraopet",      manager: "Praveen Rao",     address: "Narasaraopet, Guntur Dist, AP",   phone: "+91 98480 11017", email: "narasaraopet@alankar.com",    status: "Active" },
];

const emptyForm: Omit<BranchRecord, "id"> = {
  branchName: "",
  manager: "",
  address: "",
  phone: "",
  email: "",
  status: "Active",
};

// ── CSV export ───────────────────────────────────────────────────────────────
function exportCsv(rows: BranchRecord[]) {
  const headers = ["Branch ID", "Branch Name", "Manager Name", "Phone Number", "Email", "Status"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.id, r.branchName, r.manager, r.phone, r.email, r.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, "branches.csv");
}

// ── XLSX export (hand-rolled, no dependency) ─────────────────────────────────
function exportXlsx(rows: BranchRecord[]) {
  // Build a minimal XLSX using the SpreadsheetML XML format wrapped in a ZIP.
  // We use a pure-JS approach so there's no runtime dependency to install.
  const headers = ["Branch ID", "Branch Name", "Manager Name", "Phone Number", "Email", "Status"];
  const dataRows = rows.map((r) => [r.id, r.branchName, r.manager, r.phone, r.email, r.status]);

  const escXml = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const toRow = (cells: string[], isHeader = false) =>
    `<row>${cells
      .map(
        (c) =>
          `<c t="inlineStr"${isHeader ? ' s="1"' : ""}><is><t>${escXml(c)}</t></is></c>`
      )
      .join("")}</row>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
${toRow(headers, true)}
${dataRows.map((r) => toRow(r)).join("\n")}
</sheetData>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts><font><b/><sz val="11"/></font><font><sz val="11"/></font></fonts>
<fills><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><font><b/></font></xf>
</cellXfs>
</styleSheet>`;

  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Branches" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const pkgRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  // Build ZIP manually using the ZIP local-file format
  const enc = new TextEncoder();
  function zipEntry(name: string, data: Uint8Array): Uint8Array {
    const nameBytes = enc.encode(name);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // local file header signature
    view.setUint16(4, 20, true);          // version needed
    view.setUint16(6, 0, true);           // general purpose bit flag
    view.setUint16(8, 0, true);           // compression method (stored)
    view.setUint16(10, 0, true);          // mod time
    view.setUint16(12, 0, true);          // mod date
    // CRC32 and sizes filled below
    const crc = crc32(data);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);
    const combined = new Uint8Array(header.length + data.length);
    combined.set(header, 0);
    combined.set(data, header.length);
    return combined;
  }

  function crc32(data: Uint8Array): number {
    const table = makeCrcTable();
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  let crcTableCache: Uint32Array | null = null;
  function makeCrcTable(): Uint32Array {
    if (crcTableCache) return crcTableCache;
    crcTableCache = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTableCache[i] = c;
    }
    return crcTableCache;
  }

  const files: { name: string; data: Uint8Array }[] = [
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(pkgRels) },
    { name: "xl/workbook.xml", data: enc.encode(wbXml) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(relsXml) },
    { name: "xl/worksheets/sheet1.xml", data: enc.encode(sheetXml) },
    { name: "xl/styles.xml", data: enc.encode(stylesXml) },
  ];

  const localEntries: Uint8Array[] = [];
  const centralDirEntries: { name: Uint8Array; offset: number; size: number; crc: number }[] = [];
  let offset = 0;

  for (const f of files) {
    const entry = zipEntry(f.name, f.data);
    localEntries.push(entry);
    centralDirEntries.push({ name: enc.encode(f.name), offset, size: f.data.length, crc: crc32(f.data) });
    offset += entry.length;
  }

  const centralDirParts: Uint8Array[] = [];
  let cdSize = 0;
  for (const cd of centralDirEntries) {
    const cdEntry = new Uint8Array(46 + cd.name.length);
    const v = new DataView(cdEntry.buffer);
    v.setUint32(0, 0x02014b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(6, 20, true);
    v.setUint16(8, 0, true);
    v.setUint16(10, 0, true);
    v.setUint16(12, 0, true);
    v.setUint16(14, 0, true);
    v.setUint32(16, cd.crc, true);
    v.setUint32(20, cd.size, true);
    v.setUint32(24, cd.size, true);
    v.setUint16(28, cd.name.length, true);
    v.setUint32(42, cd.offset, true);
    cdEntry.set(cd.name, 46);
    centralDirParts.push(cdEntry);
    cdSize += cdEntry.length;
  }

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLen = localEntries.reduce((a, e) => a + e.length, 0) + cdSize + 22;
  const zip = new Uint8Array(totalLen);
  let pos = 0;
  for (const e of localEntries) { zip.set(e, pos); pos += e.length; }
  for (const e of centralDirParts) { zip.set(e, pos); pos += e.length; }
  zip.set(eocd, pos);

  const blob = new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, "branches.xlsx");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BranchManagementPage() {
  const [branches, setBranches] = useState<BranchRecord[]>(seedBranches);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<BranchRecord, "id">>(emptyForm);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) =>
      [b.branchName, b.manager, b.phone, b.email, b.id, b.status]
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [branches, search]);

  const activeCount = branches.filter((b) => b.status === "Active").length;
  const inactiveCount = branches.filter((b) => b.status === "Inactive").length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (b: BranchRecord) => {
    setEditingId(b.id);
    setForm({ branchName: b.branchName, manager: b.manager, address: b.address, phone: b.phone, email: b.email, status: b.status });
    setFormOpen(true);
  };

  const saveBranch = () => {
    if (!form.branchName || !form.manager || !form.phone || !form.email) return;
    if (editingId) {
      setBranches((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...form } : b)));
    } else {
      const newId = `BR-${String(branches.length + 1).padStart(3, "0")}`;
      setBranches((prev) => [{ id: newId, ...form }, ...prev]);
    }
    setFormOpen(false);
  };

  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Branch Management")}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard title="Total Branches" value={branches.length} hint="+0% from last week" />
        <StatCard title="Active Branches" value={activeCount} hint="+4.8% from last week" />
        <StatCard title="Inactive Branches" value={inactiveCount} hint="+2.1% from last week" negative />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#0A3A92]"
              placeholder="Search by branch name, manager, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-12 z-30 w-40 rounded-lg border border-slate-200 bg-white shadow-md">
                  <button
                    onClick={() => { exportCsv(filtered); setExportMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => { exportXlsx(filtered); setExportMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Export XLSX
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white hover:bg-[#0D3B90]"
            >
              <Plus className="h-4 w-4" />
              Add Branch
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-[#F8FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-3">Branch ID</th>
                <th className="px-3 py-3">Branch Name</th>
                <th className="px-3 py-3">Manager Name</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Phone Number</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                    No branches match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{b.id}</td>
                    <td className="px-3 py-3">{b.branchName}</td>
                    <td className="px-3 py-3">{b.manager}</td>
                    <td className="px-3 py-3 text-slate-500">{b.address}</td>
                    <td className="px-3 py-3">{b.phone}</td>
                    <td className="px-3 py-3">{b.email}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${b.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(b)} className="rounded p-2 text-slate-500 hover:bg-slate-100">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setBranches((prev) => prev.filter((x) => x.id !== b.id))} className="rounded p-2 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {b.status === "Active" ? (
                          <button
                            onClick={() => setBranches((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "Inactive" } : x)))}
                            className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setBranches((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "Active" } : x)))}
                            className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[620px] rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-lg font-semibold">{editingId ? "Edit Branch" : "Add Branch"}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormInput label="Branch Name" value={form.branchName} onChange={(v) => setForm((s) => ({ ...s, branchName: v }))} />
              <FormInput label="Manager Name" value={form.manager} onChange={(v) => setForm((s) => ({ ...s, manager: v }))} />
              <FormInput label="Address" value={form.address} onChange={(v) => setForm((s) => ({ ...s, address: v }))} />
              <FormInput label="Phone Number" value={form.phone} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} />
              <FormInput label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
                  value={form.status}
                  onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as BranchRecord["status"] }))}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setFormOpen(false)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold">Cancel</button>
              <button onClick={saveBranch} className="h-10 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

function StatCard({ title, value, hint, negative }: { title: string; value: number; hint: string; negative?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-[38px] font-semibold leading-tight">{value}</p>
      <p className={`text-xs ${negative ? "text-red-600" : "text-emerald-600"}`}>{hint}</p>
    </div>
  );
}

function FormInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
      <input
        className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
