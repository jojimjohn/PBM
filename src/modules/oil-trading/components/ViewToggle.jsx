/**
 * ViewToggle Component
 * Provides toggle between "Current Stock" and "Timeline" views
 * Used in Stock Movements page for switching display modes
 *
 * Migrated to Tailwind CSS - no external CSS file needed
 */
import React from 'react';
import { LayoutGrid, Clock } from 'lucide-react';
import { useLocalization } from '../../../context/LocalizationContext';

const ViewToggle = ({ activeView, onViewChange }) => {
  const { t, isRTL } = useLocalization();

  const views = [
    {
      id: 'current',
      label: t('currentStock') || 'Current Stock',
      icon: LayoutGrid
    },
    {
      id: 'timeline',
      label: t('timeline') || 'Timeline',
      icon: Clock
    }
  ];

  return (
    <div className={`inline-flex bg-gray-100 rounded-lg p-1 gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5
              border-none rounded-md text-sm font-medium cursor-pointer
              transition-all duration-200 whitespace-nowrap
              ${isRTL ? 'flex-row-reverse' : ''}
              ${isActive
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }
            `}
            onClick={() => onViewChange(view.id)}
            aria-pressed={isActive}
            aria-label={view.label}
          >
            <Icon className="shrink-0" size={16} />
            <span className="hidden sm:inline leading-none">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
