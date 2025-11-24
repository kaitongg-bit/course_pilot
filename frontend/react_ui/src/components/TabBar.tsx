import { MessageCircle, Search, User } from 'lucide-react';

type Tab = 'chat' | 'search' | 'profile';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'chat' as Tab, label: 'Chat', icon: MessageCircle },
    { id: 'search' as Tab, label: 'Search', icon: Search },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
  ];

  return (
    <div className="bg-white border-b border-[#E5E7EB] px-4 py-2 flex gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              isActive
                ? 'bg-[#CC0033] text-white'
                : 'text-[#6B7280] hover:bg-[#F5F5F5]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}