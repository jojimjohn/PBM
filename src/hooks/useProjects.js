/**
 * useProjects Hook
 *
 * Provides access to the shared project selection state.
 * This is a thin wrapper around ProjectContext for backward compatibility.
 *
 * Usage:
 * const { selectedProjectId, setSelectedProjectId } = useProjects();
 *
 * When selectedProjectId changes, all components using this hook will
 * re-render with the new value, triggering data refetches.
 */

import { useProjectContext } from '../context/ProjectContext';

/**
 * Custom hook for accessing project selection state
 * @returns {Object} Project state and methods from context
 */
export const useProjects = () => {
  // Simply delegate to the context
  // All state is shared across components via ProjectContext
  return useProjectContext();
};

export default useProjects;
