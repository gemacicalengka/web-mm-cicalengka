import type { Route } from "./+types/laporan";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Laporan" },
    { name: "description", content: "Halaman Laporan" },
  ];
}

export default function Laporan() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Laporan</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-justify">
        Konten laporan akan ditempatkan di sini.
      </div>
    </section>
  );
}


