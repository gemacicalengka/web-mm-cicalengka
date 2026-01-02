import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
// 
import type { Route } from "./+types/root";
import { authUtils } from "./utils/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./app.css";
import "./styles/animations.css";

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
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
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
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sidebarOpen");
        if (stored !== null) return stored === "true";
      }
    } catch {}
    return false;
  });
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Check if current route is login page
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  // Mark mounted to enable transitions after first paint
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication and get current user
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = authUtils.getCurrentUser();
      setCurrentUser(user?.username || null);
    }
  }, [location.pathname]);

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

  // Handle logout
  const handleLogout = () => {
    authUtils.logout();
    setCurrentUser(null);
    setProfileOpen(false);
    navigate('/');
  };

  // If it's login page, render without sidebar and header
  if (isLoginPage) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <Outlet />
      </div>
    );
  }

  // For protected routes, wrap with ProtectedRoute
  return (
    <ProtectedRoute>
      <div className={(mounted ? "" : "opacity-0 ") + "min-h-dvh flex bg-white"}>
      {/* Sidebar */}
      <aside
        className={
          (mounted ? "transition-all duration-700 ease-out " : "") +
          "border-r border-gray-200 bg-white " +
          (sidebarOpen ? "w-55" : "w-16") + " " +
          "hidden md:block"
        }
      >
        <div className="h-16 flex items-center gap-2 px-3 overflow-hidden">
          <img 
            src="/logo-gema.svg" 
            alt="GEMA CICALENGKA" 
            className="h-8 w-8 flex-shrink-0"
          />
          <div 
            className={
              "text-sm font-semibold text-gray-800 whitespace-nowrap transition-all duration-700 ease-out " +
              (sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4")
            }
          >
            GEMA CICALENGKA
          </div>
        </div>
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-full mb-2 inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-800 hover:bg-sky-50 hover:border-sky-300 transition-all duration-300 ease-out"
          >
            {/* hamburger icon - always visible */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 flex-shrink-0 text-gray-800">
              <path strokeWidth="2.5" strokeLinecap="round" d="M3 6h18"/>
              <path strokeWidth="2.5" strokeLinecap="round" d="M3 12h18"/>
              <path strokeWidth="2.5" strokeLinecap="round" d="M3 18h18"/>
            </svg>
            {sidebarOpen && (
              <span className="ml-2 whitespace-nowrap transition-all duration-300 ease-out">
                MENU UTAMA
              </span>
            )}
          </button>
          <nav className="space-y-1">
            <SidebarLink to="/dashboard" label="Dashboard" open={sidebarOpen} icon={DashboardIcon} />
            <SidebarLink to="/kegiatan" label="Kegiatan" open={sidebarOpen} icon={CalendarIcon} />
            <SidebarLink to="/absensi" label="Absensi" open={sidebarOpen} icon={CheckIcon} />
            <SidebarLink to="/database" label="Database" open={sidebarOpen} icon={DatabaseIcon} />
            <SidebarLink to="/laporan" label="Laporan" open={sidebarOpen} icon={ReportIcon} />
            <SidebarLink to="/informasi" label="Informasi" open={sidebarOpen} icon={InfoIcon} />
            {/* <SidebarLink to="/tabel" label="Tabel" open={sidebarOpen} icon={TableIcon} /> */} {/* Navigasi ke halaman tabel sengaja dinonaktifkan */}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-sky-400 flex items-center justify-between px-4 relative z-10">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h1 className="text-lg font-bold text-white px-4">Admin Dashboard</h1>
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
              <span className="hidden sm:inline">{currentUser || 'Akun'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-20">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={handleLogout}
                >
                  <LogoutIcon className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
            <nav className="px-4 py-2 space-y-1">
              <MobileNavLink to="/dashboard" label="Dashboard" icon={DashboardIcon} onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/kegiatan" label="Kegiatan" icon={CalendarIcon} onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/absensi" label="Absensi" icon={CheckIcon} onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/database" label="Database" icon={DatabaseIcon} onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/laporan" label="Laporan" icon={ReportIcon} onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/informasi" label="Informasi" icon={InfoIcon} onClick={() => setMobileMenuOpen(false)} />
              {/* <MobileNavLink to="/tabel" label="Tabel" icon={TableIcon} onClick={() => setMobileMenuOpen(false)} /> */} {/* Navigasi ke halaman tabel sengaja dinonaktifkan */}
            </nav>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8 text-justify">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 bg-sky-400 flex items-center justify-center text-xs text-white">
          © {new Date().getFullYear()} GEMA Cicalengka. All rights reserved.
        </footer>
      </div>
      </div>
    </ProtectedRoute>
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
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-300 ease-out overflow-hidden " +
          (isActive
            ? "bg-sky-100 text-sky-800"
            : "text-gray-700 hover:bg-sky-50")
        )
      }
    >
      <Icon className="h-5 w-5 text-sky-600 flex-shrink-0" />
      <span 
        className={
          "whitespace-nowrap transition-all duration-700 ease-out " +
          (open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4")
        }
      >
        {label}
      </span>
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
      <path strokeWidth="1.5" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
}
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline strokeWidth="1.5" points="14,2 14,8 20,8"/>
      <line strokeWidth="1.5" x1="16" y1="13" x2="8" y2="13"/>
      <line strokeWidth="1.5" x1="16" y1="17" x2="8" y2="17"/>
      <polyline strokeWidth="1.5" points="10,9 9,9 8,9"/>
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <path strokeWidth="1.5" d="M12 3v18M3 9.5h18M3 14.5h18M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/>
    </svg>
  );
}

function MobileNavLink({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors " +
        (isActive
          ? "bg-sky-100 text-sky-700 border-l-4 border-sky-500"
          : "text-gray-700 hover:bg-gray-100")
      }
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}
