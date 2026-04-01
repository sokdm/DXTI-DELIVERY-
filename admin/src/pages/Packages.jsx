import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye,
  Trash2, 
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [stopReason, setStopReason] = useState('');

  useEffect(() => {
    fetchPackages();
  }, [statusFilter]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/packages`, {
        params: { status: statusFilter }
      });
      setPackages(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    
    try {
      await axios.delete(`${API_URL}/packages/${id}`);
      toast.success('Package deleted successfully');
      fetchPackages();
    } catch (error) {
      toast.error('Failed to delete package');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const data = { status: newStatus };
      if (newStatus === 'stopped') {
        data.stopReason = stopReason;
      }
      
      await axios.patch(`${API_URL}/packages/${selectedPackage._id}/status`, data);
      toast.success('Status updated successfully');
      setShowStatusModal(false);
      setSelectedPackage(null);
      setNewStatus('');
      setStopReason('');
      fetchPackages();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredPackages = packages.filter(pkg => 
    pkg.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_transit': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'stopped': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'arrived': return <CheckCircle className="w-5 h-5 text-purple-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'in_transit': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'stopped': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'arrived': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          All Packages
        </h2>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="arrived">Arrived</option>
            <option value="delivered">Delivered</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by tracking code, name, sender, or receiver..."
          className="admin-input pl-12"
        />
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Package</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Tracking Code</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Sender</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Receiver</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Price</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary mx-auto"></div>
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No packages found
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <motion.tr
                    key={pkg._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={pkg.packageImage}
                          alt={pkg.packageName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{pkg.packageName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{pkg.packageWeight} kg</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-medium text-admin-primary">{pkg.trackingCode}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{pkg.senderName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{pkg.senderCity}, {pkg.senderCountry}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{pkg.receiverName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{pkg.receiverCity}, {pkg.receiverCountry}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setNewStatus(pkg.status);
                          setShowStatusModal(true);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pkg.status)} hover:opacity-80 transition-opacity`}
                      >
                        {getStatusIcon(pkg.status)}
                        {pkg.status.replace('_', ' ')}
                      </button>
                      {pkg.stopReason && (
                        <p className="text-xs text-red-500 mt-1 max-w-xs truncate">{pkg.stopReason}</p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white">${pkg.deliveryPrice.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`http://localhost:5173/track/${pkg.trackingCode}`, '_blank')}
                          className="p-2 text-slate-400 hover:text-admin-primary transition-colors"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg._id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showStatusModal && selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Update Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Package: <span className="font-mono text-admin-primary">{selectedPackage.trackingCode}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="admin-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="arrived">Arrived</option>
                    <option value="delivered">Delivered</option>
                    <option value="stopped">Stopped</option>
                  </select>
                </div>

                {newStatus === 'stopped' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Stop Reason *
                    </label>
                    <textarea
                      value={stopReason}
                      onChange={(e) => setStopReason(e.target.value)}
                      className="admin-input"
                      rows="3"
                      placeholder="Enter reason for stopping delivery..."
                      required
                    />
                  required
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 admin-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={newStatus === 'stopped' && !stopReason}
                    className="flex-1 admin-btn disabled:opacity-50"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Packages;
