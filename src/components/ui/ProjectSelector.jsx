/**
 * ProjectSelector Component
 *
 * A header dropdown component for selecting the active project.
 * When a project is selected, all data views filter by that project.
 * Admins can select "All Projects" to see everything.
 *
 * Features:
 * - Dropdown with search functionality for many projects
 * - Visual indicator when filtering is active
 * - Persists selection to localStorage
 * - Shows project status badges
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import useProjects from '../../hooks/useProjects';
import { ChevronsUpDown, FolderKanban, Check, Search, X } from 'lucide-react';
// CSS moved to global index.css Tailwind

const ProjectSelector = () => {
  const { t } = useLocalization();
  const {
    projects,
    selectedProjectId,
    selectedProject,
    loading,
    canViewAllProjects,
    isFiltered,
    setSelectedProjectId,
    clearSelection
  } = useProjects();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter projects by search term
  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      project.name?.toLowerCase().includes(search) ||
      project.code?.toLowerCase().includes(search)
    );
  });

  // Handle project selection
  const handleSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    clearSelection();
    setIsOpen(false);
  };

  // Don't render if no projects available and user can't view all
  if (!loading && projects.length === 0 && !canViewAllProjects) {
    return null;
  }

  // Get display text
  const getDisplayText = () => {
    if (loading) return t('loading', 'Loading...');
    if (selectedProject) return selectedProject.name;
    if (selectedProjectId === 'all') return t('allProjects', 'All Projects');
    return t('selectProject', 'Select Project');
  };

  return (
    <div className="project-selector" ref={dropdownRef}>
      <label className="project-selector-label">{t('yourProjects', 'Your Projects')}</label>
      <button
        className={`project-selector-trigger ${isFiltered ? 'filtered' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        title={isFiltered ? t('projectFilterActive', 'Project filter active') : t('selectProject', 'Select a project')}
      >
        <FolderKanban size={16} className="project-icon" />
        <span className="project-selector-text">{getDisplayText()}</span>
        {/* Only admins can clear project selection - regular users must always have a project */}
        {isFiltered && canViewAllProjects && (
          <span
            role="button"
            tabIndex={0}
            className="clear-filter-btn"
            onClick={handleClear}
            onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
            title={t('clearFilter', 'Clear filter')}
          >
            <X size={14} />
          </span>
        )}
        <ChevronsUpDown size={16} className="chevron" />
      </button>

      {isOpen && (
        <div className="project-selector-dropdown">
          {/* Search input for many projects */}
          {projects.length > 5 && (
            <div className="project-search">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('searchProjects', 'Search projects...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="project-search-input"
              />
            </div>
          )}

          <div className="project-list">
            {/* All Projects option (admin only) */}
            {canViewAllProjects && (
              <button
                className={`project-option ${selectedProjectId === 'all' || !selectedProjectId ? 'selected' : ''}`}
                onClick={() => handleSelect('all')}
              >
                <div className="project-option-content">
                  <span className="project-name">{t('allProjects', 'All Projects')}</span>
                  <span className="project-desc">{t('viewAllData', 'View all data across projects')}</span>
                </div>
                {(selectedProjectId === 'all' || !selectedProjectId) && (
                  <Check size={16} className="check-icon" />
                )}
              </button>
            )}

            {/* Divider */}
            {canViewAllProjects && filteredProjects.length > 0 && (
              <div className="project-divider" />
            )}

            {/* Project list */}
            {filteredProjects.length === 0 ? (
              <div className="no-projects">
                {searchTerm
                  ? t('noProjectsFound', 'No projects found')
                  : t('noProjectsAssigned', 'No projects assigned')}
              </div>
            ) : (
              filteredProjects.map(project => (
                <button
                  key={project.id}
                  className={`project-option ${selectedProjectId === project.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(project.id)}
                >
                  <div className="project-option-content">
                    <div className="project-name-row">
                      <span className="project-name">{project.name}</span>
                      <span className={`project-status ${project.status}`}>
                        {project.status}
                      </span>
                    </div>
                    {project.code && (
                      <span className="project-code">{project.code}</span>
                    )}
                  </div>
                  {selectedProjectId === project.id && (
                    <Check size={16} className="check-icon" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
