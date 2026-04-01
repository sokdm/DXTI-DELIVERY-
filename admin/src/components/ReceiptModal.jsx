import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  DollarSign,
  Calendar,
  Hash,
  Stamp
} from 'lucide-react';
import { format } from 'date-fns';

const ReceiptModal = ({ isOpen, onClose, packageData }) => {
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `DXTI-Receipt-${packageData?.trackingCode || 'Unknown'}`,
    onAfterPrint: () => {
      console.log('Receipt printed successfully');
    },
  });

  if (!packageData) return null;

  const {
    trackingCode,
    packageName,
    packageDescription,
    packageWeight,
    packageImage,
    senderName,
    senderPhone,
    senderEmail,
    senderAddress,
    senderCity,
    senderCountry,
    receiverName,
    receiverPhone,
    receiverEmail,
    receiverAddress,
    receiverCity,
    receiverCountry,
    receiverGender,
    deliveryPrice,
    currentLocation,
    destinationLocation,
    receipt,
    createdAt,
  } = packageData;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Package Created Successfully!
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receipt & Tracking Information
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-admin-primary to-admin-secondary text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Receipt Container - This is what gets printed */}
              <div 
                ref={receiptRef} 
                className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 relative"
                style={{ 
                  backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)',
                  backgroundSize: '20px 20px'
                }}
              >
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <div className="transform -rotate-45 text-6xl font-bold text-slate-900 tracking-widest">
                    DXT DELIVERY
                  </div>
                </div>

                {/* Receipt Header */}
                <div className="text-center mb-8 relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-2xl mb-4 shadow-lg">
                    <Truck className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">DXTI DELIVERY</h1>
                  <p className="text-slate-600">Official Shipping Receipt</p>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    PAYMENT VERIFIED
                  </div>
                </div>

                {/* Tracking Code - Prominent */}
                <div className="bg-gradient-to-r from-admin-primary/20 to-admin-secondary/20 rounded-2xl p-6 mb-8 text-center border-2 border-admin-primary/30">
                  <p className="text-sm text-slate-600 mb-2 font-medium uppercase tracking-wide">Tracking Code</p>
                  <div className="text-4xl font-mono font-bold text-admin-primary tracking-wider">
                    {trackingCode}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Share this code with the recipient to track the package</p>
                </div>

                {/* Receipt Details Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Receipt Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 border-b-2 border-slate-200 pb-2 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-admin-primary" />
                      Receipt Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Receipt ID:</span>
                        <span className="font-mono font-medium">{receipt?.receiptId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-medium">{format(new Date(createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">PENDING</span>
                      </div>
                    </div>
                  </div>

                  {/* Package Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 border-b-2 border-slate-200 pb-2 flex items-center gap-2">
                      <Package className="w-5 h-5 text-admin-primary" />
                      Package Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-medium">{packageName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Weight:</span>
                        <span className="font-medium">{packageWeight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Price:</span>
                        <span className="font-bold text-admin-primary text-lg">${deliveryPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sender & Receiver */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Sender */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-admin-secondary">
                      <User className="w-5 h-5" />
                      Sender Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-slate-900">{senderName}</p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {senderPhone}
                      </p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {senderEmail}
                      </p>
                      <p className="text-slate-600 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span>{senderAddress}, {senderCity}, {senderCountry}</span>
                      </p>
                    </div>
                  </div>

                  {/* Receiver */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-green-600">
                      <User className="w-5 h-5" />
                      Receiver Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-slate-900">{receiverName} <span className="text-xs text-slate-500">({receiverGender})</span></p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {receiverPhone}
                      </p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {receiverEmail}
                      </p>
                      <p className="text-slate-600 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span>{receiverAddress}, {receiverCity}, {receiverCountry}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-8">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    Delivery Route
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">From</p>
                      <p className="font-semibold text-slate-900">{currentLocation?.locationName}</p>
                      <p className="text-xs text-slate-500 font-mono">{currentLocation?.lat?.toFixed(4)}, {currentLocation?.lng?.toFixed(4)}</p>
                    </div>
                    <div className="flex-1 mx-4 flex items-center">
                      <div className="h-0.5 flex-1 bg-blue-300"></div>
                      <Truck className="w-6 h-6 text-blue-500 mx-2" />
                      <div className="h-0.5 flex-1 bg-blue-300"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">To</p>
                      <p className="font-semibold text-slate-900">{destinationLocation?.locationName}</p>
                      <p className="text-xs text-slate-500 font-mono">{destinationLocation?.lat?.toFixed(4)}, {destinationLocation?.lng?.toFixed(4)}</p>
                    </div>
                  </div>
                </div>

                {/* Official Stamp */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-red-600 flex items-center justify-center transform -rotate-12 opacity-80">
                      <div className="text-center">
                        <Stamp className="w-8 h-8 text-red-600 mx-auto mb-1" />
                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest leading-tight">
                          STAMPED<br/>BY<br/>DXT<br/>DELIVERY
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-red-600 transform rotate-6 opacity-40"></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-slate-500 border-t-2 border-slate-200 pt-4">
                  <p className="font-semibold text-slate-900">Thank you for choosing DXTI Delivery!</p>
                  <p>For tracking, visit: <span className="text-admin-primary font-medium">http://localhost:5173/track/{trackingCode}</span></p>
                  <p className="text-xs mt-2">This is an official receipt. Keep it for your records.</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <div className="text-sm text-slate-500">
                <p>Receipt generated on {format(new Date(), 'MMM dd, yyyy')}</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReceiptModal;
