import type { Route } from "./+types/kegiatan";
import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { supabase } from "../supabase_connection";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kegiatan" },
    { name: "description", content: "Halaman Kegiatan" },
  ];
}

type KegiatanItem = {
  id: number;
  nama_giat: string;
  tgl_giat: string; // ISO date string
  tempat: string;
};

export default function Kegiatan() {
  const [items, setItems] = useState<KegiatanItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editTanggal, setEditTanggal] = useState("");
  const [editTempat, setEditTempat] = useState("");

  // Load from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('kegiatan')
          .select('*')
          .order('id', { ascending: false });
        
        if (error) {
          console.error('Error fetching data:', error);
          alert('Error fetching data: ' + error.message);
          return;
        }
        
        setItems(data || []);
      } catch (error) {
        console.error('Error:', error);
        alert('Unexpected error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = items.filter((it) => {
      if (!q) return true;
      return (
        it.nama_giat.toLowerCase().includes(q) ||
        it.tempat.toLowerCase().includes(q) ||
        new Date(it.tgl_giat).toLocaleDateString("id-ID").toLowerCase().includes(q)
      );
    });
    if (sortBy === "kegiatan") {
      data = data.sort((a, b) => b.id - a.id);
    } else if (sortBy === "tanggal") {
      data = data.sort((a, b) => new Date(b.tgl_giat).getTime() - new Date(a.tgl_giat).getTime());
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
    
    async function addKegiatan() {
      try {
        const { data, error } = await supabase
          .from('kegiatan')
          .insert([
            {
              nama_giat: nama.trim(),
              tgl_giat: tanggal,
              tempat: tempat.trim()
            }
          ])
          .select();
        
        if (error) {
          console.error('Error adding data:', error);
          alert('Error adding data: ' + error.message);
          return;
        }
        
        if (data && data.length > 0) {
          setItems((prev) => [data[0], ...prev]);
        }
        
        resetForm();
        setShowForm(false);
      } catch (error) {
        console.error('Error:', error);
        alert('Unexpected error occurred while adding data.');
      }
    }
    
    addKegiatan();
  }

  function startEdit(item: KegiatanItem) {
    setEditingId(item.id);
    setEditNama(item.nama_giat);
    setEditTanggal(item.tgl_giat);
    setEditTempat(item.tempat);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNama("");
    setEditTanggal("");
    setEditTempat("");
  }

  function saveEdit(id: number) {
    if (!editNama.trim() || !editTanggal || !editTempat.trim()) return;
    
    async function updateKegiatan() {
      try {
        const { error } = await supabase
          .from('kegiatan')
          .update({
            nama_giat: editNama.trim(),
            tgl_giat: editTanggal,
            tempat: editTempat.trim()
          })
          .eq('id', id);
        
        if (error) {
          console.error('Error updating data:', error);
          alert('Error updating data: ' + error.message);
          return;
        }
        
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, nama_giat: editNama.trim(), tgl_giat: editTanggal, tempat: editTempat.trim() }
              : it
          )
        );
        cancelEdit();
      } catch (error) {
        console.error('Error:', error);
        alert('Unexpected error occurred while updating data.');
      }
    }
    
    updateKegiatan();
  }

  function deleteItem(id: number) {
    if (!confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) return;
    
    async function deleteKegiatan() {
      try {
        // First, delete all related absensi records
        const { error: absensiError } = await supabase
          .from('absensi')
          .delete()
          .eq('kegiatan_id', id);
        
        if (absensiError) {
          console.error('Error deleting related absensi data:', absensiError);
          alert('Error deleting related attendance data: ' + absensiError.message);
          return;
        }
        
        // Then, delete the kegiatan
        const { error } = await supabase
          .from('kegiatan')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting data:', error);
          alert('Error deleting data: ' + error.message);
          return;
        }
        
        setItems((prev) => prev.filter((it) => it.id !== id));
        alert('Kegiatan berhasil dihapus beserta data absensi terkait.');
      } catch (error) {
        console.error('Error:', error);
        alert('Unexpected error occurred while deleting data.');
      }
    }
    
    deleteKegiatan();
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return iso;
    }
  }

  return (
    <section className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Kegiatan</h2>
        {/* <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-white text-sm font-medium hover:bg-sky-600 w-full sm:w-auto justify-center"
        >
          Tambah Kegiatan
        </button> */}
      </div>
      
      <div className="rounded-xl border border-gray-200 bg-white p-4 fade-in-stagger">
        {/* Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mb-4">
          <div className="w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Cari Kegiatan
            </label>
            <input
              type="text"
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama kegiatan, tanggal, atau tempat..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-12">No</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Nama Kegiatan</th>
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
                        <div className="relative">
                          <input 
                            type="date" 
                            value={editTanggal} 
                            onChange={(e) => setEditTanggal(e.target.value)} 
                            className="w-full rounded-md border border-gray-300 px-2 py-1 pr-10 
                                      text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400
                                        cursor-pointer [&::-webkit-calendar-picker-indicator]:invert" 
                            placeholder="Pilih tanggal"
                          />
                          {/* <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div> */}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input value={editTempat} onChange={(e) => setEditTempat(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-1 sm:gap-2">
                          <button onClick={() => saveEdit(item.id)} className="inline-flex items-center rounded-md bg-sky-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-sky-600 w-full sm:w-auto justify-center">Simpan</button>
                          <button onClick={cancelEdit} className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-gray-700 text-xs font-medium hover:bg-gray-200 w-full sm:w-auto justify-center">Batal</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-gray-900">{item.nama_giat}</td>
                      <td className="px-4 py-2 text-gray-700">{formatDate(item.tgl_giat)}</td>
                      <td className="px-4 py-2 text-gray-700">{item.tempat}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-1 sm:gap-2">
                          <button onClick={() => startEdit(item)} className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-blue-600 w-full sm:w-auto justify-center">Edit</button>
                          <button onClick={() => deleteItem(item.id)} className="inline-flex items-center rounded-md bg-rose-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-rose-600 w-full sm:w-auto justify-center">Hapus</button>
                        </div>
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
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="rounded-md border border-sky-400 bg-sky-400 text-white px-2 py-1 text-xs disabled:opacity-50 hover:bg-sky-500">First</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md border border-sky-400 bg-sky-400 text-white px-2 py-1 text-xs disabled:opacity-50 hover:bg-sky-500">Prev</button>
            {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((_, i) => {
              const n = Math.max(1, currentPage - 2) + i;
              if (n > totalPages) return null;
              const active = n === currentPage;
              return (
                <button key={n} onClick={() => setPage(n)} className={(active ? "bg-sky-500 text-white " : "bg-white text-gray-700 ") + "rounded-md border border-gray-200 px-2 py-1 text-xs"}>{n}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md border border-sky-400 bg-sky-400 text-white px-2 py-1 text-xs disabled:opacity-50 hover:bg-sky-500">Next</button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="rounded-md border border-sky-400 bg-sky-400 text-white px-2 py-1 text-xs disabled:opacity-50 hover:bg-sky-500">Last</button>
            <div className="ml-0 sm:ml-2 flex flex-col sm:flex-row items-start sm:items-center gap-1 text-xs text-gray-700 mt-2 sm:mt-0">
              <span>Go to</span>
              <input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))} className="w-16 rounded-md border border-gray-300 px-2 py-1 text-gray-900" />
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2 sm:mt-0">
            Showing {filteredAndSorted.length === 0 ? 0 : startIdx + 1} to {endIdx} of {filteredAndSorted.length} entries
          </div>
        </div>
      </div>

        {/* Toggle add form */}
        <div className="flex justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 mt-2 mb-2 w-full sm:w-auto justify-center"
          >
            {showForm ? "Tutup Form" : "Tambah Kegiatan"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={onAdd} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Kegiatan</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={tanggal} 
                    onChange={(e) => setTanggal(e.target.value)} 
                    required 
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 pr-10
                              text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400
                                cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                    placeholder="Pilih tanggal"
                  />
                  {/* <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div> */}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tempat</label>
                <input value={tempat} onChange={(e) => setTempat(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 w-full sm:w-auto justify-center">Simpan</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}


