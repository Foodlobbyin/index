import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import api from '../../services/api';

// ── Result types ──────────────────────────────────────────────────────────────

interface CompanyResult {
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

interface ContactResult {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  company: string | null;
  company_gstn: string | null;
  company_count: number;
  incident_count: number;
}

const SearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<'gstin' | 'phone'>('gstin');
  const [searchValue, setSearchValue] = useState('');
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([]);
  const [contactResults, setContactResults] = useState<ContactResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    setCompanyResults([]);
    setContactResults([]);

    try {
      if (searchType === 'gstin') {
        const response = await api.get('/company/search', {
          params: { gstn: searchValue.trim().toUpperCase() },
        });
        setCompanyResults(response.data.results || []);
      } else {
        // Phone search — goes to contact persons
        const response = await api.get('/contact/search', {
          params: { phone: searchValue.trim() },
        });
        setContactResults(response.data.contacts || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (result: CompanyResult) => {
    const gstn = result.gstn || '';
    if (gstn) {
      window.location.href = `/company/view/gstn/${encodeURIComponent(gstn)}`;
    } else {
      window.location.href = `/company/view/name/${encodeURIComponent(result.company_name)}`;
    }
  };

  const handleContactClick = (contact: ContactResult) => {
    window.location.href = `/contact/${contact.id}`;
  };

  const getRepBadge = (score: number | null) => {
    if (score === null || score === undefined) return <Badge>No data</Badge>;
    if (score >= 80) return <Badge variant="success">Good ({score})</Badge>;
    if (score >= 50) return <Badge variant="warning">Fair ({score})</Badge>;
    return <Badge variant="danger">Poor ({score})</Badge>;
  };

  const hasResults = companyResults.length > 0 || contactResults.length > 0;

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Search Directory</h2>
          <p className="text-gray-600">
            {searchType === 'gstin'
              ? 'Search by GSTIN to view company profile with all invoices and contacts.'
              : 'Search by phone number to find contact persons and the companies they are linked to.'}
          </p>
        </div>

        {/* Search Type Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              searchType === 'gstin'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setSearchType('gstin'); setSearched(false); setCompanyResults([]); setContactResults([]); }}
          >
            By GSTIN
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              searchType === 'phone'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setSearchType('phone'); setSearched(false); setCompanyResults([]); setContactResults([]); }}
          >
            By Phone
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            type="text"
            placeholder={
              searchType === 'gstin'
                ? 'Enter 15-digit GSTIN (e.g. 24AABCX1234A1Z5)'
                : 'Enter phone number to search contact persons'
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
        {!loading && searched && !hasResults && !error && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-sm">
              {searchType === 'gstin'
                ? 'No incidents reported against this GSTIN.'
                : 'No contact persons found with this phone number.'}
            </p>
          </div>
        )}

        {/* ── GSTIN: Company Results ─────────────────────────────────────── */}
        {!loading && companyResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Companies Found ({companyResults.length})</h3>
            <p className="text-xs text-gray-400">Click a row to view full invoice list and contact persons</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Company', 'GSTIN', 'Phone', 'Incidents', 'Amount at Risk', 'Reputation'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companyResults.map((result) => (
                    <tr
                      key={result.company_id}
                      onClick={() => handleCompanyClick(result)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      title="Click to view company profile"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-700 hover:underline">{result.company_name}</div>
                        {(result.city || result.country) && (
                          <div className="text-xs text-gray-400">{[result.city, result.country].filter(Boolean).join(', ')}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{result.gstn || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.phone_number || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.invoice_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.unpaid_amount > 0 ? (
                          <span className="text-red-600 font-medium">₹{Number(result.unpaid_amount).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-green-600">All Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRepBadge(result.reputation_score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Phone: Contact Person Results ──────────────────────────────── */}
        {!loading && contactResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Persons Found ({contactResults.length})</h3>
            <p className="text-xs text-gray-400">Click a person to view all companies they are linked to</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Position', 'Phone', 'Email', 'Companies', 'Incidents'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contactResults.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => handleContactClick(contact)}
                      className="hover:bg-orange-50 cursor-pointer transition-colors"
                      title="Click to view contact person profile"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-orange-700 hover:underline">{contact.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.position || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.phone || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.email || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {contact.company_count} {contact.company_count === 1 ? 'company' : 'companies'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {contact.incident_count} {contact.incident_count === 1 ? 'incident' : 'incidents'}
                        </span>
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
