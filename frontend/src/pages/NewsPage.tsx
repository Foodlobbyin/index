import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

type Tag = 'Platform Update' | 'Fraud Alert' | 'Compliance' | 'Community';

interface NewsUpdate {
  id: string;
  title: string;
  date: string;
  description: string;
  tag: Tag;
}

const newsUpdates: NewsUpdate[] = [
  {
    id: '1',
    title: 'Foodlobby Pilot Launch — Invite-Only Access Now Open',
    date: '2026-06-24',
    description:
      'We are excited to announce the pilot launch of Foodlobby — India's first community-driven trade fraud protection platform built for food & spice commodity professionals. During the pilot phase, access is by invitation only to ensure the quality and trustworthiness of the member base. If you are in the food or spice commodity trade and wish to join, reach out to us.',
    tag: 'Platform Update',
  },
  {
    id: '2',
    title: 'How to Submit a Fraud Incident Report',
    date: '2026-06-20',
    description:
      'Foodlobby members can now submit detailed incident reports against buyers who have defaulted on credit payments. Include the party\'s GSTIN, pending invoice amounts, dates of default, and any supporting evidence such as invoice copies or communications. Verified reports become visible to all community members immediately after moderation. Your report could prevent the next vendor from falling victim to the same party.',
    tag: 'Platform Update',
  },
  {
    id: '3',
    title: 'Warning: Credit Default Pattern Detected in Spice Trade',
    date: '2026-06-15',
    description:
      'Our community has flagged a growing pattern of credit fraud in the turmeric and chili wholesale segment. Multiple vendors across Gujarat and Rajasthan have reported the same buyer pattern: small initial orders paid on time, followed by a large credit consignment after which payment stops completely. We urge members to verify all new buyers on Foodlobby before extending credit above ₹50,000.',
    tag: 'Fraud Alert',
  },
  {
    id: '4',
    title: 'MSME Delayed Payment Act — Know Your Rights',
    date: '2026-06-10',
    description:
      'Under the MSMED Act 2006, if your buyer is a larger enterprise and has not paid within 45 days of accepting goods, you are entitled to compound interest at three times the RBI bank rate. MSMEs can file complaints at the MSME Samadhaan portal (msmesamadhaan.gov.in). Foodlobby incident reports can serve as supporting documentation when filing such complaints. Document every transaction carefully.',
    tag: 'Compliance',
  },
  {
    id: '5',
    title: 'Reputation Scoring System Now Active',
    date: '2026-06-05',
    description:
      'Foodlobby now assigns a community reputation score to every company profile in the database. Scores are calculated based on verified incident reports, the amount outstanding, the number of reporters, and the time elapsed. A score below 50 flags a company as high-risk. This scoring helps members make faster, evidence-based decisions before entering into new trade relationships.',
    tag: 'Platform Update',
  },
  {
    id: '6',
    title: 'How Fraudsters Build Trust Before Defaulting',
    date: '2026-05-28',
    description:
      'A consistent pattern has emerged across multiple member reports: fraudulent buyers always begin with small, prompt-paying orders. After 2–4 successful transactions, they request a large consignment on 30–60 day credit. Once goods are delivered, communication drops. Legal recovery in India's trade sector is slow and costly. The only effective defence is community intelligence — checking Foodlobby before every new credit transaction.',
    tag: 'Fraud Alert',
  },
  {
    id: '7',
    title: 'GST Number Misuse in Trade Fraud — What to Watch For',
    date: '2026-05-20',
    description:
      'Fraudsters often present valid GSTIN credentials belonging to dormant or shell companies to build false credibility. Always cross-verify a GSTIN on the GST portal (gst.gov.in) to confirm the filing history is active and recent. A company with no recent GST returns but a clean-looking GSTIN is a major red flag. Foodlobby cross-references submitted GSTINs to help detect such mismatches.',
    tag: 'Fraud Alert',
  },
  {
    id: '8',
    title: 'Community Forum Coming Soon — Share Your Trade Experiences',
    date: '2026-05-10',
    description:
      'We are building a community forum section where Foodlobby members will be able to discuss trade experiences, post fraud warnings, share industry knowledge, and seek advice from peers. The forum will be moderated to maintain quality and relevance. Members who contribute high-quality posts and verified incident reports will earn elevated trust levels on the platform.',
    tag: 'Community',
  },
];

const ALL_TAGS: Tag[] = ['Platform Update', 'Fraud Alert', 'Compliance', 'Community'];

const NewsPage: React.FC = () => {
  const [activeTag, setActiveTag] = useState<Tag | 'All'>('All');

  const getBadgeVariant = (tag: Tag) => {
    switch (tag) {
      case 'Fraud Alert':   return 'danger';
      case 'Compliance':    return 'warning';
      case 'Platform Update': return 'info';
      case 'Community':     return 'success';
      default:              return 'default';
    }
  };

  const filtered = activeTag === 'All'
    ? newsUpdates
    : newsUpdates.filter(u => u.tag === activeTag);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Alerts & Updates</h1>
            <p className="text-xl text-gray-600">
              Fraud alerts, platform news, and compliance guidance for India's food &amp; spice trade community
            </p>
          </div>

          {/* Tag filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveTag('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTag === 'All'
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-600 hover:text-green-700'
              }`}
            >
              All
            </button>
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-green-600 hover:text-green-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* News items */}
          <div className="space-y-6">
            {filtered.map((update) => (
              <Card key={update.id} hover>
                <div className="flex items-start justify-between mb-3 gap-4">
                  <h2 className="text-xl font-semibold flex-1 text-gray-900">{update.title}</h2>
                  <Badge variant={getBadgeVariant(update.tag)} className="flex-shrink-0">
                    {update.tag}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {new Date(update.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {update.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-10 bg-green-50 border border-green-100 rounded-xl p-5 text-center">
            <p className="text-gray-700 font-medium mb-1">Are you a food or spice trade professional?</p>
            <p className="text-gray-600 text-sm">
              Sign in to search incident reports, submit fraud cases, and contribute to protecting India's trade community.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewsPage;
