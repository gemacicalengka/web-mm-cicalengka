import type { Route } from "./+types/database";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { supabase } from "../supabase_connection";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Database" },
    { name: "description", content: "Halaman Database" },
  ];
}

type DatabaseItem = {
  id: number;
  nama: string;
  jenis_kelamin: "L" | "P";
  kelompok: "Linggar" | "Parakan Muncang" | "Cikopo" | "Bojong Koneng" | "Cikancung 1" | "Cikancung 2";
  tgl_lahir: string;
  status: "Pelajar" | "Lulus Pelajar" | "Mahasiswa" | "Mahasiswa & Kerja" | "Lulus Kuliah" | "Kerja" | "MS" | "MT";
};

export default function Database() {
  const [items, setItems] = useState<DatabaseItem[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search and pagination state
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Load data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('data_generus')
          .select('*')
          .order('id', { ascending: false });
        
        if (error) {
          console.error('Error fetching data:', error);
          // Show more detailed error message
          if (error.code === '42501') {
            alert('Error: Row Level Security policy violation. Please check your Supabase RLS settings for the data_generus table.');
          } else if (error.code === 'PGRST116') {
            alert('Error: Table "data_generus" not found. Please check if the table exists in your Supabase database.');
          } else {
            alert('Error fetching data: ' + error.message);
          }
          return;
        }
        
        console.log('Fetched data:', data);
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

  // Filter and paginate data
  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = items.filter((item) => {
      if (!q) return true;
      return (
        item.nama.toLowerCase().includes(q) ||
        item.jenis_kelamin.toLowerCase().includes(q) ||
        item.kelompok.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        new Date(item.tgl_lahir).toLocaleDateString("id-ID").toLowerCase().includes(q)
      );
    });
    // Data is already sorted by created_at from Supabase
    return data;
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredAndSorted.length);
  const paged = useMemo(() => filteredAndSorted.slice(startIdx, endIdx), [filteredAndSorted, startIdx, endIdx]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  async function remove(id: number) {
    try {
      const { error } = await supabase
        .from('data_generus')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting data:', error);
        return;
      }
      
      setItems((prev) => prev.filter((it) => it.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function confirmDelete(id: number) {
    setShowDeleteConfirm(id);
  }

  function cancelDelete() {
    setShowDeleteConfirm(null);
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
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Database</h2>

      {/* Search and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">Pencarian</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, jenis kelamin, kelompok, status, atau tanggal lahir"
              className="mt-1 w-64 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Import Data</button>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Export Data</button>
          <Link
            to="/database/tambah"
            className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            Tambah Data
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-12">No</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-48">Nama</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-24">Jenis Kelamin</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">Kelompok</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-28">Tanggal Lahir</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-36">Status</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Memuat data...</td>
                </tr>
              ) : paged.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-gray-700">{startIdx + idx + 1}</td>
                  <td className="px-4 py-2 text-gray-900">{item.nama}</td>
                  <td className="px-4 py-2 text-gray-700">{item.jenis_kelamin}</td>
                  <td className="px-4 py-2 text-gray-700">{item.kelompok}</td>
                  <td className="px-4 py-2 text-gray-700">{formatDate(item.tgl_lahir)}</td>
                  <td className="px-4 py-2 text-gray-700">{item.status}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <Link
                      to={`/database/edit/${item.id}`}
                      className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 text-xs font-medium hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => confirmDelete(item.id)}
                      className="inline-flex items-center rounded-md bg-rose-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-rose-600"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Belum ada data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">Yakin ingin menghapus data?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Tidak
              </button>
              <button
                onClick={() => remove(showDeleteConfirm)}
                className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


