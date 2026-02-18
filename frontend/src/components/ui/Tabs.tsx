import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onTabChange, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };
  
  return (
    <div className="w-full">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                transition-colors focus:outline-none
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {children(activeTab)}
      </div>
    </div>
  );
};

export default Tabs;
