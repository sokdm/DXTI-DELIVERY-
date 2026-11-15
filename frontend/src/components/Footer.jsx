import React from 'react';
import { ArrowUp, Mail, Send, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-dhl-black text-white">
    <div className="h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent" />
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-teal-300"><Truck className="h-5 w-5" /></span>
            <span><span className="block font-bold">TRX Logistics</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Shipment portal</span></span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
            Use your tracking number to review shipment details and updates recorded by the TRX Logistics team.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li><Link className="transition hover:text-teal-300" to="/">Home</Link></li>
            <li><Link className="transition hover:text-teal-300" to="/services">Services</Link></li>
            <li><Link className="transition hover:text-teal-300" to="/security">Security</Link></li>
            <li><Link className="transition hover:text-teal-300" to="/track">Track a shipment</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Get in touch</h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">Have a question? Please share your tracking number with customer support.</p>
          <a href="mailto:support@trxlogistics.com" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-300 transition hover:text-teal-200"><Mail className="h-4 w-4" /> support@trxlogistics.com</a>
          <a href="https://t.me/TRXLogistics" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-teal-300"><Send className="h-4 w-4" /> @TRXLogistics</a>
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} TRX Logistics. All rights reserved.</p>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:self-auto">
          Back to top <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;
