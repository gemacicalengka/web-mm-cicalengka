import type { Route } from "./+types/absensi";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Absensi" },
    { name: "description", content: "Halaman Absensi" },
  ];
}

export default function Absensi() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Absensi</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-justify">
        Konten absensi akan ditempatkan di sini.
      </div>
    </section>
  );
}


