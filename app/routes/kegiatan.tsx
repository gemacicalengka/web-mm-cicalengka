import type { Route } from "./+types/kegiatan";
import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kegiatan" },
    { name: "description", content: "Halaman Kegiatan" },
  ];
}

type KegiatanItem = {
  id: string;
  nama: string;
  tanggal: string; // ISO date string
  tempat: string;
  createdAt: number; // epoch ms for sorting newest first
};

const STORAGE_KEY = "kegiatanList";

export default function Kegiatan() {
  const [items, setItems] = useState<KegiatanItem[]>([]);
  const [showForm, setShowForm] = useState(false);

  // New form state
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [tempat, setTempat] = useState("");

  // Search, sorting, and pagination state
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"kegiatan" | "tanggal" | "tempat">("kegiatan");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editTanggal, setEditTanggal] = useState("");
  const [editTempat, setEditTempat] = useState("");

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as KegiatanItem[];
        setItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch {}
  }, []);

  // Persist to localStorage when items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = items.filter((it) => {
      if (!q) return true;
      return (
        it.nama.toLowerCase().includes(q) ||
        it.tempat.toLowerCase().includes(q) ||
        new Date(it.tanggal).toLocaleDateString("id-ID").toLowerCase().includes(q)
      );
    });
    if (sortBy === "kegiatan") {
      data = data.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "tanggal") {
      data = data.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    } else if (sortBy === "tempat") {
      data = data.sort((a, b) => a.tempat.localeCompare(b.tempat));
    }
    return data;
  }, [items, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredAndSorted.length);
  const paged = useMemo(() => filteredAndSorted.slice(startIdx, endIdx), [filteredAndSorted, startIdx, endIdx]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy]);

  function resetForm() {
    setNama("");
    setTanggal("");
    setTempat("");
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim() || !tanggal || !tempat.trim()) return;
    const newItem: KegiatanItem = {
      id: crypto.randomUUID(),
      nama: nama.trim(),
      tanggal,
      tempat: tempat.trim(),
      createdAt: Date.now(),
    };
    setItems((prev) => [newItem, ...prev]);
    resetForm();
    setShowForm(false);
  }

  function startEdit(item: KegiatanItem) {
    setEditingId(item.id);
    setEditNama(item.nama);
    setEditTanggal(item.tanggal);
    setEditTempat(item.tempat);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNama("");
    setEditTanggal("");
    setEditTempat("");
  }

  function saveEdit(id: string) {
    if (!editNama.trim() || !editTanggal || !editTempat.trim()) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, nama: editNama.trim(), tanggal: editTanggal, tempat: editTempat.trim() }
          : it
      )
    );
    cancelEdit();
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return iso;
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Kegiatan</h2>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">Pencarian</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kegiatan / tanggal / tempat"
              className="mt-1 w-64 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="kegiatan">Kegiatan (terbaru)</option>
              <option value="tanggal">Tanggal (terbaru)</option>
              <option value="tempat">Tempat (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-12">No</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Judul Kegiatan</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Tempat</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-gray-700">{startIdx + idx + 1}</td>
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="date" value={editTanggal} onChange={(e) => setEditTanggal(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editTempat} onChange={(e) => setEditTempat(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button onClick={() => saveEdit(item.id)} className="inline-flex items-center rounded-md bg-sky-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-sky-600">Simpan</button>
                        <button onClick={cancelEdit} className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-gray-700 text-xs font-medium hover:bg-gray-200">Batal</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-gray-900">{item.nama}</td>
                      <td className="px-4 py-2 text-gray-700">{formatDate(item.tanggal)}</td>
                      <td className="px-4 py-2 text-gray-700">{item.tempat}</td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button onClick={() => startEdit(item)} className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 text-xs font-medium hover:bg-gray-50">Edit</button>
                        <button onClick={() => remove(item.id)} className="inline-flex items-center rounded-md bg-rose-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-rose-600">Hapus</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Belum ada kegiatan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Footer controls: pagination + info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs disabled:opacity-50">First</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs disabled:opacity-50">Prev</button>
            {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((_, i) => {
              const n = Math.max(1, currentPage - 2) + i;
              if (n > totalPages) return null;
              const active = n === currentPage;
              return (
                <button key={n} onClick={() => setPage(n)} className={(active ? "bg-sky-500 text-white " : "bg-white text-gray-700 ") + "rounded-md border border-gray-200 px-2 py-1 text-xs"}>{n}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs disabled:opacity-50">Next</button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs disabled:opacity-50">Last</button>
            <div className="ml-2 flex items-center gap-1 text-xs text-gray-700">
              <span>Go to</span>
              <input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))} className="w-16 rounded-md border border-gray-300 px-2 py-1 text-gray-900" />
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Showing {filteredAndSorted.length === 0 ? 0 : startIdx + 1} to {endIdx} of {filteredAndSorted.length} entries
          </div>
        </div>
      </div>

      {/* Toggle add form */}
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
      >
        {showForm ? "Tutup Form" : "Tambah Kegiatan"}
      </button>

      {showForm && (
        <form onSubmit={onAdd} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Kegiatan</label>
              <input value={nama} onChange={(e) => setNama(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tempat</label>
              <input value={tempat} onChange={(e) => setTempat(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600">Simpan</button>
          </div>
        </form>
      )}
    </section>
  );
}


