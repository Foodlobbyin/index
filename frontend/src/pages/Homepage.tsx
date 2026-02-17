import React from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, TrendingUp, Users, Shield, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Homepage: React.FC = () => {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              B2B Directory & Invoice Intelligence for Food & Spice Industry
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Search suppliers by GSTIN, track unpaid invoices, share vendor insights, and connect with the community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Sign In
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToFeatures}
                className="border-white text-white hover:bg-blue-700"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need to manage your B2B relationships</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">GST-Based Directory</h3>
                  <p className="text-gray-600">
                    Search and verify companies by GSTIN or phone number. Access comprehensive business profiles instantly.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Invoice Tracking</h3>
                  <p className="text-gray-600">
                    Track unpaid invoices, payment delays, and financial disputes across your vendor network.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Market Insights</h3>
                  <p className="text-gray-600">
                    View aggregated and anonymized data on market trends, payment patterns, and industry benchmarks.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Vendor Issue Tracking</h3>
                  <p className="text-gray-600">
                    Report and track issues with suppliers including quality problems, delivery delays, and disputes.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                  <MessageSquare className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Community Forum</h3>
                  <p className="text-gray-600">
                    Connect with other businesses, share experiences, and get advice on industry-specific challenges.
                  </p>
                </div>
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start">
                <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">B2B Network</h3>
                  <p className="text-gray-600">
                    Build connections with verified suppliers, buyers, and logistics partners in the food & spice sector.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to get started</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Search</h3>
              <p className="text-gray-600">
                Look up companies by GSTIN or phone number. Access their business profiles, invoice history, and reputation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Submit</h3>
              <p className="text-gray-600">
                Add your own data: company details, invoice information, and any issues you've experienced with vendors.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Learn</h3>
              <p className="text-gray-600">
                Gain insights from aggregated market data, community discussions, and industry trends to make better decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B Angle Section */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Built for Food & Spice Supply Chain
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-xl font-semibold mb-3">For Buyers</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Verify supplier credibility before placing orders
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Track payment histories and identify risks
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Access quality ratings and delivery performance
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-semibold mb-3">For Suppliers</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Build trust with verified business credentials
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Report payment delays and dispute resolutions
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Connect with potential buyers across regions
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-semibold mb-3">For Logistics Partners</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Find reliable businesses for long-term contracts
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Assess payment reliability before engagement
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Share insights on delivery challenges
                  </li>
                </ul>
              </Card>

              <Card>
                <h3 className="text-xl font-semibold mb-3">Industry Coverage</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Spices: turmeric, chili, pepper, cardamom
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Food grains and pulses
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Processed foods and ingredients
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join the community of food & spice businesses making smarter decisions
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Sign In Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
