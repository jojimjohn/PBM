/**
 * ViewToggle Component
 * Provides toggle between "Current Stock" and "Timeline" views
 * Used in Stock Movements page for switching display modes
 */
import React from 'react';
import { LayoutGrid, Clock } from 'lucide-react';
import { useLocalization } from '../../../context/LocalizationContext';
import '../styles/ViewToggle.css';

const ViewToggle = ({ activeView, onViewChange }) => {
  const { t } = useLocalization();

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
    <div className="view-toggle-container">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            className={`view-toggle-btn ${isActive ? 'active' : ''}`}
            onClick={() => onViewChange(view.id)}
            aria-pressed={isActive}
            aria-label={view.label}
          >
            <Icon className="view-toggle-icon" size={16} />
            <span className="view-toggle-label">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
