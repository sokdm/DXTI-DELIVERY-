import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  MapPin,
  Users
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ✅ FIXED: Use correct localStorage key
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

  const statCards = [
    { label: 'Total Packages', value: stats?.total || 0, icon: Package, color: 'bg-blue-500', trend: '+12%' },
    { label: 'In Transit', value: stats?.inTransit || 0, icon: Truck, color: 'bg-yellow-500', trend: '+5%' },
    { label: 'Delivered', value: stats?.delivered || 0, icon: CheckCircle, color: 'bg-green-500', trend: '+8%' },
    { label: 'Pending', value: stats?.pending || 0, icon: Clock, color: 'bg-orange-500', trend: '+3%' },
    { label: 'Arrived', value: stats?.arrived || 0, icon: MapPin, color: 'bg-purple-500', trend: '+2%' },
    { label: 'Stopped', value: stats?.stopped || 0, icon: AlertCircle, color: 'bg-red-500', trend: '-1%' },
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.02 }}
            className="admin-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Packages</h3>
          <Link to="/packages" className="text-sm text-admin-primary hover:underline">
            View All
          </Link>
        </div>

        {recentPackages.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">No packages yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Tracking Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Package</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentPackages.map((pkg) => (
                  <tr key={pkg._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-admin-primary">{pkg.trackingCode}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">{pkg.packageName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pkg.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        pkg.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                        pkg.status === 'stopped' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pkg.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
