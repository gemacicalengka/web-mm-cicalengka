import type { Route } from "./+types/informasi";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Informasi - MM Cicalengka" },
    { name: "description", content: "Informasi Struktur Kepengurusan MM Cicalengka" },
  ];
}

export default function Informasi() {
  return (
    <div className="space-y-6 text-justify fade-in">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">
        Struktur Kepengurusan MM Cicalengka
      </h2>
      
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">        
          <div className="relative flex flex-col items-center space-y-6 lg:space-y-8">
          
          {/* Pembina - Paling Atas */}
          <div className="relative flex justify-center w-full px-4">
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200 w-full max-w-xs">
              <div className="bg-yellow-500 text-white text-center py-2 sm:py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                PEMBINA
              </div>
              <div className="bg-white text-black text-center py-2 sm:py-3 px-4 sm:px-6 font-medium text-sm sm:text-base">
                Bpk. Kiki Fahd Baihaqi
              </div>
            </div>
          </div>

          {/* Ketua Muda-Mudi */}
          <div className="relative flex justify-center w-full px-4">
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200 w-full max-w-xs">
              <div className="bg-sky-600 text-white text-center py-2 sm:py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                KETUA MUDA-MUDI
              </div>
              <div className="bg-white text-black text-center py-2 sm:py-3 px-4 sm:px-6 font-medium text-sm sm:text-base">
                Bilal
              </div>
            </div>
          </div>

          {/* Wakil Ketua 1 & 2 */}
          <div className="relative flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 lg:gap-40 w-full px-4">
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200 w-full max-w-xs mx-auto sm:mx-0">
              <div className="bg-sky-600 text-white text-center py-2 sm:py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                WAKIL KETUA 1
              </div>
              <div className="bg-white text-black text-center py-2 sm:py-3 px-4 sm:px-6 font-medium text-sm sm:text-base">
                Rayza
              </div>
            </div>
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200 w-full max-w-xs mx-auto sm:mx-0">
              <div className="bg-sky-600 text-white text-center py-2 sm:py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                WAKIL KETUA 2
              </div>
              <div className="bg-white text-black text-center py-2 sm:py-3 px-4 sm:px-6 font-medium text-sm sm:text-base">
                Rofa
              </div>
            </div>
          </div>

          {/* Sekretaris & Bendahara */}
          <div className="relative flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 lg:gap-40 w-full px-4">
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200 w-full max-w-xs mx-auto sm:mx-0">
              <div className="bg-pink-400 text-white text-center py-2 sm:py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                SEKRETARIS
              </div>
              <div className="bg-white text-black text-center py-2 sm:py-3 px-4 sm:px-6 font-medium text-sm sm:text-base">
                <div>Intan</div>
                <div>Sherly</div>
              </div>
            </div>
            <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200 w-full max-w-xs mx-auto sm:mx-0">
              <div className="bg-pink-400 text-white text-center py-2 sm:py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                BENDAHARA
              </div>
              <div className="bg-white text-black text-center py-2 sm:py-3 px-4 sm:px-6 font-medium text-sm sm:text-base">
                <div>Sabila</div>
                <div>Afni</div>
              </div>
            </div>
          </div>

          {/* Baris Terakhir - KMM dan Bidang */}
          <div className="w-full max-w-6xl px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Kolom Kiri - KMM */}
              <div className="space-y-4 lg:space-y-6 order-1 sm:order-1">
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-green-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    PENEROBOS
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    <div>Rijal</div>
                    <div>Revan</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-green-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    KMM PRAJA
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    Rofa
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-green-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    KMM REMAJA
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    Hernan
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-green-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    KMM PRA NIKAH
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    Rayza
                  </div>
                </div>
              </div>

              {/* Kolom Tengah - Ketua MM Kelompok */}
              <div className="flex justify-center order-3 sm:order-2 lg:order-2">
                <div className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200 h-fit w-full max-w-xs">
                  <div className="bg-sky-600 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    KETUA MM KELOMPOK
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium space-y-1 text-xs sm:text-base">
                    <div>Hilman (Linggar)</div>
                    <div>Deiphila (Paramount)</div>
                    <div>Nurist (Cikopo)</div>
                    <div>Rayza (Bojong Koneng)</div>
                    <div>Ridwan (Cikancung 1)</div>
                    <div>Arul (Cikancung 2)</div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan - Bidang */}
              <div className="space-y-4 lg:space-y-6 order-2 sm:order-3 lg:order-3">
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-purple-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    BID. KREATIF
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    Hilman
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-purple-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    BID. KWU
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    Ridwan
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-purple-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    BID. OLAHRAGA
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    <div>Rayza</div>
                    <div>Hernan</div>
                    <div>Sifa</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-200">
                  <div className="bg-purple-500 text-white text-center py-2 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm">
                    BID. KEPUTRIAN
                  </div>
                  <div className="bg-white text-black text-center py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base">
                    <div>Oktavia</div>
                    <div>Risa</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}