import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

interface NewsUpdate {
  id: string;
  title: string;
  date: string;
  description: string;
  tag: 'Product' | 'Industry' | 'Compliance';
}

const newsUpdates: NewsUpdate[] = [
  {
    id: '1',
    title: 'New Invoice Analytics Dashboard Released',
    date: '2024-02-15',
    description: 'We\'ve launched a comprehensive invoice analytics dashboard with real-time insights into payment patterns, dispute tracking, and market trends. The dashboard includes interactive charts and exportable reports.',
    tag: 'Product',
  },
  {
    id: '2',
    title: 'Enhanced GSTIN Verification System',
    date: '2024-02-10',
    description: 'Our GSTIN verification now includes real-time validation with the government database, ensuring all company records are up-to-date and accurate. This helps prevent fraud and builds trust in the network.',
    tag: 'Product',
  },
  {
    id: '3',
    title: 'New Export Documentation Requirements for Spices',
    date: '2024-02-05',
    description: 'The Ministry of Commerce has announced new documentation requirements for spice exports effective March 1st. All exporters must comply with enhanced quality certificates and origin documentation.',
    tag: 'Compliance',
  },
  {
    id: '4',
    title: 'Community Forum Now Live',
    date: '2024-02-01',
    description: 'Join our new community forum to discuss industry challenges, share best practices, and connect with peers. Topics include quality control, payment issues, logistics, and regulatory updates.',
    tag: 'Product',
  },
  {
    id: '5',
    title: 'Turmeric Prices See 15% Increase',
    date: '2024-01-28',
    description: 'Market analysis shows turmeric prices have increased by 15% due to lower production in key growing regions. Buyers should factor in price volatility when planning Q2 purchases.',
    tag: 'Industry',
  },
  {
    id: '6',
    title: 'Updated GST Regulations for Food Processing',
    date: '2024-01-20',
    description: 'New GST clarifications have been issued for the food processing sector. Key changes include revised classifications for processed spices and updated input tax credit rules.',
    tag: 'Compliance',
  },
  {
    id: '7',
    title: 'Mobile App Beta Testing Begins',
    date: '2024-01-15',
    description: 'We\'re starting beta testing for our mobile app on iOS and Android. Beta testers will get early access to features like push notifications for invoice updates and quick GSTIN lookup.',
    tag: 'Product',
  },
  {
    id: '8',
    title: 'Cold Chain Logistics: New Partnership Announced',
    date: '2024-01-10',
    description: 'We\'ve partnered with leading cold chain logistics providers to offer verified transport solutions for perishable goods. Members can now find trusted logistics partners through the platform.',
    tag: 'Industry',
  },
];

const NewsPage: React.FC = () => {
  const getBadgeVariant = (tag: string) => {
    switch (tag) {
      case 'Product':
        return 'info';
      case 'Industry':
        return 'warning';
      case 'Compliance':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">News & Updates</h1>
            <p className="text-xl text-gray-600">
              Stay informed about product releases, industry news, and compliance updates
            </p>
          </div>

          <div className="space-y-6">
            {newsUpdates.map((update) => (
              <Card key={update.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-2xl font-semibold flex-1">{update.title}</h2>
                  <Badge variant={getBadgeVariant(update.tag)}>
                    {update.tag}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {new Date(update.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {update.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Want to receive updates directly? Sign in to enable email notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
