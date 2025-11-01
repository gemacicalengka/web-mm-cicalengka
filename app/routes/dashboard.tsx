import type { Route } from "./+types/dashboard";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { supabase } from "../supabase_connection";

interface DatabaseItem {
  id: number;
  nama: string;
  jenis_kelamin: string;
  kelompok: string;
  status: string;
  tgl_lahir: string;
}

interface KegiatanItem {
  id: number;
  nama_giat: string;
  tgl_giat: string;
  tempat: string;
}

interface AttendanceItem {
  id: number;
  kegiatan_id: number;
  generus_id: number;
  status_kehadiran: 'Belum' | 'Hadir' | 'Izin';
}

interface AttendanceStats {
  kelompok: string;
  hadir: number;
  total: number;
  izin: number;
  belum: number;
}

interface ClassificationStats {
  total: number;
  lakiLaki: number;
  perempuan: number;
}

interface UsiaStats {
  usia17Plus: ClassificationStats;
  usia20Plus: ClassificationStats;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Admin Dashboard" },
  ];
}

export default function Dashboard() {
  const [items, setItems] = useState<DatabaseItem[]>([]);
  const [allKegiatan, setAllKegiatan] = useState<KegiatanItem[]>([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState<KegiatanItem | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [classificationStats, setClassificationStats] = useState<{ praNikah: ClassificationStats; remaja: ClassificationStats; usia: UsiaStats } | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to calculate age from birth date
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper function to get gender breakdown
  const getGenderBreakdown = (data: DatabaseItem[]) => {
    const lakiLaki = data.filter(item => item.jenis_kelamin === 'L').length;
    const perempuan = data.filter(item => item.jenis_kelamin === 'P').length;
    return { lakiLaki, perempuan };
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch data_generus
        const { data, error } = await supabase
          .from('data_generus')
          .select('*');
        
        if (error) {
          console.error('Error fetching data:', error);
          return;
        }
        
        setItems(data || []);

        // Calculate classification stats
        const praNikahData = (data || []).filter(item => item.status !== 'Pelajar');
        const remajaData = (data || []).filter(item => item.status === 'Pelajar');

        const { lakiLaki: praNikahL, perempuan: praNikahP } = getGenderBreakdown(praNikahData);
        const { lakiLaki: remajaL, perempuan: remajaP } = getGenderBreakdown(remajaData);

        const usia17PlusData = (data || []).filter(item => calculateAge(item.tgl_lahir) >= 17);
        const usia20PlusData = (data || []).filter(item => calculateAge(item.tgl_lahir) >= 20);

        const { lakiLaki: usia17L, perempuan: usia17P } = getGenderBreakdown(usia17PlusData);
        const { lakiLaki: usia20L, perempuan: usia20P } = getGenderBreakdown(usia20PlusData);

        setClassificationStats({
          praNikah: { total: praNikahData.length, lakiLaki: praNikahL, perempuan: praNikahP },
          remaja: { total: remajaData.length, lakiLaki: remajaL, perempuan: remajaP },
          usia: {
            usia17Plus: { total: usia17PlusData.length, lakiLaki: usia17L, perempuan: usia17P },
            usia20Plus: { total: usia20PlusData.length, lakiLaki: usia20L, perempuan: usia20P },
          },
        });

        // Fetch all kegiatan for dropdown
        const { data: allKegiatanData, error: allKegiatanError } = await supabase
          .from('kegiatan')
          .select('*')
          .order('tgl_giat', { ascending: false });
        
        if (allKegiatanError) {
          console.error('Error fetching all kegiatan:', allKegiatanError);
        } else if (allKegiatanData && allKegiatanData.length > 0) {
          setAllKegiatan(allKegiatanData);
          // Set the latest kegiatan as default selected
          setSelectedKegiatan(allKegiatanData[0]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch attendance data when selected kegiatan changes
  useEffect(() => {
    async function fetchAttendanceData() {
      if (!selectedKegiatan || !items.length) return;

      try {
        // Fetch attendance data for selected kegiatan
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('absensi')
          .select('*')
          .eq('kegiatan_id', selectedKegiatan.id);
        
        if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError);
        } else {
          // Calculate attendance statistics by kelompok
          const kelompokList = ['Linggar', 'Parakan Muncang', 'Cikopo', 'Bojong Koneng', 'Cikancung 1', 'Cikancung 2'];
          const stats: AttendanceStats[] = [];
          
          kelompokList.forEach(kelompok => {
            const kelompokMembers = items.filter(member => member.kelompok === kelompok);
            const kelompokAttendance = (attendanceData || []).filter(att => {
              const member = kelompokMembers.find(m => m.id === att.generus_id);
              return member !== undefined;
            });
            
            const hadir = kelompokAttendance.filter(att => att.status_kehadiran === 'Hadir').length;
            const izin = kelompokAttendance.filter(att => att.status_kehadiran === 'Izin').length;
            const belum = kelompokMembers.length - kelompokAttendance.length + kelompokAttendance.filter(att => att.status_kehadiran === 'Belum').length;
            
            stats.push({
              kelompok,
              hadir,
              total: kelompokMembers.length,
              izin,
              belum
            });
          });
          
          setAttendanceStats(stats);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    }

    fetchAttendanceData();
  }, [selectedKegiatan, items]);

  const handleKegiatanChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    const kegiatan = allKegiatan.find(k => k.id === selectedId);
    setSelectedKegiatan(kegiatan || null);
  };

  // Calculate statistics
  const totalMudaMudi = items.length;
  const totalLakiLaki = items.filter(item => item.jenis_kelamin === 'L').length;
  const totalPerempuan = items.filter(item => item.jenis_kelamin === 'P').length;
  const totalPraNikah = items.filter(item => item.status !== 'Pelajar').length;
  const totalRemaja = items.filter(item => item.status === 'Pelajar').length;

  // Calculate overall attendance statistics
  const totalHadir = attendanceStats.reduce((sum, stat) => sum + stat.hadir, 0);
  const totalIzin = attendanceStats.reduce((sum, stat) => sum + stat.izin, 0);
  const totalBelum = attendanceStats.reduce((sum, stat) => sum + stat.belum, 0);
  const totalKeseluruhan = attendanceStats.reduce((sum, stat) => sum + stat.total, 0);
  const persentaseKehadiran = totalKeseluruhan > 0 ? ((totalHadir / (totalKeseluruhan - totalIzin)) * 100) : 0;

  if (loading) {
    return (
      <section className="space-y-4 text-justify fade-in">
        <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Dashboard</h2>
        <div className="text-center py-8">Loading...</div>
      </section>
    );
  }

  return (
    <section className="space-y-6 text-justify fade-in">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 fade-in-stagger">
        <SummaryCard title="JUMLAH MUDA-MUDI" value={totalMudaMudi.toString()} icon={UsersIcon} />
        <SummaryCard title="LAKI-LAKI" value={totalLakiLaki.toString()} icon={MaleIcon} />
        <SummaryCard title="PEREMPUAN" value={totalPerempuan.toString()} icon={FemaleIcon} />
        <SummaryCard title="USIA PRA-NIKAH" value={totalPraNikah.toString()} icon={HeartIcon} />
        <SummaryCard title="USIA REMAJA" value={totalRemaja.toString()} icon={StudentIcon} />
      </div>
      
      {/* Separator Line */}
      <div className="border-t border-gray-200"></div>

      {/* Classification Section */}
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Klasifikasi Jumlah MM</h2>

      {classificationStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-in-stagger">
          {/* Card 1: Status Pra-Nikah */}
          <div className="rounded-xl border border-sky-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <HeartIcon className="h-6 w-6 text-sky-500" />
              <div className="text-lg font-medium text-gray-900">Status Pra-Nikah</div>
            </div>
            <div className="text-3xl font-semibold text-sky-600 mb-2">{classificationStats.praNikah.total}</div>
            <div className="text-sm text-gray-700">
              <p>Laki-laki: {classificationStats.praNikah.lakiLaki}</p>
              <p>Perempuan: {classificationStats.praNikah.perempuan}</p>
            </div>
          </div>

          {/* Card 2: Status Remaja */}
          <div className="rounded-xl border border-sky-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <StudentIcon className="h-6 w-6 text-sky-500" />
              <div className="text-lg font-medium text-gray-900">Status Remaja</div>
            </div>
            <div className="text-3xl font-semibold text-sky-600 mb-2">{classificationStats.remaja.total}</div>
            <div className="text-sm text-gray-700">
              <p>Laki-laki: {classificationStats.remaja.lakiLaki}</p>
              <p>Perempuan: {classificationStats.remaja.perempuan}</p>
            </div>
          </div>

          {/* Card 3: Klasifikasi Usia */}
          <div className="rounded-xl border border-sky-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <ChartIcon className="h-6 w-6 text-sky-500" />
              <div className="text-lg font-medium text-gray-900">Klasifikasi Usia</div>
            </div>
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-gray-800">Usia &gt;= 17 tahun:</h4>
                <p className="text-xl font-semibold text-sky-600">Total: {classificationStats.usia.usia17Plus.total}</p>
                <p className="text-sm text-gray-700">Laki-laki: {classificationStats.usia.usia17Plus.lakiLaki}, Perempuan: {classificationStats.usia.usia17Plus.perempuan}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Usia &gt;= 20 tahun:</h4>
                <p className="text-xl font-semibold text-sky-600">Total: {classificationStats.usia.usia20Plus.total}</p>
                <p className="text-sm text-gray-700">Laki-laki: {classificationStats.usia.usia20Plus.lakiLaki}, Perempuan: {classificationStats.usia.usia20Plus.perempuan}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Attendance Recap Section */}
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Rekap Kehadiran - Kegiatan Terakhir Desa</h2>
      
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {selectedKegiatan ? (
          <>
            {/* Activity Selection Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedKegiatan.nama_giat}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="kegiatan-select" className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  Pilih Kegiatan:
                </label>
                <select
                  id="kegiatan-select"
                  value={selectedKegiatan.id}
                  onChange={handleKegiatanChange}
                  className="px-20 py-2 border text-gray-900 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white w-full sm:min-w-[200px] text-left"
                  style={{ maxHeight: '200px', overflowY: 'auto' }}
                >
                  {allKegiatan.map((kegiatan) => (
                    <option key={kegiatan.id} value={kegiatan.id}>
                      {kegiatan.nama_giat} - {new Date(kegiatan.tgl_giat).toLocaleDateString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Bar Chart */}
            <div className="mb-8 fade-in-stagger overflow-x-auto">
              <div className="relative h-64 sm:h-80 flex items-end justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 border-l-2 border-b-2 border-gray-300 ml-6 sm:ml-8 mr-2 sm:mr-4 px-1 sm:px-2 md:px-4 lg:px-6 min-w-[320px] sm:min-w-[480px] md:min-w-[600px]">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-gray-200 w-full"></div>
                  <div className="border-t border-gray-200 w-full"></div>
                  <div className="border-t border-gray-200 w-full"></div>
                  <div className="border-t border-gray-200 w-full"></div>
                  <div className="border-t border-gray-200 w-full"></div>
                  <div className="border-t border-gray-200 w-full"></div>
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-600 -ml-6 sm:-ml-8">
                  <span>50</span>
                  <span>40</span>
                  <span>30</span>
                  <span>20</span>
                  <span>10</span>
                  <span>0</span>
                </div>
                
                
                {/* Grafik Diagram Batang */}
                {attendanceStats.map((stat, index) => {
                  const maxHeight = 50;
                  const barHeight = (stat.hadir / maxHeight) * 100;
                  
                  return (
                    <div key={index} className="flex flex-col items-center relative">
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 hidden sm:block">
                        {stat.kelompok}: {stat.hadir}
                      </div>
                      {/* Bar */}
                      <div 
                        className="w-8 sm:w-12 md:w-16 lg:w-20 xl:w-30 bg-sky-500 rounded-t-md transition-all duration-300 hover:bg-sky-600 cursor-pointer"
                        style={{ height: `${Math.max(barHeight * 2.8, 2)}px` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              
              {/* Container for Group Names and Attendance Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mt-2 overflow-x-auto">
                {/* Invisible alignment structure to match main chart */}
                <div className="relative flex items-end justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 ml-6 sm:ml-8 mr-2 sm:mr-4 px-1 sm:px-2 md:px-4 lg:px-6 min-w-[320px] sm:min-w-[480px] md:min-w-[600px]">
                  {attendanceStats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center relative">
                      {/* Invisible bar for alignment - same width as main chart bars */}
                      <div className="w-8 sm:w-12 md:w-16 lg:w-20 xl:w-30 opacity-0 pointer-events-none" style={{ height: '1px' }}></div>
                      
                      {/* Group name and attendance info */}
                      <div className="text-center flex flex-col items-center relative">
                        <div className="font-semibold text-gray-800 text-xs sm:text-sm mb-1 sm:mb-2 whitespace-nowrap max-w-[60px] sm:max-w-none overflow-hidden text-ellipsis">
                          {stat.kelompok}
                        </div>
                        <div className="text-sm sm:text-lg font-bold text-gray-900">
                          {stat.hadir}
                        </div>
                        <div className="text-xs text-gray-600">
                          dari {stat.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Statistics Section */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 fade-in-stagger">
              <StatCard title="Jumlah Hadir" value={totalHadir.toString()} icon={CheckIcon} />
              <StatCard title="Jumlah Izin" value={totalIzin.toString()} icon={ClockIcon} />
              <StatCard title="Jumlah Belum" value={totalBelum.toString()} icon={XIcon} />
              <StatCard title="Persentase Kehadiran" value={`${persentaseKehadiran.toFixed(1)}%`} icon={ChartIcon} />
            </div>
            
            {/* Group Attendance Percentages */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Persentase Kehadiran Per Kelompok:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {attendanceStats.map((stat, index) => {
                  const groupPercentage = stat.total > 0 ? ((stat.hadir / (stat.total - stat.izin)) * 100) : 0;
                  return (
                    <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 truncate pr-2">{stat.kelompok}</span>
                      <span className="text-xs sm:text-sm font-bold text-sky-600 flex-shrink-0">{groupPercentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Belum ada data kegiatan untuk ditampilkan
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: (props: { className?: string }) => JSX.Element }) {
  return (
    <div className="rounded-xl border border-sky-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-6 w-6 text-sky-500" />
        <div className="text-sm font-medium text-gray-900">{title}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold text-sky-600">{value}</div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: (props: { className?: string }) => JSX.Element }) {
  return (
    <div className="rounded-xl border border-sky-200 bg-white p-3 sm:p-4">
      <div className="flex items-center gap-1 sm:gap-2">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500" />
        <div className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">{title}</div>
      </div>
      <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-sky-600">{value}</div>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M12 13c-4.97 0-9 2.239-9 5v1h18v-1c0-2.761-4.03-5-9-5Z"/>
      <path strokeWidth="1.5" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z"/>
    </svg>
  );
}
function MaleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M15 3h6v6"/>
      <path strokeWidth="1.5" d="M21 3 12 12"/>
      <circle cx="9" cy="15" r="6" strokeWidth="1.5"/>
    </svg>
  );
}
function FemaleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <circle cx="12" cy="8" r="5" strokeWidth="1.5"/>
      <path strokeWidth="1.5" d="M12 13v8m-4-4h8"/>
    </svg>
  );
}
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M12 21s-7-4.35-9.5-8.5A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6.5C19 16.65 12 21 12 21Z"/>
    </svg>
  );
}

function StudentIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path strokeWidth="1.5" d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="2" d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
      <path strokeWidth="2" d="M12 6v6l4 2"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="2" d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="2" d="M3 3v18h18"/>
      <path strokeWidth="2" d="M18 17V9"/>
      <path strokeWidth="2" d="M13 17V5"/>
      <path strokeWidth="2" d="M8 17v-3"/>
    </svg>
  );
}

