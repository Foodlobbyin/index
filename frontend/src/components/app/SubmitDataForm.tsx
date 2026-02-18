import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface FormData {
  // Step 1: Company Info
  gstin: string;
  companyName: string;
  phone: string;
  // Step 2: Invoice Details
  invoiceNumber: string;
  invoiceDate: string;
  amount: string;
  status: string;
  category: string;
  issueDescription: string;
  // Step 3: Contact Person
  contactName: string;
  contactEmail: string;
  contactRole: string;
}

const SubmitDataForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    gstin: '',
    companyName: '',
    phone: '',
    invoiceNumber: '',
    invoiceDate: '',
    amount: '',
    status: 'unpaid',
    category: 'payment_delay',
    issueDescription: '',
    contactName: '',
    contactEmail: '',
    contactRole: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  const resetForm = () => {
    setSubmitted(false);
    setStep(1);
    setFormData({
      gstin: '',
      companyName: '',
      phone: '',
      invoiceNumber: '',
      invoiceDate: '',
      amount: '',
      status: 'unpaid',
      category: 'payment_delay',
      issueDescription: '',
      contactName: '',
      contactEmail: '',
      contactRole: '',
    });
  };

  if (submitted) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Data Submitted Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for contributing to the directory. Your information will be verified and added to the database.
          </p>
          <Button onClick={resetForm}>Submit Another Entry</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Submit Data to Directory</h2>
          <p className="text-gray-600">Add company information or report invoice issues</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 1: Company Information</h3>
              <Input
                type="text"
                name="gstin"
                label="GSTIN"
                placeholder="Enter 15-digit GSTIN"
                value={formData.gstin}
                onChange={handleChange}
                required
                maxLength={15}
                fullWidth
                helperText="15-character GST Identification Number"
              />
              <Input
                type="text"
                name="companyName"
                label="Company Name"
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                type="tel"
                name="phone"
                label="Phone Number"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                required
                fullWidth
                helperText="10-digit Indian phone number or E.164 format"
              />
              <div className="flex justify-end">
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Invoice Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 2: Invoice Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="invoiceNumber"
                  label="Invoice Number"
                  placeholder="INV-2024-001"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <Input
                  type="date"
                  name="invoiceDate"
                  label="Invoice Date"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </div>
              <Input
                type="number"
                name="amount"
                label="Amount (₹)"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
                required
                fullWidth
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="payment_delay">Payment Delay</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="delivery_issue">Delivery Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Description (Optional)
                </label>
                <textarea
                  name="issueDescription"
                  value={formData.issueDescription}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe any issues or concerns..."
                />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Person */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 3: Contact Person Details</h3>
              <Input
                type="text"
                name="contactName"
                label="Contact Person Name"
                placeholder="Enter full name"
                value={formData.contactName}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                type="email"
                name="contactEmail"
                label="Email Address"
                placeholder="contact@example.com"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                type="text"
                name="contactRole"
                label="Role/Position"
                placeholder="e.g., Accounts Manager"
                value={formData.contactRole}
                onChange={handleChange}
                required
                fullWidth
              />
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default SubmitDataForm;
