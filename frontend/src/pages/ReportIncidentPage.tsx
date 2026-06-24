import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService, IncidentCreateInput, IncidentType } from '../services/incidentService';

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

interface ContactPerson {
  name: string;
  position: string;
  email: string;
  phone: string;
}

interface ExtendedFormData extends Omit<IncidentCreateInput, 'invoice_amount' | 'unpaid_amount' | 'incident_date' | 'incident_title' | 'description'> {
  state: string;
  pincode: string;
  street_address: string;
  msme_udyam_number: string;
  invoice_amount: string;
  unpaid_amount: string;
  invoice_date: string;
  due_date: string;
  item_sold: string;
  contact_persons: ContactPerson[];
}

const emptyContact = (): ContactPerson => ({ name: '', position: '', email: '', phone: '' });

const TOTAL_STEPS = 3;

const ReportIncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExtendedFormData>({
    // Step 1 – Company Details
    company_gstn: '',
    company_name: '',
    state: '',
    pincode: '',
    street_address: '',
    msme_udyam_number: '',
    // Step 2 – Incident / Invoice Details
    incident_type: 'FRAUD',
    invoice_amount: '',
    unpaid_amount: '',
    invoice_date: '',
    due_date: '',
    item_sold: '',
    amount_involved: undefined,
    currency_code: 'INR',
    is_anonymous: false,
    // Step 3 – Contact Persons
    contact_persons: [emptyContact()],
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleContactChange = (
    index: number,
    field: keyof ContactPerson,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.contact_persons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, contact_persons: updated };
    });
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
      const invoiceAmt = formData.invoice_amount !== '' ? parseFloat(formData.invoice_amount) : undefined;
      const unpaidAmt = formData.unpaid_amount !== '' ? parseFloat(formData.unpaid_amount) : undefined;

      const payload: IncidentCreateInput & Record<string, unknown> = {
        company_gstn: formData.company_gstn || undefined,
        company_name: formData.company_name,
        state: formData.state,
        pincode: formData.pincode || undefined,
        street_address: formData.street_address || undefined,
        msme_udyam_number: formData.msme_udyam_number || undefined,
        incident_type: formData.incident_type,
        incident_date: new Date().toISOString().split('T')[0], // auto-set to today
        incident_title: `${formData.incident_type} - ${formData.company_name}`, // auto-generated
        invoice_amount: invoiceAmt,
        unpaid_amount: unpaidAmt,
        invoice_date: formData.invoice_date || undefined,
        due_date: formData.due_date || undefined,
        item_sold: formData.item_sold || undefined,
        amount_involved: invoiceAmt,
        currency_code: formData.currency_code,
        is_anonymous: true, // always anonymous — no checkbox needed
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

  // ── Step indicators ───────────────────────────────────────────────────────

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
          {/* ═══════════════════════════════════════════════════════════════
              STEP 1 – COMPANY DETAILS
          ═══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <>
              <p className={sectionTitle}>Company Details</p>

              {/* GSTIN */}
              <div>
                <label className={labelClass}>
                  Company GSTIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_gstn"
                  className={inputClass}
                  value={formData.company_gstn ?? ''}
                  onChange={handleChange}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  required
                  maxLength={15}
                />
              </div>

              {/* Company Name */}
              <div>
                <label className={labelClass}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  className={inputClass}
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Registered company name"
                  required
                />
              </div>

              {/* State */}
              <div>
                <label className={labelClass}>
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  className={inputClass}
                  value={formData.state}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Pincode + Street (optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    className={inputClass}
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 360001"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    title="6-digit pincode"
                  />
                </div>
                <div>
                  <label className={labelClass}>Street Address</label>
                  <input
                    type="text"
                    name="street_address"
                    className={inputClass}
                    value={formData.street_address}
                    onChange={handleChange}
                    placeholder="Building, street, locality"
                  />
                </div>
              </div>

              {/* MSME / Udyam Aadhaar */}
              <div>
                <label className={labelClass}>MSME / Udyam Aadhaar Number</label>
                <input
                  type="text"
                  name="msme_udyam_number"
                  className={inputClass}
                  value={formData.msme_udyam_number}
                  onChange={handleChange}
                  placeholder="e.g. UDYAM-GJ-00-0000000"
                />
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2 – INVOICE / INCIDENT DETAILS
          ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <>
              <p className={sectionTitle}>Incident & Invoice Details</p>

              {/* Privacy Disclaimer */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>
                  <span className="font-semibold">Your identity is always protected.</span> Your name, email, and company details will never be made public. Other users can only see the reported company's name, incident type, and financial figures — never who submitted this report.
                </p>
              </div>

              {/* Incident Type */}
              <div>
                <label className={labelClass}>
                  Incident Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="incident_type"
                  className={inputClass}
                  value={formData.incident_type}
                  onChange={handleChange}
                  required
                >
                  {INCIDENT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Amount + Unpaid Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Invoice Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="invoice_amount"
                    className={inputClass}
                    value={formData.invoice_amount}
                    onChange={handleChange}
                    placeholder="Total invoice value"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Unpaid Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="unpaid_amount"
                    className={inputClass}
                    value={formData.unpaid_amount}
                    onChange={handleChange}
                    placeholder="Amount still unpaid"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Invoice Date + Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Invoice Date</label>
                  <input
                    type="date"
                    name="invoice_date"
                    className={inputClass}
                    value={formData.invoice_date}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    className={inputClass}
                    value={formData.due_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Item Sold (optional) */}
              <div>
                <label className={labelClass}>Item / Product Sold</label>
                <input
                  type="text"
                  name="item_sold"
                  className={inputClass}
                  value={formData.item_sold}
                  onChange={handleChange}
                  placeholder="e.g. Cumin Seeds 100kg (optional)"
                />
              </div>

              {/* Currency */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Currency</label>
                <input
                  type="text"
                  name="currency_code"
                  className={`${inputClass} max-w-[80px]`}
                  value={formData.currency_code ?? 'INR'}
                  onChange={handleChange}
                  maxLength={3}
                />
              </div>


            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3 – CONTACT PERSONS
          ═══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <>
              <p className={sectionTitle}>Contact Persons</p>
              <p className="text-sm text-gray-500 -mt-3 mb-4">
                Add the contact persons at the reported company. Click <span className="font-semibold">+</span> to add more.
              </p>

              <div className="space-y-3">
                {formData.contact_persons.map((contact, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    {/* Row number */}
                    <span className="text-xs font-semibold text-gray-400 w-5 shrink-0">{index + 1}.</span>

                    {/* Name */}
                    <input
                      type="text"
                      className={`${inputClass} flex-1 min-w-0`}
                      placeholder="Full Name"
                      value={contact.name}
                      onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                      required={index === 0}
                    />

                    {/* Position/Role */}
                    <input
                      type="text"
                      className={`${inputClass} flex-1 min-w-0`}
                      placeholder="Position / Role"
                      value={contact.position}
                      onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                    />

                    {/* Email */}
                    <input
                      type="email"
                      className={`${inputClass} flex-1 min-w-0`}
                      placeholder="Email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                    />

                    {/* Phone */}
                    <input
                      type="tel"
                      className={`${inputClass} flex-1 min-w-0`}
                      placeholder="Phone Number"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                    />

                    {/* Remove button (only if more than one row) */}
                    {formData.contact_persons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                        title="Remove contact"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add contact button */}
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-1"
              >
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600 font-bold text-base leading-none">
                  +
                </span>
                Add another contact person
              </button>
            </>
          )}

          {/* ── Navigation buttons ─────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/app/my-incidents')}
                disabled={loading}
                className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
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

