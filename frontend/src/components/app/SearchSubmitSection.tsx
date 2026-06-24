import React from 'react';
import SearchPanel from './SearchPanel';

const SearchSubmitSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search Panel — search by GSTIN, phone, or company name */}
      <SearchPanel />
    </div>
  );
};

export default SearchSubmitSection;
