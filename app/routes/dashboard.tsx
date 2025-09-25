import type { Route } from "./+types/dashboard";
import type { JSX } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Admin Dashboard" },
  ];
}

export default function Dashboard() {
  return (
    <section className="space-y-4 text-justify">
      <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-sky-400 pb-1">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="JUMLAH MUDA-MUDI" value="118" icon={UsersIcon} />
        <SummaryCard title="LAKI-LAKI" value="59" icon={MaleIcon} />
        <SummaryCard title="PEREMPUAN" value="59" icon={FemaleIcon} />
        <SummaryCard title="USIA PRA-NIKAH" value="70" icon={HeartIcon} />
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

