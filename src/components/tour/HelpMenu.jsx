import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  HelpCircle, GraduationCap, Check, Lock, Play,
  RotateCcw, LayoutDashboard, ShoppingCart, TrendingUp, Truck,
  FileText, Settings, Clock, ChevronDown, ChevronUp,
  Briefcase, Users, Package, BookOpen, ExternalLink
} from 'lucide-react';
import { useTour } from '../../context/TourContext';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { getWorkflowGuidesByCategory } from '../../config/tours';
import './HelpMenu.css';

/**
 * HelpMenu Component
 *
 * Header dropdown for tour management:
 * - Shows workflow guides grouped by category (Purchase, Sales, Admin)
 * - Role-based filtering - only shows guides user has access to
 * - Shows legacy feature tours in a separate section
 * - Progressive unlock system (complete basics to unlock others)
 * - Click to start/restart any available tour
 */
const HelpMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState('workflows'); // 'workflows' | 'feature-tours'
  const menuRef = useRef(null);
  const { t, currentLanguage } = useLocalization();
  const { user } = useAuth();

  const {
    getToursList,
    startTour,
    getTourProgress,
    isRunning,
    isTourCompleted
  } = useTour();

  // Get legacy feature tours
  const featureTours = getToursList();

  // Get workflow guides filtered by user role
  const workflowGuidesByCategory = useMemo(() => {
    const userRole = user?.role || 'PURCHASE_STAFF';
    return getWorkflowGuidesByCategory(userRole);
  }, [user?.role]);

  // Check if user has any workflow guides
  const hasWorkflowGuides = useMemo(() => {
    return (
      workflowGuidesByCategory.purchase.length > 0 ||
      workflowGuidesByCategory.sales.length > 0 ||
      workflowGuidesByCategory.admin.length > 0
    );
  }, [workflowGuidesByCategory]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon component for tour
  const getTourIcon = (iconName) => {
    const iconProps = { size: 18 };
    switch (iconName) {
      case 'GraduationCap': return <GraduationCap {...iconProps} />;
      case 'LayoutDashboard': return <LayoutDashboard {...iconProps} />;
      case 'ShoppingCart': return <ShoppingCart {...iconProps} />;
      case 'TrendingUp': return <TrendingUp {...iconProps} />;
      case 'Truck': return <Truck {...iconProps} />;
      case 'FileText': return <FileText {...iconProps} />;
      case 'Settings': return <Settings {...iconProps} />;
      default: return <GraduationCap {...iconProps} />;
    }
  };

  // Get icon for workflow category
  const getCategoryIcon = (category) => {
    const iconProps = { size: 16 };
    switch (category) {
      case 'purchase': return <Package {...iconProps} />;
      case 'sales': return <TrendingUp {...iconProps} />;
      case 'admin': return <Users {...iconProps} />;
      default: return <Briefcase {...iconProps} />;
    }
  };

  // Handle tour click (both legacy and workflow)
  const handleTourClick = (tourId, available = true) => {
    if (!available) {
      return;
    }

    setIsOpen(false);
    startTour(tourId);
  };

  // Get prerequisite tour name
  const getPrerequisiteName = (prerequisiteId) => {
    const prereqTour = featureTours.find(t => t.id === prerequisiteId);
    return prereqTour ? prereqTour.name : prerequisiteId;
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Render a workflow guide item
  const renderWorkflowGuide = (guide) => {
    const isArabic = currentLanguage === 'ar';
    const isCompleted = isTourCompleted(guide.id);
    const name = isArabic && guide.nameAr ? guide.nameAr : guide.name;
    const description = isArabic && guide.descriptionAr ? guide.descriptionAr : guide.description;

    return (
      <button
        key={guide.id}
        className={`tour-item workflow-guide ${isCompleted ? 'completed' : ''}`}
        onClick={() => handleTourClick(guide.id)}
      >
        <div className="tour-item-icon workflow">
          {isCompleted ? (
            <Check size={16} />
          ) : (
            getCategoryIcon(guide.category)
          )}
        </div>

        <div className="tour-item-content">
          <div className="tour-item-name">{name}</div>
          <div className="tour-item-description">
            {isCompleted ? (
              <span className="completed-text">{t('completed', 'Completed')}</span>
            ) : (
              <>
                <span className="guide-description">{description}</span>
                <span className="guide-time">
                  <Clock size={12} />
                  {guide.estimatedTime}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="tour-item-action">
          {isCompleted ? (
            <RotateCcw size={14} title={t('retakeGuide', 'Retake Guide')} />
          ) : (
            <Play size={14} />
          )}
        </div>
      </button>
    );
  };

  // Render category section with guides
  const renderCategorySection = (category, guides, label, labelAr) => {
    if (guides.length === 0) return null;

    const isArabic = currentLanguage === 'ar';
    const categoryLabel = isArabic && labelAr ? labelAr : label;

    return (
      <div className="workflow-category" key={category}>
        <div className="category-header">
          {getCategoryIcon(category)}
          <span>{categoryLabel}</span>
        </div>
        <div className="category-guides">
          {guides.map(guide => renderWorkflowGuide(guide))}
        </div>
      </div>
    );
  };

  return (
    <div className="help-menu" ref={menuRef} data-tour="help-menu">
      {/* Help Button */}
      <button
        className={`help-menu-trigger ${isOpen ? 'active' : ''} ${isRunning ? 'tour-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('helpAndTraining', 'Help & Training')}
        title={t('helpAndTraining', 'Help & Training')}
      >
        <HelpCircle size={20} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="help-menu-dropdown">
          {/* Header */}
          <div className="help-menu-header">
            <GraduationCap size={20} />
            <span>{t('helpAndTraining', 'Help & Training')}</span>
          </div>

          {/* Help Documentation Link */}
          <div className="help-menu-section help-docs-section">
            <a
              href="/help/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="help-docs-link"
              onClick={() => setIsOpen(false)}
            >
              <div className="help-docs-content">
                <BookOpen size={18} />
                <div className="help-docs-text">
                  <span className="help-docs-title">{t('helpDocumentation', 'Help Documentation')}</span>
                  <span className="help-docs-description">{t('helpDocsDescription', 'Complete guides, tutorials & reference')}</span>
                </div>
              </div>
              <ExternalLink size={14} className="external-icon" />
            </a>
          </div>

          {/* Workflow Guides Section */}
          {hasWorkflowGuides && (
            <div className="help-menu-section">
              <button
                className="section-toggle"
                onClick={() => toggleSection('workflows')}
              >
                <div className="section-toggle-content">
                  <Briefcase size={18} />
                  <span>{t('workflowGuides', 'Workflow Guides')}</span>
                </div>
                {expandedSection === 'workflows' ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {expandedSection === 'workflows' && (
                <div className="section-content">
                  <p className="section-description">
                    {t('workflowGuidesDescription', 'Step-by-step guides to complete business processes')}
                  </p>

                  {renderCategorySection(
                    'purchase',
                    workflowGuidesByCategory.purchase,
                    'Purchase & Collections',
                    'المشتريات والتحصيلات'
                  )}

                  {renderCategorySection(
                    'sales',
                    workflowGuidesByCategory.sales,
                    'Sales',
                    'المبيعات'
                  )}

                  {renderCategorySection(
                    'admin',
                    workflowGuidesByCategory.admin,
                    'Administration',
                    'الإدارة'
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feature Tours Section */}
          <div className="help-menu-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('feature-tours')}
            >
              <div className="section-toggle-content">
                <LayoutDashboard size={18} />
                <span>{t('featureTours', 'Feature Tours')}</span>
              </div>
              {expandedSection === 'feature-tours' ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSection === 'feature-tours' && (
              <div className="section-content">
                <p className="section-description">
                  {t('featureToursDescription', 'Quick tours of individual features and modules')}
                </p>

                <div className="help-menu-tours">
                  {featureTours.map((tour) => {
                    const progress = getTourProgress(tour.id, tour.stepCount);
                    const isLocked = !tour.available;
                    const isCompleted = tour.completed;

                    return (
                      <button
                        key={tour.id}
                        className={`tour-item ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
                        onClick={() => handleTourClick(tour.id, tour.available)}
                        disabled={isLocked}
                      >
                        <div className="tour-item-icon">
                          {isLocked ? (
                            <Lock size={18} />
                          ) : isCompleted ? (
                            <Check size={18} />
                          ) : (
                            getTourIcon(tour.icon)
                          )}
                        </div>

                        <div className="tour-item-content">
                          <div className="tour-item-name">{tour.name}</div>
                          <div className="tour-item-description">
                            {isLocked ? (
                              <span className="prerequisite-text">
                                {t('requires', 'Requires')}: {getPrerequisiteName(tour.prerequisite)}
                              </span>
                            ) : isCompleted ? (
                              <span className="completed-text">{t('completed', 'Completed')}</span>
                            ) : progress > 0 ? (
                              <span className="progress-text">{progress}% {t('complete', 'complete')}</span>
                            ) : (
                              <span>{tour.description}</span>
                            )}
                          </div>
                        </div>

                        {!isLocked && (
                          <div className="tour-item-action">
                            {isCompleted ? (
                              <RotateCcw size={14} title={t('retakeTour', 'Retake Tour')} />
                            ) : (
                              <Play size={14} />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpMenu;
