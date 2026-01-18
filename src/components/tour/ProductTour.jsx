import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTour, TOUR_IDS } from '../../context/TourContext';
import { getTourSteps, WORKFLOW_GUIDES, getLocalizedWorkflowStep } from '../../config/tours';
import { useLocalization } from '../../context/LocalizationContext';
// CSS moved to global index.css Tailwind

/**
 * ProductTour Component
 *
 * Wraps Driver.js to provide guided product tours with:
 * - Progressive tour system (legacy feature tours)
 * - Context-aware workflow guides (NEW)
 * - RTL support for Arabic
 * - Custom PBM styling
 * - Auto-start for first-time users
 * - Auto-advance on context match
 */
const ProductTour = () => {
  const {
    currentTour,
    isRunning,
    stepIndex,
    isRTL,
    currentLanguage,
    setDriverInstance,
    stopTour,
    completeTour,
    shouldAutoStartBasics,
    startTour,
    markWelcomeSeen,
    tourContext,
    isStepContextValid,
    updateProgress
  } = useTour();

  const { t } = useLocalization();

  const navigate = useNavigate();
  const location = useLocation();

  // Use refs to prevent re-initialization and track state
  const driverRef = useRef(null);
  const isInitializedRef = useRef(false);
  const autoStartTriggeredRef = useRef(false);
  const navigationPendingRef = useRef(false);
  const currentStepRef = useRef(0);
  const totalStepsRef = useRef(0);
  const tourIdRef = useRef(null);
  const isWorkflowGuideRef = useRef(false);
  const workflowStepsRef = useRef([]);
  const contextCheckIntervalRef = useRef(null);
  const elementListenerRef = useRef(null); // Store cleanup function for element listeners
  const scrollListenerRef = useRef(null); // Store cleanup function for scroll listeners
  const dismissListenerRef = useRef(null); // Store cleanup function for click-outside dismiss
  const initialDropdownValueRef = useRef(null); // Track initial dropdown value for change detection
  const pausedForInteractionRef = useRef(false); // Track if tour is paused for user interaction
  const resumeStepRef = useRef(null); // Track which step to resume from after interaction

  /**
   * Check if current tour is a workflow guide
   */
  const isWorkflowGuide = (tourId) => {
    return WORKFLOW_GUIDES && WORKFLOW_GUIDES[tourId];
  };

  /**
   * Get steps for either legacy tours or workflow guides
   */
  const getStepsForTour = (tourId, language) => {
    // Check if it's a workflow guide
    if (isWorkflowGuide(tourId)) {
      const guide = WORKFLOW_GUIDES[tourId];
      return guide.steps.map(step => getLocalizedWorkflowStep(step, language));
    }
    // Fall back to legacy tour config
    return getTourSteps(tourId, language);
  };

  /**
   * Get the required route for the current tour
   */
  const getRequiredRoute = (tourId) => {
    const steps = getStepsForTour(tourId, currentLanguage);
    if (!steps || steps.length === 0) return null;
    // Find the first step with a route defined
    const stepWithRoute = steps.find(step => step.route);
    return stepWithRoute?.route || null;
  };

  /**
   * Find the next valid step based on current context
   * For workflow guides, this enables auto-advancement when context matches
   */
  const findNextValidStep = (steps, fromIndex = 0) => {
    for (let i = fromIndex; i < steps.length; i++) {
      if (isStepContextValid(steps[i])) {
        return i;
      }
    }
    return -1; // No valid step found
  };

  /**
   * Check if current step is waiting for user action
   */
  const isStepWaitingForAction = (step) => {
    return step?.waitForAction === 'click';
  };

  /**
   * Scroll element into view, handling modal containers properly
   */
  const scrollElementIntoView = (elementSelector) => {
    const element = document.querySelector(elementSelector);
    if (!element) {
      return;
    }

    // Find the scrollable container (could be modal body, page, etc.)
    const findScrollableParent = (el) => {
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        const overflow = style.overflow;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll' ||
                            overflow === 'auto' || overflow === 'scroll';

        // Check if the element actually has scrollable content
        if (isScrollable && parent.scrollHeight > parent.clientHeight) {
          return parent;
        }

        // Also check for modal-body specifically
        if (parent.classList.contains('modal-body') && parent.scrollHeight > parent.clientHeight) {
          return parent;
        }

        parent = parent.parentElement;
      }
      return null;
    };

    const scrollableParent = findScrollableParent(element);

    if (scrollableParent) {
      // Get element's position relative to scrollable container
      const elementRect = element.getBoundingClientRect();
      const containerRect = scrollableParent.getBoundingClientRect();

      // Calculate if element is outside visible area of container
      const isAboveView = elementRect.top < containerRect.top;
      const isBelowView = elementRect.bottom > containerRect.bottom;

      if (isAboveView || isBelowView) {
        // Calculate the element's offset from container's top
        // This handles nested elements correctly
        let offsetTop = 0;
        let currentEl = element;
        while (currentEl && currentEl !== scrollableParent) {
          offsetTop += currentEl.offsetTop;
          currentEl = currentEl.offsetParent;
          // If we've gone past our scrollable container, reset
          if (currentEl && !scrollableParent.contains(currentEl)) {
            offsetTop = element.offsetTop;
            break;
          }
        }

        // Calculate scroll position to center the element
        const containerVisibleHeight = scrollableParent.clientHeight;
        const elementHeight = element.offsetHeight;
        const scrollTo = offsetTop - (containerVisibleHeight / 2) + (elementHeight / 2);

        scrollableParent.scrollTo({
          top: Math.max(0, scrollTo),
          behavior: 'smooth'
        });
      }
    } else {
      // Check if element is in view on the page
      const rect = element.getBoundingClientRect();
      const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isInView) {
        // Fall back to standard scrollIntoView
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  };

  /**
   * Enable manual scrolling within modals during the tour
   * Driver.js overlay can intercept scroll events, so we manually handle them
   */
  const enableModalScrolling = (elementSelector) => {
    // Clean up previous scroll listener
    if (scrollListenerRef.current) {
      scrollListenerRef.current();
      scrollListenerRef.current = null;
    }

    const element = document.querySelector(elementSelector);
    if (!element) return;

    // Find the modal body that should be scrollable
    let modalBody = element.closest('.modal-body');
    if (!modalBody) {
      modalBody = element.closest('[class*="modal"]')?.querySelector('.modal-body');
    }
    if (!modalBody) {
      // Also check for other scrollable containers
      modalBody = element.closest('[style*="overflow"]');
    }

    if (!modalBody) {
      return;
    }


    // Add wheel event listener to the document that forwards to modal body
    const handleWheel = (e) => {
      // Check if the modal body is visible and has scroll content
      if (modalBody.scrollHeight > modalBody.clientHeight) {
        const rect = modalBody.getBoundingClientRect();
        const isMouseOverModal = e.clientX >= rect.left && e.clientX <= rect.right &&
                                  e.clientY >= rect.top && e.clientY <= rect.bottom;

        // If mouse is anywhere near the modal, forward scroll
        if (isMouseOverModal) {
          modalBody.scrollTop += e.deltaY;
          // Don't prevent default - let normal scroll behavior work too
        }
      }
    };

    // Listen on document with capture to intercept before driver.js
    document.addEventListener('wheel', handleWheel, { passive: true, capture: true });

    // Also make sure the modal body itself handles scroll events
    const ensureScroll = (e) => {
      e.stopPropagation();
    };
    modalBody.addEventListener('wheel', ensureScroll, { passive: true });

    // Store cleanup
    scrollListenerRef.current = () => {
      document.removeEventListener('wheel', handleWheel, { capture: true });
      modalBody.removeEventListener('wheel', ensureScroll);
    };
  };

  /**
   * Get current value from a dropdown/select element (works for native and React Select)
   */
  const getDropdownValue = (element) => {
    if (!element) return null;

    // Native select
    if (element.tagName?.toLowerCase() === 'select') {
      return element.value || null;
    }

    // React Select - check for single value
    const singleValue = element.querySelector('[class*="singleValue"]');
    if (singleValue?.textContent) {
      return singleValue.textContent.trim();
    }

    // Check for selected option
    const selected = element.querySelector('[class*="selected"]') ||
                     element.querySelector('.select-value');
    if (selected?.textContent) {
      return selected.textContent.trim();
    }

    // Check hidden input
    const hiddenInput = element.querySelector('input[type="hidden"]');
    if (hiddenInput?.value) {
      return hiddenInput.value;
    }

    return null;
  };

  /**
   * Attach event listeners to the highlighted element to detect user interaction
   * Returns a cleanup function to remove listeners
   */
  const attachElementListeners = (elementSelector, onInteraction) => {
    // Clean up any previous listeners
    if (elementListenerRef.current) {
      elementListenerRef.current();
      elementListenerRef.current = null;
    }

    // Find the element
    const element = document.querySelector(elementSelector);
    if (!element) {
      return () => {};
    }


    const handlers = [];

    // Determine element type and attach appropriate listeners
    const tagName = element.tagName.toLowerCase();
    const inputType = element.getAttribute('type')?.toLowerCase();

    // Check if this is a dropdown-like element
    const isNativeSelect = tagName === 'select';
    const isReactSelect = element.classList.contains('react-select') ||
                          element.querySelector('.react-select__control') ||
                          element.classList.contains('select-wrapper') ||
                          element.querySelector('[class*="select"]') ||
                          element.querySelector('[class*="Select"]');
    const isDropdown = isNativeSelect || isReactSelect;

    // For buttons and clickable elements (but NOT dropdowns)
    if (!isDropdown && (tagName === 'button' || tagName === 'a' || element.getAttribute('role') === 'button' ||
        element.classList.contains('btn') || element.onclick)) {
      const clickHandler = (e) => {
        // Small delay to let the action complete (modal open, etc.)
        setTimeout(() => onInteraction('click'), 300);
      };
      element.addEventListener('click', clickHandler);
      handlers.push(() => element.removeEventListener('click', clickHandler));
    }

    // For native select dropdowns - wait for actual value change
    if (isNativeSelect) {
      // Store initial value
      initialDropdownValueRef.current = element.value;

      const changeHandler = (e) => {
        const newValue = e.target.value;
        // Only trigger if value actually changed to a non-empty value
        if (newValue && newValue !== initialDropdownValueRef.current) {
          setTimeout(() => onInteraction('change'), 200);
        }
      };
      element.addEventListener('change', changeHandler);
      handlers.push(() => element.removeEventListener('change', changeHandler));
    }

    // For React Select or custom dropdowns - use MutationObserver to detect actual selection
    if (isReactSelect) {
      // Store initial value
      initialDropdownValueRef.current = getDropdownValue(element);

      let hasTriggered = false; // Prevent multiple triggers

      // Use MutationObserver to detect when selection actually changes
      const observer = new MutationObserver((mutations) => {
        if (hasTriggered) return;

        // Get current value after mutation
        const currentValue = getDropdownValue(element);

        // Only trigger if value exists and is different from initial
        if (currentValue && currentValue !== initialDropdownValueRef.current) {
          hasTriggered = true;
          setTimeout(() => onInteraction('select'), 300);
        }
      });

      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
      handlers.push(() => observer.disconnect());

      // NOTE: We intentionally do NOT add a click handler here
      // because clicking to open dropdown should NOT trigger advance
      // Only actual value selection should trigger
    }

    // For input fields
    if (tagName === 'input' || tagName === 'textarea') {
      const initialValue = element.value;
      const inputHandler = (e) => {
        if (e.target.value && e.target.value !== initialValue) {
          setTimeout(() => onInteraction('input'), 300);
        }
      };
      element.addEventListener('change', inputHandler);
      element.addEventListener('blur', inputHandler);
      handlers.push(() => {
        element.removeEventListener('change', inputHandler);
        element.removeEventListener('blur', inputHandler);
      });
    }

    // For any clickable element (as fallback) - but NOT if it's a dropdown
    if (handlers.length === 0 && !isDropdown) {
      const clickHandler = () => {
        setTimeout(() => onInteraction('click'), 300);
      };
      element.addEventListener('click', clickHandler);
      handlers.push(() => element.removeEventListener('click', clickHandler));
    }

    // Store cleanup function
    const cleanup = () => {
      handlers.forEach(h => h());
      initialDropdownValueRef.current = null;
    };
    elementListenerRef.current = cleanup;

    return cleanup;
  };

  /**
   * Pause the tour for user interaction
   * This completely destroys driver.js to allow full page interaction
   * The tour can be resumed from the next step when the user completes the action
   */
  const pauseTourForInteraction = (currentIndex, elementSelector) => {

    // Set paused state BEFORE destroying
    pausedForInteractionRef.current = true;
    resumeStepRef.current = currentIndex + 1;

    // Store refs before destroy clears them
    const savedTourId = tourIdRef.current;
    const savedTotalSteps = totalStepsRef.current;
    const savedSteps = [...workflowStepsRef.current];
    const savedIsWorkflowGuide = isWorkflowGuideRef.current;

    // Clean up dismiss listener (no longer needed since we're destroying)
    if (dismissListenerRef.current) {
      dismissListenerRef.current();
      dismissListenerRef.current = null;
    }

    // Destroy driver.js instance completely
    if (driverRef.current) {
      try {
        // Temporarily remove the destroy callback to prevent it from running stopTour
        const originalOnDestroyed = driverRef.current.getConfig?.()?.onDestroyed;
        driverRef.current.destroy();
      } catch (e) {
        console.error('[Tour] Error destroying for pause:', e);
      }
      driverRef.current = null;
    }

    // Remove interaction mode class (not needed now)
    document.body.classList.remove('driver-interaction-mode');

    // Restore refs after destroy (they get cleared in onDestroyed)
    tourIdRef.current = savedTourId;
    totalStepsRef.current = savedTotalSteps;
    workflowStepsRef.current = savedSteps;
    isWorkflowGuideRef.current = savedIsWorkflowGuide;
    isInitializedRef.current = false; // Allow re-initialization


    // Set up listeners on the element to detect when user completes action
    // These listeners will trigger resumeTour when the action is complete
    attachElementListenersForResume(elementSelector, () => {
      resumeTour();
    });
  };

  /**
   * Attach listeners specifically for the resume scenario
   * These are simpler listeners that just detect any interaction
   */
  const attachElementListenersForResume = (elementSelector, onComplete) => {
    // Clean up any previous resume listeners
    if (elementListenerRef.current) {
      elementListenerRef.current();
      elementListenerRef.current = null;
    }

    const element = document.querySelector(elementSelector);
    if (!element) {
      // If element not found, resume tour after delay (element might appear later)
      setTimeout(() => {
        if (pausedForInteractionRef.current) {
          resumeTour();
        }
      }, 3000);
      return;
    }


    const handlers = [];
    const tagName = element.tagName.toLowerCase();

    // Check element types
    const isNativeSelect = tagName === 'select';
    const isReactSelect = element.classList.contains('react-select') ||
                          element.querySelector('.react-select__control') ||
                          element.classList.contains('select-wrapper') ||
                          element.querySelector('[class*="select"]') ||
                          element.querySelector('[class*="Select"]');
    const isDropdown = isNativeSelect || isReactSelect;

    // For dropdowns - detect value change
    if (isDropdown) {
      const initialValue = getDropdownValue(element);
      initialDropdownValueRef.current = initialValue;

      if (isNativeSelect) {
        const changeHandler = (e) => {
          const newValue = e.target.value;
          if (newValue && newValue !== initialDropdownValueRef.current) {
            setTimeout(onComplete, 300);
          }
        };
        element.addEventListener('change', changeHandler);
        handlers.push(() => element.removeEventListener('change', changeHandler));
      }

      if (isReactSelect) {
        let hasTriggered = false;
        const observer = new MutationObserver(() => {
          if (hasTriggered) return;
          const currentValue = getDropdownValue(element);
          if (currentValue && currentValue !== initialDropdownValueRef.current) {
            hasTriggered = true;
            setTimeout(onComplete, 300);
          }
        });
        observer.observe(element, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true
        });
        handlers.push(() => observer.disconnect());
      }
    }
    // For buttons/clickable elements
    else if (tagName === 'button' || tagName === 'a' || element.getAttribute('role') === 'button' ||
             element.classList.contains('btn') || element.onclick) {
      const clickHandler = () => {
        setTimeout(onComplete, 300);
      };
      element.addEventListener('click', clickHandler);
      handlers.push(() => element.removeEventListener('click', clickHandler));
    }
    // For inputs
    else if (tagName === 'input' || tagName === 'textarea') {
      const initialValue = element.value;
      const inputHandler = (e) => {
        if (e.target.value && e.target.value !== initialValue) {
          setTimeout(onComplete, 300);
        }
      };
      element.addEventListener('change', inputHandler);
      element.addEventListener('blur', inputHandler);
      handlers.push(() => {
        element.removeEventListener('change', inputHandler);
        element.removeEventListener('blur', inputHandler);
      });
    }
    // Fallback - click listener
    else {
      const clickHandler = () => {
        setTimeout(onComplete, 300);
      };
      element.addEventListener('click', clickHandler);
      handlers.push(() => element.removeEventListener('click', clickHandler));
    }

    // Store cleanup
    elementListenerRef.current = () => {
      handlers.forEach(h => h());
      initialDropdownValueRef.current = null;
    };
  };

  /**
   * Resume the tour from the saved step
   */
  const resumeTour = () => {
    if (!pausedForInteractionRef.current) {
      return;
    }

    const resumeStep = resumeStepRef.current;
    const tourId = tourIdRef.current;
    const totalSteps = totalStepsRef.current;


    // Clean up resume listeners
    if (elementListenerRef.current) {
      elementListenerRef.current();
      elementListenerRef.current = null;
    }

    // Reset paused state
    pausedForInteractionRef.current = false;
    resumeStepRef.current = null;

    // Check if we've completed all steps
    if (resumeStep >= totalSteps) {
      completeTour(tourId);
      return;
    }

    // Re-initialize the tour from the resume step
    // The isInitializedRef is already false from pauseTourForInteraction
    // Setting stepIndex will trigger the init effect to restart
    currentStepRef.current = resumeStep;

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      // Re-trigger the tour initialization by starting from the resume step
      const steps = getStepsForTour(tourId, currentLanguage);
      if (!steps || steps.length === 0) {
        return;
      }

      // Re-initialize driver.js
      initializeDriverAtStep(steps, resumeStep);
    }, 200);
  };

  /**
   * Shared handler for Next button click
   */
  const handleNextClick = (driverInstance) => {
    const activeIndex = driverInstance?.getActiveIndex?.() ?? currentStepRef.current;
    const nextIndex = activeIndex + 1;
    const allSteps = workflowStepsRef.current;

    if (allSteps && allSteps.length > 0) {
      const currentStep = allSteps[activeIndex];

      // ONLY block if current step explicitly requires user action (waitForAction: 'click')
      if (currentStep?.waitForAction === 'click') {

        const description = document.querySelector('.driver-popover-description');
        if (description) {
          const existingWarning = description.querySelector('.action-warning');
          if (!existingWarning) {
            const warning = document.createElement('div');
            warning.className = 'action-warning';
            warning.innerHTML = isRTL
              ? '⚠️ <strong>يرجى النقر على العنصر المحدد للمتابعة</strong>'
              : '⚠️ <strong>Please click the highlighted element to continue</strong>';
            warning.style.cssText = 'margin-top: 12px; padding: 10px; background: rgba(255,100,100,0.4); border-radius: 6px; font-size: 13px; color: #fff; border: 1px solid rgba(255,255,255,0.3);';
            description.appendChild(warning);
            setTimeout(() => warning.remove(), 4000);
          }
        }
        return; // BLOCK
      }
    }

    driverInstance.moveNext();
  };

  /**
   * Shared handler for highlight started
   */
  const handleHighlightStarted = (driverInstance) => {
    // Remove interaction mode class
    document.body.classList.remove('driver-interaction-mode');

    // Clean up previous step's listeners
    if (dismissListenerRef.current) {
      dismissListenerRef.current();
      dismissListenerRef.current = null;
    }

    // Get active index
    const activeIndex = driverInstance?.getActiveIndex?.() ?? 0;
    currentStepRef.current = activeIndex;

    // Get step config
    const allSteps = workflowStepsRef.current;
    const currentStepConfig = allSteps?.[activeIndex];
    const elementSelector = currentStepConfig?.element;

    // Scroll element into view
    if (elementSelector) {
      setTimeout(() => {
        scrollElementIntoView(elementSelector);
        enableModalScrolling(elementSelector);
      }, 100);
    }

    // Attach element listeners for auto-advance
    if (elementSelector && activeIndex < totalStepsRef.current - 1) {
      setTimeout(() => {
        attachElementListeners(elementSelector, (interactionType) => {
          const driverInst = driverRef.current;
          if (driverInst && currentStepRef.current === activeIndex) {

            if (dismissListenerRef.current) {
              dismissListenerRef.current();
              dismissListenerRef.current = null;
            }

            document.body.classList.remove('driver-interaction-mode');
            currentStepRef.current = activeIndex + 1;
            driverInst.moveNext();
          }
        });

        // Add "Got it" button - using PAUSE approach
        setTimeout(() => {
          const footer = document.querySelector('.driver-popover-footer');
          if (footer && !footer.querySelector('.dismiss-btn')) {
            const dismissBtn = document.createElement('button');
            dismissBtn.className = 'dismiss-btn';
            dismissBtn.textContent = t('tourGotIt', "Got it, I'll do it");
            dismissBtn.type = 'button';
            dismissBtn.style.cssText = 'padding: 6px 12px; background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 12px; cursor: pointer; margin-left: 8px;';

            dismissBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              pauseTourForInteraction(activeIndex, elementSelector);
            });

            const navBtns = footer.querySelector('.driver-popover-navigation-btns');
            if (navBtns) {
              footer.insertBefore(dismissBtn, navBtns);
            } else {
              footer.appendChild(dismissBtn);
            }
          }
        }, 150);

        // Set up click-outside listener to PAUSE tour
        const handleClickOutside = (e) => {
          if (currentStepRef.current !== activeIndex) return;
          if (pausedForInteractionRef.current) return;

          const popover = document.querySelector('.driver-popover');
          const highlightedElement = document.querySelector('.driver-active-element');

          if (!popover) return;

          const isClickOnPopover = popover.contains(e.target);
          const isClickOnHighlighted = highlightedElement && highlightedElement.contains(e.target);

          if (!isClickOnPopover) {
            e.stopPropagation();
            e.stopImmediatePropagation();

            pauseTourForInteraction(activeIndex, elementSelector);

            // Re-dispatch click to highlighted element
            if (isClickOnHighlighted) {
              setTimeout(() => {
                const newEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
                e.target.dispatchEvent(newEvent);
              }, 100);
            }
          }
        };

        setTimeout(() => {
          document.addEventListener('click', handleClickOutside, true);
          dismissListenerRef.current = () => {
            document.removeEventListener('click', handleClickOutside, true);
          };
        }, 500);
      }, 200);
    }

    // Add "Skip Tour" link
    setTimeout(() => {
      const footer = document.querySelector('.driver-popover-footer');
      const existingSkip = footer?.querySelector('.skip-tour-link');
      if (existingSkip) existingSkip.remove();

      if (footer) {
        const skipLink = document.createElement('button');
        skipLink.className = 'skip-tour-link';
        skipLink.textContent = t('tourSkip', 'Skip Tour');
        skipLink.type = 'button';
        skipLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (driverRef.current) {
            driverRef.current.destroy();
          }
        });
        footer.insertBefore(skipLink, footer.firstChild);
      }
    }, 100);

    // Handle waitForAction steps
    if (allSteps && allSteps.length > 0) {
      if (currentStepConfig?.waitForAction === 'click') {
        setTimeout(() => {
          const nextBtn = document.querySelector('.driver-popover-next-btn');
          if (nextBtn) nextBtn.style.display = 'none';

          const description = document.querySelector('.driver-popover-description');
          if (description && !description.querySelector('.action-hint')) {
            const hint = document.createElement('div');
            hint.className = 'action-hint';
            hint.innerHTML = `👆 <em>${t('tourActionHint', 'Perform this action to continue...')}</em>`;
            hint.style.cssText = 'margin-top: 12px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 6px; font-size: 13px; border: 1px dashed rgba(255,255,255,0.4);';
            description.appendChild(hint);
          }
        }, 150);
      } else {
        setTimeout(() => {
          const nextBtn = document.querySelector('.driver-popover-next-btn');
          if (nextBtn) nextBtn.style.display = '';
          const description = document.querySelector('.driver-popover-description');
          const oldHint = description?.querySelector('.action-hint');
          if (oldHint) oldHint.remove();
        }, 100);
      }
    }
  };

  /**
   * Shared handler for destroy started
   */
  const handleDestroyStarted = () => {
    document.body.classList.remove('driver-interaction-mode');

    if (elementListenerRef.current) {
      elementListenerRef.current();
      elementListenerRef.current = null;
    }
    if (scrollListenerRef.current) {
      scrollListenerRef.current();
      scrollListenerRef.current = null;
    }
    if (dismissListenerRef.current) {
      dismissListenerRef.current();
      dismissListenerRef.current = null;
    }
    if (contextCheckIntervalRef.current) {
      clearInterval(contextCheckIntervalRef.current);
      contextCheckIntervalRef.current = null;
    }
  };

  /**
   * Shared handler for destroyed
   */
  const handleDestroyed = () => {
    // Don't process if we're in paused state (intentional pause for interaction)
    if (pausedForInteractionRef.current) {
      return;
    }

    const finalStep = currentStepRef.current;
    const totalSteps = totalStepsRef.current;
    const tourId = tourIdRef.current;


    const wasCompleted = finalStep >= totalSteps - 1;


    // Reset refs
    driverRef.current = null;
    isInitializedRef.current = false;
    isWorkflowGuideRef.current = false;
    workflowStepsRef.current = [];

    if (wasCompleted && tourId) {
      completeTour(tourId);
    } else {
      stopTour();
    }
  };

  /**
   * Initialize driver.js at a specific step (used for resume)
   */
  const initializeDriverAtStep = (steps, startIndex) => {

    workflowStepsRef.current = steps;

    // Convert tour steps to driver.js format
    const driverSteps = steps.map((step, idx) => {
      const driverStep = {
        element: step.element,
        popover: {
          title: step.popover.title,
          description: step.popover.description,
          side: step.popover.side || 'bottom',
          align: step.popover.align || 'center'
        }
      };
      if (step.context?.requireModal) {
        driverStep.popover.popoverClass = 'pbm-tour-popover in-modal';
      }
      return driverStep;
    });

    currentStepRef.current = startIndex;
    isInitializedRef.current = true;

    // Create driver with same config as main init
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: driverSteps,
      animate: true,
      allowClose: true,
      overlayClickNext: false,
      stagePadding: 10,
      stageRadius: 8,
      popoverOffset: 12,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      smoothScroll: true,
      scrollIntoViewOptions: {
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      },
      disableActiveInteraction: false,
      allowKeyboardControl: true,
      overlayClickBehavior: 'none',
      progressText: isRTL ? '{{current}} من {{total}}' : '{{current}} of {{total}}',
      nextBtnText: isRTL ? 'التالي' : 'Next',
      prevBtnText: isRTL ? 'السابق' : 'Previous',
      doneBtnText: isRTL ? 'إنهاء' : 'Done',
      popoverClass: isRTL ? 'pbm-tour-popover rtl' : 'pbm-tour-popover',

      onCloseClick: () => {
        if (driverRef.current) {
          driverRef.current.destroy();
        }
      },

      onNextClick: (element, step, opts) => {
        handleNextClick(driverObj);
      },

      onPrevClick: () => {
        driverObj.movePrevious();
      },

      onHighlightStarted: (element, step, options) => {
        handleHighlightStarted(driverObj);
      },

      onDestroyStarted: () => {
        handleDestroyStarted();
      },

      onDestroyed: () => {
        handleDestroyed();
      }
    });

    driverRef.current = driverObj;
    setDriverInstance(driverObj);

    // Start from the specified step
    driverObj.drive(startIndex);
  };

  // ========================================
  // Context Change Detection for Workflow Guides
  // ========================================
  useEffect(() => {
    // Only run for workflow guides that are active AND initialized
    // The driver must exist before we can advance steps
    if (!isRunning || !currentTour || !isWorkflowGuideRef.current || !driverRef.current) {
      return;
    }

    const steps = workflowStepsRef.current;
    const currentIndex = currentStepRef.current;

    // Safety check - ensure we have steps
    if (!steps || steps.length === 0) {
      return;
    }

    // Only auto-advance if current step is waiting for user action
    const currentStep = steps[currentIndex];
    if (isStepWaitingForAction(currentStep)) {
      // Check if context changed (user performed the action)
      // ONLY advance to the NEXT step (currentIndex + 1), not to any later step
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        if (isStepContextValid(nextStep)) {
          // User performed the action, advance to NEXT step only
          advanceToStep(currentIndex + 1);
        }
      }
    }
    // NOTE: Removed auto-skipping to later steps - tours should proceed step by step
  }, [tourContext, isRunning, currentTour, isStepContextValid]);

  /**
   * Advance the tour to a specific step
   */
  const advanceToStep = (stepIndex) => {
    if (driverRef.current) {
      try {
        currentStepRef.current = stepIndex;
        updateProgress(tourIdRef.current, stepIndex);
        driverRef.current.moveTo(stepIndex);
      } catch (e) {
        console.error('[ProductTour] Error advancing to step:', e);
      }
    }
  };

  // Initialize and start tour when isRunning becomes true
  useEffect(() => {
    // Only initialize if:
    // 1. Tour is running
    // 2. We have a current tour ID
    // 3. We haven't already initialized this specific tour
    if (!isRunning || !currentTour) {
      return;
    }

    if (isInitializedRef.current && tourIdRef.current === currentTour) {
      return;
    }

    // If switching to a new tour while one is running, clean up first
    if (isInitializedRef.current && tourIdRef.current !== currentTour) {
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          // Ignore
        }
        driverRef.current = null;
      }
      isInitializedRef.current = false;
    }

    const steps = getStepsForTour(currentTour, currentLanguage);
    if (!steps || steps.length === 0) {
      return;
    }

    // Track if this is a workflow guide
    isWorkflowGuideRef.current = isWorkflowGuide(currentTour);
    workflowStepsRef.current = steps;

    // Check if we need to navigate to a different page
    const requiredRoute = getRequiredRoute(currentTour);
    const currentPath = location.pathname + location.search;

    // If tour requires a specific route and we're not there, navigate first
    if (requiredRoute && !currentPath.startsWith(requiredRoute.split('?')[0])) {
      navigationPendingRef.current = true;
      navigate(requiredRoute);
      return; // Wait for navigation to complete, then re-run this effect
    }

    // Clear navigation pending flag
    navigationPendingRef.current = false;

    // Mark as initialized to prevent re-entry
    isInitializedRef.current = true;

    // Longer delay to ensure DOM is fully ready after navigation
    const timer = setTimeout(() => {
      // IMPORTANT: Set steps ref INSIDE setTimeout to avoid race condition with cleanup effects
      workflowStepsRef.current = steps;

      // For workflow guides, find the first step that matches current context
      let startIndex = stepIndex;
      if (isWorkflowGuideRef.current) {
        const validIndex = findNextValidStep(steps, 0);
        if (validIndex !== -1) {
          startIndex = validIndex;
        }
      }

      // Convert tour steps to driver.js format
      const driverSteps = steps.map((step, idx) => {
        const driverStep = {
          element: step.element,
          popover: {
            title: step.popover.title,
            description: step.popover.description,
            side: step.popover.side || 'bottom',
            align: step.popover.align || 'center'
          }
        };

        // Add custom class for modal context steps
        if (step.context?.requireModal) {
          driverStep.popover.popoverClass = 'pbm-tour-popover in-modal';
        }

        return driverStep;
      });

      // Store tour info in refs for completion tracking
      tourIdRef.current = currentTour;
      totalStepsRef.current = driverSteps.length;
      currentStepRef.current = startIndex;

      // Create driver config with step tracking
      let currentActiveIndex = startIndex;

      // Helper to destroy tour and cleanup
      const destroyTour = () => {
        if (driverRef.current) {
          try {
            driverRef.current.destroy();
          } catch (e) {
            console.error('[Tour] Error destroying:', e);
          }
        }
      };

      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        steps: driverSteps,
        animate: true,
        allowClose: true,
        overlayClickNext: false,
        stagePadding: 10,
        stageRadius: 8,
        popoverOffset: 12,
        // Overlay settings
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        smoothScroll: true,
        // Improved scroll options for modal content
        scrollIntoViewOptions: {
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        },
        disableActiveInteraction: false,
        allowKeyboardControl: true,
        // Allow clicking/scrolling on the overlay to not interfere
        overlayClickBehavior: 'none',
        // Text settings
        progressText: isRTL ? '{{current}} من {{total}}' : '{{current}} of {{total}}',
        nextBtnText: isRTL ? 'التالي' : 'Next',
        prevBtnText: isRTL ? 'السابق' : 'Previous',
        doneBtnText: isRTL ? 'إنهاء' : 'Done',
        popoverClass: isRTL ? 'pbm-tour-popover rtl' : 'pbm-tour-popover',

        // Handle close button click - this is REQUIRED for close to work
        onCloseClick: () => {
          destroyTour();
        },

        // Use shared handlers - now uses PAUSE approach instead of hiding
        onNextClick: (element, step, opts) => {
          handleNextClick(driverRef.current || driverObj);
        },

        onPrevClick: () => {
          (driverRef.current || driverObj).movePrevious();
        },

        onHighlightStarted: (element, step, options) => {
          handleHighlightStarted(driverRef.current || driverObj);
        },

        onDestroyStarted: () => {
          handleDestroyStarted();
        },

        onDestroyed: () => {
          handleDestroyed();
        }
      });

      // Store reference IMMEDIATELY after driver() returns
      driverRef.current = driverObj;
      setDriverInstance(driverObj);

      // Start the tour from the calculated start index
      driverObj.drive(startIndex);
    }, 500); // Increased delay for page render

    return () => {
      clearTimeout(timer);
    };
  }, [isRunning, currentTour, currentLanguage, isRTL, stepIndex, setDriverInstance, stopTour, completeTour, location.pathname, location.search, navigate, isStepContextValid, updateProgress]);

  // Cleanup driver when isRunning becomes false (tour stopped externally)
  // OR when currentTour changes (starting a different tour)
  useEffect(() => {
    if (!isRunning) {
      // Always reset initialized flag when tour stops
      isInitializedRef.current = false;

      // Reset paused state
      pausedForInteractionRef.current = false;
      resumeStepRef.current = null;

      // Clean up interval
      if (contextCheckIntervalRef.current) {
        clearInterval(contextCheckIntervalRef.current);
        contextCheckIntervalRef.current = null;
      }

      // Clean up element listeners
      if (elementListenerRef.current) {
        elementListenerRef.current();
        elementListenerRef.current = null;
      }

      // If there's a driver instance, destroy it
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          // Ignore errors - driver may already be destroyed
        }
        driverRef.current = null;
      }
    }
  }, [isRunning]);

  // Reset initialized flag when tour changes (allows re-initialization for new tour)
  useEffect(() => {
    // When currentTour changes to a new value, reset the initialized flag
    // This allows the initialization effect to run for the new tour
    if (currentTour && tourIdRef.current && tourIdRef.current !== currentTour) {

      // Destroy existing driver if any
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          // Ignore
        }
        driverRef.current = null;
      }

      // Reset flags to allow re-initialization
      // NOTE: Don't clear workflowStepsRef here - it will be set in setTimeout
      isInitializedRef.current = false;
      isWorkflowGuideRef.current = false;
    }
  }, [currentTour]);

  // Auto-start basics tour for first-time users
  useEffect(() => {
    // Only trigger once per session
    if (autoStartTriggeredRef.current) {
      return;
    }

    if (shouldAutoStartBasics()) {
      autoStartTriggeredRef.current = true;

      // Delay to let the dashboard fully load
      const timer = setTimeout(() => {
        markWelcomeSeen();
        startTour(TOUR_IDS.BASICS);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoStartBasics, markWelcomeSeen, startTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove interaction mode class
      document.body.classList.remove('driver-interaction-mode');

      // Reset paused state
      pausedForInteractionRef.current = false;
      resumeStepRef.current = null;

      if (contextCheckIntervalRef.current) {
        clearInterval(contextCheckIntervalRef.current);
      }
      if (elementListenerRef.current) {
        elementListenerRef.current();
        elementListenerRef.current = null;
      }
      if (scrollListenerRef.current) {
        scrollListenerRef.current();
        scrollListenerRef.current = null;
      }
      if (dismissListenerRef.current) {
        dismissListenerRef.current();
        dismissListenerRef.current = null;
      }
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          // Ignore
        }
        driverRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default ProductTour;
