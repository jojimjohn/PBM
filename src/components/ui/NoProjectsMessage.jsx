/**
 * NoProjectsMessage Component
 *
 * Displays a full-page message when a user has no project assignments.
 * Uses the shared EmptyState component with localization support.
 */

import React from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { NoProjectsEmptyState } from './EmptyState';

const NoProjectsMessage = () => {
  const { t } = useLocalization();

  return (
    <div className="flex-center" style={{ minHeight: '60vh' }}>
      <NoProjectsEmptyState
        title={t('noProjectsAssigned', 'No Projects Assigned')}
        description={t(
          'noProjectsDescription',
          "You don't have access to any projects. Please contact your administrator to be assigned to a project."
        )}
      />
    </div>
  );
};

export default NoProjectsMessage;
