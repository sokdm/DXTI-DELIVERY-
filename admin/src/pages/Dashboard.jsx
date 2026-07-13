import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MapPin,
  Users,
  Mail,
  MailCheck,
  MailX,
  MailWarning,
  RefreshCw,
  Send,
  Eye,
  ArrowRight,
  Calendar,
  Weight,
  Globe,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('dxt_admin_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentPackages, setRecentPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, packagesRes] = await Promise.all([
        axios.get(`${API_URL}/packages/stats/dashboard`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/packages?limit=5`, { headers: getAuthHeaders() })
      ]);

      setStats(statsRes.data.data);
      setRecentPackages(packagesRes.data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('dxt_admin_token');
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async (pkg) => {
    if (!pkg?.receiverEmail) {
      toast.error('No receiver email found');
      return;
    }

    setResendingEmail(prev => ({ ...prev, [pkg._id]: true }));

    try {
      const response = await axios.post(
        `${API_URL}/packages/${pkg._id}/resend-email`,
        {},
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success(`Email resent to ${pkg.receiverEmail}`);
        setRecentPackages(prev => prev.map(p => 
          p._id === pkg._id ? { ...p, emailSent: true, emailStatus: 'sent', emailSentAt: new Date().toISOString() } : p
        ));
      } else {
        toast.error(response.data.message || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend email. Check SendGrid configuration.');
    } finally {
      setResendingEmail(prev => ({ ...prev, [pkg._id]: false }));
    }
  };

  const getEmailStatus = (pkg) => {
    if (pkg.emailSent === true || pkg.emailStatus === 'sent') {
      return { status: 'sent', label: 'Sent', icon: MailCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
    if (pkg.emailSent === false || pkg.emailStatus === 'failed') {
      return { status: 'failed', label: 'Failed', icon: MailX, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
    }
    if (pkg.emailStatus === 'pending') {
      return { status: 'pending', label: 'Pending', icon: MailWarning, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
    }
    return { status: 'unknown', label: 'Unknown', icon: Mail, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
  };

  const getStatusBadge = (status) => {
    const styles = {
      delivered:   { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Delivered' },
      in_transit:  { bg: 'bg-blue-100', text: 'text-blue-700', icon: Truck, label: 'In Transit' },
      arrived:     { bg: 'bg-purple-100', text: 'text-purple-700', icon: MapPin, label: 'Arrived' },
      stopped:     { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle, label: 'Stopped' },
      pending:     { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' },
      cancelled:   { bg: 'bg-slate-100', text: 'text-slate-700', icon: AlertCircle, label: 'Cancelled' },
    };
    return styles[status] || styles.pending;
  };

  const statCards = [
    { label: 'Total Packages', value: stats?.total || 0, icon: Package, color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600', trend: '+12%', trendUp: true },
    { label: 'In Transit', value: stats?.inTransit || 0, icon: Truck, color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600', trend: '+5%', trendUp: true },
    { label: 'Delivered', value: stats?.delivered || 0, icon: CheckCircle, color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600', trend: '+8%', trendUp: true },
    { label: 'Pending', value: stats?.pending || 0, icon: Clock, color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600', trend: '+3%', trendUp: true },
    { label: 'Arrived', value: stats?.arrived || 0, icon: MapPin, color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600', trend: '+2%', trendUp: true },
    { label: 'Stopped', value: stats?.stopped || 0, icon: AlertCircle, color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-600', trend: '-1%', trendUp: false },
  ];

  const quickActions = [
    { label: 'New Package', icon: Package, path: '/packages/new', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Track Package', icon: Eye, path: '/track', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'All Packages', icon: Globe, path: '/packages', color: 'bg-slate-600 hover:bg-slate-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back! Here's what's happening with your deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ─── Quick Actions ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-900/10 ${action.color}`}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* ─── Stats Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.lightColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── Revenue & Activity Overview ──────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total shipping revenue</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                ${(stats?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{stats?.revenueGrowth || '0'}%
              </span>
            </div>
            <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats?.totalRevenue || 0) / 10000 * 100, 100)}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Delivery Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Success Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{stats?.successRate || '95'}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats?.successRate || 95}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">On-Time Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{stats?.onTimeRate || '88'}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats?.onTimeRate || 88}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Customer Satisfaction</span>
                  <span className="font-bold text-slate-900 dark:text-white">{stats?.satisfaction || '4.8'}/5</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(stats?.satisfaction || 4.8) / 5 * 100}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* ─── Recent Packages Table ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Packages</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Latest shipments with email delivery status</p>
          </div>
          <Link 
            to="/packages" 
            className="inline-flex items-center gap-1 text-sm font-semibold text-admin-primary hover:text-admin-primary/80 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentPackages.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No packages yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first shipment to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tracking</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Package</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receiver</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPackages.map((pkg, idx) => {
                  const statusBadge = getStatusBadge(pkg.status);
                  const emailStatus = getEmailStatus(pkg);
                  const EmailIcon = emailStatus.icon;

                  return (
                    <motion.tr
                      key={pkg._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-admin-primary bg-admin-primary/5 px-2.5 py-1 rounded-lg text-sm">
                            {pkg.trackingCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{pkg.packageName || 'Untitled'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {pkg.packageWeight ? `${pkg.packageWeight} kg` : '—'} • {pkg.packageType || 'Standard'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{pkg.receiverName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{pkg.receiverEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                          <statusBadge.icon className="w-3.5 h-3.5" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${emailStatus.bg} ${emailStatus.color} ${emailStatus.border}`}>
                            <EmailIcon className="w-3.5 h-3.5" />
                            {emailStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(pkg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {emailStatus.status === 'failed' && (
                            <button
                              onClick={() => handleResendEmail(pkg)}
                              disabled={resendingEmail[pkg._id]}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Resend email"
                            >
                              {resendingEmail[pkg._id] ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              {resendingEmail[pkg._id] ? 'Sending...' : 'Resend'}
                            </button>
                          )}
                          <Link
                            to={`/packages/${pkg._id}`}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-admin-primary transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ─── Email Delivery Summary ──────────────────────────────── */}
      {recentPackages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Emails Sent', value: recentPackages.filter(p => getEmailStatus(p).status === 'sent').length, icon: MailCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Failed', value: recentPackages.filter(p => getEmailStatus(p).status === 'failed').length, icon: MailX, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Pending', value: recentPackages.filter(p => getEmailStatus(p).status === 'pending').length, icon: MailWarning, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total Emails', value: recentPackages.length, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
