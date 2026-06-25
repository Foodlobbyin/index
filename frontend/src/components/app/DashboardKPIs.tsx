import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, Users, CheckCircle, Calendar } from 'lucide-react';
import {
  insightsService,
  DashboardStats,
  InvoiceByMonth,
  StateUnpaidData,
} from '../../services/insightsService';
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

// Distinct colour palette for state pie slices
const STATE_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
  '#14b8a6', '#e879f9', '#fb7185', '#fbbf24', '#34d399',
];

/** Format a number as ₹ with Indian lakh/crore shorthand */
function formatINR(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)} K`;
  return `₹${value.toFixed(0)}`;
}

/** Custom tooltip shown on hover over pie slices */
const StatePieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as StateUnpaidData;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-4 py-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{d.state_name}</p>
        <p className="text-gray-600">
          Unpaid: <span className="font-medium text-red-600">{formatINR(d.unpaid_amount)}</span>
        </p>
        <p className="text-gray-500">Incidents: {d.incident_count}</p>
      </div>
    );
  }
  return null;
};

const DashboardKPIs: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoicesByMonth, setInvoicesByMonth] = useState<InvoiceByMonth[]>([]);
  const [stateData, setStateData] = useState<StateUnpaidData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, monthData, states] = await Promise.all([
          insightsService.getDashboardStats(),
          insightsService.getInvoicesByMonth(),
          insightsService.getStateUnpaidData(),
        ]);
        setStats(statsData);
        setInvoicesByMonth(monthData);
        // Only show states that have any unpaid amount; cap at top 10 for readability
        setStateData(states.filter((s) => s.unpaid_amount > 0).slice(0, 10));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({
          totalCompanies: 0,
          totalInvoices: 0,
          unpaidInvoices: 0,
          totalUsers: 0,
          resolvedIssues: 0,
          casesThisMonth: 0,
        });
        setInvoicesByMonth([]);
        setStateData([]);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Platform Stats</h2>
        <p className="text-gray-500 text-sm">
          Live snapshot of incidents, companies, and case resolution across the network.
        </p>
      </div>

      {/* KPI Cards — 4 metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Companies Reported */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Companies Reported</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalCompanies || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* 2. Total Incidents */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Incidents</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalInvoices || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* 3. Cases Reported This Month */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cases This Month</p>
              <p className="text-3xl font-bold text-orange-600">{stats?.casesThisMonth || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* 4. Issues Resolved */}
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
        {/* Bar Chart — Incidents by Month */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Incidents by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={invoicesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Resolved" />
              <Bar dataKey="unpaid" fill="#ef4444" name="Active" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart — Statewise Unpaid Amount */}
        <Card>
          <h3 className="text-lg font-semibold mb-1">Unpaid Amount by State</h3>
          <p className="text-xs text-gray-400 mb-4">
            Derived from GSTIN prefix · Top 10 states · Hover for details
          </p>

          {stateData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              No data yet — unpaid amounts will appear once incidents are filed.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  dataKey="unpaid_amount"
                  nameKey="state_name"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    if (percent < 0.04) return null; // skip tiny slices
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {stateData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATE_COLORS[index % STATE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<StatePieTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-gray-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardKPIs;
