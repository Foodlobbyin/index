import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService, IncidentCreateInput, IncidentType } from '../services/incidentService';
import api from '../services/api';

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'SERVICE_ISSUE', label: 'Service Issue' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'CONTRACT_BREACH', label: 'Contract Breach' },
  { value: 'OTHER', label: 'Other' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

interface InvoiceRow {
  invoice_amount: string;
  unpaid_amount: string;
  invoice_date: string;
  due_date: string;
  item_sold: string;
}

interface ContactPerson {
  name: string;
  position: string;
  email: string;
  phone: string;
}

interface FormData {
  // Step 1
  company_gstn: string;
  company_name: string;
  state: string;
  pincode: string;
  street_address: string;
  msme_udyam_number: string;
  // Step 2
  incident_type: IncidentType;
  description: string;
  currency_code: string;
  invoices: InvoiceRow[];
  // Step 3
  contact_persons: ContactPerson[];
}

const emptyInvoice = (): InvoiceRow => ({
  invoice_amount: '',
  unpaid_amount: '',
  invoice_date: '',
  due_date: '',
  item_sold: '',
});

const emptyContact = (): ContactPerson => ({ name: '', position: '', email: '', phone: '' });

const TOTAL_STEPS = 3;

const ReportIncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GSTN auto-fill state
  const [gstnLookupStatus, setGstnLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  // Per-contact phone lookup status (index → status)
  const [phoneLookupStatus, setPhoneLookupStatus] = useState<Record<number, 'idle' | 'loading' | 'found' | 'not_found'>>({});

  const [formData, setFormData] = useState<FormData>({
    company_gstn: '',
    company_name: '',
    state: '',
    pincode: '',
    street_address: '',
    msme_udyam_number: '',
    incident_type: 'FRAUD',
    description: '',
    currency_code: 'INR',
    invoices: [emptyInvoice()],
    contact_persons: [emptyContact()],
  });

  // ── Generic field handler ─────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset GSTN lookup if user clears/changes the GSTN field
    if (name === 'company_gstn') {
      setGstnLookupStatus('idle');
    }
  };

  // ── GSTN blur → auto-fill from companies table ────────────────────────────
  const handleGstnBlur = async () => {
    const gstn = formData.company_gstn.trim().toUpperCase();
    if (gstn.length < 10) return;
    setGstnLookupStatus('loading');
    try {
      const res = await api.get('/company/lookup', { params: { gstn } });
      const company = res.data?.company;
      if (company) {
        setFormData((prev) => ({
          ...prev,
          company_gstn: company.gstn ?? prev.company_gstn,
          company_name: company.company_name ?? prev.company_name,
          state: company.state ?? prev.state,
          pincode: company.pincode ?? prev.pincode,
          street_address: company.street_address ?? prev.street_address,
          msme_udyam_number: company.msme_udyam_number ?? prev.msme_udyam_number,
        }));
        setGstnLookupStatus('found');
      } else {
        setGstnLookupStatus('not_found');
      }
    } catch {
      setGstnLookupStatus('not_found');
    }
  };

  // ── Invoice row handlers ──────────────────────────────────────────────────
  const handleInvoiceChange = (index: number, field: keyof InvoiceRow, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.invoices];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, invoices: updated };
    });
  };

  const addInvoice = () => {
    setFormData((prev) => ({ ...prev, invoices: [...prev.invoices, emptyInvoice()] }));
  };

  const removeInvoice = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((_, i) => i !== index),
    }));
  };

  // ── Contact person handlers ───────────────────────────────────────────────
  const handleContactChange = (index: number, field: keyof ContactPerson, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.contact_persons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, contact_persons: updated };
    });
    // Reset phone lookup if user changes the phone field
    if (field === 'phone') {
      setPhoneLookupStatus((prev) => ({ ...prev, [index]: 'idle' }));
    }
  };

  // ── Contact phone blur → auto-fill from contact_persons table ─────────────
  const handleContactPhoneBlur = async (index: number) => {
    const phone = formData.contact_persons[index].phone.trim();
    if (phone.replace(/\D/g, '').length < 5) return;
    setPhoneLookupStatus((prev) => ({ ...prev, [index]: 'loading' }));
    try {
      const res = await api.get('/contact/lookup', { params: { phone } });
      const contact = res.data?.contact;
      if (contact) {
        setFormData((prev) => {
          const updated = [...prev.contact_persons];
          updated[index] = {
            ...updated[index],
            name: contact.name ?? updated[index].name,
            position: contact.position ?? updated[index].position,
            email: contact.email ?? updated[index].email,
            phone: contact.phone ?? updated[index].phone,
          };
          return { ...prev, contact_persons: updated };
        });
        setPhoneLookupStatus((prev) => ({ ...prev, [index]: 'found' }));
      } else {
        setPhoneLookupStatus((prev) => ({ ...prev, [index]: 'not_found' }));
      }
    } catch {
      setPhoneLookupStatus((prev) => ({ ...prev, [index]: 'not_found' }));
    }
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contact_persons: [...prev.contact_persons, emptyContact()],
    }));
  };

  const removeContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contact_persons: prev.contact_persons.filter((_, i) => i !== index),
    }));
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const goNext = () => {
    setError(null);
    if (step === 2 && !(formData.description ?? '').trim()) {
      setError('Description is required. Please describe the incident.');
      return;
    }
    if (step === 2) {
      const hasInvoice = formData.invoices.some(
        (inv) => inv.invoice_amount.trim() !== '' || inv.unpaid_amount.trim() !== ''
      );
      if (!hasInvoice) {
        setError('Please enter at least one invoice with Invoice Amount or Unpaid Amount.');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Filter out blank invoice rows
      const validInvoices = formData.invoices.filter(
        (inv) => inv.invoice_amount.trim() !== '' || inv.unpaid_amount.trim() !== ''
      );

      // Compute total amount_involved for the incident record (sum of all invoice amounts)
      const totalInvolved = validInvoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.invoice_amount) || 0),
        0
      );

      const payload: IncidentCreateInput & Record<string, unknown> = {
        company_gstn: formData.company_gstn || undefined,
        company_name: formData.company_name,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
        street_address: formData.street_address || undefined,
        msme_udyam_number: formData.msme_udyam_number || undefined,
        incident_type: formData.incident_type,
        incident_date: new Date().toISOString().split('T')[0],
        incident_title: `${formData.incident_type} - ${formData.company_name}`,
        description: formData.description || '',
        amount_involved: totalInvolved || undefined,
        currency_code: formData.currency_code || 'INR',
        is_anonymous: true,
        // Multi-invoice array — saved to incident_invoices table
        invoices: validInvoices,
        // Contact persons — upserted to contact_persons table
        contact_persons: formData.contact_persons.filter((c) => c.name.trim() !== ''),
      };

      const incident = await incidentService.submit(payload as IncidentCreateInput);
      navigate(`/app/incidents/${incident.id}`);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ??
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to submit incident.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const sectionTitle = 'text-base font-semibold text-gray-800 mb-4';

  const steps = [
    { label: 'Company Details' },
    { label: 'Invoice Details' },
    { label: 'Contact Persons' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      num
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${step > num ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Report an Incident</h2>
        <p className="text-sm text-gray-500 mb-6">Step {step} of {TOTAL_STEPS} — {steps[step - 1].label}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <form
          onSubmit={step === TOTAL_STEPS ? handleSubmit : (e) => { e.preventDefault(); goNext(); }}
          className="space-y-5"
        >
          {/* ═══════════════ STEP 1 – COMPANY DETAILS ═══════════════════ */}
          {step === 1 && (
            <>
              <p className={sectionTitle}>Company Details</p>

              <div>
                <label className={labelClass}>Company GSTIN <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    name="company_gstn"
                    className={`${inputClass} ${gstnLookupStatus === 'found' ? 'border-green-400 bg-green-50' : ''}`}
                    value={formData.company_gstn}
                    onChange={handleChange}
                    onBlur={handleGstnBlur}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    required
                    maxLength={15}
                  />
                  {gstnLookupStatus === 'loading' && (
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400">Looking up…</span>
                  )}
                  {gstnLookupStatus === 'found' && (
                    <span className="absolute right-3 top-2.5 text-xs text-green-600 font-medium">✓ Company found — details auto-filled</span>
                  )}
                  {gstnLookupStatus === 'not_found' && (
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400">New company — please fill details below</span>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
                <input type="text" name="company_name" className={inputClass}
                  value={formData.company_name} onChange={handleChange}
                  placeholder="Registered company name" required />
              </div>

              <div>
                <label className={labelClass}>State <span className="text-red-500">*</span></label>
                <select name="state" className={inputClass} value={formData.state} onChange={handleChange} required>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input type="text" name="pincode" className={inputClass}
                    value={formData.pincode} onChange={handleChange}
                    placeholder="e.g. 360001" maxLength={6} />
                </div>
                <div>
                  <label className={labelClass}>Street Address</label>
                  <input type="text" name="street_address" className={inputClass}
                    value={formData.street_address} onChange={handleChange}
                    placeholder="Building, street, locality" />
                </div>
              </div>

              <div>
                <label className={labelClass}>MSME / Udyam Number</label>
                <input type="text" name="msme_udyam_number" className={inputClass}
                  value={formData.msme_udyam_number} onChange={handleChange}
                  placeholder="e.g. UDYAM-GJ-00-0000000" />
              </div>
            </>
          )}

          {/* ═══════════════ STEP 2 – INVOICE DETAILS (multi-row) ══════════ */}
          {step === 2 && (
            <>
              <p className={sectionTitle}>Incident &amp; Invoice Details</p>

              {/* Privacy Disclaimer */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>
                  <span className="font-semibold">Your identity is always protected.</span> Only the reported company&apos;s details and financial figures are visible to other users — never who submitted this report.
                </p>
              </div>

              {/* Incident Type */}
              <div>
                <label className={labelClass}>Incident Type <span className="text-red-500">*</span></label>
                <select name="incident_type" className={inputClass} value={formData.incident_type} onChange={handleChange} required>
                  {INCIDENT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description <span className="text-red-500">*</span></label>
                <textarea name="description" className={`${inputClass} resize-y min-h-[80px]`}
                  value={formData.description} onChange={handleChange}
                  placeholder="Describe the incident — payment default, bounced cheque, quality dispute, etc."
                  required />
              </div>

              {/* ── Invoice rows ─────────────────────────────────────────── */}
              <div>
                <label className={labelClass}>
                  Invoices <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-2">(add all unpaid invoices in this incident)</span>
                </label>

                <div className="space-y-3 mt-2">
                  {formData.invoices.map((inv, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice {idx + 1}</span>
                        {formData.invoices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInvoice(idx)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                            title="Remove invoice"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Invoice Amount (₹) <span className="text-red-500">*</span></label>
                          <input type="number" className={inputClass}
                            value={inv.invoice_amount}
                            onChange={(e) => handleInvoiceChange(idx, 'invoice_amount', e.target.value)}
                            placeholder="Total invoice value" min="0" step="0.01" />
                        </div>
                        <div>
                          <label className={labelClass}>Unpaid Amount (₹) <span className="text-red-500">*</span></label>
                          <input type="number" className={inputClass}
                            value={inv.unpaid_amount}
                            onChange={(e) => handleInvoiceChange(idx, 'unpaid_amount', e.target.value)}
                            placeholder="Amount still unpaid" min="0" step="0.01" />
                        </div>
                        <div>
                          <label className={labelClass}>Invoice Date</label>
                          <input type="date" className={inputClass}
                            value={inv.invoice_date}
                            onChange={(e) => handleInvoiceChange(idx, 'invoice_date', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Due Date</label>
                          <input type="date" className={inputClass}
                            value={inv.due_date}
                            onChange={(e) => handleInvoiceChange(idx, 'due_date', e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Item / Product Sold</label>
                          <input type="text" className={inputClass}
                            value={inv.item_sold}
                            onChange={(e) => handleInvoiceChange(idx, 'item_sold', e.target.value)}
                            placeholder="e.g. Cumin Seeds 100kg (optional)" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addInvoice}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-3"
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600 font-bold text-base leading-none">+</span>
                  Add another invoice
                </button>
              </div>

              {/* Currency */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Currency</label>
                <input type="text" name="currency_code" className={`${inputClass} max-w-[80px]`}
                  value={formData.currency_code} onChange={handleChange} maxLength={3} />
              </div>
            </>
          )}

          {/* ═══════════════ STEP 3 – CONTACT PERSONS ════════════════════ */}
          {step === 3 && (
            <>
              <p className={sectionTitle}>Contact Persons</p>
              <p className="text-sm text-gray-500 -mt-3 mb-4">
                Add the individuals involved in this deal at the reported company.
                Enter a phone number and their details will be auto-filled if already in our database.
                These names will be visible on the company profile to warn others.
              </p>

              <div className="space-y-4">
                {formData.contact_persons.map((contact, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 bg-gray-50 ${phoneLookupStatus[index] === 'found' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Contact {index + 1}
                        {phoneLookupStatus[index] === 'found' && (
                          <span className="ml-2 text-green-600 normal-case font-normal">✓ Details auto-filled from database</span>
                        )}
                        {phoneLookupStatus[index] === 'loading' && (
                          <span className="ml-2 text-gray-400 normal-case font-normal">Looking up…</span>
                        )}
                      </span>
                      {formData.contact_persons.length > 1 && (
                        <button type="button" onClick={() => removeContact(index)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                          title="Remove contact">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Phone first so lookup fires before other fields */}
                      <div>
                        <label className={labelClass}>Phone Number</label>
                        <input
                          type="tel"
                          className={inputClass}
                          placeholder="Phone — auto-fills other fields"
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                          onBlur={() => handleContactPhoneBlur(index)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Full Name {index === 0 && <span className="text-red-500">*</span>}</label>
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="Full Name"
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          required={index === 0}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Position / Role</label>
                        <input type="text" className={inputClass}
                          placeholder="e.g. Proprietor, Sales Manager"
                          value={contact.position}
                          onChange={(e) => handleContactChange(index, 'position', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <input type="email" className={inputClass}
                          placeholder="Email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addContact}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-1">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600 font-bold text-base leading-none">+</span>
                Add another contact person
              </button>
            </>
          )}

          {/* ── Navigation buttons ──────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              {step > 1 && (
                <button type="button" onClick={goBack} disabled={loading}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  ← Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => navigate('/app/my-incidents')} disabled={loading}
                className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors">
                Cancel
              </button>
              {step < TOTAL_STEPS ? (
                <button type="submit"
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Next →
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loading ? 'Submitting…' : 'Submit Report'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentPage;
