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
    title: 'Foodlobby Pilot Launch -- Invite-Only Access Now Open',
    date: '2026-06-24',
    description:
      `We are excited to announce the pilot launch of Foodlobby -- India's first community-driven trade fraud protection platform built for food & spice commodity professionals. During the pilot phase, access is by invitation only to ensure the quality and trustworthiness of the member base. If you are in the food or spice commodity trade and wish to join, reach out to us.`,
    tag: 'Platform Update',
  },
  {
    id: '2',
    title: 'How to Submit a Fraud Incident Report',
    date: '2026-06-20',
    description:
      `Foodlobby members can now submit detailed incident reports against buyers who have defaulted on credit payments. Include the party's GSTIN, pending invoice amounts, dates of default, and any supporting evidence such as invoice copies or communications. Verified reports become visible to all community members immediately after moderation. Your report could prevent the next vendor from falling victim to the same party.`,
    tag: 'Platform Update',
  },
  {
    id: '3',
    title: 'Warning: Credit Default Pattern Detected in Spice Trade',
    date: '2026-06-15',
    description:
      `Our community has flagged a growing pattern of credit fraud in the turmeric and chili wholesale segment. Multiple vendors across Gujarat and Rajasthan have reported the same buyer pattern: small initial orders paid on time, followed by a large credit consignment after which payment stops completely. We urge members to verify all new buyers on Foodlobby before extending credit above Rs.50,000.`,
    tag: 'Fraud Alert',
  },
  {
    id: '4',
    title: 'MSME Delayed Payment Act -- Know Your Rights',
    date: '2026-06-10',
    description:
      `Under the MSME Development Act, buyers are legally required to pay MSMEs within 45 days of delivery. If payment is not received within this window, the buyer is liable to pay compound interest at three times the RBI bank rate. Foodlobby members can use this law alongside our platform's incident reporting system to build documented cases against defaulters. Know your rights and protect your business.`,
    tag: 'Compliance',
  },
  {
    id: '5',
    title: 'New Feature: Reputation Scores for Buyers',
    date: '2026-06-05',
    description:
      `Foodlobby now displays a reputation score for each buyer in our database, calculated from community-submitted incident reports, payment history data, and the severity of reported defaults. Scores are updated in real time as new reports come in. Before extending credit to any new buyer, check their reputation score on Foodlobby -- a low score is your first warning signal.`,
    tag: 'Platform Update',
  },
  {
    id: '6',
    title: 'How Fraudsters Build Trust Before Striking',
    date: '2026-05-28',
    description:
      `Analysis of incident reports submitted to Foodlobby reveals a consistent fraud pattern: buyers start with 2-3 small orders and pay promptly. After building trust, they place a large credit order. Once goods are delivered, communication slows down, payments stop, and the buyer eventually becomes unreachable. This pattern repeats across different geographies with the same parties. Sharing intelligence through Foodlobby breaks this cycle.`,
    tag: 'Fraud Alert',
  },
  {
    id: '7',
    title: 'GST Number Misuse in Trade Fraud -- What to Watch For',
    date: '2026-05-20',
    description:
      `Several Foodlobby members have reported buyers presenting GSTIN numbers that belong to shell companies or businesses that have been cancelled by the GST authorities. Always verify a buyer's GSTIN on the GST portal before the first transaction. Foodlobby's search feature lets you cross-reference party names against reported incidents even when GSTIN details are unavailable or suspicious.`,
    tag: 'Compliance',
  },
  {
    id: '8',
    title: 'Community Forum Coming Soon -- Share Your Trade Experiences',
    date: '2026-05-15',
    description:
      `We are building a community forum where Foodlobby members can share trade experiences, discuss regional risk patterns, and seek advice from peers who have dealt with difficult buyers. The forum will be moderated to ensure quality and relevance. Members will be able to post anonymously or with their verified business identity. Watch this space for the launch announcement.`,
    tag: 'Community',
  },
];

const ALL_TAGS: Tag[] = ['Platform Update', 'Fraud Alert', 'Compliance', 'Community'];

const tagColors: Record<Tag, 'info' | 'danger' | 'warning' | 'success'> = {
  'Platform Update': 'info',
  'Fraud Alert': 'danger',
  'Compliance': 'warning',
  'Community': 'success',
};

const NewsPage: React.FC = () => {
  const [activeTag, setActiveTag] = useState<Tag | null>(null);

  const filtered = activeTag
    ? newsUpdates.filter((n) => n.tag === activeTag)
    : newsUpdates;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Alerts & Updates</h1>
      <p className="text-gray-500 mb-8">
        Fraud alerts, compliance guidance, and platform news for India's food & spice commodity trade community.
      </p>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveTag(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeTag === null
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-700'
          }`}
        >
          All
        </button>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeTag === tag
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-6">
        {filtered.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-lg font-semibold text-gray-900 leading-snug">{item.title}</h2>
              <Badge variant={tagColors[item.tag]} className="shrink-0 mt-0.5">
                {item.tag}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {new Date(item.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
