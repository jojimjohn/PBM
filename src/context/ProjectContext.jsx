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

// Alias for convenience (shorter name)
export const useProjects = useProjectContext;

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
  const [initialized, setInitialized] = useState(false); // True when localStorage checked & projects loaded

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
      setInitialized(true); // Mark as ready for API calls
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
      setInitialized(false);
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

  // Check if user has no projects available (non-admin with no assignments)
  const noProjectsAvailable = useMemo(() => {
    return !loading && projects.length === 0 && !canViewAllProjects;
  }, [loading, projects.length, canViewAllProjects]);

  // Check if project selection is required (non-admins must select a project)
  const isProjectRequired = useMemo(() => {
    return !canViewAllProjects;
  }, [canViewAllProjects]);

  // Auto-select first project for non-admins if none selected
  useEffect(() => {
    if (
      isProjectRequired &&
      !selectedProjectId &&
      !loading &&
      projects.length > 0
    ) {
      // Auto-select the first available project
      setSelectedProjectId(projects[0].id);
    }
  }, [isProjectRequired, selectedProjectId, loading, projects, setSelectedProjectId]);

  // Get query parameter for API calls (validates access for non-admins)
  const getProjectQueryParam = useCallback(() => {
    if (!selectedProjectId) return {};
    if (selectedProjectId === 'all') return { project_id: 'all' };

    // For admins, return the project_id directly
    if (canViewAllProjects) {
      return { project_id: selectedProjectId };
    }

    // For non-admins, validate they have access before returning
    const hasAccess = projects.some(p => p.id === selectedProjectId);
    if (hasAccess) {
      return { project_id: selectedProjectId };
    }

    // No access - return empty to let backend filter by user's projects
    return {};
  }, [selectedProjectId, canViewAllProjects, projects]);

  // Build URL with project filter (validates access for non-admins)
  const buildFilteredUrl = useCallback((baseUrl) => {
    if (!selectedProjectId || selectedProjectId === 'all') return baseUrl;

    // For admins, add the filter directly
    if (canViewAllProjects) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}project_id=${selectedProjectId}`;
    }

    // For non-admins, validate access before adding filter
    const hasAccess = projects.some(p => p.id === selectedProjectId);
    if (hasAccess) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}project_id=${selectedProjectId}`;
    }

    // No access - return base URL without filter
    return baseUrl;
  }, [selectedProjectId, canViewAllProjects, projects]);

  // Clear project selection
  const clearSelection = useCallback(() => {
    setSelectedProjectIdState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Refresh projects list
  const refreshProjects = useCallback(() => {
    return fetchProjects();
  }, [fetchProjects]);

  // Check if user has access to a specific project ID
  const hasProjectAccess = useCallback((projectId) => {
    if (!projectId || projectId === 'all') return true;
    if (canViewAllProjects) return true;
    return projects.some(p => p.id === projectId);
  }, [canViewAllProjects, projects]);

  // Get validated project ID (returns null if user doesn't have access)
  const getValidatedProjectId = useCallback(() => {
    if (!selectedProjectId) return null;
    if (selectedProjectId === 'all') return 'all';
    if (canViewAllProjects) return selectedProjectId;

    // For non-admins, validate access
    const hasAccess = projects.some(p => p.id === selectedProjectId);
    return hasAccess ? selectedProjectId : null;
  }, [selectedProjectId, canViewAllProjects, projects]);

  const value = {
    // State
    projects,
    selectedProjectId,
    selectedProject,
    loading,
    initialized, // True when localStorage checked & projects loaded - safe to make API calls
    error,
    canViewAllProjects,
    isFiltered,
    noProjectsAvailable,
    isProjectRequired,

    // Actions
    setSelectedProjectId,
    clearSelection,
    refreshProjects,

    // Helpers
    getProjectQueryParam,
    buildFilteredUrl,
    hasProjectAccess,
    getValidatedProjectId
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
