import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SearchResult {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  invoiceCount: number;
  unpaidAmount: number;
  lastActivity: string;
  status: 'verified' | 'pending' | 'flagged';
}

const SearchPanel: React.FC = () => {
  const [searchType, setSearchType] = useState<'gstin' | 'phone'>('gstin');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setSearched(true);

    // Simulate API call
    setTimeout(() => {
      // Mock results
      const mockResults: SearchResult[] = searchType === 'gstin'
        ? [
            {
              id: '1',
              name: 'Spice Traders Pvt Ltd',
              gstin: '27AABCT1234L1Z5',
              phone: '+91 9876543210',
              invoiceCount: 45,
              unpaidAmount: 125000,
              lastActivity: '2024-02-10',
              status: 'verified',
            },
            {
              id: '2',
              name: 'Kerala Spice Exporters',
              gstin: '32AABCK5555M1Z8',
              phone: '+91 9988776655',
              invoiceCount: 67,
              unpaidAmount: 0,
              lastActivity: '2024-02-15',
              status: 'verified',
            },
          ]
        : [
            {
              id: '3',
              name: 'Mumbai Food Supplies',
              gstin: '27AABCM9999N1Z3',
              phone: searchValue,
              invoiceCount: 23,
              unpaidAmount: 45000,
              lastActivity: '2024-02-12',
              status: 'verified',
            },
          ];
      
      setResults(mockResults);
      setLoading(false);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success">Verified</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'flagged':
        return <Badge variant="danger">Flagged</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Search Directory</h2>
          <p className="text-gray-600">Search for companies by GSTIN or phone number</p>
        </div>

        {/* Search Type Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              searchType === 'gstin'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSearchType('gstin')}
          >
            Search by GSTIN
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              searchType === 'phone'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSearchType('phone')}
          >
            Search by Phone
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            type="text"
            placeholder={searchType === 'gstin' ? 'Enter 15-digit GSTIN' : 'Enter phone number'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            fullWidth
            maxLength={searchType === 'gstin' ? 15 : 13}
          />
          <Button type="submit" isLoading={loading} className="whitespace-nowrap">
            <Search size={18} className="mr-2" />
            Search
          </Button>
        </form>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-sm">Try searching with a different GSTIN or phone number</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Results ({results.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GSTIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unpaid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.name}</div>
                        <div className="text-sm text-gray-500">
                          Last activity: {new Date(result.lastActivity).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.gstin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.invoiceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.unpaidAmount > 0 ? (
                          <span className="text-red-600 font-medium">
                            ₹{result.unpaidAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-green-600">All Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(result.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SearchPanel;
