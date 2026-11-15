import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  PlugZap,
  PlusCircle,
  ShieldCheck,
  Sun,
  Truck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  {
    label: 'WORKSPACE',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Overview', exact: true },
      { path: '/packages', icon: Package, label: 'Shipments', badge: 'Manage' },
      { path: '/create', icon: PlusCircle, label: 'Create shipment' },
    ],
  },
  {
    label: 'DEVELOPER TOOLS',
    items: [
      { path: '/integrations', icon: PlugZap, label: 'API & integrations', exact: true },
      { path: '/integrations/docs', icon: BookOpen, label: 'API documentation', exact: true },
    ],
  },
];

const pageMeta = {
  '/': { title: 'Overview', subtitle: 'A clear view of shipment operations.' },
  '/packages': { title: 'Shipments', subtitle: 'Search, review, and manage delivery activity.' },
  '/create': { title: 'Create shipment', subtitle: 'Register a new package and prepare its receipt.' },
  '/integrations': { title: 'API & integrations', subtitle: 'Manage partner access and shipment event delivery.' },
  '/integrations/docs': { title: 'API documentation', subtitle: 'Technical reference for your Credixa integration.' },
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('trx_admin_sidebar') !== 'collapsed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('trx_admin_theme') || 'light');
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = useMemo(() => pageMeta[location.pathname] || pageMeta['/'], [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('trx_admin_theme', theme);
  }, [theme]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen((open) => {
      localStorage.setItem('trx_admin_sidebar', open ? 'collapsed' : 'expanded');
      return !open;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavigation = (mobile = false) => (
    <nav className={`space-y-7 ${mobile ? 'px-3 py-5' : 'px-3 py-6'}`}>
      {navigation.map((group) => (
        <div key={group.label}>
          {(sidebarOpen || mobile) && (
            <div className="mb-2 px-3 text-[10px] font-extrabold tracking-[.18em] text-slate-500">
              {group.label}
            </div>
          )}
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                title={!sidebarOpen && !mobile ? item.label : undefined}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''} ${!sidebarOpen && !mobile ? 'justify-center px-0' : ''}`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
                {(sidebarOpen || mobile) && (
                  <>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge && <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">{item.badge}</span>}
                    {item.path === '/integrations/docs' && location.pathname === item.path && <ChevronRight className="h-4 w-4 text-admin-secondary" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="admin-shell min-h-screen text-slate-900 dark:text-slate-100">
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 276 : 86 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col text-white md:flex"
      >
        <Link to="/" className={`admin-brand ${sidebarOpen ? 'px-5' : 'justify-center px-3'}`}>
          <span className="admin-brand-mark"><Truck className="h-5 w-5" /></span>
          {sidebarOpen && (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold tracking-tight text-white">TRX Logistics</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.2em] text-slate-400">Operations console</span>
            </span>
          )}
        </Link>

        <div className={`mx-4 mt-4 flex items-center rounded-xl border border-white/[.07] bg-white/[.045] ${sidebarOpen ? 'gap-3 px-3 py-3' : 'justify-center py-3'}`}>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          {sidebarOpen && <span className="text-xs font-semibold text-slate-300">Systems operational</span>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{renderNavigation()}</div>

        {sidebarOpen && (
          <div className="mx-4 mb-4 rounded-2xl border border-white/[.07] bg-gradient-to-br from-white/[.07] to-white/[.025] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white"><ShieldCheck className="h-4 w-4 text-admin-secondary" /> Protected workspace</div>
            <p className="text-[11px] leading-5 text-slate-400">Shipment records and integration credentials are managed securely.</p>
            <Link to="/integrations/docs" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 hover:text-white">View API guide <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
        )}

        <div className="border-t border-white/[.08] p-3">
          <div className={`mb-2 flex items-center rounded-xl px-2 py-2 ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-300 text-xs font-black text-slate-950">
              {(admin?.name || admin?.email || 'A').slice(0, 1).toUpperCase()}
            </div>
            {sidebarOpen && <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-white">{admin?.name || 'Administrator'}</div><div className="truncate text-[10px] text-slate-400">{admin?.email}</div></div>}
            {sidebarOpen && <button title="Sign out" onClick={handleLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"><LogOut className="h-4 w-4" /></button>}
          </div>
          <button onClick={toggleSidebar} className={`flex w-full items-center rounded-xl py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[.06] hover:text-white ${sidebarOpen ? 'justify-between px-3' : 'justify-center'}`} title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sidebarOpen && <span>Collapse sidebar</span>}
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </motion.aside>

      <div className={`min-h-screen transition-[margin] duration-200 ${sidebarOpen ? 'md:ml-[276px]' : 'md:ml-[86px]'}`}>
        <header className="admin-topbar sticky top-0 z-30">
          <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 md:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
              <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-admin-primary dark:bg-teal-500/10 sm:flex">
                {location.pathname.includes('docs') ? <FileText className="h-4 w-4" /> : location.pathname.includes('integrations') ? <PlugZap className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                  <span className="hidden sm:inline">TRX Logistics</span><ChevronRight className="hidden h-3 w-3 sm:block" /> <span className="truncate">{currentPage.title}</span>
                </div>
                <h1 className="truncate text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-base">{currentPage.title}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-300 lg:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All systems normal
              </div>
              <Link to="/integrations/docs" title="API documentation" className="hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-teal-300 hover:text-admin-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex"><HelpCircle className="h-[18px] w-[18px]" /></Link>
              <button onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-admin-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-admin-primary" />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 lg:px-9 lg:pt-8">
          <div className="mb-6 hidden sm:block">
            <p className="text-sm text-slate-500 dark:text-slate-400">{currentPage.subtitle}</p>
          </div>
          <Outlet />
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-5 text-[11px] text-slate-400 dark:border-slate-800">
            <span>TRX Logistics Operations · Secure administrator workspace</span>
            <Link to="/integrations/docs" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-admin-primary"><BookOpen className="h-3.5 w-3.5" /> Developer documentation</Link>
          </footer>
        </main>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />
            <motion.aside className="admin-sidebar absolute inset-y-0 left-0 flex w-[290px] max-w-[86vw] flex-col text-white shadow-2xl" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}>
              <div className="admin-brand justify-between px-5">
                <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <span className="admin-brand-mark"><Truck className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-extrabold text-white">TRX Logistics</span><span className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">Operations console</span></span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{renderNavigation(true)}</div>
              <div className="border-t border-white/10 p-4">
                <div className="mb-3 text-xs font-bold text-white">{admin?.name || 'Administrator'}<div className="mt-1 font-normal text-slate-400">{admin?.email}</div></div>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
