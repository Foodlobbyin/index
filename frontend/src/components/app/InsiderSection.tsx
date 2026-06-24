import React from 'react';
import { Lock, Newspaper } from 'lucide-react';
import Card from '../ui/Card';

const InsiderSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Insider</h2>
        <p className="text-gray-500 text-sm">
          Exclusive industry news, trade alerts, and market intelligence for verified community members.
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Lock size={28} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon</h3>
          <p className="text-gray-500 text-sm max-w-md">
            Insider will bring you curated food &amp; spice industry news, commodity price alerts,
            regulatory updates, and exclusive trade intelligence — available only to verified
            FoodLobby members.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
            {[
              { icon: <Newspaper size={20} />, label: 'Industry News', desc: 'Curated trade news' },
              { icon: <Lock size={20} />, label: 'Market Alerts', desc: 'Price & policy changes' },
              { icon: <Newspaper size={20} />, label: 'Regulatory Updates', desc: 'GST, FSSAI & more' },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-dashed border-gray-200 rounded-lg p-4 text-center opacity-60"
              >
                <div className="flex justify-center text-blue-400 mb-2">{item.icon}</div>
                <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InsiderSection;
