/**
 * useProjects Hook
 *
 * Manages project selection state for the application.
 * - Loads user's assigned projects from API
 * - Persists selected project to localStorage
 * - Provides project filtering capabilities for data queries
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import projectsService from '../services/projectsService';
import { ROLE_HIERARCHY } from '../config/roles';

// Admin hierarchy level (COMPANY_ADMIN and above can view all projects)
const ADMIN_HIERARCHY_LEVEL = 5;

// localStorage key for persisting selection
const STORAGE_KEY = 'pbm_selected_project';

/**
 * Custom hook for managing project selection and filtering
 * @returns {Object} Project state and methods
 */
export const useProjects = () => {
  const { user, selectedCompany } = useAuth();

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
    const savedProject = localStorage.getItem(STORAGE_KEY);
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        // Ensure saved selection matches current company
        if (parsed.companyId === selectedCompany?.id) {
          setSelectedProjectIdState(parsed.projectId);
        }
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [selectedCompany?.id]);

  // Fetch user's projects
  const fetchProjects = useCallback(async () => {
    if (!user || !selectedCompany) {
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
  }, [user, selectedCompany, canViewAllProjects, selectedProjectId]);

  // Fetch projects when user or company changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  return {
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
};

export default useProjects;
