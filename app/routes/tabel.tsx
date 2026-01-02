// Halaman ini sengaja dikomen karena tidak digunakan dalam aplikasi
/*
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
  status_kehadiran: 'Belum' | 'Hadir' | 'Izin';
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
  return null;
  /*
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
        flatList.push({ 
          ...generus, 
          current_no_grup: group.no_grup, 
          original_no_grup: group.no_grup,
          status_kehadiran: 'Hadir' 
        });
      });
      group.perempuan.forEach(generus => {
        flatList.push({ 
          ...generus, 
          current_no_grup: group.no_grup, 
          original_no_grup: group.no_grup,
          status_kehadiran: 'Hadir'
        });
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

  const handleStatusChange = async (generusId: number, newStatus: 'Belum' | 'Hadir' | 'Izin') => {
    if (!selectedKegiatanId) return;

    try {
      const generus = editableGenerusList.find(g => g.id === generusId);
      const generusName = generus?.nama;

      const confirmed = confirm(`Apakah Anda yakin ingin mengubah status kehadiran "${generusName || 'Generus'}" menjadi "${newStatus}"?`);
      if (!confirmed) return;

      // 1. Update status_kehadiran di tabel absensi
      const { error: absensiError } = await supabase
        .from('absensi')
        .update({ status_kehadiran: newStatus })
        .eq('generus_id', generusId)
        .eq('kegiatan_id', selectedKegiatanId);

      if (absensiError) {
        console.error('Error updating absensi status:', absensiError);
        alert('Gagal mengubah status kehadiran: ' + absensiError.message);
        return;
      }

      // 2. Update local state editableGenerusList
      setEditableGenerusList(prevList =>
        prevList.map(g =>
          g.id === generusId ? { ...g, status_kehadiran: newStatus } : g
        )
      );

      // 3. Tampilkan alert sukses
      alert(`Status kehadiran "${generusName || ''}" berhasil diubah menjadi "${newStatus}"!`);

      // 4. Re-fetch data untuk memastikan UI konsisten dengan DB
      await fetchAbsensiAndGenerus();

    } catch (error) {
      console.error('Unexpected error during status update:', error);
      alert('Terjadi kesalahan saat mengubah status kehadiran.');
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

    editableGenerusList.filter(g => g.status_kehadiran === 'Hadir' && !g.is_deleted).forEach(generus => {
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

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">
        Tabel Grup Kelompok
      </h2>
      <p>Halaman ini sedang tidak digunakan.</p>
    </div>
  );
  * /
}
*/
