import type { Route } from "./+types/tabel";
import { useEffect, useState, useMemo, useRef } from "react"; // Added useMemo and useRef
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
import { supabase } from "../supabase_connection";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tabel" },
    { name: "description", content: "Tabel Grup" },
  ];
}

type KegiatanItem = {
  id: number;
  nama_giat: string;
  tgl_giat: string; // ISO date string
  tempat: string;
};

type AbsensiItem = {
  id: number;
  kegiatan_id: number;
  generus_id: number;
  status_kehadiran: 'Belum' | 'Hadir' | 'Izin';
};

type GenerusItem = {
  id: number;
  nama: string;
  jenis_kelamin: string;
  kelompok: string;
};

type GroupedGenerus = {
  no_grup: number;
  laki_laki: GenerusItem[];
  perempuan: GenerusItem[];
};

type EditableGenerusItem = GenerusItem & { 
  current_no_grup: number; 
  original_no_grup: number; 
  is_deleted?: boolean; 
};

// Daftar pengecualian nama yang tidak dimasukkan ke dalam kelompok
const EXCLUSION_LIST = [
  "Dede Hilman Fauzi",
  "Alfian Ridwan Fauzi",
  "Muhammad Akmal Baihakhi",
  "Ashafa Multazam",
  "Revan Muhammad Nur Falah",
  "Muhammad Bilal Mardhiyyano Azizi",
  "Risa Fitria Khoirina",
  "Nurul Fajar",
  "Sherly Lydya Findianti",
  "Aulia Firdiannisa",
  "Hudaya Khoirul Anam",
  "Rofa Rofiandi Akbar",
  "Muhammad Rijal Mutaqin",
  "Akmal Nabhan Ibrahim",
  "Muhammad Deiphila Aziz Lianoto",
  "Rokib Ibnu Setya Akibi",
  "Hernan Alif Fauzi",
  "Mario Abdillah Alhaq",
  "Aisyah Putri",
  "Novita Alfarizi",
  "Nur Afni Hidayati",
  "Intan Aulia Solihat",
  "Adelia Pramesthi Putri",
  "Sabila Agnia",
  "Nurist Akyasil Akmal",
  "Rayza Fauzan Al Habsy"
];

