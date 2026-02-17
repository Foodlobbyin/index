import { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { companyService, Company, CompanyInput } from '../services/companyService';

export default function CompanyProfile(): JSX.Element {
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyInput>({
    company_name: '',
    industry: '',
    revenue: 0,
    employees: 0,
    address: '',
    city: '',
    country: '',
    website: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const data = await companyService.getCompany();
      setCompany(data);
      setFormData({
        company_name: data.company_name,
        industry: data.industry || '',
        revenue: data.revenue || 0,
        employees: data.employees || 0,
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
        website: data.website || '',
      });
      setIsEditing(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsEditing(false);
      } else {
        setError('Failed to load company profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isEditing && company) {
        await companyService.updateCompany(company.id, formData);
        setSuccess('Company profile updated successfully!');
      } else {
        const newCompany = await companyService.createCompany(formData);
        setCompany(newCompany);
        setIsEditing(true);
        setSuccess('Company profile created successfully!');
      }
      await fetchCompany();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save company profile');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const successStyle: React.CSSProperties = {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px',
  };

  return (
    <Layout>
      <div style={cardStyle}>
        <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>
          {isEditing ? 'Edit Company Profile' : 'Create Company Profile'}
        </h1>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={gridStyle}>
            <input
              type="text"
              name="company_name"
              placeholder="Company Name *"
              value={formData.company_name}
              onChange={handleChange}
              required
              style={inputStyle}
              disabled={loading}
            />
            <input
              type="text"
              name="industry"
              placeholder="Industry"
              value={formData.industry}
              onChange={handleChange}
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div style={gridStyle}>
            <input
              type="number"
              name="revenue"
              placeholder="Annual Revenue"
              value={formData.revenue || ''}
              onChange={handleChange}
              style={inputStyle}
              disabled={loading}
            />
            <input
              type="number"
              name="employees"
              placeholder="Number of Employees"
              value={formData.employees || ''}
              onChange={handleChange}
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            style={inputStyle}
            disabled={loading}
          />

          <div style={gridStyle}>
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              style={inputStyle}
              disabled={loading}
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <input
            type="url"
            name="website"
            placeholder="Website"
            value={formData.website}
            onChange={handleChange}
            style={inputStyle}
            disabled={loading}
          />

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
