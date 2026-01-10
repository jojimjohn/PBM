/**
 * ProjectContext
 *
 * Provides shared project selection state across all components.
 * When a project is selected in the header, all data views automatically
 * filter to show only data for that project.
 *
 * Architecture: Context-based state management ensures that project selection
 * changes propagate to all consuming components, triggering data refetches.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import projectsService from '../services/projectsService';
import { ROLE_HIERARCHY } from '../config/roles';

const ProjectContext = createContext();

// Admin hierarchy level (COMPANY_ADMIN and above can view all projects)
const ADMIN_HIERARCHY_LEVEL = 5;

// localStorage key for persisting selection
const STORAGE_KEY = 'pbm_selected_project';

/**
 * Hook to access project context
 * @throws {Error} If used outside of ProjectProvider
 */
export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

/**
 * Project Provider component
 * Wraps the app to provide shared project state
 */
export const ProjectProvider = ({ children }) => {
  const { user, selectedCompany, isAuthenticated } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if user can view all projects (admin level)
  const canViewAllProjects = useMemo(() => {
    if (!user?.role) return false;
    const hierarchyLevel = ROLE_HIERARCHY[user.role] || 0;
    return hierarchyLevel >= ADMIN_HIERARCHY_LEVEL;
  }, [user?.role]);

  // Load saved project selection from localStorage
  useEffect(() => {
    if (!selectedCompany?.id) return;

    const savedProject = localStorage.getItem(STORAGE_KEY);
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        // Ensure saved selection matches current company
        if (parsed.companyId === selectedCompany.id) {
          setSelectedProjectIdState(parsed.projectId);
        } else {
          // Different company, clear stored selection
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [selectedCompany?.id]);

  // Fetch user's projects
  const fetchProjects = useCallback(async () => {
    if (!user || !selectedCompany || !isAuthenticated) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For admins, get all projects; for others, get assigned projects
      const result = canViewAllProjects
        ? await projectsService.getAll({ status: 'active' })
        : await projectsService.getMyProjects(true);

      if (result.success) {
        setProjects(result.data || []);

        // If previously selected project is not in the list, clear selection
        if (selectedProjectId && selectedProjectId !== 'all') {
          const projectExists = result.data?.some(p => p.id === selectedProjectId);
          if (!projectExists) {
            setSelectedProjectIdState(null);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } else {
        setError(result.error || 'Failed to load projects');
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCompany, isAuthenticated, canViewAllProjects, selectedProjectId]);

  // Fetch projects when user, company, or auth state changes
  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      fetchProjects();
    }
  }, [isAuthenticated, selectedCompany?.id, fetchProjects]);

  // Clear state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      setSelectedProjectIdState(null);
      setError(null);
    }
  }, [isAuthenticated]);

  // Set selected project and persist to localStorage
  const setSelectedProjectId = useCallback((projectId) => {
    // Handle 'all' selection for admins
    const newValue = projectId === 'all' ? 'all' : (projectId ? parseInt(projectId, 10) : null);

    setSelectedProjectIdState(newValue);

    if (newValue && selectedCompany?.id) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        companyId: selectedCompany.id,
        projectId: newValue
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedCompany?.id]);

  // Get the currently selected project object
  const selectedProject = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === 'all') return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Check if filtering is active
  const isFiltered = useMemo(() => {
    if (!selectedProjectId) return false;
    if (selectedProjectId === 'all') return false;
    return true;
  }, [selectedProjectId]);

  // Get query parameter for API calls
  const getProjectQueryParam = useCallback(() => {
    if (!selectedProjectId) return {};
    if (selectedProjectId === 'all') return { project_id: 'all' };
    return { project_id: selectedProjectId };
  }, [selectedProjectId]);

  // Build URL with project filter
  const buildFilteredUrl = useCallback((baseUrl) => {
    if (!selectedProjectId || selectedProjectId === 'all') return baseUrl;

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}project_id=${selectedProjectId}`;
  }, [selectedProjectId]);

  // Clear project selection
  const clearSelection = useCallback(() => {
    setSelectedProjectIdState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Refresh projects list
  const refreshProjects = useCallback(() => {
    return fetchProjects();
  }, [fetchProjects]);

  const value = {
    // State
    projects,
    selectedProjectId,
    selectedProject,
    loading,
    error,
    canViewAllProjects,
    isFiltered,

    // Actions
    setSelectedProjectId,
    clearSelection,
    refreshProjects,

    // Helpers
    getProjectQueryParam,
    buildFilteredUrl
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
