import React from 'react';
import SearchPanel from './SearchPanel';
import InviteWidget from './InviteWidget';

const SearchSubmitSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search Panel — search by GSTIN, phone, or company name */}
      <SearchPanel />

      {/* Invite widget — visible to verified members and above */}
      <InviteWidget />
    </div>
  );
};

export default SearchSubmitSection;
