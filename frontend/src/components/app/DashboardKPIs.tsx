import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, Users, CheckCircle } from 'lucide-react';
import { insightsService, DashboardStats, InvoiceByMonth, InvoiceByStatus } from '../../services/insightsService';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

const DashboardKPIs: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoicesByMonth, setInvoicesByMonth] = useState<InvoiceByMonth[]>([]);
  const [invoicesByStatus, setInvoicesByStatus] = useState<InvoiceByStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, monthData, statusData] = await Promise.all([
          insightsService.getDashboardStats(),
          insightsService.getInvoicesByMonth(),
          insightsService.getInvoicesByStatus(),
        ]);
        
        setStats(statsData);
        setInvoicesByMonth(monthData);
        setInvoicesByStatus(statusData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalCompanies || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalInvoices || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Unpaid Invoices</p>
              <p className="text-3xl font-bold text-red-600">{stats?.unpaidInvoices || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Issues Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats?.resolvedIssues || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Invoices by Month */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Invoices by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={invoicesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Paid" />
              <Bar dataKey="unpaid" fill="#ef4444" name="Unpaid" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart - Invoices by Status */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Invoices by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={invoicesByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.status}: ${entry.count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {invoicesByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default DashboardKPIs;
