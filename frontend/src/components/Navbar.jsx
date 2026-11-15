import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Truck, Sun, Moon, Menu, X, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { toggleTheme, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Security', href: '/security' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-dhl-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-dhl-gray-900/90"
    >
      <nav aria-label="Main navigation" className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="TRX Logistics home" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-dhl-black text-white shadow-lg shadow-slate-900/10 transition-transform group-hover:-rotate-3">
            <Truck className="h-5 w-5" />
          </span>
          <span className="leading-none">
            <span className="block text-[17px] font-extrabold tracking-tight text-dhl-black dark:text-white">TRX</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.22em] text-dhl-red">Logistics</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = link.href === '/' ? location.pathname === '/' : link.href === '/#contact' ? false : location.pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${active ? 'bg-dhl-gray-100 text-dhl-black dark:bg-white/10 dark:text-white' : 'text-dhl-gray-600 hover:bg-dhl-gray-50 hover:text-dhl-black dark:text-dhl-gray-300 dark:hover:bg-white/5 dark:hover:text-white'}`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-dhl-gray-600 transition hover:bg-dhl-gray-100 hover:text-dhl-black dark:text-dhl-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <Link to="/track" className="btn-dhl ml-1 !rounded-lg !px-4 !py-2.5 text-[13px]">
            Track a shipment <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <button type="button" aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`} onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-xl text-dhl-gray-600 hover:bg-dhl-gray-100 dark:text-dhl-gray-300 dark:hover:bg-white/10">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button type="button" aria-expanded={isMenuOpen} aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setIsMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-dhl-gray-100 text-dhl-black dark:bg-white/10 dark:text-white">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-dhl-gray-200 bg-white dark:border-white/10 dark:bg-dhl-gray-900 md:hidden">
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.href} onClick={() => setIsMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-dhl-gray-700 hover:bg-dhl-gray-50 dark:text-dhl-gray-200 dark:hover:bg-white/5">
                  {link.name}
                </Link>
              ))}
              <Link to="/track" onClick={() => setIsMenuOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-dhl-red px-4 py-3 text-sm font-bold text-white">
                Track a shipment <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
