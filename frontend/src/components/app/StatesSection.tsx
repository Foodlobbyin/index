import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import api from '../../services/api';

interface StateEntry {
  state_code: string;
  state_name: string;
  incident_count: number;
  company_count: number;
}

// GST state code → name mapping
const GST_STATE_MAP: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

const StatesSection: React.FC = () => {
  const [states, setStates] = useState<StateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/insights/states');
        setStates(res.data.states || []);
      } catch {
        setError('Could not load state data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">States Directory</h2>
        <p className="text-gray-500 text-sm">
          Browse companies reported by Indian state. GSTIN prefix identifies the state of registration.
        </p>
      </div>

      {states.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <MapPin size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No state data yet</p>
            <p className="text-sm mt-1">Data will appear as incidents are reported with valid GSTINs.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {states.map((s) => (
            <button
              key={s.state_code}
              onClick={() => setSelected(selected === s.state_code ? null : s.state_code)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selected === s.state_code
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{s.state_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">GST Code: {s.state_code}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                    {s.incident_count} incident{s.incident_count !== 1 ? 's' : ''}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{s.company_count} co.</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatesSection;
