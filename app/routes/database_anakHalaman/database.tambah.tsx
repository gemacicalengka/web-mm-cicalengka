import type { Route } from "./+types/database.tambah";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../supabase_connection";
import { authUtils } from "../../utils/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Database - Tambah Data" },
    { name: "description", content: "Tambah Data Database" },
  ];
}

type DatabaseItem = {
  id: number;
  nama: string;
  jenis_kelamin: "L" | "P";
  kelompok: "Linggar" | "Parakan Muncang" | "Cikopo" | "Bojong Koneng" | "Cikancung 1" | "Cikancung 2";
  tgl_lahir: string | null;
  status: "Pelajar" | "Lulus Pelajar" | "Mahasiswa" | "Mahasiswa & Kerja" | "Lulus Kuliah" | "Kerja" | "MS" | "MT";
};

function isValidDateParts(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

function normalizeTanggalLahir(rawValue: string): { value: string | null; error?: string } {
  const trimmed = rawValue.trim();
  if (!trimmed) return { value: null };
  if (trimmed.toLowerCase() === "dd/mm/yyyy") return { value: null };

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (!isValidDateParts(year, month, day)) return { value: null, error: "Tanggal lahir tidak valid." };
    return { value: trimmed };
  }

  const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (!isValidDateParts(year, month, day)) return { value: null, error: "Tanggal lahir tidak valid." };
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return { value: `${year}-${mm}-${dd}` };
  }

  return { value: null, error: "Format tanggal lahir tidak valid." };
}

export default function DatabaseTambah() {
  const navigate = useNavigate();
  
  // Check permission - redirect if user doesn't have add permission
  useEffect(() => {
    if (!authUtils.hasPermission('add')) {
      navigate("/database");
      return;
    }
  }, [navigate]);
  
  // Form state
  const [nama, setNama] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P" | "">("");
  const [kelompok, setKelompok] = useState<DatabaseItem["kelompok"] | "">("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [status, setStatus] = useState<DatabaseItem["status"] | "">("");
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validateForm() {
    const newErrors: Record<string, string> = {};
    
    if (!nama.trim()) newErrors.nama = "Data harus diisi.";
    if (!jenisKelamin) newErrors.jenisKelamin = "Data harus diisi.";
    if (!kelompok) newErrors.kelompok = "Data harus diisi.";
    const normalizedTanggalLahir = normalizeTanggalLahir(tanggalLahir);
    if (normalizedTanggalLahir.error) newErrors.tanggalLahir = normalizedTanggalLahir.error;
    if (!status) newErrors.status = "Data harus diisi.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitError(null);
    setLoading(true);
    
    try {
      const normalizedTanggalLahir = normalizeTanggalLahir(tanggalLahir);
      const { data, error } = await supabase
        .from('data_generus')
        .insert([
          {
            nama: nama.trim(),
            jenis_kelamin: jenisKelamin as "L" | "P",
            kelompok: kelompok as DatabaseItem["kelompok"],
            tgl_lahir: normalizedTanggalLahir.value,
            status: status as DatabaseItem["status"],
          }
        ])
        .select();
      
      if (error) {
        console.error('Error inserting data:', error);
        setSubmitError(`Gagal menyimpan data: ${error.message}`);
        setLoading(false);
        return;
      }
      
      navigate("/database");
    } catch (error) {
      console.error('Error:', error);
      setSubmitError("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
      setLoading(false);
    }
  }

  function handleCancel() {
    navigate("/database");
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Database - Tambah Data</h2>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        {submitError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                errors.nama ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan nama"
            />
            {errors.nama && <p className="mt-1 text-sm text-red-500">{errors.nama}</p>}
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center text-black">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="L"
                  checked={jenisKelamin === "L"}
                  onChange={(e) => setJenisKelamin(e.target.value as "L" | "P")}
                  className="mr-2"
                />
                L
              </label>
              <label className="flex items-center text-black">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="P"
                  checked={jenisKelamin === "P"}
                  onChange={(e) => setJenisKelamin(e.target.value as "L" | "P")}
                  className="mr-2"
                />
                P
              </label>
            </div>
            {errors.jenisKelamin && <p className="mt-1 text-sm text-red-500">{errors.jenisKelamin}</p>}
          </div>

          {/* Kelompok */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelompok <span className="text-red-500">*</span>
            </label>
            <select
              value={kelompok}
              onChange={(e) => setKelompok(e.target.value as DatabaseItem["kelompok"])}
              className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                errors.kelompok ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Pilih Kelompok</option>
              <option value="Linggar">Linggar</option>
              <option value="Parakan Muncang">Parakan Muncang</option>
              <option value="Cikopo">Cikopo</option>
              <option value="Bojong Koneng">Bojong Koneng</option>
              <option value="Cikancung 1">Cikancung 1</option>
              <option value="Cikancung 2">Cikancung 2</option>
            </select>
            {errors.kelompok && <p className="mt-1 text-sm text-red-500">{errors.kelompok}</p>}
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Lahir <span className="text-gray-500 text-xs">(opsional)</span>
            </label>
            <input
              type="date"
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                errors.tanggalLahir ? "border-red-500" : "border-gray-300"
              }`}
            />
            {/* <p className="mt-1 text-xs text-gray-500">Kosong atau “dd/mm/yyyy” akan disimpan sebagai kosong.</p> */}
            {errors.tanggalLahir && <p className="mt-1 text-sm text-red-500">{errors.tanggalLahir}</p>}
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DatabaseItem["status"])}
              className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                errors.status ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Pilih Status</option>
              <option value="Pelajar">Pelajar</option>
              <option value="Lulus Pelajar">Lulus Pelajar</option>
              <option value="Mahasiswa">Mahasiswa</option>
              <option value="Mahasiswa & Kerja">Mahasiswa & Kerja</option>
              <option value="Lulus Kuliah">Lulus Kuliah</option>
              <option value="Kerja">Kerja</option>
              <option value="MS">MS</option>
              <option value="MT">MT</option>
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-sky-500 rounded-md hover:bg-sky-600 font-medium disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </section>
  );
}
