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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportAllData, setExportAllData] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectAllStatuses, setSelectAllStatuses] = useState(true);
  const [ageCategory, setAgeCategory] = useState<'Remaja' | 'Pra-Nikah' | 'Keduanya'>('Keduanya');
  const [selectedKelompok, setSelectedKelompok] = useState<string>('Semua Kelompok');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    items.forEach(item => statuses.add(item.status));
    return Array.from(statuses);
  }, [items]);

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

  const filteredDataForExport = useMemo(() => {
    if (exportAllData) {
      return items;
    }

    let filtered = items;

    // Filter by status
    if (!selectAllStatuses && selectedStatuses.length > 0) {
      filtered = filtered.filter(item => selectedStatuses.includes(item.status));
    }

    // Filter by age category
    if (ageCategory !== 'Keduanya') {
      filtered = filtered.filter(item => {
        const age = new Date().getFullYear() - new Date(item.tgl_lahir).getFullYear();
        if (ageCategory === 'Remaja') {
          return age >= 13 && age <= 18;
        } else if (ageCategory === 'Pra-Nikah') {
          return age > 18;
        }
        return true; // Should not reach here if ageCategory is not 'Keduanya'
      });
    }

    // Filter by kelompok
    if (selectedKelompok !== 'Semua Kelompok') {
      filtered = filtered.filter(item => item.kelompok === selectedKelompok);
    }

    return filtered;
  }, [items, exportAllData, selectedStatuses, ageCategory]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowExportModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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

  function handleExport() {
    setExportLoading(true);
    try {
      const dataToExport = filteredDataForExport.map((item, index) => ({
        'No': index + 1,
        'Nama': item.nama,
        'Jenis Kelamin': item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        'Kelompok': item.kelompok,
        'Tanggal Lahir': formatDate(item.tgl_lahir),
        'Status': item.status
      }));

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let filename = `data_generus_${dateStr}`;

      if (exportFormat === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);

        const colWidths = [
          { wch: 5 },  // No
          { wch: 25 }, // Nama
          { wch: 15 }, // Jenis Kelamin
          { wch: 20 }, // Kelompok
          { wch: 15 }, // Tanggal Lahir
          { wch: 20 }  // Status
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Data Generus');
        filename += '.xlsx';
        XLSX.writeFile(wb, filename);
      } else if (exportFormat === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        filename += '.csv';
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      alert(`Data berhasil diekspor ke file ${filename}`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Terjadi kesalahan saat mengekspor data');
    } finally {
      setExportLoading(false);
    }
  }

  function exportCurrentDataToExcel() {
    try {
      const dataToExport = filteredAndSorted.map((item, index) => ({
        'No': index + 1,
        'Nama': item.nama,
        'Jenis Kelamin': item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        'Kelompok': item.kelompok,
        'Tanggal Lahir': formatDate(item.tgl_lahir),
        'Status': item.status
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      const colWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 15 }, // Jenis Kelamin
        { wch: 20 }, // Kelompok
        { wch: 15 }, // Tanggal Lahir
        { wch: 20 }  // Status
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Data Generus');

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `data_generus_current_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      
      alert(`Data berhasil diekspor ke file ${filename}`);
    } catch (error) {
      console.error('Error exporting current data:', error);
      alert('Terjadi kesalahan saat mengekspor data saat ini');
    }
  }

  return (
    <>
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
          <button 
            onClick={exportCurrentDataToExcel}
            className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-2 rounded-md border border-green-200 hover:bg-green-50 w-full sm:w-auto text-center"
          >
            Ekspor Data Saat Ini
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md border border-blue-200 hover:bg-blue-50 w-full sm:w-auto text-center"
          >
            Pilih Ekspor Data
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

    {showExportModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50"
          onClick={() => setShowExportModal(false)} // Close when clicking outside
        >
          <div 
            className="relative p-4 border w-11/12 sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3 shadow-lg rounded-md bg-white h-full overflow-y-auto"
            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Export Data</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="mt-2 text-gray-600">
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={exportAllData}
                    onChange={(e) => setExportAllData(e.target.checked)}
                  />
                  <span className="ml-2 text-gray-700">Semua Data</span>
                </label>
              </div>

              {!exportAllData && (
                <div className="mb-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Status:</label>
                  <div className="mt-1 space-y-1">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={selectAllStatuses}
                        onChange={(e) => {
                          setSelectAllStatuses(e.target.checked);
                          if (e.target.checked) {
                            setSelectedStatuses([]);
                          }
                        }}
                      />
                      <span className="ml-2 text-gray-700">Semua Status</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        {["Pelajar", "Lulus Pelajar", "Kerja", "Mahasiswa"].map(status => (
                          <label key={status} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="form-checkbox"
                              value={status}
                              checked={selectedStatuses.includes(status) && !selectAllStatuses}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStatuses([...selectedStatuses, e.target.value]);
                                  setSelectAllStatuses(false);
                                } else {
                                  setSelectedStatuses(selectedStatuses.filter(s => s !== e.target.value));
                                }
                              }}
                              disabled={selectAllStatuses}
                            />
                            <span className="ml-2 text-gray-700">{status}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-col">
                        {["Mahasiswa & Kerja", "MS", "MT"].map(status => (
                          <label key={status} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="form-checkbox"
                              value={status}
                              checked={selectedStatuses.includes(status) && !selectAllStatuses}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStatuses([...selectedStatuses, e.target.value]);
                                  setSelectAllStatuses(false);
                                } else {
                                  setSelectedStatuses(selectedStatuses.filter(s => s !== e.target.value));
                                }
                              }}
                              disabled={selectAllStatuses}
                            />
                            <span className="ml-2 text-gray-700">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!exportAllData && (
                <div className="space-y-4">
                  <div className="mb-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Usia:</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio"
                          name="ageCategory"
                          value="Remaja"
                          checked={ageCategory === 'Remaja'}
                          onChange={(e) => setAgeCategory(e.target.value as 'Remaja' | 'Pra-Nikah' | 'Keduanya')}
                        />
                        <span className="ml-2 text-gray-700">Remaja</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio"
                          name="ageCategory"
                          value="Pra-Nikah"
                          checked={ageCategory === 'Pra-Nikah'}
                          onChange={(e) => setAgeCategory(e.target.value as 'Remaja' | 'Pra-Nikah' | 'Keduanya')}
                        />
                        <span className="ml-2 text-gray-700">Pra-Nikah</span>
                      </label>
                    </div>
                    <div className="">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio"
                          name="ageCategory"
                          value="Keduanya"
                          checked={ageCategory === 'Keduanya'}
                          onChange={(e) => setAgeCategory(e.target.value as 'Remaja' | 'Pra-Nikah' | 'Keduanya')}
                        />
                        <span className="ml-2 text-gray-700">Semua Usia</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelompok:</label>
                    <div className="mt-1 space-y-1">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio"
                          name="kelompokCategory"
                          value="Semua Kelompok"
                          checked={selectedKelompok === 'Semua Kelompok'}
                          onChange={(e) => setSelectedKelompok(e.target.value)}
                        />
                        <span className="ml-2 text-gray-700">Semua Kelompok</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          {["Linggar", "Parakan Muncang", "Bojong Koneng"].map(kelompok => (
                            <label key={kelompok} className="inline-flex items-center">
                              <input
                                type="radio"
                                className="form-radio"
                                name="kelompokCategory"
                                value={kelompok}
                                checked={selectedKelompok === kelompok}
                                onChange={(e) => setSelectedKelompok(e.target.value)}
                              />
                              <span className="ml-2 text-gray-700">{kelompok}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex flex-col">
                          {["Cikopo", "Cikancung 1", "Cikancung 2"].map(kelompok => (
                            <label key={kelompok} className="inline-flex items-center">
                              <input
                                type="radio"
                                className="form-radio"
                                name="kelompokCategory"
                                value={kelompok}
                                checked={selectedKelompok === kelompok}
                                onChange={(e) => setSelectedKelompok(e.target.value)}
                              />
                              <span className="ml-2 text-gray-700">{kelompok}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">Jumlah data yang akan diekspor: {filteredDataForExport.length}</p>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Format Export:</label>
                <select
                  className="px-1 py-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'xlsx' | 'csv')}
                >
                  <option value="xlsx">Excel (xlsx)</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div className="items-center px-4 py-3 flex justify-end gap-2">
              <button
                id="cancel-button"
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={() => setShowExportModal(false)}
                disabled={exportLoading}
              >
                Cancel
              </button>
              <button
                id="export-button"
                className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