export default function Informasi() {
  const [kegiatanList, setKegiatanList] = useState<KegiatanItem[]>([]);
  const [loadingKegiatan, setLoadingKegiatan] = useState(true);
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);

  const [absensiData, setAbsensiData] = useState<AbsensiItem[]>([]);
  const [generusData, setGenerusData] = useState<GenerusItem[]>([]);
  const [loadingAbsensiGenerus, setLoadingAbsensiGenerus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableGenerusList, setEditableGenerusList] = useState<EditableGenerusItem[]>([]);

  // Fungsi untuk menginisialisasi editableGenerusList dari groupedGenerus
  const initializeEditableGenerusList = (groups: GroupedGenerus[]) => {
    const flatList: EditableGenerusItem[] = [];
    groups.forEach(group => {
      group.laki_laki.forEach(generus => {
        flatList.push({ ...generus, current_no_grup: group.no_grup, original_no_grup: group.no_grup });
      });
      group.perempuan.forEach(generus => {
        flatList.push({ ...generus, current_no_grup: group.no_grup, original_no_grup: group.no_grup });
      });
    });
    setEditableGenerusList(flatList);
  };

  const handleIndividualGroupChange = (generusId: number, newGroupNumber: number) => {
    setEditableGenerusList(prevList =>
      prevList.map(generus =>
        generus.id === generusId ? { ...generus, current_no_grup: newGroupNumber } : generus
      )
    );
  };

  const handleDeleteGenerus = async (generusId: number) => {
     if (!selectedKegiatanId) return;
 
     try {
       // Cari nama generus untuk menghapus dari tabel grup jika ada
       const generusToDelete = editableGenerusList.find(g => g.id === generusId);
       const generusName = generusToDelete?.nama;

       // 1. Update status_kehadiran di tabel absensi menjadi 'Belum'
       const { error: absensiError } = await supabase
         .from('absensi')
         .update({ status_kehadiran: 'Belum' })
         .eq('generus_id', generusId)
         .eq('kegiatan_id', selectedKegiatanId);
 
       if (absensiError) {
         console.error('Error updating absensi status:', absensiError);
         alert('Gagal mengubah status kehadiran.');
         return;
       }

       // 2. Hapus dari tabel grup jika nama ditemukan
       if (generusName) {
         await supabase
           .from('grup')
           .delete()
           .eq('id_kegiatan', selectedKegiatanId)
           .eq('nama', generusName);
       }
 
       // 3. Tampilkan alert sukses
       alert(`Data "${generusName || ''}" berhasil dihapus dari kelompok dan status kehadiran diubah menjadi "Belum"!`);
 
       // 4. Update local state editableGenerusList
       setEditableGenerusList(prevList =>
         prevList.map(generus =>
           generus.id === generusId ? { ...generus, is_deleted: true } : generus
         )
       );
 
       // 5. Re-fetch data untuk memastikan UI konsisten dengan DB
       await fetchAbsensiAndGenerus();
 
     } catch (error) {
       console.error('Unexpected error during delete:', error);
       alert('Terjadi kesalahan saat menghapus data.');
     }
   };

  const handleSave = async () => {
    if (selectedKegiatanId === null) return;

    // Hapus semua data grup lama untuk kegiatan ini
    const { error: deleteError } = await supabase
      .from('grup')
      .delete()
      .eq('id_kegiatan', selectedKegiatanId);

    if (deleteError) {
      console.error('Error deleting old grouped data:', deleteError);
      alert('Gagal menyimpan perubahan grup.');
      return;
    }

    // Masukkan data grup yang baru dari editableGenerusList (yang tidak dihapus)
    const inserts = editableGenerusList
      .filter(generus => !generus.is_deleted)
      .map(generus => ({
        nama: generus.nama,
        no_grup: generus.current_no_grup.toString(),
        kelompok: generus.kelompok,
        id_kegiatan: selectedKegiatanId,
      }));

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('grup')
        .insert(inserts);

      if (insertError) {
        console.error('Error inserting new grouped data:', insertError);
        alert('Gagal menyimpan perubahan grup.');
        return;
      }
    }

    alert('Perubahan grup berhasil disimpan!');
    setIsEditing(false);
    // Re-fetch data untuk memastikan UI konsisten dengan DB
    // Ini akan memicu initializeEditableGenerusList lagi dengan data terbaru
    // fetchAbsensiAndGenerus(); // Anda mungkin perlu menyesuaikan ini jika menyebabkan masalah
  };

  const handleCancelEdit = () => {
    initializeEditableGenerusList(groupedGenerus); // Reset ke data awal
    setIsEditing(false);
  };

  const tableRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintToPdf = async () => {
    if (groupedEditableGenerus.length === 0) {
      alert("Tidak ada data grup untuk dicetak.");
      return;
    }

    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      let yOffset = 20; // Initial Y position for content

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PEMBAGIAN KELOMPOK', 105, yOffset, { align: 'center' });
      yOffset += 10;

      for (let i = 0; i < groupedEditableGenerus.length; i++) {
        const group = groupedEditableGenerus[i];
        const groupTitle = `Grup ${group.no_grup}`;

        // Add group title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(groupTitle, 20, yOffset);
        yOffset += 5;

        const tableData = [];
        const maxLength = Math.max(group.laki_laki.length, group.perempuan.length);

        for (let j = 0; j < maxLength; j++) {
          tableData.push([
            j + 1,
            group.laki_laki[j]?.nama || '-',
            group.perempuan[j]?.nama || '-'
          ]);
        }

        autoTable(doc, {
          startY: yOffset,
          head: [['No', 'Laki-laki', 'Perempuan']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [14, 165, 233] }, // sky-500
          styles: { fontSize: 12 },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' }
          },
          didDrawPage: function (data) {
            // Footer will be added after all content is generated
          }
        });

        yOffset = (doc as any).lastAutoTable.finalY + 10; // Update yOffset after table

        // Add a page break after every two tables
        if ((i + 1) % 2 === 0 && (i + 1) < groupedEditableGenerus.length) {
          doc.addPage();
          yOffset = 20; // Reset yOffset for new page
        }
      }

      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      }

      doc.save('tabel_grup.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Terjadi kesalahan saat membuat laporan: ${(error as Error).message || String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch kegiatan list
  useEffect(() => {
    async function fetchKegiatan() {
      try {
        setLoadingKegiatan(true);
        const { data, error } = await supabase
          .from('kegiatan')
          .select('id, nama_giat, tgl_giat, tempat')
          .order('tgl_giat', { ascending: false });

        if (error) {
          console.error('Error fetching kegiatan:', error);
        } else {
          setKegiatanList(data || []);
          if (data && data.length > 0) {
            setSelectedKegiatanId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching kegiatan:', error);
      } finally {
        setLoadingKegiatan(false);
      }
    }
    fetchKegiatan();
  }, []);

  // Move fetch function outside useEffect so it can be called after delete
  async function fetchAbsensiAndGenerus() {
    if (!selectedKegiatanId) {
      setAbsensiData([]);
      setGenerusData([]);
      return;
    }

    try {
      setLoadingAbsensiGenerus(true);
      const { data: absensi, error: absensiError } = await supabase
        .from('absensi')
        .select('id, kegiatan_id, generus_id, status_kehadiran')
        .eq('kegiatan_id', selectedKegiatanId);

      if (absensiError) {
        console.error('Error fetching absensi:', absensiError);
        setAbsensiData([]);
        setGenerusData([]);
        return;
      }

      setAbsensiData(absensi || []);

      const databaseIds = (absensi || []).map(item => item.generus_id);
      const uniqueDatabaseIds = [...new Set(databaseIds)];

      if (uniqueDatabaseIds.length > 0) {
        const { data: generus, error: generusError } = await supabase
          .from('data_generus')
          .select('id, nama, jenis_kelamin, kelompok')
          .in('id', uniqueDatabaseIds);

        if (generusError) {
          console.error('Error fetching generus:', generusError);
          setGenerusData([]);
          return;
        }
        setGenerusData(generus || []);
      } else {
        console.log('No unique database IDs found, clearing generus data.');
        setGenerusData([]);
      }

    } catch (error) {
      console.error('Unexpected error fetching absensi and generus:', error);
    } finally {
      setLoadingAbsensiGenerus(false);
    }
  }

  // Fetch absensi and generus data based on selectedKegiatanId
  useEffect(() => {
    fetchAbsensiAndGenerus();
  }, [selectedKegiatanId]);

  // Grouping logic
  const groupedGenerus = useMemo(() => {
    const groups: { [key: number]: { laki_laki: GenerusItem[]; perempuan: GenerusItem[] } } = {};
    for (let i = 1; i <= 8; i++) {
      groups[i] = { laki_laki: [], perempuan: [] };
    }

    const hadirGenerus: GenerusItem[] = [];
    absensiData.forEach(absensi => {
      if (absensi.status_kehadiran === 'Hadir') {
        const generus = generusData.find(g => g.id === absensi.generus_id);
        // Implementasi logika pengecualian: 
        // Jika nama termasuk dalam daftar EXCLUSION_LIST, jangan masukkan ke kelompok
        if (generus && !EXCLUSION_LIST.includes(generus.nama)) {
          hadirGenerus.push(generus);
        }
      }
    });

            const lakiLakiHadir = hadirGenerus.filter(g => g.jenis_kelamin === 'L');
            const perempuanHadir = hadirGenerus.filter(g => g.jenis_kelamin === 'P');

    let maleGroupIndex = 0;
    lakiLakiHadir.forEach(generus => {
      const groupNumber = (maleGroupIndex % 8) + 1;
      groups[groupNumber].laki_laki.push(generus);
      maleGroupIndex++;
    });

    let femaleGroupIndex = 0;
    perempuanHadir.forEach(generus => {
      const groupNumber = (femaleGroupIndex % 8) + 1;
      groups[groupNumber].perempuan.push(generus);
      femaleGroupIndex++;
    });

    return Object.keys(groups).map(key => ({
      no_grup: Number(key),
      laki_laki: groups[Number(key)].laki_laki,
      perempuan: groups[Number(key)].perempuan,
    })).sort((a, b) => a.no_grup - b.no_grup);
          }, [absensiData, generusData]);

          console.log('Final groupedGenerus:', groupedGenerus); // Re-run when absensiData or generusData changes

  // Panggil initializeEditableGenerusList saat groupedGenerus berubah
  useEffect(() => {
    if (groupedGenerus.length > 0) {
      initializeEditableGenerusList(groupedGenerus);
    }
  }, [groupedGenerus]);

  const groupedEditableGenerus = useMemo(() => {
    const groups: { [key: number]: { laki_laki: EditableGenerusItem[]; perempuan: EditableGenerusItem[] } } = {};
    for (let i = 1; i <= 8; i++) {
      groups[i] = { laki_laki: [], perempuan: [] };
    }

    editableGenerusList.filter(g => !g.is_deleted).forEach(generus => {
      if (generus.jenis_kelamin === 'L') {
        groups[generus.current_no_grup].laki_laki.push(generus);
      } else {
        groups[generus.current_no_grup].perempuan.push(generus);
      }
    });

    return Object.keys(groups).map(key => ({
      no_grup: Number(key),
      laki_laki: groups[Number(key)].laki_laki,
      perempuan: groups[Number(key)].perempuan,
    })).sort((a, b) => a.no_grup - b.no_grup);
  }, [editableGenerusList]);

  // Auto-save grouped data to Supabase when groupedGenerus or selectedKegiatanId changes

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">
        Tabel Grup Kelompok
      </h2>

      {loadingKegiatan ? (
        <p>Memuat daftar kegiatan...</p>
      ) : kegiatanList.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <label htmlFor="kegiatan-select" className="block text-sm font-medium text-gray-700 mb-1">
            Pilih Kegiatan
          </label>
          <select
            id="kegiatan-select"
            value={selectedKegiatanId || ''}
            onChange={(e) => setSelectedKegiatanId(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {kegiatanList.map((kegiatan) => (
              <option key={kegiatan.id} value={kegiatan.id}>
                {kegiatan.nama_giat} - {new Date(kegiatan.tgl_giat).toLocaleDateString('id-ID')}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p>Tidak ada kegiatan yang tersedia.</p>
      )}

      {loadingAbsensiGenerus && selectedKegiatanId && ( // Only show loading if a kegiatan is selected
        <p>Memuat data absensi dan generus untuk kegiatan ini...</p>
      )}

      {/* Tampilkan hasil pengelompokan */}
      {!loadingAbsensiGenerus && selectedKegiatanId && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Hasil Pengelompokan</h3>
          {isEditing && (
            <div className="mb-4 flex justify-end space-x-2">
              <button
                onClick={handleSave}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Simpan Perubahan
              </button>
              <button
                onClick={handleCancelEdit}
                className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Batal
              </button>
            </div>
          )}
          {!isEditing && (
            <div className="mb-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Edit Grup
              </button>
              <button
                onClick={handlePrintToPdf}
                disabled={isGenerating}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Mencetak...' : 'Cetak ke PDF'}
              </button>
            </div>
          )}
          {groupedEditableGenerus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedEditableGenerus.map(group => (
                <div key={group.no_grup} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Grup {group.no_grup}</h4>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Nomor</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Laki-laki</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Perempuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Array.from({ length: Math.max(group.laki_laki.length, group.perempuan.length) }).map((_, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-gray-700">{index + 1}</td>
                          <td className="px-4 py-2 text-gray-900">
                            {isEditing && group.laki_laki[index] ? (
                              <div className="flex items-center gap-2">
                                {group.laki_laki[index].nama}
                                <select
                                  value={group.laki_laki[index].current_no_grup}
                                  onChange={(e) => handleIndividualGroupChange(group.laki_laki[index].id, Number(e.target.value))}
                                  className="rounded-md border border-gray-300 px-2 py-1 text-gray-900"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleDeleteGenerus(group.laki_laki[index].id)}
                                  className="p-1 rounded-md bg-red-500 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                  aria-label="Hapus Generus"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 01-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              group.laki_laki[index]?.nama || '-'
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {isEditing && group.perempuan[index] ? (
                              <div className="flex items-center gap-2">
                                {group.perempuan[index].nama}
                                <select
                                  value={group.perempuan[index].current_no_grup}
                                  onChange={(e) => handleIndividualGroupChange(group.perempuan[index].id, Number(e.target.value))}
                                  className="rounded-md border border-gray-300 px-2 py-1 text-gray-900"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleDeleteGenerus(group.perempuan[index].id)}
                                  className="p-1 rounded-md bg-red-500 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                  aria-label="Hapus Generus"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 01-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              group.perempuan[index]?.nama || '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : ( // If no generus are present after grouping
            <p>Tidak ada generus yang hadir untuk kegiatan ini.</p>
          )}
        </div>
      )} 
      {!selectedKegiatanId && !loadingKegiatan && kegiatanList.length === 0 && (
        <p>Pilih kegiatan untuk melihat pengelompokan.</p>
      )}
    </div>
  );
}
