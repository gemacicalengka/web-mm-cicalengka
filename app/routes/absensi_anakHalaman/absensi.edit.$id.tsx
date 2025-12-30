import type { Route } from "./+types/absensi.edit.$id";
import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import { supabase } from "../../supabase_connection";
import { authUtils } from "../../utils/auth";

interface KegiatanItem {
  id: number;
  nama_giat: string;
  tgl_giat: string;
  tempat: string;
}

interface DatabaseItem {
  id: number;
  nama: string;
  jenis_kelamin: string;
  kelompok: string;
  status: string;
  tgl_lahir: string | null;
}

interface AttendanceItem {
  id?: number;
  kegiatan_id: number;
  generus_id: number;
  status_kehadiran: 'Belum' | 'Hadir' | 'Izin';
  created_at?: string;
  updated_at?: string;
}

interface AttendanceDisplay {
  id: number;
  nama: string;
  kelompok: string;
  status_kehadiran: 'Belum' | 'Hadir' | 'Izin';
  generus_id: number;
  attendance_id?: number;
  tgl_lahir: string | null;
  status: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Absensi - Edit Kehadiran" },
    { name: "description", content: "Halaman Edit Kehadiran" },
  ];
}

export default function AbsensiEdit() {
  const { id } = useParams();
  const kegiatanId = parseInt(id || '0');
  
  const [kegiatan, setKegiatan] = useState<KegiatanItem | null>(null);
  const [members, setMembers] = useState<DatabaseItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch specific kegiatan
        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan')
          .select('*')
          .eq('id', kegiatanId)
          .single();
        
        if (kegiatanError) {
          console.error('Error fetching kegiatan:', kegiatanError);
        } else {
          setKegiatan(kegiatanData);
        }

        // Fetch members data
        const { data: membersData, error: membersError } = await supabase
          .from('data_generus')
          .select('*')
          .order('nama', { ascending: true });
        
        if (membersError) {
          console.error('Error fetching members:', membersError);
          return;
        }

        // Fetch existing attendance data for this kegiatan
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('absensi')
          .select('*')
          .eq('kegiatan_id', kegiatanId);
        
        if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError);
        }

        // Combine members with their attendance status
        const attendanceMap = new Map();
        (attendanceRecords || []).forEach(record => {
          attendanceMap.set(record.generus_id, record);
        });

        // Prepare members who don't have attendance records yet
        const membersWithoutAttendance = (membersData || []).filter(member => 
          !attendanceMap.has(member.id)
        );

        // Auto-insert default "Belum" status for members without attendance records
        if (membersWithoutAttendance.length > 0) {
          const defaultAttendanceRecords = membersWithoutAttendance.map(member => ({
            kegiatan_id: kegiatanId,
            generus_id: member.id,
            status_kehadiran: 'Belum' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { data: insertedRecords, error: insertError } = await supabase
            .from('absensi')
            .insert(defaultAttendanceRecords)
            .select();

          if (insertError) {
            console.error('Error inserting default attendance:', insertError);
          } else {
            // Add the inserted records to the attendance map
            (insertedRecords || []).forEach(record => {
              attendanceMap.set(record.generus_id, record);
            });
          }
        }

        const combinedData = (membersData || []).map(member => {
          const attendanceRecord = attendanceMap.get(member.id);
          return {
            id: member.id,
            nama: member.nama,
            kelompok: member.kelompok,
            status_kehadiran: attendanceRecord?.status_kehadiran || 'Belum' as const,
            generus_id: member.id,
            attendance_id: attendanceRecord?.id,
            tgl_lahir: member.tgl_lahir,
            status: member.status
          };
        });

        setMembers(membersData || []);
        setAttendanceData(combinedData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (kegiatanId) {
      fetchData();
    }
  }, [kegiatanId]);

  // Filter attendance data based on search query
  const filteredAttendance = useMemo(() => {
    if (!query.trim()) return attendanceData;
    
    return attendanceData.filter(item =>
      item.nama.toLowerCase().includes(query.toLowerCase()) ||
      item.kelompok.toLowerCase().includes(query.toLowerCase())
    );
  }, [attendanceData, query]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredAttendance.length);
  const paged = useMemo(() => filteredAttendance.slice(startIdx, endIdx), [filteredAttendance, startIdx, endIdx]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  const updateAttendanceStatus = async (generusId: number, status: 'Belum' | 'Hadir' | 'Izin') => {
    try {
      const existingRecord = attendanceData.find(item => item.generus_id === generusId);
      
      if (existingRecord?.attendance_id) {
        // Update existing record
        const { error } = await supabase
          .from('absensi')
          .update({ 
            status_kehadiran: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.attendance_id);
        
        if (error) {
          console.error('Error updating attendance:', error);
          alert('Gagal mengupdate kehadiran');
          return;
        }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('absensi')
          .insert({
            kegiatan_id: kegiatanId,
            generus_id: generusId,
            status_kehadiran: status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating attendance:', error);
          alert('Gagal menyimpan kehadiran');
          return;
        }

        // Update local state with new attendance_id
        setAttendanceData(prev => 
          prev.map(item => 
            item.generus_id === generusId 
              ? { ...item, attendance_id: data.id, status_kehadiran: status }
              : item
          )
        );
        return;
      }

      // Update local state
      setAttendanceData(prev => 
        prev.map(item => 
          item.generus_id === generusId 
            ? { ...item, status_kehadiran: status }
            : item
        )
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  const deleteAttendance = async (generusId: number) => {
    const confirmed = confirm('Apakah Anda yakin ingin menghapus data kehadiran ini?');
    if (!confirmed) return;

    try {
      const existingRecord = attendanceData.find(item => item.generus_id === generusId);
      
      if (existingRecord?.attendance_id) {
        const { error } = await supabase
          .from('absensi')
          .delete()
          .eq('id', existingRecord.attendance_id);
        
        if (error) {
          console.error('Error deleting attendance:', error);
          alert('Gagal menghapus data kehadiran');
          return;
        }
      }

      // Reset to default status
      setAttendanceData(prev => 
        prev.map(item => 
          item.generus_id === generusId 
            ? { ...item, status_kehadiran: 'Belum' as const, attendance_id: undefined }
            : item
        )
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const getStatusColor = (status: 'Belum' | 'Hadir' | 'Izin') => {
    switch (status) {
      case 'Hadir': return 'bg-green-500 text-white';
      case 'Belum': return 'bg-red-500 text-white';
      case 'Izin': return 'bg-yellow-500 text-white';
      default: return 'bg-red-500 text-white';
    }
  };

  function formatDate(dateString: string | null): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('id-ID');
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">
          Absensi - Edit Kehadiran
        </h2>
        <div className="text-center py-8">Loading...</div>
      </section>
    );
  }

  if (!kegiatan) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">
          Absensi - Edit Kehadiran
        </h2>
        <div className="text-center py-8">Kegiatan tidak ditemukan</div>
      </section>
    );
  }

  return (
    <section className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">
          Absensi - Edit Kehadiran
        </h2>
      </div>
      
      <div className="rounded-xl border border-gray-200 bg-white p-4 fade-in-stagger">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Kegiatan: {kegiatan.nama_giat}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Tanggal: {new Date(kegiatan.tgl_giat).toLocaleDateString('id-ID')} | Tempat: {kegiatan.tempat}
        </p>
        
        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Cari Data
              </label>
              <input
                type="text"
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau kelompok..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
          {authUtils.hasPermission('add') && (
            <Link
              to={`/proses_tambahData?kegiatan_id=${kegiatan?.id}`}
              className="inline-flex items-center rounded-md bg-green-500 px-4 py-2 text-white text-sm font-medium hover:bg-green-600 w-full sm:w-auto justify-center"
            >
              Tambah Data
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-12">No</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-48">Nama</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">Kelompok</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-28">Tanggal Lahir</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-36">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-36">Status Kehadiran</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Memuat data...</td>
                </tr>
              ) : paged.map((item, idx) => (
                <tr key={item.generus_id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-gray-700">{startIdx + idx + 1}</td>
                  <td className="px-4 py-2 text-gray-900">{item.nama}</td>
                  <td className="px-4 py-2 text-gray-700">{item.kelompok}</td>
                  <td className="px-4 py-2 text-gray-700">{formatDate(item.tgl_lahir)}</td>
                  <td className="px-4 py-2 text-gray-700">{item.status}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(item.status_kehadiran)}`}>
                      {item.status_kehadiran}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-1 sm:gap-2">
                      <div className="relative w-full sm:w-auto">
                        <select
                          value={item.status_kehadiran}
                          onChange={(e) => updateAttendanceStatus(item.generus_id, e.target.value as 'Belum' | 'Hadir' | 'Izin')}
                          className="inline-flex items-center rounded-md bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 cursor-pointer appearance-none pr-8 min-w-[80px] text-transparent w-full sm:w-auto"
                        >
                          <option value="Hadir" className="text-black">✅ Hadir</option>
                          <option value="Belum" className="text-black">❌ Belum</option>
                          <option value="Izin" className="text-black">✋ Izin</option>
                        </select>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs font-medium text-gray-700">Status</span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {authUtils.hasPermission('edit') && (
                        <Link
                          to={`/proses_editData/${item.generus_id}?kegiatan_id=${kegiatan?.id}`}
                          className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-blue-600 w-full sm:w-auto justify-center"
                        >
                          <i className="fas fa-pen" aria-hidden="true"></i>
                        </Link>
                      )}
                      {authUtils.hasPermission('delete') && (
                        <button 
                          onClick={() => deleteAttendance(item.generus_id)}
                          className="inline-flex items-center rounded-md bg-rose-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-rose-600 w-full sm:w-auto justify-center"
                        >
                          <i className="fas fa-trash" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAttendance.length === 0 && (
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
            Showing {filteredAttendance.length === 0 ? 0 : startIdx + 1} to {endIdx} of {filteredAttendance.length} entries
          </div>
        </div>
      </div>
    </section>
  );
}
