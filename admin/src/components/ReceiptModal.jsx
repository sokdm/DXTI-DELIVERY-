import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, MapPin, Package, User, Phone, Mail, DollarSign, Calendar, Shield, Truck } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, packageData }) => {
  if (!packageData) return null;

  const handlePrint = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${API_URL}/packages/${packageData._id}/receipt`, '_blank', 'width=900,height=1000');
  };

  const handleDownloadPDF = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/packages/${packageData._id}/receipt/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DXTI-Receipt-${packageData.trackingCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const createdDate = new Date(packageData.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    in_transit: 'bg-blue-100 text-blue-800 border-blue-300',
    arrived: 'bg-purple-100 text-purple-800 border-purple-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    stopped: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#D40511] to-[#E31B23] p-4 text-center relative shrink-0">
              <div className="flex items-center justify-center gap-2">
                <Truck className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-black text-white tracking-wider">DXTI</h2>
                  <p className="text-[10px] text-[#FFCC00] font-bold tracking-widest uppercase">Express Delivery</p>
                </div>
              </div>
              <p className="text-white/70 text-[10px] mt-1">Receipt: {packageData.receipt?.receiptId || 'N/A'}</p>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-5 space-y-4">
              {/* Tracking */}
              <div className="bg-gradient-to-r from-[#FFF8E1] to-[#FFECB3] rounded-xl p-4 text-center border-2 border-dashed border-[#FFCC00]">
                <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-widest mb-1">Tracking Number</p>
                <p className="text-xl font-black text-[#1f2937] font-mono tracking-wider">{packageData.trackingCode}</p>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border-2 ${statusColors[packageData.status] || 'bg-gray-100 text-gray-800'}`}>
                  {packageData.status.replace('_', ' ')}
                </span>
              </div>

              {/* Sender & Receiver - Compact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#D40511]/20">
                    <User className="w-3 h-3 text-[#D40511]" />
                    <h3 className="text-[10px] font-black text-[#D40511] uppercase tracking-wider">Sender</h3>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{packageData.senderName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <p className="text-xs text-slate-600">{packageData.senderPhone}</p>
                  </div>
                  <div className="flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-tight">{packageData.senderCity}, {packageData.senderCountry}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#FFCC00]/40">
                    <User className="w-3 h-3 text-[#D40511]" />
                    <h3 className="text-[10px] font-black text-[#D40511] uppercase tracking-wider">Receiver</h3>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{packageData.receiverName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <p className="text-xs text-slate-600">{packageData.receiverPhone}</p>
                  </div>
                  <div className="flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-tight">{packageData.receiverCity}, {packageData.receiverCountry}</p>
                  </div>
                </div>
              </div>

              {/* Package Info - Compact */}
              <div className="bg-white rounded-lg p-3 border-2 border-slate-200">
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
                  <Package className="w-3 h-3 text-[#D40511]" />
                  <h3 className="text-[10px] font-black text-[#D40511] uppercase tracking-wider">Package</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-md p-2">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Weight</p>
                    <p className="text-sm font-bold text-slate-800">{packageData.packageWeight}kg</p>
                  </div>
                  <div className="bg-slate-50 rounded-md p-2">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Service</p>
                    <p className="text-sm font-bold text-slate-800">Express</p>
                  </div>
                  <div className="bg-slate-50 rounded-md p-2">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Price</p>
                    <p className="text-sm font-bold text-[#D40511]">${packageData.deliveryPrice?.toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{packageData.packageDescription}</p>
              </div>

              {/* Amount - Compact */}
              <div className="bg-gradient-to-r from-[#FFF8E1] to-[#FFECB3] rounded-xl p-4 border-2 border-[#FFCC00]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#B8860B] uppercase tracking-widest font-black">Shipping Amount</p>
                    <p className="text-[10px] text-[#B8860B]/70 mt-0.5">Pay before delivery</p>
                  </div>
                  <p className="text-2xl font-black text-[#D40511]">${packageData.deliveryPrice?.toFixed(2)}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-[#FFCC00]/30 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-[#B8860B]" />
                  <p className="text-[10px] text-[#B8860B] font-medium">Payment required before package release. Contact sender.</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center justify-center gap-1.5 text-slate-500">
                <Calendar className="w-3 h-3" />
                <p className="text-xs font-medium">{createdDate}</p>
              </div>
            </div>

            {/* Footer Buttons - Sticky */}
            <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#D40511] hover:bg-[#B0040E] text-white py-2.5 rounded-xl font-bold text-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#1f2937] hover:bg-black text-white py-2.5 rounded-xl font-bold text-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReceiptModal;
