import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/packages/stats/dashboard`);
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Packages', 
      value: stats?.total || 0, 
      icon: Package, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      title: 'In Transit', 
      value: stats?.inTransit || 0, 
      icon: Truck, 
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    { 
      title: 'Delivered', 
      value: stats?.delivered || 0, 
      icon: CheckCircle, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      title: 'Stopped', 
      value: stats?.stopped || 0, 
      icon: AlertCircle, 
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
  ];

  const pieData = stats ? [
    { name: 'Pending', value: stats.pending, color: '#fbbf24' },
    { name: 'In Transit', value: stats.inTransit, color: '#6366f1' },
    { name: 'Arrived', value: stats.arrived, color: '#a855f7' },
    { name: 'Delivered', value: stats.delivered, color: '#22c55e' },
    { name: 'Stopped', value: stats.stopped, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="admin-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 text-transparent bg-clip-text bg-gradient-to-br ${card.color}`} style={{ color: 'inherit' }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="admin-card"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Package Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Packages
            </h3>
            <Link to="/packages" className="text-admin-primary hover:text-admin-secondary text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {stats?.recentPackages?.length > 0 ? (
              stats.recentPackages.map((pkg) => (
                <div key={pkg._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      pkg.status === 'delivered' ? 'bg-green-100 text-green-600' :
                      pkg.status === 'in_transit' ? 'bg-blue-100 text-blue-600' :
                      pkg.status === 'stopped' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{pkg.packageName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{pkg.trackingCode}</p>
                    </div>
                  </div>
                  <span className={`status-pill ${
                    pkg.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    pkg.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                    pkg.status === 'stopped' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pkg.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No packages yet
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="admin-card"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/create">
            <button className="admin-btn flex items-center gap-2">
              <Package className="w-5 h-5" />
              Create New Package
            </button>
          </Link>
          <Link to="/packages">
            <button className="admin-btn-secondary flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Manage Packages
            </button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
