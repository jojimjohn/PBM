import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useLocalization } from './LocalizationContext';
import { useLocation } from 'react-router-dom';

/**
 * TourContext - Manages product tour state and progress
 *
 * Features:
 * - Progressive tour system (basics must be completed to unlock others)
 * - Role-based tour filtering
 * - Persistent progress storage (localStorage)
 * - Auto-start for first-time users
 * - RTL support for Arabic
 * - Context-aware workflow guides (NEW)
 *   - Detects current page, modal, and form state
 *   - Auto-advances when user reaches expected context
 */

const TourContext = createContext(null);

// Tour levels with prerequisites
export const TOUR_IDS = {
  BASICS: 'basics',
  DASHBOARD: 'dashboard',
  PURCHASE: 'purchase',
  SALES: 'sales',
  COLLECTIONS: 'collections',
  CONTRACTS: 'contracts',
  SETTINGS: 'settings'
};

// Default tour state
const getDefaultTourState = () => ({
  completedTours: [],
  tourProgress: {},
  tourEnabled: true,
  autoStartEnabled: true,
  hasSeenWelcome: false,
  lastActiveTour: null
});

export const TourProvider = ({ children }) => {
  const { user, selectedCompany } = useAuth();
  const { currentLanguage } = useLocalization();
  const location = useLocation();

  const [tourState, setTourState] = useState(getDefaultTourState());
  const [currentTour, setCurrentTour] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [driverInstance, setDriverInstance] = useState(null);

  // ========================================
  // Context Detection System (NEW)
  // ========================================
  const [tourContext, setTourContext] = useState({
    currentPage: null,       // e.g., '/purchase', '/sales'
    currentModal: null,      // e.g., 'PurchaseOrderForm', 'SalesOrderForm'
    modalProps: {},          // Props passed to the current modal
    formState: {},           // Form field states (hasSupplier, itemCount, etc.)
    lastAction: null         // Last user action (e.g., 'click-new-po')
  });

  // Auto-update currentPage from router location
  useEffect(() => {
    setTourContext(prev => ({
      ...prev,
      currentPage: location.pathname
    }));
  }, [location.pathname]);

  // Broadcast function for components to update tour context
  const updateTourContext = useCallback((updates) => {
    setTourContext(prev => ({ ...prev, ...updates }));
  }, []);

  // Check if a step's context requirements match current tour context
  const isStepContextValid = useCallback((step) => {
    // If step has no context requirements, it's always valid
    if (!step?.context) return true;

    const { requirePage, requireModal, requireFormState } = step.context;

    // Check page requirement
    if (requirePage) {
      const currentPath = tourContext.currentPage || '';
      // Allow partial match (e.g., '/purchase' matches '/purchase?tab=collections')
      if (!currentPath.startsWith(requirePage.split('?')[0])) {
        return false;
      }
    }

    // Check modal requirement
    if (requireModal && tourContext.currentModal !== requireModal) {
      return false;
    }

    // Check form state requirements
    if (requireFormState) {
      for (const [key, requiredValue] of Object.entries(requireFormState)) {
        const actualValue = tourContext.formState[key];
        // Handle boolean comparisons
        if (typeof requiredValue === 'boolean') {
          if (Boolean(actualValue) !== requiredValue) return false;
        } else if (actualValue !== requiredValue) {
          return false;
        }
      }
    }

    return true;
  }, [tourContext]);

  // Storage key based on user and company
  const getStorageKey = useCallback(() => {
    if (!user?.id || !selectedCompany?.id) return null;
    return `pbm_tour_${user.id}_${selectedCompany.id}`;
  }, [user?.id, selectedCompany?.id]);

  // Load tour state from localStorage
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTourState(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading tour state:', error);
    }
  }, [getStorageKey]);

  // Save tour state to localStorage
  const saveTourState = useCallback((newState) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const stateToSave = {
        completedTours: newState.completedTours,
        tourProgress: newState.tourProgress,
        tourEnabled: newState.tourEnabled,
        autoStartEnabled: newState.autoStartEnabled,
        hasSeenWelcome: newState.hasSeenWelcome,
        lastActiveTour: newState.lastActiveTour
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving tour state:', error);
    }
  }, [getStorageKey]);

  // Check if a tour is available (prerequisites met)
  const isTourAvailable = useCallback((tourId) => {
    const { completedTours } = tourState;

    // Basics tour is always available
    if (tourId === TOUR_IDS.BASICS) return true;

    // All other tours require basics to be completed
    if (!completedTours.includes(TOUR_IDS.BASICS)) return false;

    // Collections requires Purchase tour
    if (tourId === TOUR_IDS.COLLECTIONS) {
      return completedTours.includes(TOUR_IDS.PURCHASE);
    }

    return true;
  }, [tourState.completedTours]);

  // Check if a tour is completed
  const isTourCompleted = useCallback((tourId) => {
    return tourState.completedTours.includes(tourId);
  }, [tourState.completedTours]);

  // Get tour progress percentage
  const getTourProgress = useCallback((tourId, totalSteps) => {
    const progress = tourState.tourProgress[tourId] || 0;
    if (tourState.completedTours.includes(tourId)) return 100;
    if (totalSteps === 0) return 0;
    return Math.round((progress / totalSteps) * 100);
  }, [tourState]);

  // Start a tour
  const startTour = useCallback((tourId) => {

    if (!tourState.tourEnabled) {
      return false;
    }

    if (!isTourAvailable(tourId)) {
      return false;
    }

    setCurrentTour(tourId);
    // Always start from step 0 (don't resume from previous progress)
    setStepIndex(0);
    setIsRunning(true);

    // Update last active tour
    const newState = { ...tourState, lastActiveTour: tourId };
    setTourState(newState);
    saveTourState(newState);

    return true;
  }, [tourState, isTourAvailable, saveTourState]);

  // Stop current tour (state only - driver cleanup handled by ProductTour)
  const stopTour = useCallback(() => {
    setIsRunning(false);
    setCurrentTour(null);
    setStepIndex(0);
  }, []);

  // Skip current tour
  const skipTour = useCallback(() => {
    stopTour();
  }, [stopTour]);

  // Complete a tour
  const completeTour = useCallback((tourId) => {
    const newState = { ...tourState };

    if (!newState.completedTours.includes(tourId)) {
      newState.completedTours = [...newState.completedTours, tourId];
    }

    // Mark as 100% progress
    newState.tourProgress[tourId] = 999; // High number to indicate complete

    setTourState(newState);
    saveTourState(newState);
    stopTour();
  }, [tourState, saveTourState, stopTour]);

  // Update tour progress (current step)
  const updateProgress = useCallback((tourId, step) => {
    const newState = { ...tourState };
    newState.tourProgress[tourId] = step;
    setTourState(newState);
    setStepIndex(step);

    // Debounce saving to avoid too many writes
    // Only save every 3 steps or on completion
    if (step % 3 === 0) {
      saveTourState(newState);
    }
  }, [tourState, saveTourState]);

  // Reset all tours
  const resetAllTours = useCallback(() => {
    const newState = getDefaultTourState();
    newState.hasSeenWelcome = true; // Keep this flag
    setTourState(newState);
    saveTourState(newState);
    stopTour();
  }, [saveTourState, stopTour]);

  // Toggle tour enabled/disabled
  const toggleTourEnabled = useCallback(() => {
    const newState = { ...tourState, tourEnabled: !tourState.tourEnabled };
    setTourState(newState);
    saveTourState(newState);

    if (!newState.tourEnabled && isRunning) {
      stopTour();
    }
  }, [tourState, isRunning, saveTourState, stopTour]);

  // Toggle auto-start
  const toggleAutoStart = useCallback(() => {
    const newState = { ...tourState, autoStartEnabled: !tourState.autoStartEnabled };
    setTourState(newState);
    saveTourState(newState);
  }, [tourState, saveTourState]);

  // Mark welcome as seen
  const markWelcomeSeen = useCallback(() => {
    const newState = { ...tourState, hasSeenWelcome: true };
    setTourState(newState);
    saveTourState(newState);
  }, [tourState, saveTourState]);

  // Check if should auto-start basics tour
  const shouldAutoStartBasics = useCallback(() => {
    return (
      tourState.tourEnabled &&
      tourState.autoStartEnabled &&
      !tourState.hasSeenWelcome &&
      !tourState.completedTours.includes(TOUR_IDS.BASICS) &&
      selectedCompany?.businessType === 'oil' // Only for oil trading
    );
  }, [tourState, selectedCompany]);

  // Get list of all tours with their status
  const getToursList = useCallback(() => {
    return [
      {
        id: TOUR_IDS.BASICS,
        name: currentLanguage === 'ar' ? 'البدء' : 'Getting Started',
        description: currentLanguage === 'ar'
          ? 'تعلم أساسيات نظام إدارة البترول'
          : 'Learn the basics of PBM',
        available: isTourAvailable(TOUR_IDS.BASICS),
        completed: isTourCompleted(TOUR_IDS.BASICS),
        prerequisite: null,
        stepCount: 13,
        icon: 'GraduationCap'
      },
      {
        id: TOUR_IDS.DASHBOARD,
        name: currentLanguage === 'ar' ? 'لوحة التحكم' : 'Dashboard Deep Dive',
        description: currentLanguage === 'ar'
          ? 'استكشاف لوحة سير العمل'
          : 'Explore the workflow dashboard',
        available: isTourAvailable(TOUR_IDS.DASHBOARD),
        completed: isTourCompleted(TOUR_IDS.DASHBOARD),
        prerequisite: TOUR_IDS.BASICS,
        stepCount: 8,
        icon: 'LayoutDashboard'
      },
      {
        id: TOUR_IDS.PURCHASE,
        name: currentLanguage === 'ar' ? 'سير عمل المشتريات' : 'Purchase Workflow',
        description: currentLanguage === 'ar'
          ? 'تعلم دورة المشتريات الكاملة'
          : 'Learn the complete purchase cycle',
        available: isTourAvailable(TOUR_IDS.PURCHASE),
        completed: isTourCompleted(TOUR_IDS.PURCHASE),
        prerequisite: TOUR_IDS.BASICS,
        stepCount: 10,
        icon: 'ShoppingCart'
      },
      {
        id: TOUR_IDS.SALES,
        name: currentLanguage === 'ar' ? 'وحدة المبيعات' : 'Sales Module',
        description: currentLanguage === 'ar'
          ? 'إنشاء وإدارة أوامر المبيعات'
          : 'Create and manage sales orders',
        available: isTourAvailable(TOUR_IDS.SALES),
        completed: isTourCompleted(TOUR_IDS.SALES),
        prerequisite: TOUR_IDS.BASICS,
        stepCount: 6,
        icon: 'TrendingUp'
      },
      {
        id: TOUR_IDS.COLLECTIONS,
        name: currentLanguage === 'ar' ? 'سير عمل التحصيل' : 'Collections Workflow',
        description: currentLanguage === 'ar'
          ? 'التحصيل والنداءات وإتمام WCN'
          : 'Collections, callouts, and WCN finalization',
        available: isTourAvailable(TOUR_IDS.COLLECTIONS),
        completed: isTourCompleted(TOUR_IDS.COLLECTIONS),
        prerequisite: TOUR_IDS.PURCHASE,
        stepCount: 4,
        icon: 'Truck'
      },
      {
        id: TOUR_IDS.CONTRACTS,
        name: currentLanguage === 'ar' ? 'إدارة العقود' : 'Contract Management',
        description: currentLanguage === 'ar'
          ? 'إنشاء وإدارة عقود الموردين'
          : 'Create and manage supplier contracts',
        available: isTourAvailable(TOUR_IDS.CONTRACTS),
        completed: isTourCompleted(TOUR_IDS.CONTRACTS),
        prerequisite: TOUR_IDS.BASICS,
        stepCount: 4,
        icon: 'FileText'
      },
      {
        id: TOUR_IDS.SETTINGS,
        name: currentLanguage === 'ar' ? 'الإعدادات' : 'Settings & Configuration',
        description: currentLanguage === 'ar'
          ? 'تخصيص تفضيلاتك'
          : 'Customize your preferences',
        available: isTourAvailable(TOUR_IDS.SETTINGS),
        completed: isTourCompleted(TOUR_IDS.SETTINGS),
        prerequisite: TOUR_IDS.BASICS,
        stepCount: 4,
        icon: 'Settings'
      }
    ];
  }, [currentLanguage, isTourAvailable, isTourCompleted]);

  // Context value
  const value = {
    // State
    tourState,
    currentTour,
    isRunning,
    stepIndex,
    driverInstance,

    // Context Detection (NEW)
    tourContext,
    updateTourContext,
    isStepContextValid,

    // Setters
    setDriverInstance,
    setStepIndex,

    // Actions
    startTour,
    stopTour,
    skipTour,
    completeTour,
    updateProgress,
    resetAllTours,
    toggleTourEnabled,
    toggleAutoStart,
    markWelcomeSeen,

    // Queries
    isTourAvailable,
    isTourCompleted,
    getTourProgress,
    shouldAutoStartBasics,
    getToursList,

    // Computed
    isRTL: currentLanguage === 'ar',
    currentLanguage
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

// Custom hook to use tour context
export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

/**
 * useTourBroadcast - Hook for components to broadcast their state to the tour system
 *
 * Usage:
 * ```javascript
 * const { broadcast, isTourActive } = useTourBroadcast();
 *
 * // In useEffect or event handlers:
 * useEffect(() => {
 *   if (isTourActive) {
 *     broadcast({
 *       currentModal: 'PurchaseOrderForm',
 *       formState: { hasSupplier: true, itemCount: 2 }
 *     });
 *   }
 * }, [formData, isTourActive]);
 * ```
 */
export const useTourBroadcast = () => {
  const context = useContext(TourContext);

  // Return no-op functions if context is not available (component outside TourProvider)
  if (!context) {
    return {
      broadcast: () => {},
      isTourActive: false,
      tourContext: null
    };
  }

  const { updateTourContext, currentTour, isRunning, tourContext } = context;

  // Broadcast function that only updates if a tour is running
  const broadcast = useCallback((updates) => {
    // Only broadcast if a tour is actively running
    // This prevents unnecessary state updates when no tour is active
    if (currentTour && isRunning) {
      updateTourContext(updates);
    }
  }, [currentTour, isRunning, updateTourContext]);

  return {
    broadcast,
    isTourActive: !!(currentTour && isRunning),
    tourContext
  };
};

export default TourContext;
