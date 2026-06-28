import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Track Package', href: '/track' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-dhl-gray-900/95 backdrop-blur-xl border-b-2 border-dhl-yellow shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div whileHover={{ rotate: 10, scale: 1.05 }} className="p-2 bg-dhl-yellow rounded-sm">
              <Truck className="w-6 h-6 text-dhl-black" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-dhl-black dark:text-white uppercase tracking-tight leading-none">DXTI</span>
              <span className="text-xs font-bold text-dhl-red uppercase tracking-widest leading-none">DELIVERY</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.href} className="px-4 py-2 text-dhl-gray-600 dark:text-dhl-gray-300 hover:text-dhl-black dark:hover:text-dhl-yellow font-semibold uppercase text-sm tracking-wider transition-colors rounded-sm hover:bg-dhl-yellow/10">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme} className="p-2 rounded-sm bg-dhl-gray-100 dark:bg-dhl-gray-800 text-dhl-gray-600 dark:text-dhl-gray-300 hover:bg-dhl-yellow hover:text-dhl-black transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-sm bg-dhl-yellow text-dhl-black">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-dhl-red via-dhl-yellow to-dhl-red"></div>

      <motion.div initial={false} animate={{ height: isMenuOpen ? 'auto' : 0, opacity: isMenuOpen ? 1 : 0 }} className="md:hidden overflow-hidden bg-white/95 dark:bg-dhl-gray-900/95 backdrop-blur-xl border-b-2 border-dhl-yellow">
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.href} onClick={() => setIsMenuOpen(false)} className="block py-3 px-4 text-dhl-gray-600 dark:text-dhl-gray-300 hover:text-dhl-black dark:hover:text-dhl-yellow font-semibold uppercase text-sm tracking-wider hover:bg-dhl-yellow/10 rounded-sm">
              {link.name}
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;
