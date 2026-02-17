import React from 'react';
import DashboardKPIs from './DashboardKPIs';
import SearchPanel from './SearchPanel';
import SubmitDataForm from './SubmitDataForm';

const SearchSubmitSection: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Dashboard KPIs and Charts */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <DashboardKPIs />
      </section>

      {/* Search Panel */}
      <section>
        <SearchPanel />
      </section>

      {/* Submit Data Form */}
      <section>
        <SubmitDataForm />
      </section>
    </div>
  );
};

export default SearchSubmitSection;
