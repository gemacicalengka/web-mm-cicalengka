import type { Route } from "./+types/laporan";
import { useState, useEffect } from "react";
import { supabase } from "../supabase_connection";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  tgl_lahir: string;
}

interface AttendanceItem {
  id: number;
  kegiatan_id: number;
  generus_id: number;
  status_kehadiran: 'Belum' | 'Hadir' | 'Izin';
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Laporan" },
    { name: "description", content: "Halaman Laporan" },
  ];
}

export default function Laporan() {
  const [kegiatan, setKegiatan] = useState<KegiatanItem[]>([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState<number | null>(null);
  const [selectedKelompok, setSelectedKelompok] = useState<string>("Semua");
  const [isGenerating, setIsGenerating] = useState(false);

  const kelompokOptions = [
    "Semua",
    "Linggar", 
    "Parakan Muncang", 
    "Cikopo", 
    "Bojong Koneng", 
    "Cikancung 1", 
    "Cikancung 2"
  ];

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const fetchKegiatan = async () => {
    try {
      const { data, error } = await supabase
        .from('kegiatan')
        .select('*')
        .order('tgl_giat', { ascending: false });

      if (error) throw error;
      
      setKegiatan(data || []);
      if (data && data.length > 0) {
        setSelectedKegiatan(data[0].id); // Set default to latest activity
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
    }
  };

  const generatePDF = async () => {
    if (!selectedKegiatan) {
      alert('Pilih kegiatan terlebih dahulu');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Starting PDF generation for kegiatan:', selectedKegiatan);
      
      // Fetch generus data first
      const { data: generusData, error: generusError } = await supabase
        .from('data_generus')
        .select('*')
        .order('kelompok')
        .order('nama');

      if (generusError) {
        console.error('Generus error:', generusError);
        throw generusError;
      }

      console.log('Generus data:', generusData);

      // Fetch ALL existing attendance data for this kegiatan (including updated ones)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('absensi')
        .select('*')
        .eq('kegiatan_id', selectedKegiatan);

      if (attendanceError) {
        console.error('Attendance error:', attendanceError);
        throw attendanceError;
      }

      console.log('Raw attendance data from Supabase:', attendanceData);

      // Create attendance map for quick lookup
      const attendanceMap = new Map();
      (attendanceData || []).forEach(record => {
        attendanceMap.set(record.generus_id, record);
      });

      // Find members without attendance records
      const membersWithoutAttendance = (generusData || []).filter(member => 
        !attendanceMap.has(member.id)
      );

      // Only auto-insert if there are members without any attendance record
      if (membersWithoutAttendance.length > 0) {
        const defaultAttendanceRecords = membersWithoutAttendance.map(member => ({
          kegiatan_id: selectedKegiatan,
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
          // Add inserted records to attendance data
          (insertedRecords || []).forEach(record => {
            attendanceMap.set(record.generus_id, record);
          });
        }
      }

      // Use the current attendance data (no need to re-fetch)
      const updatedAttendanceData = Array.from(attendanceMap.values());

      // Get selected activity name
      const selectedActivity = kegiatan.find(k => k.id === selectedKegiatan);
      const activityName = selectedActivity?.nama_giat || '';

      console.log('Selected activity:', selectedActivity);

      // Filter data based on selected group
      let filteredGenerus = generusData || [];
      if (selectedKelompok !== "Semua") {
        filteredGenerus = filteredGenerus.filter(g => g.kelompok === selectedKelompok);
      }

      // Sort by group order and then by name
      const kelompokOrder = ["Linggar", "Parakan Muncang", "Cikopo", "Bojong Koneng", "Cikancung 1", "Cikancung 2"];
      filteredGenerus.sort((a, b) => {
        const aIndex = kelompokOrder.indexOf(a.kelompok);
        const bIndex = kelompokOrder.indexOf(b.kelompok);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.nama.localeCompare(b.nama);
      });

      console.log('Filtered generus:', filteredGenerus);

      // Calculate statistics
      const stats = calculateStatistics(filteredGenerus, updatedAttendanceData || []);

      console.log('Statistics:', stats);

      // Generate PDF
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Rekap Kehadiran', 105, 20, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const subtitle = selectedKelompok === "Semua" ? "Semua Kelompok" : selectedKelompok;
      doc.text(subtitle, 105, 30, { align: 'center' });
      doc.text(`Kegiatan: ${activityName}`, 105, 40, { align: 'center' });

      // Statistics
      let yPos = 55;
      doc.setFontSize(10);
      doc.text(`Jumlah Hadir: ${stats.totalHadir}`, 20, yPos);
      doc.text(`Jumlah Izin: ${stats.totalIzin}`, 20, yPos + 7);
      doc.text(`Jumlah Belum: ${stats.totalBelum}`, 20, yPos + 14);
      doc.text(`Persentase Kehadiran: ${stats.persentase.toFixed(1)}%`, 20, yPos + 21);

      yPos += 35;

      // Group statistics (if "Semua" is selected)
      if (selectedKelompok === "Semua") {
        doc.text('Kehadiran per Kelompok:', 20, yPos);
        yPos += 10;
        
        kelompokOrder.forEach(kelompok => {
          const kelompokStats = stats.kelompokStats[kelompok];
          if (kelompokStats) {
            doc.text(`${kelompok}: ${kelompokStats.hadir}/${kelompokStats.total} (${kelompokStats.persentase.toFixed(1)}%)`, 25, yPos);
            yPos += 7;
          }
        });
        yPos += 10;
      }

      // Table data
      const tableData = filteredGenerus.map((generus, index) => {
        const attendance = updatedAttendanceData?.find(a => a.generus_id === generus.id);
        const status = attendance?.status_kehadiran || 'Belum';
        return [
          index + 1,
          generus.kelompok,
          generus.nama,
          status
        ];
      });

      console.log('Table data:', tableData);

      // Generate table
      autoTable(doc, {
        startY: yPos,
        head: [['No', 'Kelompok', 'Nama', 'Status Hadir']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }, // sky-500
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' }
        }
      });

      // Save PDF
      const fileName = `Rekap Kehadiran - ${subtitle} - ${activityName}.pdf`;
      console.log('Saving PDF with filename:', fileName);
      doc.save(fileName);

      console.log('PDF generated successfully');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Terjadi kesalahan saat membuat laporan: ${(error as Error).message || String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateStatistics = (generusData: DatabaseItem[], attendanceData: AttendanceItem[]) => {
    const totalGenerus = generusData.length;
    let totalHadir = 0;
    let totalIzin = 0;
    let totalBelum = 0;

    const kelompokStats: { [key: string]: { hadir: number; total: number; persentase: number; izin: number; belum: number } } = {};

    // Initialize group stats
    const kelompokOrder = ["Linggar", "Parakan Muncang", "Cikopo", "Bojong Koneng", "Cikancung 1", "Cikancung 2"];
    kelompokOrder.forEach(kelompok => {
      kelompokStats[kelompok] = { hadir: 0, total: 0, persentase: 0, izin: 0, belum: 0 };
    });

    // Calculate statistics by kelompok (same logic as dashboard)
    kelompokOrder.forEach(kelompok => {
      const kelompokMembers = generusData.filter(member => member.kelompok === kelompok);
      const kelompokAttendance = attendanceData.filter(att => {
        const member = kelompokMembers.find(m => m.id === att.generus_id);
        return member !== undefined;
      });
      
      const hadir = kelompokAttendance.filter(att => att.status_kehadiran === 'Hadir').length;
      const izin = kelompokAttendance.filter(att => att.status_kehadiran === 'Izin').length;
      const belum = kelompokMembers.length - kelompokAttendance.length + kelompokAttendance.filter(att => att.status_kehadiran === 'Belum').length;
      
      kelompokStats[kelompok] = {
        hadir,
        total: kelompokMembers.length,
        izin,
        belum,
        persentase: (kelompokMembers.length - izin) > 0 ? (hadir / (kelompokMembers.length - izin)) * 100 : 0
      };

      // Add to totals
      totalHadir += hadir;
      totalIzin += izin;
      totalBelum += belum;
    });

    // Calculate overall percentage (same as dashboard: exclude izin from denominator)
    const persentase = (totalGenerus - totalIzin) > 0 ? (totalHadir / (totalGenerus - totalIzin)) * 100 : 0;

    return {
      totalHadir,
      totalIzin,
      totalBelum,
      persentase,
      kelompokStats
    };
  };

  return (
    <section className="space-y-6 fade-in">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Laporan</h2>
      
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 fade-in-stagger">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cetak Laporan Kehadiran</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Activity Selection */}
          <div>
            <label htmlFor="kegiatan" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kegiatan
            </label>
            <select
              id="kegiatan"
              value={selectedKegiatan || ''}
              onChange={(e) => setSelectedKegiatan(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-gray-900"
            >
              {kegiatan.map((item) => (
                <option key={item.id} value={item.id} className="text-gray-900">
                  {item.nama_giat} - {new Date(item.tgl_giat).toLocaleDateString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          {/* Group Selection */}
          <div>
            <label htmlFor="kelompok" className="block text-sm font-medium text-gray-700 mb-2">
              Kelompok
            </label>
            <select
              id="kelompok"
              value={selectedKelompok}
              onChange={(e) => setSelectedKelompok(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-gray-900"
            >
              {kelompokOptions.map((option) => (
                <option key={option} value={option} className="text-gray-900">
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={generatePDF}
            disabled={!selectedKegiatan || isGenerating}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
          >
            {isGenerating ? 'Membuat Laporan...' : 'Cetak'}
          </button>
          
          {/* <button
            onClick={() => {
              setSelectedKegiatan(kegiatan.length > 0 ? kegiatan[0].id : null);
              setSelectedKelompok('Semua');
            }}
            className="px-6 py-3 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Batal
          </button> */}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Catatan:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Pilih "Semua" untuk mencetak laporan semua kelompok</li>
            <li>Pilih kelompok tertentu untuk mencetak laporan kelompok tersebut saja</li>
            <li>Laporan akan diurutkan berdasarkan kelompok dan nama (A-Z)</li>
            <li>File PDF akan otomatis terunduh setelah dibuat</li>
          </ul>
        </div>
      </div>
    </section>
  );
}


