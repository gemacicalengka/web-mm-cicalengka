import type { Route } from "./+types/absensi";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { supabase } from "../supabase_connection";

interface KegiatanItem {
  id: number;
  nama_giat: string;
  tgl_giat: string;
  tempat: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Absensi" },
    { name: "description", content: "Halaman Absensi" },
  ];
}

export default function Absensi() {
  const [kegiatan, setKegiatan] = useState<KegiatanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch kegiatan data
        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan')
          .select('*')
          .order('tgl_giat', { ascending: false });
        
        if (kegiatanError) {
          console.error('Error fetching kegiatan:', kegiatanError);
        } else {
          setKegiatan(kegiatanData || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Absensi</h2>
        <div className="text-center py-8">Loading...</div>
      </section>
    );
  }

  return (
    <section className="space-y-6 fade-in">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Absensi</h2>
      
      {/* Kegiatan Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 fade-in-stagger">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Kegiatan</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kegiatan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kegiatan.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-gray-700">{index + 1}</td>
                  <td className="px-4 py-2 text-gray-900">{item.nama_giat}</td>
                  <td className="px-4 py-2 text-gray-700">{new Date(item.tgl_giat).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-2 text-gray-700">{item.tempat}</td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/absensi/edit/${item.id}`}
                      className="inline-flex items-center rounded-md bg-green-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-green-600 w-full sm:w-auto justify-center"
                    >
                      Edit Kehadiran
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


