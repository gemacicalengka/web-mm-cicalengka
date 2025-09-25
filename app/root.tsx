import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
} from "react-router";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/logo-gema.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sidebarOpen");
        if (stored !== null) return stored === "true";
      }
    } catch {}
    return true;
  });
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Mark mounted to enable transitions after first paint
  useEffect(() => {
    setMounted(true);
  }, []);

  // Persist sidebar state on change
  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", String(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);

  // Close profile dropdown on outside click or route change
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Note: dropdown closes on outside click; header uses static title

  return (
    <div className={(mounted ? "" : "opacity-0 ") + "min-h-dvh flex bg-white"}>
      {/* Sidebar */}
      <aside
        className={
          (mounted ? "transition-all duration-500 ease-in-out " : "") +
          "border-r border-gray-200 bg-white " +
          (sidebarOpen ? "w-64" : "w-16")
        }
      >
        <div className="h-16 flex items-center gap-2 px-3">
          <img 
            src="/logo-gema.svg" 
            alt="GEMA CICALENGKA" 
            className="h-8 w-8"
          />
          {sidebarOpen && (
            <div className="text-sm font-semibold text-gray-800 transition-opacity duration-300 ease-in-out">GEMA CICALENGKA</div>
          )}
        </div>
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-full mb-2 inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-sky-50 transition-colors duration-200"
          >
            {/* hamburger icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeWidth="1.5" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
            {sidebarOpen && <span className="transition-opacity duration-300">MENU UTAMA</span>}
          </button>
          <nav className="space-y-1">
            <SidebarLink to="/" label="Dashboard" open={sidebarOpen} icon={DashboardIcon} end />
            <SidebarLink to="/kegiatan" label="Kegiatan" open={sidebarOpen} icon={CalendarIcon} />
            <SidebarLink to="/absensi" label="Absensi" open={sidebarOpen} icon={CheckIcon} />
            <SidebarLink to="/database" label="Database" open={sidebarOpen} icon={DatabaseIcon} />
            <SidebarLink to="/laporan" label="Laporan" open={sidebarOpen} icon={ReportIcon} />
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-sky-400 flex items-center justify-between px-4 relative z-10">
          <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
          <div className="relative flex items-center gap-2" ref={profileRef}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-white"
              title="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeWidth="1.5" d="M4 4v6h6M20 20v-6h-6"/><path strokeWidth="1.5" d="M20 8a8 8 0 0 0-14.928-3M4 16a8 8 0 0 0 14.928 3"/></svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-white"
            >
              <UserIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Akun</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-20">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setProfileOpen(false);
                    // Implement your logout navigation/action here
                  }}
                >
                  <LogoutIcon className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8 text-justify">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 bg-sky-400 flex items-center justify-center text-xs text-white">
          © {new Date().getFullYear()} MM Cicalengka. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

// Internal helpers
function SidebarLink({
  to,
  label,
  open,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  open: boolean;
  icon: (props: { className?: string }) => JSX.Element;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        (
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
          (isActive
            ? "bg-sky-100 text-sky-800"
            : "text-gray-700 hover:bg-sky-50")
        )
      }
    >
      <Icon className="h-5 w-5 text-sky-600" />
      {open && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h8v8H3v-8Zm10 7v-8h8v8h-8Z"/>
    </svg>
  );
}
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M7 2v3m10-3v3M3 9h18M4 6h16a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z"/>
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M20 7 9 18l-5-5"/>
    </svg>
  );
}
function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth="1.5"/>
      <path strokeWidth="1.5" d="M4 5v6c0 1.657 3.582 3 8 3s8-1.343 8-3V5M4 11v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"/>
    </svg>
  );
}
function ReportIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M6 20V9m6 11V4m6 16v-8"/>
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-8 2.5-8 5v1h16v-1c0-2.5-3-5-8-5Z"/>
    </svg>
  );
}
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="m6 9 6 6 6-6"/>
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M15 17l5-5-5-5m5 5H9m6 8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>
    </svg>
  );
}
