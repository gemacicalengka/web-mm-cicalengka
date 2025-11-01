import type { Route } from "./+types/database";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { supabase } from "../supabase_connection";
import { authUtils } from "../utils/auth";
import * as XLSX from 'xlsx';

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
    // Sort data alphabetically by name
    data = data.sort((a, b) => a.nama.localeCompare(b.nama));
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
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
      // First, delete related absensi records
      const { error: absensiError } = await supabase
        .from('absensi')
        .delete()
        .eq('generus_id', id);
      
      if (absensiError) {
        console.error('Error deleting related absensi records:', absensiError);
        alert('Error deleting related attendance records: ' + absensiError.message);
        return;
      }
      
      // Then delete the data_generus record
      const { error } = await supabase
        .from('data_generus')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting data:', error);
        alert('Error deleting data: ' + error.message);
        return;
      }
      
      setItems((prev) => prev.filter((it) => it.id !== id));
      alert('Data berhasil dihapus!');
    } catch (error) {
      console.error('Error:', error);
      alert('Unexpected error occurred while deleting data.');
    }
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  }

  function exportToExcel() {
    try {
      // Use filtered data for export
      const dataToExport = filteredAndSorted.map((item, index) => ({
        'No': index + 1,
        'Nama': item.nama,
        'Jenis Kelamin': item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        'Kelompok': item.kelompok,
        'Tanggal Lahir': formatDate(item.tgl_lahir),
        'Status': item.status
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Set column widths
      const colWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 15 }, // Jenis Kelamin
        { wch: 20 }, // Kelompok
        { wch: 15 }, // Tanggal Lahir
        { wch: 20 }  // Status
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data Generus');

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `data_generus_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      alert(`Data berhasil diekspor ke file ${filename}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Terjadi kesalahan saat mengekspor data');
    }
  }

  return (
    <section className="space-y-4 fade-in">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Database</h2>

      {/* Search and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 fade-in-stagger">
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">Pencarian</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, jenis kelamin, kelompok, status, atau tanggal lahir"
              className="mt-1 w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md border border-blue-200 hover:bg-blue-50 w-full sm:w-auto text-center">Import Data</button> */}
          <button 
            onClick={exportToExcel}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md border border-blue-200 hover:bg-blue-50 w-full sm:w-auto text-center"
          >
            Export Data
          </button>
          {authUtils.hasPermission('add') && (
            <Link
              to="/database/tambah"
              className="inline-flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 w-full sm:w-auto justify-center"
            >
              Tambah Data
            </Link>
          )}
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
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-1 sm:gap-2">
                      {authUtils.hasPermission('edit') && (
                        <Link
                          to={`/database/edit/${item.id}`}
                          className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-blue-600 w-full sm:w-auto justify-center"
                        >
                          Edit
                        </Link>
                      )}
                      {authUtils.hasPermission('delete') && (
                        <button 
                          onClick={() => remove(item.id)}
                          className="inline-flex items-center rounded-md bg-rose-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-rose-600 w-full sm:w-auto justify-center"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
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
          <div className="text-xs text-gray-600">
            Showing {filteredAndSorted.length === 0 ? 0 : startIdx + 1} to {endIdx} of {filteredAndSorted.length} entries
          </div>
        </div>
      </div>


    </section>
  );
}


