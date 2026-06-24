import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import api from '../../services/api';

interface SearchResult {
  company_id: number;
  company_name: string;
  gstn: string;
  phone_number: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  reputation_score: number | null;
  invoice_count: number;
  unpaid_amount: number;
}

const SearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<'gstin' | 'phone' | 'name'>('gstin');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    setResults([]);

    try {
      const params = searchType === 'gstin'
        ? { gstn: searchValue.trim().toUpperCase() }
        : searchType === 'phone'
        ? { phone: searchValue.trim() }
        : { name: searchValue.trim() };

      const endpoint = searchType === 'name' ? '/incident/search' : '/company/search';
      const response = await api.get(endpoint, { params });
      // incident/search returns { incidents } array, normalize to same shape
      if (searchType === 'name') {
        const incidents = response.data.incidents || [];
        // Deduplicate by GSTN and aggregate
        const byGstn: Record<string, SearchResult> = {};
        for (const inc of incidents) {
          const key = inc.company_gstn || inc.company_name;
          if (!byGstn[key]) {
            byGstn[key] = {
              company_id: inc.id,
              company_name: inc.company_name,
              gstn: inc.company_gstn || '',
              phone_number: null,
              industry: null,
              city: null,
              country: null,
              reputation_score: null,
              invoice_count: 1,
              unpaid_amount: 0,
            };
          } else {
            byGstn[key].invoice_count += 1;
          }
        }
        setResults(Object.values(byGstn));
      } else {
        setResults(response.data.results || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (result: SearchResult) => {
    // Use window.location.href to ensure clean navigation out of the
    // AppShell nested <Routes> context into the top-level route.
    window.location.href = `/company/view/${result.company_id}`;
  };

  const getRepBadge = (score: number | null) => {
    if (score === null || score === undefined) return <Badge>No data</Badge>;
    if (score >= 80) return <Badge variant="success">Good ({score})</Badge>;
    if (score >= 50) return <Badge variant="warning">Fair ({score})</Badge>;
    return <Badge variant="danger">Poor ({score})</Badge>;
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
            onClick={() => { setSearchType('gstin'); setSearched(false); setResults([]); }}
          >
            By GSTIN
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              searchType === 'phone'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setSearchType('phone'); setSearched(false); setResults([]); }}
          >
            By Phone
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              searchType === 'name'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setSearchType('name'); setSearched(false); setResults([]); }}
          >
            By Company Name
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            type="text"
            placeholder={
              searchType === 'gstin' ? 'Enter 15-digit GSTIN (e.g. 24AABCX1234A1Z5)'
              : searchType === 'phone' ? 'Enter phone number'
              : 'Enter company name'
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            fullWidth
            maxLength={searchType === 'gstin' ? 15 : undefined}
          />
          <Button type="submit" isLoading={loading} className="whitespace-nowrap">
            <Search size={18} className="mr-2" />
            Search
          </Button>
        </form>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-sm">Try searching with a different GSTIN or phone number</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Results ({results.length})</h3>
            <p className="text-xs text-gray-400">Click a row to view the company profile</p>
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
                      Incidents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount at Risk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reputation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr
                      key={result.company_id}
                      onClick={() => handleRowClick(result)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      title="Click to view company profile"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-700 hover:underline">
                          {result.company_name}
                        </div>
                        {(result.city || result.country) && (
                          <div className="text-xs text-gray-400">
                            {[result.city, result.country].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {result.industry && (
                          <div className="text-xs text-gray-400">{result.industry}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {result.gstn || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.phone_number || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.invoice_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.unpaid_amount > 0 ? (
                          <span className="text-red-600 font-medium">
                            ₹{Number(result.unpaid_amount).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-green-600">All Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRepBadge(result.reputation_score)}
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
